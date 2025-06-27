import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Lock, Mail, User, ArrowRight, Eye, EyeOff } from 'lucide-react-native';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const { signUp } = useAuth();
  const router = useRouter();
  const { theme, colors } = useTheme();

  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
  };

  
  const validateName = (name: string) => {
    return name.trim().length >= 2 && name.length <= 50;
  };


  const validatePassword = (password: string) => {
    return password.length >= 6 && password.length <= 128;
  };

  
  const handleEmailChange = (text: string) => {
    if (text.length <= 100) {
      setEmail(text);
      if (text && !validateEmail(text)) {
        setEmailError('Email inválido ou muito longo (máx. 100 caracteres)');
      } else {
        setEmailError('');
      }
    }
  };


  const handleNameChange = (text: string) => {
    if (text.length <= 50) {
      setFullName(text);
      if (text && !validateName(text)) {
        setNameError('Nome deve ter entre 2 e 50 caracteres');
      } else {
        setNameError('');
      }
    }
  };


  const handlePasswordChange = (text: string) => {
    if (text.length <= 128) {
      setPassword(text);
      if (text && !validatePassword(text)) {
        setPasswordError('Senha deve ter entre 6 e 128 caracteres');
      } else {
        setPasswordError('');
      }
      
      if (confirmPassword && text !== confirmPassword) {
        setConfirmPasswordError('As senhas não coincidem');
      } else if (confirmPassword) {
        setConfirmPasswordError('');
      }
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    if (text.length <= 128) {
      setConfirmPassword(text);
      if (text && text !== password) {
        setConfirmPasswordError('As senhas não coincidem');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (!validateName(fullName)) {
      Alert.alert('Erro', 'O nome deve ter entre 2 e 50 caracteres');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Erro', 'Por favor, insira um email válido ou máximo de 100 caracteres');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Erro', 'A senha deve ter entre 6 e 128 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, { full_name: fullName.trim() });
      if (error) throw error;
      
      Alert.alert(
        'Conta Criada', 
        'Verifique seu e-mail para ativar sua conta. O link de ativação foi enviado!',
        [{ text: 'Entrar', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Falha no Cadastro', error.message || 'Falha ao criar conta. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Criar Conta</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Cadastre-se para começar a gerenciar suas assinaturas</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
            <User size={20} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Nome"
            placeholderTextColor={colors.textSecondary}
            value={fullName}
            onChangeText={handleNameChange}
            maxLength={50}
          />
        </View>
        {nameError ? <Text style={[styles.errorText, { color: colors.error }]}>{nameError}</Text> : null}

        <View style={styles.inputContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
            <Mail size={20} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="E-mail"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            keyboardType="email-address"
            maxLength={100}
          />
        </View>
        {emailError ? <Text style={[styles.errorText, { color: colors.error }]}>{emailError}</Text> : null}

        <View style={styles.inputContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
            <Lock size={20} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Senha"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={!showPassword}
            maxLength={128}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={[styles.errorText, { color: colors.error }]}>{passwordError}</Text> : null}

        <View style={styles.inputContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
            <Lock size={20} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Confirmar Senha"
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            secureTextEntry={!showConfirmPassword}
            maxLength={128}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? <Text style={[styles.errorText, { color: colors.error }]}>{confirmPasswordError}</Text> : null}

        <TouchableOpacity 
          style={[styles.signupButton, { backgroundColor: colors.primary }]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.signupButtonText}>Criar Conta</Text>
              <ArrowRight size={20} color="white" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>Já tem uma conta?</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Entrar</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
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
  eyeIcon: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  signupButton: {
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
    marginRight: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
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
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: -16,
    marginBottom: 16,
    marginLeft: 56,
  },
});