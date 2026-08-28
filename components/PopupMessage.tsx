import * as Clipboard from 'expo-clipboard';
import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const APP_BASE_URL = 'https://campuscares.us';

interface PopupMessageProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  opportunityId?: number;
}

const TYPE_STYLES = {
  success: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    text: '#166534',
    icon: '✓',
  },
  warning: {
    bg: '#fefce8',
    border: '#fde68a',
    text: '#854d0e',
    icon: '⚠',
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#991b1b',
    icon: '✕',
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1e40af',
    icon: 'ℹ',
  },
};

const onInvite = async (opportunityId: number) => {
  const inviteLink = `${APP_BASE_URL}/opportunities/${opportunityId}`;
  const message =
    `Join me in volunteering with CampusCares!\n\nI just signed up for this opportunity and thought you might want to come serve with me.\n\nSign up here:\n${inviteLink}`;

  try {
    const result = await Share.share({
      message,
      title: 'Serve with me on CampusCares!',
      // url: inviteLink, // iOS only — adds a separate URL field; often redundant with message
    });

    if (result.action === Share.dismissedAction) {
      // user cancelled the share sheet — no action needed
      return;
    }
  } catch (err) {
    // Fallback: copy to clipboard if Share fails for some reason
    try {
      await Clipboard.setStringAsync(inviteLink);
      Alert.alert('Invite link copied!');
    } catch {
      Alert.alert('Error', 'Failed to share or copy invite link.');
    }
  }
};

const PopupMessage: React.FC<PopupMessageProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  opportunityId,
}) => {
  const s = TYPE_STYLES[type];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.box, { backgroundColor: s.bg, borderColor: s.border }]}>
          <View style={styles.row}>
            <Text style={[styles.icon, { color: s.text }]}>{s.icon}</Text>
            <View style={styles.content}>
              <Text style={[styles.title, { color: s.text }]}>{title}</Text>
              <Text style={[styles.message, { color: s.text }]}>{message}</Text>
              <View style={styles.buttons}>
                {type === 'success' && opportunityId && onInvite && (
                  <Pressable
                    onPress={() => onInvite(opportunityId)}
                    style={[styles.btn, { borderColor: s.border, backgroundColor: s.bg }]}
                  >
                    <Text style={[styles.btnTxt, { color: s.text }]}>Invite Friends!</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={onClose}
                  style={[styles.btn, styles.btnFull, { borderColor: s.border, backgroundColor: s.bg }]}
                >
                  <Text style={[styles.btnTxt, { color: s.text }]}>Got it</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  box: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttons: {
    marginTop: 16,
    gap: 10,
    alignItems: 'center',
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  btnFull: {
    width: '100%',
    alignItems: 'center',
  },
  btnTxt: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default PopupMessage;