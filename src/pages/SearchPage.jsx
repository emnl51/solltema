import React, { useState } from 'react';
import { useLocalStorage } from '../contexts/LocalStorageContext';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [review, setReview] = useState('');
  const [savingRating, setSavingRating] = useState(false);

  const { saveRating, getContent, getRatings, saveContent } = useLocalStorage();

  const omdbApi = {
    search: async (query, type = '', page = 1) => {
      const params = new URLSearchParams({
        s: query,
        page: page.toString(),
      });

      if (type) {
        params.append('type', type);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/omdb?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      return response.json();
    },

    getById: async (imdbId) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/omdb?i=${imdbId}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      return response.json();
    },
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const data = await omdbApi.search(searchQuery, searchType);
      if (data.Search) {
        setSearchResults(data.Search);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = async (movie) => {
    setSelectedMovie(movie);
    setLoading(true);

    try {
      const details = await omdbApi.getById(movie.imdbID);
      setMovieDetails(details);

      const ratings = await getRatings();
      const existingRating = ratings.find(r => r.contentId === movie.imdbID);

      if (existingRating) {
        setUserRating(existingRating.rating);
        setReview(existingRating.review || '');
      } else {
        setUserRating(0);
        setReview('');
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating) => {
    if (!movieDetails) return;

    setUserRating(rating);
    setSavingRating(true);

    try {
      await saveContent({
        imdbId: movieDetails.imdbID,
        title: movieDetails.Title,
        year: movieDetails.Year,
        type: movieDetails.Type,
        genre: movieDetails.Genre,
        director: movieDetails.Director,
        actors: movieDetails.Actors,
        plot: movieDetails.Plot,
        poster: movieDetails.Poster,
        imdbRating: parseFloat(movieDetails.imdbRating) || 0,
        runtime: movieDetails.Runtime,
        language: movieDetails.Language,
        country: movieDetails.Country,
        awards: movieDetails.Awards,
        metadata: movieDetails,
      });

      await saveRating(movieDetails.imdbID, rating, review);
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setSavingRating(false);
    }
  };

  const closeModal = () => {
    setSelectedMovie(null);
    setMovieDetails(null);
    setUserRating(0);
    setReview('');
  };

  return (
    <div>
      <div className="panel">
        <h2>Film ve Dizi Ara</h2>
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Film veya dizi ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="">Tümü</option>
            <option value="movie">Film</option>
            <option value="series">Dizi</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </form>
      </div>

      {searchResults.length > 0 && (
        <div className="panel">
          <h2>Arama Sonuçları ({searchResults.length})</h2>
          <div className="movie-grid">
            {searchResults.map((movie) => (
              <div
                key={movie.imdbID}
                className="movie-card"
                onClick={() => handleMovieClick(movie)}
              >
                <img
                  src={movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=No+Poster'}
                  alt={movie.Title}
                  className="movie-poster"
                />
                <div className="movie-info">
                  <div className="movie-title">{movie.Title}</div>
                  <div className="movie-year">{movie.Year}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMovie && movieDetails && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{movieDetails.Title}</h2>
              <button className="ghost" onClick={closeModal}>
                Kapat
              </button>
            </div>

            <div className="modal-content">
              <div className="movie-detail-grid">
                <img
                  src={movieDetails.Poster !== 'N/A' ? movieDetails.Poster : 'https://via.placeholder.com/200x300'}
                  alt={movieDetails.Title}
                  className="movie-detail-poster"
                />

                <div className="movie-details">
                  <div className="detail-row">
                    <div className="detail-label">Yıl</div>
                    <div className="detail-value">{movieDetails.Year}</div>
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Tür</div>
                    <div className="detail-value">{movieDetails.Genre}</div>
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Yönetmen</div>
                    <div className="detail-value">{movieDetails.Director}</div>
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Oyuncular</div>
                    <div className="detail-value">{movieDetails.Actors}</div>
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">IMDb Puanı</div>
                    <div className="detail-value">{movieDetails.imdbRating}/10</div>
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Süre</div>
                    <div className="detail-value">{movieDetails.Runtime}</div>
                  </div>

                  <div className="detail-row">
                    <div className="detail-label">Konu</div>
                    <div className="detail-value">{movieDetails.Plot}</div>
                  </div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Puanınız</div>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= userRating ? 'filled' : ''}`}
                      onClick={() => handleRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="detail-row">
                <label>
                  <div className="detail-label">Yorumunuz (İsteğe bağlı)</div>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Bu yapım hakkında ne düşünüyorsunuz?"
                    rows={4}
                  />
                </label>
              </div>

              <button onClick={() => handleRating(userRating)} disabled={savingRating || userRating === 0}>
                {savingRating ? 'Kaydediliyor...' : 'Puanı Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
