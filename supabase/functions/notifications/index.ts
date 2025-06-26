import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { format, addDays, addWeeks, addMonths, addYears } from 'https://esm.sh/date-fns@2.30.0'
import { ptBR } from 'https://esm.sh/date-fns@2.30.0/locale'

// Configuração do Supabase
const supabaseUrl = 'https://rbyhbrvcjexxlhvukkmr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieWhicnZjamV4eGxodnVra21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjM3Njg5MywiZXhwIjoyMDYxOTUyODkzfQ.1RU2EQb2phT7g_oZe46bZaapQ2sPoeZRoOPrVgCoUxs'
const expoAccessToken = '-Y2rhmcBarq5Dbje8zGNgng4-rd44wo7RxV9QdOh'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface UserSettings {
  id: string
  notification_enabled: boolean
  push_token: string | null
}

interface Subscription {
  id: string
  user_id: string
  name: string
  amount: number
  billing_date: string
  renewal_period: string
  active: boolean
}

const getNextBillingDate = (billingDate: Date, renewalPeriod: string): Date => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (billingDate < today) {
    switch (renewalPeriod.toLowerCase()) {
      case 'diario':
        // Para assinaturas diárias, calcula quantos dias se passaram desde a última cobrança
        const daysDiff = Math.ceil((today.getTime() - billingDate.getTime()) / (1000 * 60 * 60 * 24))
        return addDays(billingDate, daysDiff)
      case 'semanal':
        return addWeeks(billingDate, 1)
      case 'mensal':
        return addMonths(billingDate, 1)
      case 'trimestral':
        return addMonths(billingDate, 3)
      case 'anual':
        return addYears(billingDate, 1)
      default:
        return addMonths(billingDate, 1)
    }
  }
  
  return billingDate
}

const sendPushNotification = async (pushToken: string, title: string, message: string) => {
  try {
    const payload = {
      to: pushToken,
      title,
      body: message,
      sound: 'default',
      priority: 'high'
    };
    console.log('Payload push:', payload);

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${expoAccessToken}`
      },
      body: JSON.stringify(payload)
    });
    const responseBody = await response.text();
    console.log('Expo response:', response.status, responseBody);

    if (!response.ok) {
      throw new Error(`Erro ao enviar push notification: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Erro ao enviar push notification:', error);
  }
}

serve(async (req: Request) => {
  try {
    console.log('Iniciando verificação de notificações...');
    
    // Buscar usuários com notificações ativadas
    const { data: users, error: usersError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('notification_enabled', true);

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
      throw usersError;
    }

    console.log('Usuários encontrados:', users?.length || 0);

    for (const user of (users as UserSettings[])) {
      console.log('Processando usuário:', user.id);
      
      // Buscar assinaturas ativas do usuário
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true);

      if (subsError) {
        console.error('Erro ao buscar assinaturas:', subsError);
        throw subsError;
      }

      console.log('Assinaturas encontradas para o usuário:', subscriptions?.length || 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const sub of (subscriptions as Subscription[])) {
        console.log('Processando assinatura:', sub.id, sub.name);
        
        const nextBillingDate = getNextBillingDate(new Date(sub.billing_date), sub.renewal_period);
        nextBillingDate.setHours(0, 0, 0, 0);
        
        const daysUntilBilling = Math.ceil((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('Dias até a próxima cobrança:', daysUntilBilling);

        // Verificar se há renovação hoje ou nos próximos 3 dias
        if (daysUntilBilling >= 0 && daysUntilBilling <= 3) {
          console.log('Gerando notificação para assinatura:', sub.id);
          
          const title = daysUntilBilling === 0 
            ? 'Renovação Hoje' 
            : `Lembrete: ${daysUntilBilling} dia${daysUntilBilling !== 1 ? 's' : ''} para pagamento`;
          
          const message = daysUntilBilling === 0
            ? `Sua assinatura ${sub.name} é renovada hoje. Valor: R$ ${Number(sub.amount).toFixed(2)}`
            : `Sua assinatura ${sub.name} será cobrada em ${daysUntilBilling} dia${daysUntilBilling !== 1 ? 's' : ''}. Valor: R$ ${Number(sub.amount).toFixed(2)}`;

          // Criar notificação no banco
          const { data: notification, error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              subscription_id: sub.id,
              title,
              message,
              notification_date: new Date().toISOString(),
              is_read: false
            })
            .select()
            .single();

          if (notifError) {
            console.error('Erro ao criar notificação:', notifError);
            throw notifError;
          }

          console.log('Notificação criada:', notification);

          // Enviar push notification
          if (user.push_token) {
            console.log('Enviando push notification para:', user.push_token);
            await sendPushNotification(user.push_token, title, message);
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Processo concluído com sucesso'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}); 