import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '../contexts/LocalStorageContext';

const AIRecommendations = () => {
  const { getRatings, getAllContents } = useLocalStorage();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const ratings = await getRatings();
      const allContents = await getAllContents();

      const ratedIds = ratings.map((r) => r.contentId);

      const availableContents = allContents.filter((c) => !ratedIds.includes(c.imdbId));

      const genres = {};
      const directors = {};
      const actors = {};
      let totalRating = 0;

      ratings.forEach((rating) => {
        totalRating += rating.rating;
        const content = allContents.find((c) => c.imdbId === rating.contentId);

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

      if (availableContents.length > 0 && Object.keys(genres).length > 0) {
        const scored = availableContents.map((content) => {
          let score = parseFloat(content.imdbRating) || 0;

          if (content.genre) {
            const contentGenres = content.genre.split(',').map((g) => g.trim());
            contentGenres.forEach((genre) => {
              if (genres[genre]) {
                score += genres[genre] * 0.5;
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
        setRecommendations(scored.slice(0, 12));
      } else {
        const topByRating = availableContents.sort((a, b) =>
          (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0)
        ).slice(0, 12);
        setRecommendations(topByRating);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
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
        <p style={{ color: '#94a3b8' }}>
          Beğenilerine, favori türlerine, oyuncu ve yönetmen tercihlerine göre önerilen içerikler.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="panel">
          <h3>Henüz öneri yok</h3>
          <p style={{ color: '#94a3b8' }}>
            Keşfet sekmesinden film ve dizileri puanlayarak AI'ya tercihlerini öğret!
          </p>
        </div>
      ) : (
        <div className="panel">
          <div className="movie-grid">
            {recommendations.map((content) => (
              <div key={content.imdbId} className="movie-card">
                <img
                  src={
                    content.poster && content.poster !== 'N/A'
                      ? content.poster
                      : 'https://via.placeholder.com/200x300?text=No+Poster'
                  }
                  alt={content.title}
                  className="movie-poster"
                />
                <div className="movie-info">
                  <div className="movie-title">{content.title}</div>
                  <div className="movie-year">
                    {content.year} • IMDb: {content.imdbRating}/10
                  </div>
                  {content.aiScore && (
                    <div style={{ fontSize: '0.8rem', color: '#818cf8', marginTop: '4px' }}>
                      AI Skoru: {content.aiScore.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
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
