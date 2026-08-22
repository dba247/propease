import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { theme } from '../data/theme';
import { registerAccount } from '../data/accountStore';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', label: 'India', maxLen: 10, placeholder: '9876543210' },
  { code: '+1',  flag: '🇺🇸', label: 'US',    maxLen: 10, placeholder: '4155550100' },
];

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '' });
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!form.name || !form.mobile || !form.password) {
      Alert.alert('Missing Info', 'Please fill in name, mobile number, and password.');
      return;
    }
    if (form.mobile.length < selectedCountry.maxLen) {
      Alert.alert('Invalid Mobile', `Please enter a valid ${selectedCountry.maxLen}-digit mobile number.`);
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await registerAccount({
      name: form.name,
      mobile: form.mobile,
      countryCode: selectedCountry.code,
      email: form.email,
      password: form.password,
    });

    setLoading(false);
    if (!result.success) {
      Alert.alert('Account Exists', result.error);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Account Created!</Text>
          <Text style={styles.successDesc}>
            Account created. Please log in with your {selectedCountry.code} {form.mobile}.
          </Text>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.submitText}>Go to Login →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>

      <View style={styles.form}>
        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Rajesh Kumar"
            placeholderTextColor={theme.colors.textLight}
            value={form.name}
            onChangeText={(val) => setForm({ ...form, name: val })}
          />
        </View>

        {/* Mobile with country code */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mobile Number *</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => { setShowCountryPicker(!showCountryPicker); setShowCities(false); }}
            >
              <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
              <Text style={styles.countryCode}>{selectedCountry.code}</Text>
              <Text style={styles.dropArrow}>{showCountryPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              placeholder={selectedCountry.placeholder}
              placeholderTextColor={theme.colors.textLight}
              keyboardType="phone-pad"
              maxLength={selectedCountry.maxLen}
              value={form.mobile}
              onChangeText={(val) => setForm({ ...form, mobile: val })}
            />
          </View>
          {showCountryPicker && (
            <View style={styles.countryDropdown}>
              {COUNTRY_CODES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.countryOption, selectedCountry.code === c.code && styles.countryOptionActive]}
                  onPress={() => {
                    setSelectedCountry(c);
                    setShowCountryPicker(false);
                    setForm({ ...form, mobile: '' });
                  }}
                >
                  <Text style={styles.countryOptionFlag}>{c.flag}</Text>
                  <Text style={styles.countryOptionLabel}>{c.label}</Text>
                  <Text style={styles.countryOptionCode}>{c.code}</Text>
                  {selectedCountry.code === c.code && <Text style={styles.countryTick}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="rajesh@gmail.com"
            placeholderTextColor={theme.colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(val) => setForm({ ...form, email: val })}
          />
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Min 6 characters"
              placeholderTextColor={theme.colors.textLight}
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(val) => setForm({ ...form, password: val })}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* City */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>City</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => { setShowCities(!showCities); setShowCountryPicker(false); }}
          >
            <Text style={selectedCity ? styles.pickerText : styles.pickerPlaceholder}>
              {selectedCity || 'Select your city'}
            </Text>
            <Text style={styles.pickerArrow}>{showCities ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showCities && (
            <View style={styles.cityList}>
              {cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.cityItem, selectedCity === city && styles.cityItemActive]}
                  onPress={() => { setSelectedCity(city); setForm({ ...form, city }); setShowCities(false); }}
                >
                  <Text style={[styles.cityText, selectedCity === city && styles.cityTextActive]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSignup} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Create My Free Account →</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  successContainer: {
    flex: 1, backgroundColor: theme.colors.bg,
    justifyContent: 'center', padding: 28,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50, paddingBottom: 30, paddingHorizontal: 24,
  },
  backBtn: { marginBottom: 16 },
  backText: { color: '#a0c0e0', fontSize: 15 },
  headerTitle: { fontSize: 30, fontWeight: '900', color: '#fff' },
  headerSub: { color: '#90b8d8', fontSize: 14, marginTop: 4 },
  form: { padding: 24 },
  freePill: {
    backgroundColor: '#ecfdf5', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16,
    alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#a7f3d0',
  },
  freePillText: { color: '#059669', fontWeight: '700', fontSize: 13 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  input: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: theme.colors.text,
  },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
  },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 14,
    borderRightWidth: 1, borderRightColor: theme.colors.border,
    gap: 5,
  },
  countryFlag: { fontSize: 18 },
  countryCode: { fontWeight: '700', color: theme.colors.primary, fontSize: 14 },
  dropArrow: { fontSize: 9, color: theme.colors.textLight },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: theme.colors.text },
  countryDropdown: {
    backgroundColor: theme.colors.card,
    borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: 10, marginTop: 6, overflow: 'hidden',
  },
  countryOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  countryOptionActive: { backgroundColor: 'rgba(30,100,200,0.07)' },
  countryOptionFlag: { fontSize: 20 },
  countryOptionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text },
  countryOptionCode: { fontSize: 14, color: theme.colors.textLight, fontWeight: '600' },
  countryTick: { fontSize: 14, color: theme.colors.primary, fontWeight: '800' },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.colors.text },
  eyeBtn: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 18 },
  picker: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerText: { fontSize: 15, color: theme.colors.text },
  pickerPlaceholder: { fontSize: 15, color: theme.colors.textLight },
  pickerArrow: { color: theme.colors.textSecondary },
  cityList: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border, marginTop: 4, overflow: 'hidden',
  },
  cityItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  cityItemActive: { backgroundColor: theme.colors.primary },
  cityText: { fontSize: 15, color: theme.colors.text },
  cityTextActive: { color: '#fff', fontWeight: '700' },
  submitBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: theme.colors.textSecondary, fontSize: 14 },
  loginLinkBold: { color: theme.colors.primary, fontWeight: '700' },
  successBox: {
    backgroundColor: '#ecfdf5', borderRadius: 20,
    borderWidth: 1, borderColor: '#a7f3d0',
    padding: 32, alignItems: 'center',
  },
  successIcon: { fontSize: 56, marginBottom: 14 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#065f46', marginBottom: 10 },
  successDesc: { fontSize: 14, color: '#047857', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
});