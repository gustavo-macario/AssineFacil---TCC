import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const { theme, colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      router.replace('/(screens)');
    } catch (error: any) {
      Alert.alert('Falha no Login', error.message || 'Falha ao fazer login. Por favor, tente novamente.');
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
        <Text style={[styles.title, { color: colors.text }]}>AssineFacil</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Acompanhe e gerencie suas assinaturas com facilidade</Text>
      </View>

      <View style={styles.formContainer}>
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
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
            <Lock size={20} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Senha"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
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

        <TouchableOpacity 
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.loginButtonText}>Entrar</Text>
              <ArrowRight size={20} color="white" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity>
              <Text style={[styles.link, { color: colors.primary }]}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { color: colors.textSecondary }]}>Não tem uma conta?</Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={[styles.signupLink, { color: colors.primary }]}>Cadastre-se</Text>
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
    marginBottom: 48,
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
  loginButton: {
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
    marginRight: 8,
  },
  linkContainer: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
  link: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  signupText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginRight: 4,
  },
  signupLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});