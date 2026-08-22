import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { theme } from '../data/theme';
import { findAccount } from '../data/accountStore';
import { loginAsCustomer } from '../navigation/AppNavigator';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', label: 'India', maxLen: 10, placeholder: '9876543210' },
  { code: '+1',  flag: '🇺🇸', label: 'US',    maxLen: 10, placeholder: '4155550100' },
];

export default function LoginScreen({ navigation }) {
  const [loginMode, setLoginMode] = useState('phone');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const clearErrors = () => { setIdentifierError(''); setPasswordError(''); setRoleError(''); };

  const handleLogin = async () => {
    clearErrors();

    if (!identifier) {
      setIdentifierError(loginMode === 'phone' ? 'Please enter your phone number.' : 'Please enter your email address.');
      return;
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      return;
    }

    setLoading(true);
    const { found, wrongPassword, account } = await findAccount({
      loginMode,
      identifier: identifier.trim(),
      countryCode: selectedCountry.code,
      password,
    });

    setLoading(false);
    if (!found) {
      setIdentifierError(
        loginMode === 'phone'
          ? `No account found for ${selectedCountry.code} ${identifier}. Please create an account first.`
          : `No account found for "${identifier.trim()}". Please create an account first.`
      );
      return;
    }

    if (wrongPassword) {
      setPasswordError('Incorrect password. Please try again.');
      return;
    }

    // Block managers — they must use the management portal
    if (account.role === 'manager') {
      setRoleError('This is the Customer Login. Management staff must use the Management Portal.');
      return;
    }
    loginAsCustomer(account.id);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>🏠</Text>
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <Text style={styles.headerSub}>Customer Login</Text>
        </View>

        <View style={styles.form}>

          {/* Phone / Email Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, loginMode === 'phone' && styles.modeBtnActive]}
              onPress={() => { setLoginMode('phone'); setIdentifier(''); clearErrors(); }}
            >
              <Text style={[styles.modeBtnText, loginMode === 'phone' && styles.modeBtnTextActive]}>📱  Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, loginMode === 'email' && styles.modeBtnActive]}
              onPress={() => { setLoginMode('email'); setIdentifier(''); clearErrors(); }}
            >
              <Text style={[styles.modeBtnText, loginMode === 'email' && styles.modeBtnTextActive]}>✉️  Email</Text>
            </TouchableOpacity>
          </View>

          {/* Phone Input */}
          {loginMode === 'phone' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.phoneRow, identifierError ? styles.inputError : null]}>
                <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={() => setShowCountryPicker(!showCountryPicker)}
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
                  value={identifier}
                  onChangeText={v => { setIdentifier(v); setIdentifierError(''); }}
                />
              </View>
              {showCountryPicker && (
                <View style={styles.countryDropdown}>
                  {COUNTRY_CODES.map(c => (
                    <TouchableOpacity
                      key={c.code}
                      style={[styles.countryOption, selectedCountry.code === c.code && styles.countryOptionActive]}
                      onPress={() => { setSelectedCountry(c); setShowCountryPicker(false); setIdentifier(''); clearErrors(); }}
                    >
                      <Text style={styles.countryOptionFlag}>{c.flag}</Text>
                      <Text style={styles.countryOptionLabel}>{c.label}</Text>
                      <Text style={styles.countryOptionCode}>{c.code}</Text>
                      {selectedCountry.code === c.code && <Text style={styles.countryTick}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {identifierError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️  {identifierError}</Text>
                  {identifierError.includes('create an account') && (
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.errorSignupBtn}>
                      <Text style={styles.errorSignupBtnText}>Create Free Account →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
          )}

          {/* Email Input */}
          {loginMode === 'email' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, identifierError ? styles.inputError : null]}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={identifier}
                onChangeText={v => { setIdentifier(v); setIdentifierError(''); }}
              />
              {identifierError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️  {identifierError}</Text>
                  {identifierError.includes('create an account') && (
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.errorSignupBtn}>
                      <Text style={styles.errorSignupBtnText}>Create Free Account →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
          )}

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.passwordRow, passwordError ? styles.inputError : null]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.textLight}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={v => { setPassword(v); setPasswordError(''); }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {passwordError}</Text>
              </View>
            ) : null}
          </View>

          {roleError ? (
            <View style={styles.roleErrorBox}>
              <Text style={styles.roleErrorText}>🚫  {roleError}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Login →</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50, paddingBottom: 40,
    paddingHorizontal: 24, alignItems: 'center',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { color: '#a0c0e0', fontSize: 15 },
  logo: { fontSize: 48, marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff' },
  headerSub: { color: '#90b8d8', fontSize: 14, marginTop: 4 },
  form: { padding: 24 },
  modeToggle: {
    flexDirection: 'row', backgroundColor: theme.colors.card,
    borderRadius: 12, borderWidth: 1.5, borderColor: theme.colors.border,
    marginBottom: 24, overflow: 'hidden',
  },
  modeBtn: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  modeBtnActive: { backgroundColor: theme.colors.primary },
  modeBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.textLight },
  modeBtnTextActive: { color: '#fff' },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
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
  countryOptionActive: { backgroundColor: 'rgba(30,100,200,0.07)' },
  countryOptionFlag: { fontSize: 20 },
  countryOptionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text },
  countryOptionCode: { fontSize: 14, color: theme.colors.textLight, fontWeight: '600' },
  countryTick: { fontSize: 14, color: theme.colors.primary, fontWeight: '800' },
  input: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.colors.text,
  },
  inputError: { borderColor: '#ef4444' },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.colors.text },
  eyeBtn: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 18 },
  errorBox: {
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 8, padding: 10, marginTop: 8,
  },
  errorText: { color: '#b91c1c', fontSize: 13, lineHeight: 18 },
  errorSignupBtn: {
    marginTop: 8, backgroundColor: '#ef4444',
    borderRadius: 7, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start',
  },
  errorSignupBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -4 },
  forgotText: { color: theme.colors.primaryLight, fontSize: 13, fontWeight: '600' },
  loginBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { paddingHorizontal: 12, color: theme.colors.textLight, fontSize: 13 },
  signupLink: { alignItems: 'center' },
  signupLinkText: { color: theme.colors.textSecondary, fontSize: 14 },
  signupBold: { color: theme.colors.primary, fontWeight: '700' },
  roleErrorBox: {
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: 10, padding: 14, marginBottom: 16,
  },
  roleErrorText: { color: '#92400e', fontSize: 13, lineHeight: 20, fontWeight: '600' },
  demoNote: {
    backgroundColor: '#fef9ec', borderRadius: theme.radius.md,
    padding: 14, marginTop: 24, borderWidth: 1, borderColor: '#fde68a',
  },
  demoNoteTitle: { color: '#92400e', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  demoNoteText: { color: '#92400e', fontSize: 12, marginTop: 3, lineHeight: 18 },
});