const { useEffect, useMemo, useState } = React;

const GENRES = ["Aksiyon", "Drama", "Komedi", "Bilim Kurgu"];

const MOVIES = [
  {
    id: "m1",
    title: "Nebula Drift",
    synopsis: "Uzak galakside bir kurtarma görevi sadakati sınar.",
    genres: [0.8, 0.2, 0.1, 0.9]
  },
  {
    id: "m2",
    title: "Gülen Sinyaller",
    synopsis: "Ev arkadaşları şaka kanalıyla viral bir hareket başlatır.",
    genres: [0.1, 0.3, 0.95, 0.1]
  },
  {
    id: "m3",
    title: "Çelik Liman",
    synopsis: "Bir dedektif kıyı metropolündeki yolsuzluğu ortaya çıkarır.",
    genres: [0.6, 0.7, 0.2, 0.2]
  },
  {
    id: "m4",
    title: "Gece Sonatı",
    synopsis: "Bir piyanist, geçmişiyle yüzleşmek için unutulmuş bir melodiyi izler.",
    genres: [0.1, 0.9, 0.2, 0.1]
  },
  {
    id: "m5",
    title: "Kuantum Sirki",
    synopsis: "Zaman bükebilen sanatçılar topluluklarını kurtarmaya çalışır.",
    genres: [0.7, 0.3, 0.6, 0.8]
  }
];

const LIVE_SIGNALS = [
  "Mobilde bilim kurgu izlenmeleri bugün %18 arttı.",
  "Hafta sonu komedi maratonları izleme süresini yükseltti.",
  "Latin Amerika'da yeni sci-fi fragmanları trend oldu.",
  "Drama içeriklerinde gece saatlerinde tekrar izleme zirvede.",
  "Yeni aksiyon lansmanları tamamlanma oranını büyütüyor."
];

const QUICK_INSIGHTS = [
  {
    title: "Akşam önerisi",
    value: "3 yeni film",
    detail: "AI, son izlemelere göre listeni yeniledi."
  },
  {
    title: "Keşif oranı",
    value: "%72",
    detail: "Yeni türleri deneme oranı artıyor."
  },
  {
    title: "Bugünkü hedef",
    value: "45 dk",
    detail: "Kısa içeriklerle hedefini tamamlayabilirsin."
  }
];

const INITIAL_FACTORS = {
  users: {
    u1: [0.42, 0.11, 0.55],
    u2: [0.3, 0.6, 0.2]
  },
  items: {
    m1: [0.9, 0.1, 0.4],
    m2: [0.2, 0.8, 0.3],
    m3: [0.6, 0.4, 0.3],
    m4: [0.1, 0.9, 0.2],
    m5: [0.7, 0.3, 0.5]
  }
};

const createProfile = () => ({
  Aksiyon: 0.6,
  Drama: 0.4,
  Komedi: 0.3,
  "Bilim Kurgu": 0.7
});

const scoreContent = (profile, movie) => {
  const weights = GENRES.map((genre) => profile[genre] || 0);
  return weights.reduce((sum, weight, index) => sum + weight * movie.genres[index], 0);
};

const normalizeScore = (value) => Math.max(0, Math.min(1, value));

const useLiveSignals = () => {
  const [signals, setSignals] = useState([LIVE_SIGNALS[0]]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSignals((prev) => [
        LIVE_SIGNALS[Math.floor(Math.random() * LIVE_SIGNALS.length)],
        ...prev
      ].slice(0, 6));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return signals;
};

const HybridApp = () => {
  const [activePage, setActivePage] = useState("Ana Ekran");
  const [profile, setProfile] = useState(createProfile());
  const [userFactors, setUserFactors] = useState(INITIAL_FACTORS.users.u1);
  const [feedbackLog, setFeedbackLog] = useState([]);
  const [isTraining, setIsTraining] = useState(false);

  const liveSignals = useLiveSignals();

  const recommendations = useMemo(() => {
    return MOVIES.map((movie) => {
      const contentScore = scoreContent(profile, movie);
      const mfScore = tf.tidy(() => {
        const userTensor = tf.tensor1d(userFactors);
        const itemTensor = tf.tensor1d(INITIAL_FACTORS.items[movie.id]);
        return userTensor.dot(itemTensor).dataSync()[0];
      });

      const blended = normalizeScore(contentScore * 0.6 + mfScore * 0.4);

      return {
        ...movie,
        contentScore,
        mfScore,
        blended
      };
    }).sort((a, b) => b.blended - a.blended);
  }, [profile, userFactors]);

  const updateProfile = (genre, value) => {
    setProfile((prev) => ({ ...prev, [genre]: value }));
  };

  const sendFeedback = async (movie, rating) => {
    setIsTraining(true);
    const learningRate = 0.08;

    const newFactors = tf.tidy(() => {
      const userTensor = tf.tensor1d(userFactors);
      const itemTensor = tf.tensor1d(INITIAL_FACTORS.items[movie.id]);
      const prediction = userTensor.dot(itemTensor);
      const error = tf.scalar(rating).sub(prediction);
      const gradient = error.mul(itemTensor).mul(tf.scalar(learningRate));
      return userTensor.add(gradient).arraySync();
    });

    setUserFactors(newFactors);

    const entry = {
      movie: movie.title,
      rating,
      timestamp: new Date().toLocaleTimeString()
    };

    setFeedbackLog((prev) => [entry, ...prev].slice(0, 5));

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId: movie.id, rating, reason: "In-app tap" })
      });
    } catch (error) {
      console.error("Feedback sync failed", error);
    } finally {
      setIsTraining(false);
    }
  };

  const resetProfile = () => {
    setProfile(createProfile());
    setUserFactors(INITIAL_FACTORS.users.u1);
    setFeedbackLog([]);
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Solltema • Akıllı Film Asistanı</p>
          <h1>Merhaba Ayşe, bugün ne izlemek istersin?</h1>
          <p>
            Ana ekran, AI önerileri, profil ve ayarlar arasında hızlıca geçiş yapabilir,
            içerik keşfini kişiselleştirebilirsin.
          </p>
        </div>
        <nav className="nav">
          {[
            "Ana Ekran",
            "AI Önerileri",
            "Profil",
            "Ayarlar"
          ].map((page) => (
            <button
              key={page}
              className={page === activePage ? "nav-button active" : "nav-button"}
              onClick={() => setActivePage(page)}
            >
              {page}
            </button>
          ))}
        </nav>
      </header>

      <main className="page">
        {activePage === "Ana Ekran" && (
          <section className="page-grid">
            <div className="panel hero">
              <h2>Günün keşif planı</h2>
              <p>
                AI sinyalleri, izleme alışkanlıkların ve güncel trendler birleştirildi.
                Aşağıdaki içerikler hızlıca başlamak için hazır.
              </p>
              <div className="chip-row">
                <span className="chip">Hızlı başlangıç</span>
                <span className="chip">Yeni çıkanlar</span>
                <span className="chip">Senin için</span>
              </div>
              <div className="action-row">
                <button>Oynat</button>
                <button className="secondary">Listeyi düzenle</button>
              </div>
            </div>

            <div className="panel">
              <h2>Bugünkü özet</h2>
              <div className="insight-grid">
                {QUICK_INSIGHTS.map((item) => (
                  <div className="insight-card" key={item.title}>
                    <p className="insight-title">{item.title}</p>
                    <h3>{item.value}</h3>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Hızlı listeler</h2>
              <div className="list-grid">
                {[
                  "Sakin akşamlar",
                  "Aksiyon dozu yüksek",
                  "20 dakikalık kaçış",
                  "Kalabalık izleme"
                ].map((list) => (
                  <div className="list-card" key={list}>
                    <h3>{list}</h3>
                    <p>AI, bu listeyi sana göre güncelledi.</p>
                    <button className="ghost">Aç</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Canlı trendler</h2>
              <div className="live-feed">
                {liveSignals.map((signal, index) => (
                  <div className="live-item" key={`${signal}-${index}`}>
                    {signal}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activePage === "AI Önerileri" && (
          <section className="page-grid">
            <div className="panel">
              <h2>Tercih ayarı</h2>
              <div className="slider-group">
                {GENRES.map((genre) => (
                  <label className="slider" key={genre}>
                    <span>
                      {genre} ilgisi: <strong>{profile[genre].toFixed(2)}</strong>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={profile[genre]}
                      onChange={(event) => updateProfile(genre, Number(event.target.value))}
                    />
                  </label>
                ))}
              </div>

              <div className="controls">
                <button className="secondary" onClick={resetProfile}>
                  Profili sıfırla
                </button>
                <button onClick={() => sendFeedback(recommendations[0], 1.0)}>
                  En iyi öneriyi güçlendir
                </button>
              </div>

              <footer>
                {isTraining
                  ? "Online öğrenme güncelleniyor..."
                  : "Bir öneriye dokunarak modele sinyal gönder."}
              </footer>
            </div>

            <div className="panel">
              <h2>AI önerileri</h2>
              <div className="slider-group">
                {recommendations.map((movie) => (
                  <div
                    key={movie.id}
                    className="recommendation"
                    onClick={() => sendFeedback(movie, 0.95)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        sendFeedback(movie, 0.9);
                      }
                    }}
                  >
                    <div className="recommendation-header">
                      <strong>{movie.title}</strong>
                      <span className="pill">{movie.blended.toFixed(2)} uyum</span>
                    </div>
                    <span>{movie.synopsis}</span>
                    <div className="score-grid">
                      <div className="score">İçerik skoru: {movie.contentScore.toFixed(2)}</div>
                      <div className="score">MF skoru: {movie.mfScore.toFixed(2)}</div>
                      <div className="score">Hibrit sıra: {movie.blended.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Canlı veri sinyalleri</h2>
              <div className="live-feed">
                {liveSignals.map((signal, index) => (
                  <div className="live-item" key={`${signal}-${index}`}>
                    {signal}
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Öğrenme geri bildirimi</h2>
              <div className="live-feed">
                {feedbackLog.length === 0 ? (
                  <div className="live-item">
                    Henüz geri bildirim yok. Bir öneriyi seçerek modeli eğit.
                  </div>
                ) : (
                  feedbackLog.map((entry) => (
                    <div className="live-item" key={`${entry.movie}-${entry.timestamp}`}>
                      <strong>{entry.movie}</strong>
                      <div>Puan sinyali: {entry.rating.toFixed(2)}</div>
                      <div>{entry.timestamp}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {activePage === "Profil" && (
          <section className="page-grid">
            <div className="panel profile-card">
              <div>
                <h2>Ayşe Demir</h2>
                <p>Premium Üye • İstanbul</p>
                <div className="profile-meta">
                  <span>Profil tamamlama: %82</span>
                  <span>Haftalık hedef: 3 film</span>
                </div>
              </div>
              <button className="secondary">Profili düzenle</button>
            </div>

            <div className="panel">
              <h2>İzleme istatistikleri</h2>
              <div className="insight-grid">
                {[
                  { title: "Bu hafta", value: "6 saat", detail: "2 film + 1 mini dizi" },
                  { title: "Favori tür", value: "Bilim kurgu", detail: "Son 30 gün" },
                  { title: "Ortalama seans", value: "48 dk", detail: "Akşam izlemeleri" }
                ].map((item) => (
                  <div className="insight-card" key={item.title}>
                    <p className="insight-title">{item.title}</p>
                    <h3>{item.value}</h3>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Tercih haritası</h2>
              <div className="preference-grid">
                {GENRES.map((genre) => (
                  <div className="preference-card" key={genre}>
                    <p>{genre}</p>
                    <div className="progress">
                      <span style={{ width: `${profile[genre] * 100}%` }} />
                    </div>
                    <strong>{Math.round(profile[genre] * 100)}%</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Yakın zamanda izlenenler</h2>
              <ul className="activity-list">
                {[
                  "Kuantum Sirki • Tamamlandı",
                  "Gülen Sinyaller • Devam ediyor",
                  "Gece Sonatı • Favorilere eklendi",
                  "Çelik Liman • İzleme listesinde"
                ].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {activePage === "Ayarlar" && (
          <section className="page-grid">
            <div className="panel">
              <h2>Hesap ayarları</h2>
              <div className="form-grid">
                <label>
                  Görünen ad
                  <input type="text" defaultValue="Ayşe" />
                </label>
                <label>
                  E-posta bildirimleri
                  <select defaultValue="daily">
                    <option value="daily">Günlük özet</option>
                    <option value="weekly">Haftalık</option>
                    <option value="off">Kapalı</option>
                  </select>
                </label>
                <label>
                  Varsayılan profil
                  <select defaultValue="solo">
                    <option value="solo">Tek kişi</option>
                    <option value="family">Aile</option>
                    <option value="kids">Çocuk</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="panel">
              <h2>Oynatma tercihleri</h2>
              <div className="toggle-list">
                {[
                  "Sonraki bölümü otomatik oynat",
                  "Ön izleme videolarını göster",
                  "Hareketli arka planı etkinleştir",
                  "Düşük veri modu"
                ].map((label) => (
                  <label className="toggle" key={label}>
                    <input type="checkbox" defaultChecked={label !== "Düşük veri modu"} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Gizlilik</h2>
              <div className="toggle-list">
                {[
                  "İzleme geçmişini cihazlarda senkronize et",
                  "AI kişiselleştirmeyi etkinleştir",
                  "Pazarlama içeriklerine izin ver"
                ].map((label, index) => (
                  <label className="toggle" key={label}>
                    <input type="checkbox" defaultChecked={index !== 2} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <button className="secondary">Ayarları kaydet</button>
            </div>

            <div className="panel">
              <h2>Cihaz yönetimi</h2>
              <div className="device-grid">
                {[
                  { name: "iPhone 13", status: "Aktif" },
                  { name: "Web Player", status: "Aktif" },
                  { name: "Android TV", status: "Son aktif 2 gün" }
                ].map((device) => (
                  <div className="device-card" key={device.name}>
                    <h3>{device.name}</h3>
                    <p>{device.status}</p>
                    <button className="ghost">Yönet</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<HybridApp />);
