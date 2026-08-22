import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ManagementScreen({ route, navigation }) {
  const account = route?.params?.account;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Management Dashboard</Text>

      {account && (
        <View style={styles.card}>
          <Text style={styles.name}>{account.name}</Text>
          <Text>{account.email}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('CustomersScreen')}
      >
        <Text style={styles.btnText}>Go to Customers</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  card: {
    padding: 16,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    marginBottom: 20,
  },
  name: { fontSize: 18, fontWeight: '700' },
  btn: {
    backgroundColor: '#2f6fed',
    padding: 14,
    borderRadius: 10,
  },
  btnText: { color: '#fff', textAlign: 'center' },
});