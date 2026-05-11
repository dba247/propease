import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, StatusBar, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { theme } from '../data/theme';
import { findAccount } from '../data/accountStore';
import { loginAsManager } from '../navigation/AppNavigator';

// Locked management credentials
const ALLOWED_PHONE    = '9494154838';
const ALLOWED_COUNTRY  = '+1';
const ALLOWED_EMAIL    = 'propeasemgr@propease.in';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', label: 'India', maxLen: 10, placeholder: '9876543210' },
  { code: '+1',  flag: '🇺🇸', label: 'US',    maxLen: 10, placeholder: '4155550100' },
];


function ManagementSignupScreen({ navigation, onBack }) {
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
      [{ text: 'Log In', onPress: () => onBack ? onBack() : navigation.replace('ManagerLogin') }]
    );
  };

  return (
    <ScrollView style={signupStyles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1628" />

      <View style={signupStyles.header}>
        <TouchableOpacity onPress={() => onBack ? onBack() : navigation.goBack()}>
          <Text style={signupStyles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={signupStyles.title}>Create Management Account</Text>
        <Text style={signupStyles.sub}>PropEase Internal Access</Text>
      </View>

      <View style={signupStyles.form}>

        {/* Name */}
        <Text style={signupStyles.label}>Full Name *</Text>
        <TextInput style={signupStyles.input} placeholder="Your name"
          placeholderTextColor={theme.colors.textLight}
          value={form.name} onChangeText={v => set('name', v)} />

        {/* Mobile */}
        <Text style={signupStyles.label}>Mobile Number *</Text>
        <View style={signupStyles.phoneRow}>
          <TouchableOpacity style={signupStyles.countrySelector}
            onPress={() => setShowCountryPicker(!showCountryPicker)}>
            <Text style={signupStyles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={signupStyles.countryCode}>{selectedCountry.code}</Text>
            <Text style={signupStyles.dropArrow}>{showCountryPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          <TextInput style={signupStyles.phoneInput}
            placeholder={selectedCountry.placeholder}
            placeholderTextColor={theme.colors.textLight}
            keyboardType="phone-pad"
            maxLength={selectedCountry.maxLen}
            value={form.mobile} onChangeText={v => set('mobile', v)} />
        </View>
        {showCountryPicker && (
          <View style={signupStyles.countryDropdown}>
            {COUNTRY_CODES.map(c => (
              <TouchableOpacity key={c.code}
                style={[signupStyles.countryOption, selectedCountry.code === c.code && signupStyles.countryOptionActive]}
                onPress={() => { setSelectedCountry(c); setShowCountryPicker(false); set('mobile', ''); }}>
                <Text style={signupStyles.countryOptionFlag}>{c.flag}</Text>
                <Text style={signupStyles.countryOptionLabel}>{c.label}</Text>
                <Text style={signupStyles.countryOptionCode}>{c.code}</Text>
                {selectedCountry.code === c.code && <Text style={signupStyles.tick}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Email */}
        <Text style={signupStyles.label}>Email Address</Text>
        <TextInput style={signupStyles.input} placeholder="you@company.com"
          placeholderTextColor={theme.colors.textLight}
          keyboardType="email-address" autoCapitalize="none"
          value={form.email} onChangeText={v => set('email', v)} />

        {/* Password */}
        <Text style={signupStyles.label}>Password *</Text>
        <View style={signupStyles.passwordRow}>
          <TextInput style={signupStyles.passwordInput}
            placeholder="Min 6 characters"
            placeholderTextColor={theme.colors.textLight}
            secureTextEntry={!showPassword}
            value={form.password} onChangeText={v => set('password', v)} />
          <TouchableOpacity style={signupStyles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={signupStyles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={signupStyles.label}>Confirm Password *</Text>
        <View style={signupStyles.passwordRow}>
          <TextInput style={signupStyles.passwordInput}
            placeholder="Re-enter password"
            placeholderTextColor={theme.colors.textLight}
            secureTextEntry={!showConfirm}
            value={form.confirm} onChangeText={v => set('confirm', v)} />
          <TouchableOpacity style={signupStyles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={signupStyles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={signupStyles.createBtn} onPress={handleCreate}>
          <Text style={signupStyles.createBtnText}>Create Account →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={signupStyles.loginLink} onPress={() => onBack ? onBack() : navigation.replace('ManagerLogin')}>
          <Text style={signupStyles.loginLinkText}>Already have an account? <Text style={signupStyles.loginLinkBold}>Log In</Text></Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const signupStyles = StyleSheet.create({
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

export default function ManagementLoginScreen({ navigation }) {
  const [loginMode, setLoginMode] = useState('phone');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const clearErrors = () => {
    setIdentifierError('');
    setPasswordError('');
    setRoleError('');
    setShowCreateLink(false);
  };

  const handleLogin = () => {
    clearErrors();

    if (!identifier) {
      setIdentifierError(loginMode === 'phone' ? 'Please enter your phone number.' : 'Please enter your email address.');
      return;
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      return;
    }

    // Validate against locked credentials
    if (loginMode === 'phone') {
      if (selectedCountry.code !== ALLOWED_COUNTRY || identifier.trim() !== ALLOWED_PHONE) {
        setIdentifierError('Unauthorised. Please use the authorised management credentials.');
        return;
      }
    } else {
      if (identifier.trim().toLowerCase() !== ALLOWED_EMAIL) {
        setIdentifierError('Unauthorised. Please use the authorised management email.');
        return;
      }
    }

    setLoading(true);
    const { found, wrongPassword, account } = findAccount({
      loginMode,
      identifier: identifier.trim(),
      countryCode: selectedCountry.code,
      password,
    });
    setLoading(false);
    if (!found) {
      setIdentifierError(
        loginMode === 'phone'
          ? `No management account found for ${selectedCountry.code} ${identifier}.`
          : `No management account found for "${identifier.trim()}".`
      );
      setShowCreateLink(true);
      return;
    }

    if (wrongPassword) {
      setPasswordError('Incorrect password. Please try again.');
      return;
    }

    // Block customers from manager login
    if (account.role !== 'manager') {
      setRoleError('This login is for PropEase management only. Please use the Customer Login on the home screen.');
      return;
    }

    loginAsManager(account);
  };

  if (showSignup) {
    return <ManagementSignupScreen navigation={navigation} onBack={() => setShowSignup(false)} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a1628" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header — dark, distinct from customer login */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.lockBadge}>
            <Text style={styles.lockIcon}>🔐</Text>
          </View>
          <Text style={styles.headerTitle}>Management Portal</Text>
          <Text style={styles.headerSub}>PropEase Internal Access Only</Text>
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>⚠️  Authorised Personnel Only</Text>
          </View>
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
              {identifierError ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️  {identifierError}</Text></View> : null}
            </View>
          )}

          {/* Email Input */}
          {loginMode === 'email' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, identifierError ? styles.inputError : null]}
                placeholder="manager@propease.in"
                placeholderTextColor={theme.colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={identifier}
                onChangeText={v => { setIdentifier(v); setIdentifierError(''); }}
              />
              {identifierError ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️  {identifierError}</Text></View> : null}
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
            {passwordError ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️  {passwordError}</Text></View> : null}
          </View>

          {/* Role error — shown if a customer tries to log in here */}
          {roleError ? (
            <View style={styles.roleErrorBox}>
              <Text style={styles.roleErrorText}>🚫  {roleError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Management Login →</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    backgroundColor: '#0a1628',
    paddingTop: 50, paddingBottom: 36,
    paddingHorizontal: 24, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: '#1e3a5f',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { color: '#5a7a9a', fontSize: 15 },
  lockBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#1e3a5f', justifyContent: 'center',
    alignItems: 'center', marginBottom: 14,
    borderWidth: 2, borderColor: '#2a5080',
  },
  lockIcon: { fontSize: 30 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  headerSub: { color: '#5a7a9a', fontSize: 13, marginTop: 4 },
  warningBadge: {
    marginTop: 14, backgroundColor: 'rgba(234,179,8,0.15)',
    borderWidth: 1, borderColor: 'rgba(234,179,8,0.4)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
  },
  warningText: { color: '#ca8a04', fontSize: 12, fontWeight: '700' },
  form: { padding: 24 },
  modeToggle: {
    flexDirection: 'row', backgroundColor: theme.colors.card,
    borderRadius: 12, borderWidth: 1.5, borderColor: theme.colors.border,
    marginBottom: 24, overflow: 'hidden',
  },
  modeBtn: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#0a1628' },
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
  countryCode: { fontWeight: '700', color: '#0a1628', fontSize: 14 },
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
  countryTick: { fontSize: 14, color: '#0a1628', fontWeight: '800' },
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
  roleErrorBox: {
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: 10, padding: 14, marginBottom: 16,
  },
  roleErrorText: { color: '#92400e', fontSize: 13, lineHeight: 20, fontWeight: '600' },
  loginBtn: {
    backgroundColor: '#0a1628', borderRadius: theme.radius.lg,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 2, borderColor: '#1e3a5f',
  },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  createAccountBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1, borderColor: '#bae6fd',
    borderRadius: 10, padding: 16, marginTop: 16,
  },
  createAccountText: {
    color: '#0369a1', fontSize: 13, lineHeight: 20, marginBottom: 12,
  },
  createAccountBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8, paddingVertical: 11, alignItems: 'center',
  },
  createAccountBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  demoNote: {
    backgroundColor: '#fef9ec', borderRadius: theme.radius.md,
    padding: 14, marginTop: 24, borderWidth: 1, borderColor: '#fde68a',
  },
  demoNoteTitle: { color: '#92400e', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  demoNoteText: { color: '#92400e', fontSize: 12, marginTop: 3, lineHeight: 18 },
});