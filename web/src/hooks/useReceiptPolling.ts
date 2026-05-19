import { useEffect, useRef } from 'react';

const POLL_INTERVAL = 8000; // 8 segundos

export function useReceiptPolling(onPoll: () => void, enabled: boolean) {
  const callbackRef = useRef(onPoll);
  callbackRef.current = onPoll;

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      callbackRef.current();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [enabled]);
}
