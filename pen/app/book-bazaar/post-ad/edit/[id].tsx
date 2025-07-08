import React, { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function EditAdScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  useEffect(() => {
    if (id) {
      router.replace(`/book-bazaar/post-ad?id=${id}`);
    }
  }, [id]);
  
  return null;
}
