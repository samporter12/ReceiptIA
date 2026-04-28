import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/store/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerPushToken, setupNotificationListeners } from './src/utils/pushNotifications';

function AppWithNotifications() {
  const { user } = useAuth();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    registerPushToken(user.id);

    const cleanup = setupNotificationListeners(
      (_notification) => {
        // Notificación recibida en primer plano — no necesita acción extra
      },
      (response) => {
        // Usuario tocó la notificación
        const receiptId = response.notification.request.content.data?.receiptId;
        if (receiptId && navigationRef.current) {
          navigationRef.current.navigate('ReceiptDetail', { receiptId });
        }
      }
    );
    return cleanup;
  }, [user?.id]);

  return <AppNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppWithNotifications />
    </AuthProvider>
  );
}
