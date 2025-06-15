import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { User, Bell, Moon, Sun, LogOut, CreditCard, DollarSign, Lock, Mail, ChevronRight, CircleAlert as AlertCircle, Settings } from 'lucide-react-native';
import CurrencyPicker from '@/components/CurrencyPicker';
import { useCurrency } from '@/context/CurrencyContext';
import { registerForPushNotificationsAsync, updatePushToken } from '@/lib/notifications';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (session) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settingsData) {
        setSettings(settingsData);
        setNotificationsEnabled(settingsData.notification_enabled);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sair',
      'Você tem certeza de que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          onPress: async () => {
            try {
              console.log('[LOGOUT] Iniciando processo de logout...');
              setIsLoading(true);

              // Limpa os estados locais primeiro
              setUserProfile(null);
              setSettings(null);
              setNotificationsEnabled(false);

              // Tenta fazer o logout do Supabase
              const { error: signOutError } = await supabase.auth.signOut();
              
              if (signOutError) {
                console.error('[LOGOUT] Erro ao fazer logout do Supabase:', signOutError);
                // Mesmo com erro, continua com o processo de logout
              }

              // Força a limpeza do estado de autenticação
              await signOut();

              // Redireciona para a tela de login
              console.log('[LOGOUT] Redirecionando para login...');
              router.replace({
                pathname: '/(auth)/login',
                params: { timestamp: Date.now() }
              });

            } catch (error) {
              console.error('[LOGOUT ERRO]', error);
              // Em caso de erro, força o redirecionamento para login
              router.replace('/(auth)/login');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };
  

  const toggleNotifications = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      
      if (value) {
        const token = await registerForPushNotificationsAsync();
        if (token && session?.user.id) {
          await updatePushToken(session.user.id, token);
        }
      }
      
      const { error } = await supabase
        .from('user_settings')
        .update({ notification_enabled: value })
        .eq('id', session?.user.id);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        notification_enabled: value
      }));
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setNotificationsEnabled(!value);
      Alert.alert('Erro', 'Não foi possível atualizar as configurações de notificação.');
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      await setCurrency(newCurrency);
    } catch (error) {
      console.error('Erro ao atualizar moeda:', error);
      Alert.alert('Erro', 'Falha ao atualizar a moeda. Tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {/* <Text style={[styles.title, { color: colors.text }]}>Configurações</Text> */}
      </View>

      {/* Profile Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {userProfile?.full_name?.charAt(0) || session?.user.email?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {userProfile?.full_name || 'Usuário'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {session?.user.email}
            </Text>
          </View>
        </View>
      </View>

      {/* Admin Section - Only visible for admin users */}
      {userProfile?.role === 'admin' && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(screens)/admin')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Settings size={20} color={colors.primary} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Painel Administrativo
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Preferences Section */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferências</Text>
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingIconContainer}>
            {theme === 'dark' ? (
              <Moon size={20} color={colors.primary} />
            ) : (
              <Sun size={20} color={colors.primary} />
            )}
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Modo Escuro</Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={theme === 'dark' ? colors.primary : colors.cardHighlight}
          />
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.settingRow}>
          <View style={styles.settingIconContainer}>
            <Bell size={20} color={colors.primary} />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Notificações</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Receber lembretes de pagamentos de assinaturas
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={notificationsEnabled ? colors.primary : colors.cardHighlight}
          />
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.settingRow}>
          <View style={styles.settingIconContainer}>
            <DollarSign size={20} color={colors.primary} />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Moeda</Text>
            <CurrencyPicker
              value={currency}
              onValueChange={handleCurrencyChange}
            />
          </View>
        </View>
      </View>

      {/* Account Section */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Conta</Text>
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingIconContainer}>
            <Mail size={20} color={colors.primary} />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>E-mail</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {session?.user.email}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => router.push('/(screens)/change-password')}
        >
          <View style={styles.settingIconContainer}>
            <Lock size={20} color={colors.primary} />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Senha</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              ••••••••
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textTertiary} />
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleSignOut}
        >
          <View style={[styles.settingIconContainer, { backgroundColor: colors.errorLight }]}>
            <LogOut size={20} color={colors.error} />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.error }]}>Sair</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Sobre</Text>
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingIconContainer}>
            <AlertCircle size={20} color={colors.primary} />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Versão</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  section: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  settingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  settingValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginLeft: 56,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});