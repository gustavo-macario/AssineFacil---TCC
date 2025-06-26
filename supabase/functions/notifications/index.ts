import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


type UserSettings = {
  id: string;
  notification_enabled: boolean;
  reminder_days: number;
  theme: string;
  currency: string;
  created_at: string;
  updated_at: string;
  push_token?: string;
};

type Subscription = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  amount: number;
  billing_date: string;
  renewal_period: string;
  category?: string;
  color?: string;
  payment_method?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const supabaseUrl = 'https://rbyhbrvcjexxlhvukkmr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieWhicnZjamV4eGxodnVra21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjM3Njg5MywiZXhwIjoyMDYxOTUyODkzfQ.1RU2EQb2phT7g_oZe46bZaapQ2sPoeZRoOPrVgCoUxs'
const expoAccessToken = '-Y2rhmcBarq5Dbje8zGNgng4-rd44wo7RxV9QdOh'

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
};

serve(async (req: Request) => {
  try {
    console.log('Iniciando verificação de notificações...');
    
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
      
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true);

      if (subsError) {
        console.error('Erro ao buscar assinaturas:', subsError);
        throw subsError;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const sub of (subscriptions as Subscription[])) {
        console.log('Processando assinatura:', sub.id, sub.name);
        
        // --- CORREÇÃO DE ARQUITETURA: Chamando a função do banco de dados via RPC ---
        const { data: nextBillingDateStr, error: rpcError } = await supabase.rpc('get_next_billing_date', {
          initial_date: sub.billing_date,
          renewal_period_text: sub.renewal_period
        });

        if (rpcError) {
          console.error(`Erro ao chamar RPC para sub ${sub.id}:`, rpcError);
          continue; 
        }

        const nextBillingDate = new Date(`${nextBillingDateStr}T00:00:00`);
        const daysUntilBilling = Math.ceil((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`Próxima cobrança: ${nextBillingDate.toISOString()}, Dias até lá: ${daysUntilBilling}`);

        if (daysUntilBilling >= 0 && daysUntilBilling <= 3) {
          console.log('Gerando notificação para assinatura:', sub.id);
          const title = daysUntilBilling === 0 ? 'Renovação Hoje' : `Lembrete: ${daysUntilBilling} dia${daysUntilBilling !== 1 ? 's' : ''} para pagamento`;
          const message = daysUntilBilling === 0 ? `Sua assinatura ${sub.name} é renovada hoje. Valor: R$ ${Number(sub.amount).toFixed(2)}` : `Sua assinatura ${sub.name} será cobrada em ${daysUntilBilling} dia${daysUntilBilling !== 1 ? 's' : ''}. Valor: R$ ${Number(sub.amount).toFixed(2)}`;

          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: user.id,
            subscription_id: sub.id,
            title,
            message,
            notification_date: new Date().toISOString(),
            is_read: false
          });

          if (notifError) {
            console.error('Erro ao criar notificação:', notifError);
          } else {
            console.log('Notificação criada no banco.');
          }

          if (user.push_token) {
            console.log('Enviando push notification para:', user.push_token);
            await sendPushNotification(user.push_token, title, message);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Processo concluído' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    console.error('Erro geral na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});