import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../utils/fetchApi';
import { ActorData } from '../../../types/api';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<ActorData | null>(null);
  const [loading, setLoading] = useState(true);

  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    const res = await fetchApi("me", {});
    if (res.success) {
      setCurrentUser(res.actor);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  return { currentUser, loading, getCurrentUser };
};