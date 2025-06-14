import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { supabase } from '@/lib/supabase';

let firebaseApp: any;
let firestore: any;

export function initializeBackup() {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  try {
    // Initialize Firebase
    firebaseApp = initializeApp(firebaseConfig);
    firestore = getFirestore(firebaseApp);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

export async function backupData(userId: string) {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }

  try {
    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Fetch user settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    // Fetch subscriptions
    const { data: subscriptionsData, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subscriptionsError) throw subscriptionsError;

    // Create backup object
    const backup = {
      profile: profileData,
      settings: settingsData,
      subscriptions: subscriptionsData,
      lastBackup: new Date().toISOString(),
    };

    // Save to Firebase
    const userBackupRef = doc(collection(firestore, 'userBackups'), userId);
    await setDoc(userBackupRef, backup);

    return { success: true };
  } catch (error) {
    console.error('Error backing up data:', error);
    throw error;
  }
}

export async function restoreData(userId: string) {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }

  try {
    // Get backup data from Firebase
    const userBackupRef = doc(collection(firestore, 'userBackups'), userId);
    const backupDoc = await getDoc(userBackupRef);

    if (!backupDoc.exists()) {
      throw new Error('No backup found for this user');
    }

    const backupData = backupDoc.data();

    // Begin transaction
    // 1. Restore profile
    if (backupData.profile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(backupData.profile);

      if (profileError) throw profileError;
    }

    // 2. Restore settings
    if (backupData.settings) {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert(backupData.settings);

      if (settingsError) throw settingsError;
    }

    // 3. Restore subscriptions
    if (backupData.subscriptions && backupData.subscriptions.length > 0) {
      // First delete existing subscriptions
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then insert backup subscriptions
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(backupData.subscriptions);

      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error restoring data:', error);
    throw error;
  }
}