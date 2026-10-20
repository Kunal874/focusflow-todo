import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../features/auth/AuthContext';
import { connectionConfig } from '../lib/config';
import { Button } from './Button';
import { TextField } from './TextField';
import { colors, common } from '../app/theme';
export function ConnectionButton() {
  const { serverUrl, changeServer } = useAuth();
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState(serverUrl);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const open = () => {
    setUrl(serverUrl);
    setError('');
    setVisible(true);
  };
  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await changeServer(url);
      setVisible(false);
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Could not update the server.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Pressable accessibilityRole="button" onPress={open} style={styles.link}>
        <Text style={common.caption}>Server settings</Text>
      </Pressable>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!busy) setVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sheet}>
              <Text style={styles.title}>Connect to your server</Text>
              <Text style={[common.body, styles.description]}>
                Use the API address for your FocusFlow account. Changing it
                signs you out.
              </Text>
              <TextField
                label="API address"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                error={error || undefined}
                maxLength={2048}
              />
              {connectionConfig.allowHttp && (
                <View style={styles.presets}>
                  <Button
                    secondary
                    label="Android emulator"
                    onPress={() => setUrl('http://10.0.2.2:3000/api')}
                  />
                  <Button
                    secondary
                    label="USB-connected phone"
                    onPress={() => setUrl('http://127.0.0.1:3000/api')}
                  />
                  <Text style={common.caption}>
                    For USB, forward port 3000 with adb reverse. For Wi-Fi, use
                    your PC’s LAN address.
                  </Text>
                </View>
              )}
              <Button
                label={busy ? 'Saving…' : 'Save connection'}
                onPress={() => {
                  void save();
                }}
                busy={busy}
              />
              <Button
                secondary
                label="Cancel"
                disabled={busy}
                onPress={() => setVisible(false)}
                style={styles.cancel}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: '#17212288' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.paper,
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink },
  description: { marginVertical: 16 },
  presets: { gap: 10, marginBottom: 20 },
  cancel: { marginTop: 12 },
});
