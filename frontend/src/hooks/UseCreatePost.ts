import { useState } from 'react';
import { fetchApi } from '../utils/fetchApi';
import { Req_createPost, Res_createPost } from '../../../types/api';

export const useCreatePost = () => {
  const [creating, setCreating] = useState(false);

  const createPost = async (data: Req_createPost): Promise<Res_createPost> => {
    setCreating(true);
    try {
      return await fetchApi('createPost', {}, data);
    } finally {
      setCreating(false);
    }
  };

  return { createPost, creating };
};
