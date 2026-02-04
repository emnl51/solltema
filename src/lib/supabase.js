import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const omdbApi = {
  search: async (query, type = '', page = 1) => {
    const params = new URLSearchParams({
      s: query,
      page: page.toString(),
    });

    if (type) {
      params.append('type', type);
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/omdb?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      }
    );

    return response.json();
  },

  getById: async (imdbId) => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/omdb?i=${imdbId}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      }
    );

    return response.json();
  },

  getByTitle: async (title, year = '') => {
    const params = new URLSearchParams({ t: title });
    if (year) {
      params.append('y', year);
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/omdb?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      }
    );

    return response.json();
  },
};
