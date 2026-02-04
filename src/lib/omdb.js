const OMDB_API_KEY = '6a599c65';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

const buildUrl = (params) => {
  const url = new URL(OMDB_BASE_URL);
  const searchParams = new URLSearchParams({ apikey: OMDB_API_KEY, ...params });
  url.search = searchParams.toString();
  return url.toString();
};

export const fetchOmdb = async (params) => {
  const response = await fetch(buildUrl(params));
  if (!response.ok) {
    throw new Error('OMDb isteği başarısız oldu.');
  }
  return response.json();
};

export const fetchById = async (imdbId) => fetchOmdb({ i: imdbId, plot: 'full' });

export const searchTitles = async (query, { type = '', year = '', page = 1 } = {}) => {
  const params = {
    s: query,
    page: String(page),
  };

  if (type) {
    params.type = type;
  }

  if (year) {
    params.y = year;
  }

  return fetchOmdb(params);
};
