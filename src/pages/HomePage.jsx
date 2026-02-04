import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user, profile, signOut } = useAuth();
  const [recentRatings, setRecentRatings] = useState([]);
  const [stats, setStats] = useState({
    totalRatings: 0,
    avgRating: 0,
    favoriteGenre: '-',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: ratings } = await supabase
        .from('ratings')
        .select(`
          *,
          contents (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      setRecentRatings(ratings || []);

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preferences) {
        const genres = Object.entries(preferences.favorite_genres || {});
        const topGenre = genres.sort((a, b) => b[1] - a[1])[0];

        setStats({
          totalRatings: preferences.total_watched || 0,
          avgRating: preferences.average_rating || 0,
          favoriteGenre: topGenre ? topGenre[0] : '-',
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Hoş geldin, {profile?.display_name || 'Kullanıcı'}!</h2>
            <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>
              Film ve dizi yolculuğuna devam et. İşte senin için hazırladığımız özet.
            </p>
          </div>
          <button className="secondary" onClick={handleSignOut}>
            Çıkış Yap
          </button>
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
                    rating.contents?.poster !== 'N/A'
                      ? rating.contents?.poster
                      : 'https://via.placeholder.com/200x300?text=No+Poster'
                  }
                  alt={rating.contents?.title}
                  className="movie-poster"
                />
                <div className="movie-info">
                  <div className="movie-title">{rating.contents?.title}</div>
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
