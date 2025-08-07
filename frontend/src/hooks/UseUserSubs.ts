import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../utils/fetchApi';
import { ActorData } from '../../../types/api';
import { useAuth } from './UseAuth';

export const useUserSubs = () => {
  const { currentUser } = useAuth();
  const [userSubs, setUserSubs] = useState<ActorData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUserSubs = useCallback(async () => {
    if (!currentUser?.name) return;
    setLoading(true);
    const res = await fetchApi("getActorFollowing", { name: currentUser.name });
    if (res.success) {
      setUserSubs(res.following);
    }
    setLoading(false);
  }, [currentUser?.name]);

  useEffect(() => {
    loadUserSubs();
  }, [loadUserSubs]);

  return { userSubs, loading, refreshSubs: loadUserSubs };
};
