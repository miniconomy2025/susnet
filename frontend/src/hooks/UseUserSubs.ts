// UseUserSubs.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../utils/fetchApi';
import { ActorData } from '../../../types/api';

export const useUserSubs = (userName: string) => {
  const [userSubs, setUserSubs] = useState<ActorData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUserSubs = useCallback(async () => {
    if (!userName) {
      setUserSubs([]);
      return;
    }
    setLoading(true);
    const res = await fetchApi("getActorFollowing", { name: userName });
    if (res.success) {
      setUserSubs(res.following);
    }
    setLoading(false);
  }, [userName]);

  useEffect(() => {
    loadUserSubs();
  }, [loadUserSubs]);

  return { userSubs, loading, refreshSubs: loadUserSubs };
};
