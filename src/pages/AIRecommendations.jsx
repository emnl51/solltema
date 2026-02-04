import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const AIRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setPreferences(userPrefs);

      const { data: userRatings } = await supabase
        .from('ratings')
        .select('content_id')
        .eq('user_id', user.id);

      const ratedIds = userRatings?.map((r) => r.content_id) || [];

      let query = supabase
        .from('contents')
        .select('*')
        .order('imdb_rating', { ascending: false })
        .limit(20);

      if (ratedIds.length > 0) {
        query = query.not('id', 'in', `(${ratedIds.join(',')})`);
      }

      const { data: allContents } = await query;

      if (allContents && userPrefs && userPrefs.favorite_genres) {
        const scored = allContents.map((content) => {
          let score = parseFloat(content.imdb_rating) || 0;

          if (content.genre) {
            const genres = content.genre.split(',').map((g) => g.trim());
            genres.forEach((genre) => {
              if (userPrefs.favorite_genres[genre]) {
                score += userPrefs.favorite_genres[genre] * 0.5;
              }
            });
          }

          if (content.director && userPrefs.favorite_directors) {
            const directors = content.director.split(',').map((d) => d.trim());
            directors.forEach((director) => {
              if (userPrefs.favorite_directors[director]) {
                score += userPrefs.favorite_directors[director] * 0.3;
              }
            });
          }

          if (content.actors && userPrefs.favorite_actors) {
            const actors = content.actors.split(',').map((a) => a.trim());
            actors.forEach((actor) => {
              if (userPrefs.favorite_actors[actor]) {
                score += userPrefs.favorite_actors[actor] * 0.2;
              }
            });
          }

          return { ...content, aiScore: score };
        });

        scored.sort((a, b) => b.aiScore - a.aiScore);
        setRecommendations(scored.slice(0, 12));
      } else {
        setRecommendations(allContents?.slice(0, 12) || []);
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
              <div key={content.id} className="movie-card">
                <img
                  src={
                    content.poster !== 'N/A'
                      ? content.poster
                      : 'https://via.placeholder.com/200x300?text=No+Poster'
                  }
                  alt={content.title}
                  className="movie-poster"
                />
                <div className="movie-info">
                  <div className="movie-title">{content.title}</div>
                  <div className="movie-year">
                    {content.year} • IMDb: {content.imdb_rating}/10
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
                {preferences.favorite_genres
                  ? Object.keys(preferences.favorite_genres).slice(0, 3).join(', ')
                  : '-'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;
