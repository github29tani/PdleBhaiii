import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';

interface LogoProps {
  size?: number;
  imagePath?: string;
  style?: any;
}

const Logo: React.FC<LogoProps> = ({
  size = 250, 
  imagePath = 'Screenshot 2025-06-30 at 16.46.16.png', 
  style
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        // Use the direct URL for the app icon (fixed URL)
        const url = 'https://sulznkznjuhxbjpmjviv.supabase.co/storage/v1/object/public/logo/app-icon.png';
        
        // Verify the image exists
        console.log('Loading app icon from URL:', url);
        const response = await fetch(url);
        if (response.ok) {
          console.log('App icon loaded successfully');
          setImageUrl(url);
        } else {
          console.warn('Logo image not found at URL:', url);
          // Fallback to a placeholder or local asset if needed
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };

    loadImage();
  }, []);

  if (!imageUrl) {
    return (
      <View style={[styles.placeholder, { width: size, height: size }, style]} />
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}>
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: '100%',
          height: '120%',
          resizeMode: 'cover',
          marginTop: '-10%',
        }}
        transition={300}
        contentFit="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});

export default Logo;
