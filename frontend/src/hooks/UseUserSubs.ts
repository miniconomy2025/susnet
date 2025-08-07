import { useState, useEffect } from 'react';
import { fetchApi } from '../utils/fetchApi';
import { ActorData } from '../../../types/api';

export const useUserSubs = (userName: string) => {
  const [userSubs, setUserSubs] = useState<ActorData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserSubs = async () => {
      setLoading(true);
      const res = await fetchApi("getActorFollowing", { name: userName });
      if (res.success) {
        setUserSubs(res.following);
      }
      setLoading(false);
    };

    if (userName) loadUserSubs();
  }, [userName]);

  return { userSubs, loading };
};