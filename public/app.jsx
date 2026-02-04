const { useEffect, useMemo, useState } = React;

const GENRES = ["Action", "Drama", "Comedy", "Sci-Fi"];

const MOVIES = [
  {
    id: "m1",
    title: "Nebula Drift",
    synopsis: "A sci-fi rescue mission becomes a test of loyalty.",
    genres: [0.8, 0.2, 0.1, 0.9]
  },
  {
    id: "m2",
    title: "Laughing Signals",
    synopsis: "Roommates launch a prank channel that turns into a movement.",
    genres: [0.1, 0.3, 0.95, 0.1]
  },
  {
    id: "m3",
    title: "Steel Harbor",
    synopsis: "A detective uncovers corruption in a coastal megacity.",
    genres: [0.6, 0.7, 0.2, 0.2]
  },
  {
    id: "m4",
    title: "Midnight Sonata",
    synopsis: "A pianist confronts her past through a haunting melody.",
    genres: [0.1, 0.9, 0.2, 0.1]
  },
  {
    id: "m5",
    title: "Quantum Circus",
    synopsis: "Time-warping performers try to save their interstellar troupe.",
    genres: [0.7, 0.3, 0.6, 0.8]
  }
];

const LIVE_SIGNALS = [
  "Mobile users in Seattle are binge-watching space thrillers.",
  "Weekend watch parties boosted comedy engagement by 14%.",
  "Sci-fi trailers trending in Latin America.",
  "Drama rewatch spikes on weekday nights.",
  "New action releases drive higher completion rates on mobile."
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
  Action: 0.6,
  Drama: 0.4,
  Comedy: 0.3,
  "Sci-Fi": 0.7
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
        <h1>Hybrid Movie Recommendation Engine</h1>
        <p>
          This prototype blends real-time signals, content-based filtering, matrix
          factorization, and online learning. It runs on Node.js, React, and TensorFlow.js,
          and is optimized for fast personalization across web and mobile clients.
        </p>
        <div className="badges">
          <span className="badge">Real-time ingestion</span>
          <span className="badge">Content-based filtering</span>
          <span className="badge">Matrix factorization</span>
          <span className="badge">Online learning</span>
          <span className="badge">TensorFlow.js</span>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Preference tuning</h2>
          <div className="slider-group">
            {GENRES.map((genre) => (
              <label className="slider" key={genre}>
                <span>
                  {genre} affinity: <strong>{profile[genre].toFixed(2)}</strong>
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
              Reset profile
            </button>
            <button onClick={() => sendFeedback(recommendations[0], 1.0)}>
              Boost top pick
            </button>
          </div>

          <footer>
            {isTraining
              ? "Applying online learning update..."
              : "Tap a recommendation to send real-time feedback."}
          </footer>
        </section>

        <section className="panel">
          <h2>Personalized recommendations</h2>
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
                <strong>{movie.title}</strong>
                <span>{movie.synopsis}</span>
                <div className="score-grid">
                  <div className="score">Content score: {movie.contentScore.toFixed(2)}</div>
                  <div className="score">MF score: {movie.mfScore.toFixed(2)}</div>
                  <div className="score">Hybrid rank: {movie.blended.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Live data signals</h2>
          <div className="live-feed">
            {liveSignals.map((signal, index) => (
              <div className="live-item" key={`${signal}-${index}`}>
                {signal}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Online learning feedback</h2>
          <div className="live-feed">
            {feedbackLog.length === 0 ? (
              <div className="live-item">
                No feedback yet. Tap a recommendation to teach the model.
              </div>
            ) : (
              feedbackLog.map((entry) => (
                <div className="live-item" key={`${entry.movie}-${entry.timestamp}`}>
                  <strong>{entry.movie}</strong>
                  <div>Rating signal: {entry.rating.toFixed(2)}</div>
                  <div>{entry.timestamp}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<HybridApp />);
