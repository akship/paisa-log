import { useEffect } from 'react';

export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      document.documentElement.classList.add('modal-open');
      return () => {
        document.documentElement.classList.remove('modal-open');
      };
    }
  }, [lock]);
}
