import { Platform, Alert } from 'react-native';

/**
 * Cross-platform confirmation dialog.
 *
 * React Native's Alert.alert is a no-op on web (react-native-web has no
 * real implementation), so any confirm-before-action flow built purely
 * on Alert.alert silently does nothing when tested in a browser. This
 * wrapper falls back to the browser's native window.confirm() on web,
 * and uses the real Alert.alert on iOS/Android as normal.
 *
 * @param {string} title
 * @param {string} message
 * @param {() => void} onConfirm - called if the user confirms
 * @param {string} confirmLabel - button label on native (default "OK")
 */
export function confirmDialog(title, message, onConfirm, confirmLabel = 'OK') {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    const ok = typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`);
    if (ok) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
