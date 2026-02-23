import { useEffect, useRef, useCallback } from 'react';
import { receiptService } from '../services/api';

export const useReceiptPolling = (
  onUpdate: () => void,
  active: boolean = true
) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // Mantener referencia actualizada sin re-ejecutar el efecto
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!active) return;

    intervalRef.current = setInterval(async () => {
      try {
        const res = await receiptService.getReceipts({
          status: 'processing',
          limit: 5,
        });
        if (res.data?.length > 0) {
          onUpdateRef.current();
        }
      } catch (err) {
        // Silencioso
      }
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);
};