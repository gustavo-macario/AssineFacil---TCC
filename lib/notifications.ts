import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Falha ao obter token para notificações push!');
      return;
    }
    
    try {
      // Em desenvolvimento, usamos o token de desenvolvimento
      if (__DEV__) {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
          developmentClient: true
        })).data;
      } else {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId
        })).data;
      }
      console.log('Token gerado com sucesso:', token);
    } catch (error) {
      console.error('Erro ao gerar token:', error);
      throw error;
    }
  } else {
    console.log('Dispositivo físico necessário para notificações push');
  }

  return token;
}

export async function updatePushToken(userId: string, token: string) {
  try {
    const { error } = await supabase
      .from('user_settings')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) throw error;
    console.log('Token de notificação atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar token de notificação:', error);
  }
} 