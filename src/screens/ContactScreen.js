import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { theme } from '../data/theme';

const SUPPORT_PHONE = '9876543210';

export default function ContactScreen() {
  const [form, setForm] = useState({ name: '', mobile: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const callNow  = () => Linking.openURL(`tel:+91${SUPPORT_PHONE}`);
  const whatsapp = () => Linking.openURL(`https://wa.me/91${SUPPORT_PHONE}`);

  const submitForm = () => {
    if (!form.name || !form.mobile) {
      Alert.alert('Required', 'Please enter your name and mobile number.');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.successTitle}>Request Submitted</Text>
        <Text style={styles.successDesc}>Our team will call you within 24 hours.</Text>
        <TouchableOpacity style={styles.callNowBtn} onPress={callNow}>
          <Text style={styles.callNowText}>📞 Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSubmitted(false)}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contact Support</Text>
      </View>

      {/* Direct contact */}
      <View style={styles.section}>
        <View style={styles.contactCards}>
          <TouchableOpacity style={styles.contactCard} onPress={callNow}>
            <Text style={styles.contactIcon}>📞</Text>
            <Text style={styles.contactLabel}>Call</Text>
            <Text style={styles.contactValue}>+91 {SUPPORT_PHONE}</Text>
            <Text style={styles.contactSub}>Mon–Sat 9am–7pm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactCard, styles.waCard]} onPress={whatsapp}>
            <Text style={styles.contactIcon}>💬</Text>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactValue}>Chat Now</Text>
            <Text style={styles.contactSub}>Replies within 1hr</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Callback form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request a Callback</Text>
        {[
          { label: 'Name *',   key: 'name',   placeholder: 'Your name',     keyboard: 'default' },
          { label: 'Mobile *', key: 'mobile', placeholder: '9876543210',    keyboard: 'phone-pad', maxLength: 10 },
        ].map(field => (
          <View style={styles.fieldGroup} key={field.key}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={theme.colors.textLight}
              keyboardType={field.keyboard}
              maxLength={field.maxLength}
              value={form[field.key]}
              onChangeText={val => setForm({ ...form, [field.key]: val })}
            />
          </View>
        ))}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="How can we help you?"
            placeholderTextColor={theme.colors.textLight}
            multiline
            numberOfLines={3}
            value={form.message}
            onChangeText={val => setForm({ ...form, message: val })}
          />
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={submitForm}>
          <Text style={styles.submitText}>Request Callback</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50, paddingBottom: 24, paddingHorizontal: 24,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 14 },
  contactCards: { flexDirection: 'row', gap: 12 },
  contactCard: {
    flex: 1, backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg, padding: 18, alignItems: 'center',
  },
  waCard: { backgroundColor: '#075E54' },
  contactIcon: { fontSize: 30, marginBottom: 8 },
  contactLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  contactValue: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 4 },
  contactSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4, textAlign: 'center' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  input: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.colors.text,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  successContainer: {
    flex: 1, backgroundColor: theme.colors.bg,
    justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.text, marginBottom: 10 },
  successDesc: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  callNowBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg,
    paddingVertical: 16, paddingHorizontal: 40, marginBottom: 16,
  },
  callNowText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  backBtn: { marginTop: 8 },
  backBtnText: { color: theme.colors.primaryLight, fontSize: 14 },
});