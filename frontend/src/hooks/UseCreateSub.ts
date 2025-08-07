import { useState } from 'react';
import { fetchApi } from '../utils/fetchApi';
import { Req_createSub, Res_createSub } from '../../../types/api';

export const useCreateSub = () => {
  const [creating, setCreating] = useState(false);

  const createSub = async (data: Req_createSub): Promise<Res_createSub> => {
    setCreating(true);
    try {
      return await fetchApi('createSub', {}, data);
    } finally {
      setCreating(false);
    }
  };

  return { createSub, creating };
};
