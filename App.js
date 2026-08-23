import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { initAccountStore } from './src/data/accountStore';
import { theme } from './src/data/theme';

import LandingScreen         from './src/screens/LandingScreen';
import LoginScreen           from './src/screens/LoginScreen';
import ManagementLoginScreen from './src/screens/ManagementLoginScreen';
import DashboardScreen       from './src/screens/DashboardScreen';
import CustomersScreen       from './src/screens/CustomersScreen';
import RentScreen            from './src/screens/RentScreen';
import WorkOrdersScreen      from './src/screens/WorkOrdersScreen';
import ContactScreen         from './src/screens/ContactScreen';
import OwnerPortalScreen     from './src/screens/OwnerPortalScreen';
import TenantPortalScreen    from './src/screens/TenantPortalScreen';

initAccountStore();

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// Global auth state callbacks — set by App, called by any screen
export const Auth = { login: null, logout: null, user: null };

function ManagerTabs() {
  const icons = { Dashboard:'🏠', Customers:'👥', Rent:'💰', 'Work Orders':'📋', Contact:'📞' };
  return (
    <Tab.Navigator screenOptions={({ route: r }) => ({
      tabBarIcon: () => <Text style={{ fontSize: 20 }}>{icons[r.name]}</Text>,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textLight,
      tabBarStyle: { backgroundColor:'#fff', borderTopColor:theme.colors.border, height:60, paddingBottom:6 },
      tabBarLabelStyle: { fontSize:10, fontWeight:'700' },
      headerShown: false,
    })}>
      <Tab.Screen name="Dashboard"   component={DashboardScreen} />
      <Tab.Screen name="Customers"   component={CustomersScreen} />
      <Tab.Screen name="Rent"        component={RentScreen} />
      <Tab.Screen name="Work Orders" component={WorkOrdersScreen} />
      <Tab.Screen name="Contact"     component={ContactScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [auth, setAuth] = useState(null); // null | { role, user, renterId }

  // Wire up global callbacks immediately on every render
  Auth.logout = () => setAuth(null);
  Auth.login  = (state) => setAuth(state);
  Auth.user   = auth?.user || null;

  if (auth?.role === 'manager') {
    return (
      <NavigationContainer>
        <ManagerTabs />
      </NavigationContainer>
    );
  }

  if (auth?.role === 'owner') {
    return (
      <View style={{ flex: 1 }}>
        <OwnerPortalScreen />
      </View>
    );
  }

  if (auth?.role === 'tenant') {
    return (
      <View style={{ flex: 1 }}>
        <TenantPortalScreen />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing"      component={LandingScreen} />
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="ManagerLogin" component={ManagementLoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}