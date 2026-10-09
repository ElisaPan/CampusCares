import { getUserByEmail } from '@/api';
import { auth } from '@/firebase-config';
import { useUserStore } from '@/hooks/useUserStore';
import { useEffect, useState } from 'react';

export function useEnsureUser() {
  const hasUser = useUserStore((s) => !!s.currentUser);
  const [status, setStatus] = useState('started');

  useEffect(() => {
    if (hasUser) {
      setStatus('already-set');
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        setStatus('waiting-for-firebase');
        if (typeof (auth as any).authStateReady === 'function') {
          await (auth as any).authStateReady();
        }
        const fbUser = auth.currentUser;
        if (!fbUser?.email) {
          setStatus('no-firebase-user');
          return;
        }
        if (useUserStore.getState().currentUser) {
          setStatus('filled-meanwhile');
          return;
        }
        setStatus('fetching-user');
        const token = await fbUser.getIdToken();
        const user = await getUserByEmail(fbUser.email, token);
        if (!user) {
          setStatus('getUserByEmail-returned-empty');
          return;
        }
        if (!cancelled && !useUserStore.getState().currentUser) {
          useUserStore.getState().setCurrentUser(user);
        }
        setStatus('done');
      } catch (e: any) {
        setStatus(`error: ${String(e?.message ?? e)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasUser]);

  return status;
}