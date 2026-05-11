import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function ManagementSetupScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const validateEmail = (email) => {
    return /^[^\s@]+@propease\.in$/.test(email);
  };

  const handleCreate = () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Missing Info', 'All fields are required');
      return;
    }

    if (!validateEmail(form.email)) {
      Alert.alert('Invalid Email', 'Must use @propease.in domain');
      return;
    }

    // 👉 Replace with API/Firebase later
    const account = {
      id: Date.now().toString(),
      ...form,
    };

    console.log('Created Account:', account);

    Alert.alert('Success', 'Management account created');

    navigation.replace('ManagementScreen', {
      account,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Management Setup</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={form.name}
        onChangeText={v => set('name', v)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email (rajesh@propease.in)"
        autoCapitalize="none"
        value={form.email}
        onChangeText={v => set('email', v)}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={v => set('phone', v)}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={form.password}
        onChangeText={v => set('password', v)}
      />

      <TouchableOpacity style={styles.btn} onPress={handleCreate}>
        <Text style={styles.btnText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#2f6fed',
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});