import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { initAccountStore } from './src/data/accountStore';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialise encrypted store and seed demo accounts on first launch
    initAccountStore().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1B2A' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return <AppNavigator />;
}