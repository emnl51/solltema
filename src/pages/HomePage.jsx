import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../contexts/LocalStorageContext';
import { fetchById } from '../lib/omdb';

const HERO_ID = 'tt3896198';
const FEATURED_IDS = [
  'tt3896198',
  'tt1375666',
  'tt0111161',
  'tt4154796',
  'tt0120737',
  'tt0903747',
];

const CURATED_POOL_IDS = [
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
  imdbRating: data.imdbRating,
  runtime: data.Runtime,
  type: data.Type,
});

const getPoster = (poster) =>
  poster && poster !== 'N/A' ? poster : 'https://via.placeholder.com/320x480?text=No+Poster';

const HomePage = () => {
  const { user, getRatings, getContent } = useLocalStorage();
  const [hero, setHero] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [forYou, setForYou] = useState([]);
  const [recentRatings, setRecentRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const [heroData, ...featuredData] = await Promise.all(
        [HERO_ID, ...FEATURED_IDS.filter((id) => id !== HERO_ID)].map((id) => fetchById(id))
      );

      setHero(normalizeOmdb(heroData));
      setFeatured(featuredData.map(normalizeOmdb));

      const ratings = await getRatings();
      const ratingsWithContent = await Promise.all(
        ratings.map(async (rating) => ({
          ...rating,
          content: await getContent(rating.contentId),
        }))
      );

      const sorted = ratingsWithContent
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 6);

      setRecentRatings(sorted);

      const genreScores = {};
      ratingsWithContent.forEach((rating) => {
        if (rating.content?.genre) {
          rating.content.genre.split(',').forEach((genre) => {
            const trimmed = genre.trim();
            genreScores[trimmed] = (genreScores[trimmed] || 0) + rating.rating;
          });
        }
      });

      const pool = await Promise.all(CURATED_POOL_IDS.map((id) => fetchById(id)));
      const poolNormalized = pool.map(normalizeOmdb);

      const scored = poolNormalized.map((content) => {
        let score = parseFloat(content.imdbRating) || 0;

        if (content.genre) {
          content.genre.split(',').forEach((genre) => {
            const trimmed = genre.trim();
            if (genreScores[trimmed]) {
              score += genreScores[trimmed] * 0.6;
            }
          });
        }

        return {
          ...content,
          score,
        };
      });

      scored.sort((a, b) => b.score - a.score);
      setForYou(scored.slice(0, 8));
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setErrorMessage('OMDb verileri yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (recentRatings.length === 0) {
      return {
        totalRatings: 0,
        avgRating: 0,
        favoriteGenre: '-',
      };
    }

    const totalRatings = recentRatings.length;
    const avgRating =
      recentRatings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings;

    const genres = {};
    recentRatings.forEach((rating) => {
      if (rating.content?.genre) {
        rating.content.genre.split(',').forEach((genre) => {
          const trimmed = genre.trim();
          genres[trimmed] = (genres[trimmed] || 0) + 1;
        });
      }
    });

    const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0];

    return {
      totalRatings,
      avgRating,
      favoriteGenre: topGenre ? topGenre[0] : '-',
    };
  }, [recentRatings]);

  if (loading && !hero) {
    return (
      <div className="panel">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <div className="panel hero-panel" style={{ gridColumn: '1 / -1' }}>
        {hero && (
          <div className="hero-banner">
            <div className="hero-media">
              <img src={getPoster(hero.poster)} alt={hero.title} />
            </div>
            <div className="hero-content">
              <p className="hero-eyebrow">Günün Afişi</p>
              <h2>{hero.title}</h2>
              <p className="hero-meta">
                {hero.year} • {hero.genre} • IMDb {hero.imdbRating}
              </p>
              <p className="hero-description">{hero.plot}</p>
              <div className="hero-actions">
                <button>İzlemeye Başla</button>
                <button className="secondary">Listeme Ekle</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <p className="error-message">{errorMessage}</p>
        </div>
      )}

      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <div className="section-header">
          <div>
            <h2>Öne Çıkan İçerikler</h2>
            <p className="muted">
              OMDb verilerine göre derlediğimiz güncel film ve diziler.
            </p>
          </div>
        </div>
        <div className="movie-grid">
          {featured.map((content) => (
            <div key={content.imdbId} className="movie-card">
              <img
                src={getPoster(content.poster)}
                alt={content.title}
                className="movie-poster"
              />
              <div className="movie-info">
                <div className="movie-title">{content.title}</div>
                <div className="movie-year">
                  {content.year} • {content.type === 'series' ? 'Dizi' : 'Film'}
                </div>
              </div>
            </div>
          ))}
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
        <h2>Senin İçin Öneriler</h2>
        <p className="muted">
          Puanlama geçmişine göre kişiselleştirilmiş içerikler.
        </p>
        <div className="movie-grid">
          {forYou.map((content) => (
            <div key={content.imdbId} className="movie-card">
              <img
                src={getPoster(content.poster)}
                alt={content.title}
                className="movie-poster"
              />
              <div className="movie-info">
                <div className="movie-title">{content.title}</div>
                <div className="movie-year">{content.genre}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>Son Puanladıkların</h2>
        {recentRatings.length === 0 ? (
          <p className="muted">
            Henüz hiçbir içerik puanlamadın. Keşfet sekmesinden başla!
          </p>
        ) : (
          <div className="movie-grid">
            {recentRatings.map((rating) => (
              <div key={rating.id} className="movie-card">
                <img
                  src={getPoster(rating.content?.poster)}
                  alt={rating.content?.title}
                  className="movie-poster"
                />
                <div className="movie-info">
                  <div className="movie-title">{rating.content?.title}</div>
                  <div className="movie-year">Puanın: {rating.rating}/10</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Hızlı Eylemler</h2>
        <p className="muted">Yeni içerikler keşfet ve listeni oluştur.</p>
        <div style={{ display: 'grid', gap: '12px' }}>
          <button>Yeni İçerik Keşfet</button>
          <button className="secondary">Profili Düzenle</button>
          <button className="ghost">İzleme Listem</button>
        </div>
      </div>

      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h2>{user?.displayName || 'Kullanıcı'} için özel güncelleme</h2>
        <p className="muted">
          Profilini güncel tutarak önerileri daha da kişiselleştirebilirsin.
        </p>
        <div className="pill-row">
          <span className="pill">Kişisel listeler</span>
          <span className="pill">Tür analizleri</span>
          <span className="pill">Haftalık raporlar</span>
          <span className="pill">Yeni vizyon uyarıları</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
