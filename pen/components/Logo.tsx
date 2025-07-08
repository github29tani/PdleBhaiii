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
      if (imagePath) {
        try {
          const { data } = supabase.storage
            .from('logo')
            .getPublicUrl(imagePath);
          
          if (data?.publicUrl) {
            setImageUrl(data.publicUrl);
          }
        } catch (error) {
          console.error('Error loading logo:', error);
        }
      }
    };

    loadImage();
  }, [imagePath]);

  if (!imageUrl) {
    return (
      <View style={[styles.placeholder, { width: size, height: size }, style]} />
    );
  }

  return (
    <View style={[styles.container, { width: size }, style]}>
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: '100%',
          height: '100%',
          resizeMode: 'contain',
        }}
        transition={300}
        contentFit="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});

export default Logo;
