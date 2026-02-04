import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '../contexts/LocalStorageContext';

const HomePage = () => {
  const { user, getRatings, getContent } = useLocalStorage();
  const [recentRatings, setRecentRatings] = useState([]);
  const [stats, setStats] = useState({
    totalRatings: 0,
    avgRating: 0,
    favoriteGenre: '-',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const ratings = await getRatings();

      const ratingsWithContent = await Promise.all(
        ratings.map(async (rating) => ({
          ...rating,
          content: await getContent(rating.contentId),
        }))
      );

      const sorted = ratingsWithContent.sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
      ).slice(0, 6);

      setRecentRatings(sorted);

      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

        const genres = {};
        ratings.forEach((rating) => {
          if (rating.content?.genre) {
            rating.content.genre.split(', ').forEach((genre) => {
              genres[genre] = (genres[genre] || 0) + rating.rating;
            });
          }
        });

        const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0];

        setStats({
          totalRatings: ratings.length,
          avgRating: avgRating,
          favoriteGenre: topGenre ? topGenre[0] : '-',
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <div>
          <h2>Hoş geldin, {user?.displayName || 'Kullanıcı'}!</h2>
          <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>
            Film ve dizi yolculuğuna devam et. İşte senin için hazırladığımız özet.
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>İstatistikler</h2>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Toplam Puan</div>
            <div className="stat-value">{stats.totalRatings}</div>
            <div className="stat-detail">İzlenen içerik</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Ortalama Puan</div>
            <div className="stat-value">{stats.avgRating.toFixed(1)}</div>
            <div className="stat-detail">10 üzerinden</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Favori Tür</div>
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>
              {stats.favoriteGenre}
            </div>
            <div className="stat-detail">En çok beğenilen</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Son Puanladıkların</h2>
        {recentRatings.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>
            Henüz hiçbir içerik puanlamadın. Keşfet sekmesinden başla!
          </p>
        ) : (
          <div className="movie-grid">
            {recentRatings.map((rating) => (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Hızlı Eylemler</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          <button>Yeni İçerik Keşfet</button>
          <button className="secondary">Profili Düzenle</button>
          <button className="ghost">İzleme Listem</button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
