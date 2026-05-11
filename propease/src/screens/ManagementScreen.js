import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ManagementScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Management Dashboard</Text>

      <Text style={styles.subtitle}>
        Welcome to PropEase Management Panel
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Customers')}
      >
        <Text style={styles.buttonText}>Go to Customers</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f9',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});