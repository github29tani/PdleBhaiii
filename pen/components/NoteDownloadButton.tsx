import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { AdModal } from './AdModal';
import { useNotesStore } from '@/store/notes-store';
import { useEarningsStore } from '@/store/earnings-store';
import { Platform, Linking, View, TouchableOpacity, Text, TextInput, StyleSheet, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { Download, Coffee } from 'lucide-react-native';
import { Input } from './Input';

interface NoteDownloadButtonProps {
  noteId: string;
  noteName: string;
  fileUrl: string;
  creatorId: string;
}

export const NoteDownloadButton: React.FC<NoteDownloadButtonProps> = ({
  noteId,
  noteName,
  fileUrl,
  creatorId
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const { downloadNote } = useNotesStore();
  const { addEarning } = useEarningsStore();
  
  // Update dimensions on screen rotation or size change
  useEffect(() => {
    const updateLayout = () => {
      setScreenWidth(Dimensions.get('window').width);
    };
    
    // Handle dimension changes
    const subscription = Dimensions.addEventListener('change', updateLayout);
    
    return () => {
      // Clean up event listener
      subscription.remove();
    };
  }, []);

  const handleDownload = async () => {
    if (!fileUrl) {
      console.error('No file URL provided');
      return;
    }

    try {
      setIsDownloading(true);
      
      // First update stats in Supabase
      await downloadNote(noteId);

      // Then handle the download
      if (Platform.OS === 'web') {
        window.open(fileUrl, '_blank');
      } else {
        // On mobile, open with system viewer
        const supported = await Linking.canOpenURL(fileUrl);
        if (supported) {
          await Linking.openURL(fileUrl);
        } else {
          throw new Error('Cannot open URL');
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileDownload = async () => {
    try {
      // Get the signed URL from the downloadNote function
      const signedUrl = await downloadNote(noteId);
      
      // If we got a signed URL, open it
      if (signedUrl) {
        // On web, open in new tab
        if (Platform.OS === 'web') {
          window.open(signedUrl, '_blank');
        } else {
          // On mobile, open with system viewer
          const supported = await Linking.canOpenURL(signedUrl);
          if (supported) {
            await Linking.openURL(signedUrl);
          } else {
            throw new Error('Cannot open URL');
          }
        }
      }
    } catch (error) {
      throw new Error('Failed to download file: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleTip = async () => {
    try {
      const amount = parseFloat(tipAmount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid amount');
        return;
      }

      await addEarning({
        amount,
        type: 'support_tip',
        noteId
      });

      setShowTipModal(false);
      setTipAmount('');
    } catch (error) {
      console.error('Tip failed:', error);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={handleDownload}
          style={[styles.iconButton, styles.downloadButton]}
          activeOpacity={0.7}
        >
          {isDownloading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Download size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowTipModal(true)}
          style={[styles.iconButton, styles.coffeeButton]}
          activeOpacity={0.7}
        >
          <Coffee size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showTipModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buy Me a Coffee</Text>
            <Text style={styles.modalSubtitle}>Support the creator with a coffee!</Text>

            <Input
              label="Amount (₹)"
              value={tipAmount}
              onChangeText={setTipAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
            />

            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                onPress={() => setShowTipModal(false)} 
                style={styles.modalButton}
                variant="secondary"
              />
              <Button 
                title="Buy Coffee" 
                onPress={handleTip} 
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadButton: {
    backgroundColor: colors.primary,
  },
  coffeeButton: {
    backgroundColor: '#FF4D4F', // Red color for coffee button
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    minWidth: 100,
    marginLeft: 8,
  },
});
