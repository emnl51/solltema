import React, { useState } from 'react';
import { omdbApi, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

  const { user } = useAuth();

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

      const { data: existingRating } = await supabase
        .from('ratings')
        .select('rating, review')
        .eq('user_id', user.id)
        .eq('content_id', movie.imdbID)
        .maybeSingle();

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
      let contentId = null;

      const { data: existingContent } = await supabase
        .from('contents')
        .select('id')
        .eq('imdb_id', movieDetails.imdbID)
        .maybeSingle();

      if (existingContent) {
        contentId = existingContent.id;
      } else {
        const { data: newContent, error: insertError } = await supabase
          .from('contents')
          .insert([
            {
              imdb_id: movieDetails.imdbID,
              title: movieDetails.Title,
              year: movieDetails.Year,
              type: movieDetails.Type,
              genre: movieDetails.Genre,
              director: movieDetails.Director,
              actors: movieDetails.Actors,
              plot: movieDetails.Plot,
              poster: movieDetails.Poster,
              imdb_rating: parseFloat(movieDetails.imdbRating) || 0,
              runtime: movieDetails.Runtime,
              language: movieDetails.Language,
              country: movieDetails.Country,
              awards: movieDetails.Awards,
              metadata: movieDetails,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        contentId = newContent.id;
      }

      const { error: ratingError } = await supabase
        .from('ratings')
        .upsert(
          {
            user_id: user.id,
            content_id: contentId,
            rating: rating,
            review: review,
          },
          {
            onConflict: 'user_id,content_id',
          }
        );

      if (ratingError) throw ratingError;

      await updateUserPreferences();
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setSavingRating(false);
    }
  };

  const updateUserPreferences = async () => {
    try {
      const { data: allRatings } = await supabase
        .from('ratings')
        .select(`
          rating,
          contents (
            genre,
            director,
            actors
          )
        `)
        .eq('user_id', user.id);

      if (!allRatings) return;

      const genreMap = {};
      const actorMap = {};
      const directorMap = {};
      let totalRating = 0;

      allRatings.forEach((r) => {
        if (r.contents) {
          totalRating += r.rating;

          if (r.contents.genre) {
            r.contents.genre.split(',').forEach((g) => {
              const genre = g.trim();
              genreMap[genre] = (genreMap[genre] || 0) + r.rating;
            });
          }

          if (r.contents.actors) {
            r.contents.actors.split(',').forEach((a) => {
              const actor = a.trim();
              actorMap[actor] = (actorMap[actor] || 0) + 1;
            });
          }

          if (r.contents.director && r.contents.director !== 'N/A') {
            r.contents.director.split(',').forEach((d) => {
              const director = d.trim();
              directorMap[director] = (directorMap[director] || 0) + 1;
            });
          }
        }
      });

      const avgRating = allRatings.length > 0 ? totalRating / allRatings.length : 0;

      await supabase.from('user_preferences').upsert(
        {
          user_id: user.id,
          favorite_genres: genreMap,
          favorite_actors: actorMap,
          favorite_directors: directorMap,
          average_rating: avgRating,
          total_watched: allRatings.length,
        },
        {
          onConflict: 'user_id',
        }
      );
    } catch (error) {
      console.error('Error updating preferences:', error);
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
