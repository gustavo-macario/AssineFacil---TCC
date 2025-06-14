import { Tabs } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Home, CreditCard, ChartLine as LineChart, Bell, Settings, ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function AppLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [session]);

  const checkAdminStatus = async () => {
    if (!session?.user.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 80,
          paddingBottom: 20,
          paddingTop: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
          color: colors.text,
        },
        headerTintColor: colors.primary,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          headerTitle: 'AssineFacil',
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: 'Assinaturas',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Análises',
          tabBarIcon: ({ color, size }) => <LineChart size={size} color={color} />,
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="admin/index"
        options={{
          href: null,
          headerTitle: 'Painel Administrativo',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(screens)/settings')}
              style={{ marginLeft: 16 }}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="change-password"
        options={{
          href: null,
          headerTitle: 'Alterar Senha',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(screens)/settings')}
              style={{ marginLeft: 16 }}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="subscription-details/[id]"
        options={{
          href: null,
          headerTitle: '',
          headerStyle: {
            backgroundColor: colors.card,
            height: 50,
          },
          headerTitleStyle: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 16,
            color: colors.text,
          },
        }}
      />
      <Tabs.Screen
        name="edit-subscription/[id]"
        options={{
          href: null,
          headerTitle: '',
          headerStyle: {
            backgroundColor: colors.card,
            height: 50,
          },
          headerTitleStyle: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 16,
            color: colors.text,
          },
        }}
      />
      <Tabs.Screen
        name="add-subscription"
        options={{
          href: null,
          headerTitle: '',
          headerStyle: {
            backgroundColor: colors.card,
            height: 50,
          },
          headerTitleStyle: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 16,
            color: colors.text,
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});