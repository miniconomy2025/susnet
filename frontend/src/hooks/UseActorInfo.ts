import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../utils/fetchApi';
import { ActorData, Req_EditActor } from '../../../../types/api';

export const useActorInfo = (actorName?: string) => {
  const [actor, setActor] = useState<ActorData<'full'> | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getActor = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    if (actorName) {
      const res = await fetchApi("getActor", { name: actorName });
      if (res.success) {
        setActor(res.actor);
      } else {
        setError('Actor not found');
      }
    } else {
      const res = await fetchApi("me", {});
      if (res.success) {
        setActor(res.actor);
      } else {
        setError('Failed to load user info');
      }
    }
    setLoading(false);
  }, [actorName]);

  const updateActor = useCallback(async (updates: Req_EditActor) => {
    if (!actor) return false;
    
    setUpdating(true);
    setError(null);
    
    try {
        const res = actorName 
        ? await fetchApi("updateActor", { actorName }, updates)
        : await fetchApi("updateMe", {}, updates);
        
        if (res.success) {
        await getActor(); // Refresh data
        return true;
        } else {
        setError('Failed to update actor');
        return false;
        }
    } finally {
        setUpdating(false); // This will always run
    }
    }, [actorName, actor, getActor]);

  useEffect(() => {
    getActor();
  }, [getActor]);

  return {
    actor,
    loading,
    updating,
    error,
    getActor,
    updateActor
  };
};
