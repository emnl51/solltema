import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../contexts/LocalStorageContext';
import { fetchById } from '../lib/omdb';
import ContentCard from '../components/ContentCard';

const RECOMMENDATION_POOL = [
  'tt3896198',
  'tt1375666',
  'tt0111161',
  'tt0068646',
  'tt0109830',
  'tt0167260',
  'tt0108778',
  'tt0903747',
  'tt0944947',
  'tt7286456',
  'tt0133093',
  'tt0080684',
  'tt0266697',
  'tt1345836',
  'tt1877830',
  'tt4574334',
  'tt6751668',
  'tt1187043',
  'tt0877057',
  'tt0796366',
  'tt0107290',
  'tt8579674',
  'tt6470478',
  'tt0458290',
];

const normalizeOmdb = (data) => ({
  imdbId: data.imdbID,
  title: data.Title,
  year: data.Year,
  genre: data.Genre,
  director: data.Director,
  actors: data.Actors,
  plot: data.Plot,
  poster: data.Poster,
  imdbRating: parseFloat(data.imdbRating) || 0,
  runtime: data.Runtime,
  type: data.Type,
});

const parseYear = (year) => {
  if (!year) return null;
  const match = year.match(/\d{4}/);
  return match ? Number(match[0]) : null;
};

const AIRecommendations = () => {
  const { getRatings, getAllContents, saveContent, saveRating } = useLocalStorage();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const [filters, setFilters] = useState({
    genre: '',
    type: '',
    yearFrom: '',
    yearTo: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [ratings, storedContents, poolDetails] = await Promise.all([
        getRatings(),
        getAllContents(),
        Promise.all(RECOMMENDATION_POOL.map((id) => fetchById(id))),
      ]);

      const pool = poolDetails.map(normalizeOmdb);
      const ratedIds = new Set(ratings.map((r) => r.contentId));
      setUserRatings(
        ratings.reduce((acc, rating) => {
          acc[rating.contentId] = rating.rating;
          return acc;
        }, {})
      );
      const availableContents = pool.filter((content) => !ratedIds.has(content.imdbId));

      const genres = {};
      const directors = {};
      const actors = {};
      let totalRating = 0;

      ratings.forEach((rating) => {
        totalRating += rating.rating;
        const content = storedContents.find((c) => c.imdbId === rating.contentId);

        if (content) {
          if (content.genre) {
            content.genre.split(',').forEach((g) => {
              const genre = g.trim();
              genres[genre] = (genres[genre] || 0) + rating.rating;
            });
          }

          if (content.director && content.director !== 'N/A') {
            content.director.split(',').forEach((d) => {
              const director = d.trim();
              directors[director] = (directors[director] || 0) + 1;
            });
          }

          if (content.actors) {
            content.actors.split(',').forEach((a) => {
              const actor = a.trim();
              actors[actor] = (actors[actor] || 0) + 1;
            });
          }
        }
      });

      const avgRating = ratings.length > 0 ? totalRating / ratings.length : 0;

      const userPrefs = {
        favorite_genres: genres,
        favorite_directors: directors,
        favorite_actors: actors,
        average_rating: avgRating,
        total_watched: ratings.length,
      };

      setPreferences(userPrefs);

      const scored = availableContents.map((content) => {
        let score = content.imdbRating || 0;

        if (content.genre) {
          const contentGenres = content.genre.split(',').map((g) => g.trim());
          contentGenres.forEach((genre) => {
            if (genres[genre]) {
              score += genres[genre] * 0.6;
            }
          });
        }

        if (content.director && directors) {
          const directorsList = content.director.split(',').map((d) => d.trim());
          directorsList.forEach((director) => {
            if (directors[director]) {
              score += directors[director] * 0.3;
            }
          });
        }

        if (content.actors && actors) {
          const actorsList = content.actors.split(',').map((a) => a.trim());
          actorsList.forEach((actor) => {
            if (actors[actor]) {
              score += actors[actor] * 0.2;
            }
          });
        }

        return { ...content, aiScore: score };
      });

      scored.sort((a, b) => b.aiScore - a.aiScore);
      setRecommendations(scored);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setErrorMessage('OMDb önerileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const availableGenres = useMemo(() => {
    const set = new Set();
    recommendations.forEach((content) => {
      if (content.genre) {
        content.genre.split(',').forEach((genre) => set.add(genre.trim()));
      }
    });
    return Array.from(set).sort();
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((content) => {
      if (filters.type && content.type !== filters.type) {
        return false;
      }

      if (filters.genre && !content.genre?.includes(filters.genre)) {
        return false;
      }

      const year = parseYear(content.year);
      const yearFrom = filters.yearFrom ? Number(filters.yearFrom) : null;
      const yearTo = filters.yearTo ? Number(filters.yearTo) : null;

      if (yearFrom && year && year < yearFrom) {
        return false;
      }

      if (yearTo && year && year > yearTo) {
        return false;
      }

      return true;
    });
  }, [filters, recommendations]);

  const buildReason = (content) => {
    if (!preferences) {
      return 'IMDb puanı ve popülerlik metrikleri ile önerildi.';
    }

    const reasons = [];

    const topGenres = Object.entries(preferences.favorite_genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([genre]) => genre);

    if (content.genre) {
      const matches = content.genre
        .split(',')
        .map((g) => g.trim())
        .filter((genre) => topGenres.includes(genre));
      if (matches.length > 0) {
        reasons.push(`Sevdiğin türlerle örtüşüyor: ${matches.join(', ')}`);
      }
    }

    const topDirectors = Object.entries(preferences.favorite_directors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1)
      .map(([director]) => director);

    if (content.director && topDirectors.length > 0) {
      const matches = content.director
        .split(',')
        .map((d) => d.trim())
        .filter((director) => topDirectors.includes(director));
      if (matches.length > 0) {
        reasons.push(`Favori yönetmenlerinden: ${matches.join(', ')}`);
      }
    }

    const topActors = Object.entries(preferences.favorite_actors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([actor]) => actor);

    if (content.actors && topActors.length > 0) {
      const matches = content.actors
        .split(',')
        .map((a) => a.trim())
        .filter((actor) => topActors.includes(actor));
      if (matches.length > 0) {
        reasons.push(`Beğendiğin oyuncular var: ${matches.join(', ')}`);
      }
    }

    if (reasons.length === 0) {
      return 'İzleme geçmişinle uyumlu yüksek puanlı içerik.';
    }

    return reasons.join(' • ');
  };

  const handleRateContent = async (content, rating) => {
    if (!content) return;

    try {
      await saveContent({
        imdbId: content.imdbId,
        title: content.title,
        year: content.year,
        type: content.type,
        genre: content.genre,
        director: content.director,
        actors: content.actors,
        plot: content.plot,
        poster: content.poster,
        imdbRating: parseFloat(content.imdbRating) || 0,
        runtime: content.runtime,
        metadata: content,
      });

      await saveRating(content.imdbId, rating, '');
      setUserRatings((prev) => ({ ...prev, [content.imdbId]: rating }));
    } catch (error) {
      console.error('Rating error:', error);
      setErrorMessage('Puanlama sırasında bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <p>AI önerileri hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="panel">
        <h2>Senin İçin AI Önerileri</h2>
        <p className="muted">
          OMDb verileri ile profil tercihlerini birleştirerek kişiselleştirilmiş öneriler.
        </p>
        <div className="filter-grid">
          <label>
            Tür
            <select
              value={filters.genre}
              onChange={(e) => setFilters((prev) => ({ ...prev, genre: e.target.value }))}
            >
              <option value="">Tümü</option>
              {availableGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tür Tipi
            <select
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="">Tümü</option>
              <option value="movie">Film</option>
              <option value="series">Dizi</option>
            </select>
          </label>
          <label>
            Yıl (Başlangıç)
            <input
              type="number"
              min="1900"
              max="2100"
              placeholder="1990"
              value={filters.yearFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, yearFrom: e.target.value }))}
            />
          </label>
          <label>
            Yıl (Bitiş)
            <input
              type="number"
              min="1900"
              max="2100"
              placeholder="2024"
              value={filters.yearTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, yearTo: e.target.value }))}
            />
          </label>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>

      {filteredRecommendations.length === 0 ? (
        <div className="panel">
          <h3>Henüz öneri yok</h3>
          <p className="muted">
            Filtreleri temizleyerek daha fazla öneri görüntüleyebilirsin.
          </p>
        </div>
      ) : (
        <div className="panel">
          <div className="content-grid">
            {filteredRecommendations.slice(0, 12).map((content) => (
              <ContentCard
                key={content.imdbId}
                content={content}
                badge={`AI ${content.aiScore.toFixed(1)}`}
                reason={buildReason(content)}
                footer={<span className="content-card-foot">IMDb {content.imdbRating.toFixed(1)}</span>}
                currentRating={userRatings[content.imdbId] || 0}
                onRate={(rating) => handleRateContent(content, rating)}
              />
            ))}
          </div>
        </div>
      )}

      {preferences && (
        <div className="panel">
          <h2>Tercih Özeti</h2>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Ortalama Puanın</div>
              <div className="stat-value">{preferences.average_rating?.toFixed(1) || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">İzlenen İçerik</div>
              <div className="stat-value">{preferences.total_watched || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Favori Türler</div>
              <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                {Object.keys(preferences.favorite_genres).slice(0, 3).join(', ') || '-'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;
