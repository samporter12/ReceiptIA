import { supabaseAdmin } from './supabaseClient';
import logger from '../utils/logger';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> => {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    const token = (profile as any)?.push_token;
    if (!token) return;

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
    });

    if (!res.ok) {
      logger.warn('Expo push returned non-200', { status: res.status });
    }
  } catch (error: any) {
    logger.error('Error sending push notification', { error: error.message });
  }
};
