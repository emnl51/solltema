import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../contexts/LocalStorageContext';
import ContentCard from '../components/ContentCard';

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

      setAllRatings(
        ratingsWithContent.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );

      const genres = {};
      const directors = {};
      const actors = {};
      let totalRating = 0;

      ratings.forEach((rating) => {
        totalRating += rating.rating;
        const content = ratingsWithContent.find((r) => r.contentId === rating.contentId)?.content;

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

  const topGenres = useMemo(() => {
    if (!preferences?.favorite_genres) return [];
    const entries = Object.entries(preferences.favorite_genres);
    entries.sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, val]) => sum + val, 0);
    return entries.slice(0, 5).map(([genre, score]) => ({
      genre,
      percentage: total > 0 ? (score / total) * 100 : 0,
    }));
  }, [preferences]);

  if (loading) {
    return (
      <div className="panel">
        <p>Profil yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <div className="profile-header">
          <div>
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
                <p className="muted">Kütüphanen ve tercihlerin burada.</p>
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
          <p className="muted">Puanladığın içeriklere göre tür dağılımın</p>
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

      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h2>Kütüphanem ({allRatings.length})</h2>
        {allRatings.length === 0 ? (
          <p className="muted">Henüz hiçbir içerik puanlamadın.</p>
        ) : (
          <div className="content-grid">
            {allRatings.slice(0, 12).map((rating) => (
              <ContentCard
                key={rating.id}
                content={rating.content}
                badge={`Puan ${rating.rating}/10`}
                reason={rating.review ? `Notun: ${rating.review}` : 'Kütüphanene ekledin.'}
                footer={<span className="content-card-foot">Son güncelleme: {new Date(rating.updatedAt).toLocaleDateString('tr-TR')}</span>}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
