// Tela de recuperação de senha - Temporariamente desabilitada
// Para reativar, descomente o código abaixo e configure o Supabase corretamente

/*
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira seu endereço de e-mail');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'myapp://reset-password',
      });
      
      if (error) throw error;
      
      setIsSent(true);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Algo deu errado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Recuperar Senha</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isSent 
            ? 'Verifique seu e-mail para instruções de redefinição de senha'
            : 'Digite o e-mail associado à sua conta'}
        </Text>

        {!isSent ? (
          <>
            <View style={styles.inputContainer}>
              <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                <Mail size={20} color={colors.primary} />
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="E-mail"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                maxLength={100}
              />
            </View>

            <TouchableOpacity 
              style={[styles.resetButton, { backgroundColor: colors.primary }]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.resetButtonText}>Recuperar Senha</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.resetButtonText}>Voltar para Login</Text>
          </TouchableOpacity>
        )}

        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>Lembrou sua senha?</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Entrar</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginTop: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    fontFamily: 'Inter-Regular',
  },
  resetButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  loginText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginRight: 4,
  },
  loginLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});
*/

// Componente vazio para evitar warnings
import React from 'react';

export default function ForgotPassword() {
  return null;
}