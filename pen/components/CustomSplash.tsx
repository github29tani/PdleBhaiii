import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '../lib/supabase';

const CustomSplash = ({ children }: { children: React.ReactNode }) => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashImage, setSplashImage] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Use the direct URL for the splash screen
        const splashUrl = 'https://sulznkznjuhxbjpmjviv.supabase.co/storage/v1/object/public/logo/splash-icon.png';
        console.log('Loading splash screen from URL:', splashUrl);
        
        // Set the URL first to start loading
        setSplashImage(splashUrl);
        
        // Verify the image exists
        const response = await fetch(splashUrl);
        if (response.ok) {
          console.log('Splash screen loaded successfully');
        } else {
          console.warn('Splash image not found at URL:', splashUrl);
        }
      } catch (e) {
        console.warn('Error loading splash image:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady || !splashImage) {
    return (
      <View style={styles.container}>
        <Image 
          source={{ uri: splashImage || '' }} 
          style={styles.image} 
          resizeMode="contain"
        />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
  },
});

export default CustomSplash;
