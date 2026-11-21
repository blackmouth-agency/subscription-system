import axios from "axios";

// Cliente HTTP de la API (Edge Function `api`) con el JWT del usuario.
export const createApi = (accessToken: string) =>
  axios.create({
    baseURL: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`,
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });
