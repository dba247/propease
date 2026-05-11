import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import LandingScreen        from '../screens/LandingScreen';
import SignupScreen         from '../screens/SignupScreen';
import LoginScreen          from '../screens/LoginScreen';
import ManagementLoginScreen from '../screens/ManagementLoginScreen';

// Manager screens
import DashboardScreen   from '../screens/DashboardScreen';
import CustomersScreen   from '../screens/CustomersScreen';
import RentScreen        from '../screens/RentScreen';
import WorkOrdersScreen  from '../screens/WorkOrdersScreen';
import ContactScreen     from '../screens/ContactScreen';

// Customer portal
import CustomerPortalScreen from '../screens/CustomerPortalScreen';

import { theme } from '../data/theme';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Manager bottom tabs ──────────────────────────────────────
function ManagerTabs({ route }) {
  const user = route?.params?.user;
  const icons = {
    Dashboard:    '🏠',
    Customers:    '👥',
    Rent:         '💰',
    'Work Orders':'📋',
    Contact:      '📞',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route: r }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{icons[r.name]}</Text>,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard"   component={DashboardScreen}  initialParams={{ user }} />
      <Tab.Screen name="Customers"   component={CustomersScreen} />
      <Tab.Screen name="Rent"        component={RentScreen} />
      <Tab.Screen name="Work Orders" component={WorkOrdersScreen} />
      <Tab.Screen name="Contact"     component={ContactScreen} />
    </Tab.Navigator>
  );
}

// ── Root stack ───────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Public */}
        <Stack.Screen name="Landing"          component={LandingScreen} />
        <Stack.Screen name="Signup"           component={SignupScreen} />
        <Stack.Screen name="Login"            component={LoginScreen} />
        {/* Hidden management entry — navigated to by 3-tap footer */}
        <Stack.Screen name="ManagerLogin"     component={ManagementLoginScreen} />
        {/* Authenticated */}
        <Stack.Screen name="ManagerTabs"      component={ManagerTabs} />
        <Stack.Screen name="CustomerTabs"     component={CustomerPortalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}