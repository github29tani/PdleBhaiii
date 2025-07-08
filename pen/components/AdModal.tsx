import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Button } from './Button';
import { colors } from '@/constants/colors';
import { useEarningsStore } from '@/store/earnings-store';

interface AdModalProps {
  visible: boolean;
  onClose: () => void;
  onAdComplete: () => void;
  noteId?: string;
  noteName?: string;
}

export const AdModal: React.FC<AdModalProps> = ({ 
  visible, 
  onClose, 
  onAdComplete,
  noteId,
  noteName
}) => {
  const [adState, setAdState] = useState<'loading' | 'playing' | 'completed'>('loading');
  const [progress, setProgress] = useState(0);
  const { addEarning } = useEarningsStore();
  
  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    
    if (visible) {
      // Reset state at the start
      setAdState('loading');
      setProgress(0);
      
      // Simulate ad loading
      loadingTimeout = setTimeout(() => {
        setAdState('playing');
        
        // Start progress
        let currentProgress = 0;
        progressInterval = setInterval(() => {
          currentProgress += 2;
          
          if (currentProgress >= 100) {
            clearInterval(progressInterval);
            setProgress(100);
            setAdState('completed');
          } else {
            setProgress(currentProgress);
          }
        }, 100);
      }, 1500);
    }
    
    return () => {
      clearTimeout(loadingTimeout);
      clearInterval(progressInterval);
    };
  }, [visible]);

  // Handle ad completion separately
  useEffect(() => {
    if (adState === 'completed' && noteId && noteName) {
      addEarning({
        amount: 2.50,
        type: 'ad_view',
        noteId,
        noteName
      });
    }
  }, [adState, noteId, noteName, addEarning]);
  

  
  const handleComplete = useCallback(() => {
    if (adState === 'completed') {
      onAdComplete();
      onClose();
    }
  }, [adState, onAdComplete]);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Watch Ad to Download</Text>
          
          <View style={styles.adContainer}>
            {adState === 'loading' ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading ad...</Text>
              </View>
            ) : (
              <>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7' }} 
                  style={styles.adImage} 
                />
                
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
                
                <Text style={styles.adText}>
                  {adState === 'completed' 
                    ? 'Ad completed! You can now download the note.' 
                    : 'Please watch the entire ad to download the note.'}
                </Text>
              </>
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            {adState === 'completed' ? (
              <Button 
                title="Download Now" 
                onPress={handleComplete} 
                variant="primary" 
              />
            ) : (
              <Button 
                title="Cancel" 
                onPress={onClose} 
                variant="outline" 
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  adContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },
  adImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  adText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  buttonContainer: {
    alignItems: 'center',
  }
});