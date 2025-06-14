import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function Index() {
  const { session, isLoading } = useAuth();

  // While we're figuring out the auth state, show a loading indicator
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // If user is authenticated, redirect to app home page
  // Otherwise, redirect to auth pages
  return session ? <Redirect href="/(screens)" /> : <Redirect href="/(auth)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});