import { Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { View } from 'react-native';
import { useEffect } from 'react';

export default function AdminLayout({ children }) {
  const { user, isAdmin } = useAuth();

  // Protect admin routes
  if (!user || !isAdmin) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <AdminSidebar />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}
