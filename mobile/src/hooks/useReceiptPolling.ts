import { useEffect, useRef, useCallback } from 'react';
import { receiptService } from '../services/api';

const POLL_INTERVAL_MS = 5000;
const MAX_EMPTY_POLLS = 12; // Para tras 60s sin recibos en procesamiento

export const useReceiptPolling = (
  onUpdate: () => void,
  active: boolean = true
) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const emptyPollsRef = useRef(0);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    emptyPollsRef.current = 0;

    intervalRef.current = setInterval(async () => {
      try {
        const res = await receiptService.getReceipts({ status: 'processing', limit: 5 });
        if ((res.data?.length ?? 0) > 0) {
          emptyPollsRef.current = 0;
          onUpdateRef.current();
        } else {
          emptyPollsRef.current += 1;
          if (emptyPollsRef.current >= MAX_EMPTY_POLLS) {
            stopPolling();
          }
        }
      } catch {
        // Silencioso
      }
    }, POLL_INTERVAL_MS);

    return stopPolling;
  }, [active, stopPolling]);
};
