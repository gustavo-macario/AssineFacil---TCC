import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados para validação em tempo real
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Função para validar senha
  const validatePassword = (password: string) => {
    return password.length >= 6 && password.length <= 128;
  };

  // Validação em tempo real da nova senha
  const handleNewPasswordChange = (text: string) => {
    if (text.length <= 128) {
      setNewPassword(text);
      if (text && !validatePassword(text)) {
        setNewPasswordError('Senha deve ter entre 6 e 128 caracteres');
      } else {
        setNewPasswordError('');
      }
      
      // Validar confirmação de senha quando a senha muda
      if (confirmPassword && text !== confirmPassword) {
        setConfirmPasswordError('As senhas não coincidem');
      } else if (confirmPassword) {
        setConfirmPasswordError('');
      }
    }
  };

  // Validação em tempo real da confirmação de senha
  const handleConfirmPasswordChange = (text: string) => {
    if (text.length <= 128) {
      setConfirmPassword(text);
      if (text && text !== newPassword) {
        setConfirmPasswordError('As senhas não coincidem');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert('Erro', 'A nova senha deve ter entre 6 e 128 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    try {
      setIsLoading(true);

      // Primeiro, verifica se a senha atual está correta
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session?.user.email || '',
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Erro', 'Senha atual incorreta.');
        return;
      }

      // Se a senha atual estiver correta, atualiza para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert(
        'Sucesso',
        'Senha alterada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      Alert.alert('Erro', 'Não foi possível alterar a senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Senha atual"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              maxLength={128}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nova senha"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={handleNewPasswordChange}
              maxLength={128}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {newPasswordError ? <Text style={[styles.errorText, { color: colors.error }]}>{newPasswordError}</Text> : null}

        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirmar nova senha"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
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
        </View>
        {confirmPasswordError ? <Text style={[styles.errorText, { color: colors.error }]}>{confirmPasswordError}</Text> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Alterar Senha</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 16,
  },
}); 