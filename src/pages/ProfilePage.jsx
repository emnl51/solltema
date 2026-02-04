import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '../contexts/LocalStorageContext';

const ProfilePage = () => {
  const { user, updateUserDisplayName, getRatings, getContent } = useLocalStorage();
  const [preferences, setPreferences] = useState(null);
  const [allRatings, setAllRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const ratings = await getRatings();

      const ratingsWithContent = await Promise.all(
        ratings.map(async (rating) => ({
          ...rating,
          content: await getContent(rating.contentId),
        }))
      );

      setAllRatings(ratingsWithContent.sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
      ));

      const genres = {};
      const directors = {};
      const actors = {};
      let totalRating = 0;

      ratings.forEach((rating) => {
        totalRating += rating.rating;
        const content = ratingsWithContent.find(r => r.contentId === rating.contentId)?.content;

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

      setPreferences({
        favorite_genres: genres,
        favorite_directors: directors,
        favorite_actors: actors,
        average_rating: ratings.length > 0 ? totalRating / ratings.length : 0,
        total_watched: ratings.length,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      updateUserDisplayName(displayName);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getTopGenres = () => {
    if (!preferences?.favorite_genres) return [];
    const entries = Object.entries(preferences.favorite_genres);
    entries.sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, val]) => sum + val, 0);
    return entries.slice(0, 5).map(([genre, score]) => ({
      genre,
      percentage: total > 0 ? (score / total) * 100 : 0,
    }));
  };

  const getTopActors = () => {
    if (!preferences?.favorite_actors) return [];
    const entries = Object.entries(preferences.favorite_actors);
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 10).map(([actor, count]) => ({ actor, count }));
  };

  const getTopDirectors = () => {
    if (!preferences?.favorite_directors) return [];
    const entries = Object.entries(preferences.favorite_directors);
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 10).map(([director, count]) => ({ director, count }));
  };

  if (loading) {
    return (
      <div className="panel">
        <p>Profil yükleniyor...</p>
      </div>
    );
  }

  const topGenres = getTopGenres();
  const topActors = getTopActors();
  const topDirectors = getTopDirectors();

  return (
    <div className="page-grid">
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <div className="form-grid">
                <label>
                  Görünen İsim
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleUpdateProfile}>Kaydet</button>
                  <button className="secondary" onClick={() => setIsEditing(false)}>
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2>{user?.displayName || 'Kullanıcı'}</h2>
                <button className="ghost" onClick={() => setIsEditing(true)}>
                  Profili Düzenle
                </button>
              </>
            )}
          </div>

          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Toplam İzlenen</div>
              <div className="stat-value">{preferences?.total_watched || 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Ortalama Puan</div>
              <div className="stat-value">{preferences?.average_rating?.toFixed(1) || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {topGenres.length > 0 && (
        <div className="panel">
          <h2>Favori Türler</h2>
          <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
            Puanladığın içeriklere göre tür dağılımın
          </p>
          <div className="genre-bars">
            {topGenres.map(({ genre, percentage }) => (
              <div key={genre} className="genre-bar">
                <div className="genre-bar-header">
                  <span className="genre-name">{genre}</span>
                  <span className="genre-percent">{percentage.toFixed(0)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {topActors.length > 0 && (
        <div className="panel">
          <h2>En Beğendiğin Oyuncular</h2>
          <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
            Puanladığın filmlerde en sık karşılaştığın oyuncular
          </p>
          <div className="actor-list">
            {topActors.map(({ actor, count }) => (
              <div key={actor} className="actor-item">
                <span className="actor-name">{actor}</span>
                <span className="actor-count">{count} film</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topDirectors.length > 0 && (
        <div className="panel">
          <h2>En Beğendiğin Yönetmenler</h2>
          <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
            Puanladığın filmlerde en sık karşılaştığın yönetmenler
          </p>
          <div className="director-list">
            {topDirectors.map(({ director, count }) => (
              <div key={director} className="director-item">
                <span className="director-name">{director}</span>
                <span className="director-count">{count} film</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h2>Son Puanladıklarım ({allRatings.length})</h2>
        {allRatings.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Henüz hiçbir içerik puanlamadın.</p>
        ) : (
          <div className="movie-grid">
            {allRatings.slice(0, 12).map((rating) => (
              <div key={rating.id} className="movie-card">
                <img
                  src={
                    rating.content?.poster && rating.content.poster !== 'N/A'
                      ? rating.content.poster
                      : 'https://via.placeholder.com/200x300?text=No+Poster'
                  }
                  alt={rating.content?.title}
                  className="movie-poster"
                />
                <div className="movie-info">
                  <div className="movie-title">{rating.content?.title}</div>
                  <div className="movie-year">
                    Puanın: {rating.rating}/10
                  </div>
                  {rating.review && (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                      {rating.review.slice(0, 50)}...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
