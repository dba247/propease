import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { theme } from '../data/theme';
import { registerAccount } from '../data/accountStore';

// Locked management credentials
const LOCKED_PHONE   = '9494154838';
const LOCKED_COUNTRY = '+1';
const LOCKED_EMAIL   = 'propeasemgr@propease.in';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', label: 'India', maxLen: 10, placeholder: '9876543210' },
  { code: '+1',  flag: '🇺🇸', label: 'US',    maxLen: 10, placeholder: '4155550100' },
];

export default function ManagementSignupScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '', confirm: '' });
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = () => {
    if (!form.name.trim() || !form.mobile.trim() || !form.password) {
      Alert.alert('Required', 'Please fill in name, mobile and password.');
      return;
    }
    if (form.mobile.length < selectedCountry.maxLen) {
      Alert.alert('Invalid Mobile', `Please enter a valid ${selectedCountry.maxLen}-digit mobile number.`);
      return;
    }
    if (selectedCountry.code !== LOCKED_COUNTRY || form.mobile.trim() !== LOCKED_PHONE) {
      Alert.alert('Unauthorised', 'Management accounts must use the authorised phone number.');
      return;
    }
    if (form.email.trim().toLowerCase() !== LOCKED_EMAIL) {
      Alert.alert('Unauthorised', 'Management accounts must use the authorised email address.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    const result = registerAccount({
      name:        form.name.trim(),
      mobile:      form.mobile.trim(),
      countryCode: selectedCountry.code,
      email:       form.email.trim(),
      password:    form.password,
    });

    if (!result.success) {
      Alert.alert('Account Exists', result.error);
      return;
    }

    Alert.alert(
      'Account Created',
      'Your management account has been created. Please log in.',
      [{ text: 'Log In', onPress: () => navigation.replace('ManagerLogin') }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1628" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Management Account</Text>
        <Text style={styles.sub}>PropEase Internal Access</Text>
      </View>

      <View style={styles.form}>

        {/* Name */}
        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} placeholder="Your name"
          placeholderTextColor={theme.colors.textLight}
          value={form.name} onChangeText={v => set('name', v)} />

        {/* Mobile */}
        <Text style={styles.label}>Mobile Number *</Text>
        <View style={styles.phoneRow}>
          <TouchableOpacity style={styles.countrySelector}
            onPress={() => setShowCountryPicker(!showCountryPicker)}>
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.countryCode}>{selectedCountry.code}</Text>
            <Text style={styles.dropArrow}>{showCountryPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          <TextInput style={styles.phoneInput}
            placeholder={selectedCountry.placeholder}
            placeholderTextColor={theme.colors.textLight}
            keyboardType="phone-pad"
            maxLength={selectedCountry.maxLen}
            value={form.mobile} onChangeText={v => set('mobile', v)} />
        </View>
        {showCountryPicker && (
          <View style={styles.countryDropdown}>
            {COUNTRY_CODES.map(c => (
              <TouchableOpacity key={c.code}
                style={[styles.countryOption, selectedCountry.code === c.code && styles.countryOptionActive]}
                onPress={() => { setSelectedCountry(c); setShowCountryPicker(false); set('mobile', ''); }}>
                <Text style={styles.countryOptionFlag}>{c.flag}</Text>
                <Text style={styles.countryOptionLabel}>{c.label}</Text>
                <Text style={styles.countryOptionCode}>{c.code}</Text>
                {selectedCountry.code === c.code && <Text style={styles.tick}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Email */}
        <Text style={styles.label}>Email Address</Text>
        <TextInput style={styles.input} placeholder="you@company.com"
          placeholderTextColor={theme.colors.textLight}
          keyboardType="email-address" autoCapitalize="none"
          value={form.email} onChangeText={v => set('email', v)} />

        {/* Password */}
        <Text style={styles.label}>Password *</Text>
        <View style={styles.passwordRow}>
          <TextInput style={styles.passwordInput}
            placeholder="Min 6 characters"
            placeholderTextColor={theme.colors.textLight}
            secureTextEntry={!showPassword}
            value={form.password} onChangeText={v => set('password', v)} />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={styles.label}>Confirm Password *</Text>
        <View style={styles.passwordRow}>
          <TextInput style={styles.passwordInput}
            placeholder="Re-enter password"
            placeholderTextColor={theme.colors.textLight}
            secureTextEntry={!showConfirm}
            value={form.confirm} onChangeText={v => set('confirm', v)} />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Text style={styles.createBtnText}>Create Account →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.replace('ManagerLogin')}>
          <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Log In</Text></Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    backgroundColor: '#0a1628',
    paddingTop: 50, paddingBottom: 28, paddingHorizontal: 24,
    borderBottomWidth: 2, borderBottomColor: '#1e3a5f',
  },
  back: { color: '#5a7a9a', fontSize: 14, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  sub: { color: '#5a7a9a', fontSize: 13, marginTop: 4 },
  form: { padding: 24 },
  label: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.colors.text,
  },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: theme.colors.border,
  },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 14,
    borderRightWidth: 1, borderRightColor: theme.colors.border, gap: 5,
  },
  countryFlag: { fontSize: 18 },
  countryCode: { fontWeight: '700', color: theme.colors.primary, fontSize: 14 },
  dropArrow: { fontSize: 9, color: theme.colors.textLight },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: theme.colors.text },
  countryDropdown: {
    backgroundColor: theme.colors.card, borderWidth: 1.5,
    borderColor: theme.colors.border, borderRadius: 10, marginTop: 6, overflow: 'hidden',
  },
  countryOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  countryOptionActive: { backgroundColor: 'rgba(10,22,40,0.07)' },
  countryOptionFlag: { fontSize: 20 },
  countryOptionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text },
  countryOptionCode: { fontSize: 14, color: theme.colors.textLight, fontWeight: '600' },
  tick: { fontSize: 14, color: theme.colors.primary, fontWeight: '800' },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.colors.text },
  eyeBtn: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 18 },
  createBtn: {
    backgroundColor: '#0a1628', borderRadius: theme.radius.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
    borderWidth: 2, borderColor: '#1e3a5f',
  },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: theme.colors.textSecondary, fontSize: 14 },
  loginLinkBold: { color: theme.colors.primary, fontWeight: '700' },
});