const { useEffect, useMemo, useRef, useState } = React;

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

const buildCsv = (headers, rows) => {
  const escapeValue = (value) => {
    const stringValue = String(value ?? "");
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  return [headers, ...rows].map((row) => row.map(escapeValue).join(",")).join("\n");
};

const parseCsv = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });
};

const HybridApp = () => {
  const [profile, setProfile] = useState(createProfile());
  const [profileName, setProfileName] = useState("Aylin");
  const [profileGoal, setProfileGoal] = useState("Discover cinematic sci-fi");
  const [userFactors, setUserFactors] = useState(INITIAL_FACTORS.users.u1);
  const [feedbackLog, setFeedbackLog] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [modelStatus, setModelStatus] = useState("Not trained");
  const [modelMetrics, setModelMetrics] = useState(null);
  const [importMessage, setImportMessage] = useState("");

  const modelRef = useRef(null);
  const fileInputRef = useRef(null);
  const liveSignals = useLiveSignals();

  const recommendations = useMemo(() => {
    const model = modelRef.current;
    return MOVIES.map((movie) => {
      const contentScore = scoreContent(profile, movie);
      const mfScore = tf.tidy(() => {
        const userTensor = tf.tensor1d(userFactors);
        const itemTensor = tf.tensor1d(INITIAL_FACTORS.items[movie.id]);
        return userTensor.dot(itemTensor).dataSync()[0];
      });

      const modelScore = model
        ? tf.tidy(() => {
            const prediction = model.predict(tf.tensor2d([movie.genres]));
            return prediction.dataSync()[0];
          })
        : contentScore;

      const blended = normalizeScore(contentScore * 0.45 + mfScore * 0.25 + modelScore * 0.3);

      return {
        ...movie,
        contentScore,
        mfScore,
        modelScore,
        blended
      };
    }).sort((a, b) => b.blended - a.blended);
  }, [profile, userFactors, modelStatus]);

  const updateProfile = (genre, value) => {
    setProfile((prev) => ({ ...prev, [genre]: value }));
  };

  const createTrainingData = () => {
    const weights = GENRES.map((genre) => profile[genre] || 0);
    const xs = MOVIES.map((movie) => movie.genres);
    const ys = xs.map((movieGenres) => {
      const weighted = movieGenres.reduce((sum, value, index) => sum + value * weights[index], 0);
      return normalizeScore(weighted * 0.9 + 0.05);
    });
    return { xs, ys };
  };

  const trainModel = async () => {
    setIsTraining(true);
    setModelStatus("Training...");

    const { xs, ys } = createTrainingData();

    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 6,
        activation: "relu",
        inputShape: [GENRES.length]
      })
    );
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
    model.compile({ optimizer: tf.train.adam(0.08), loss: "meanSquaredError" });

    const history = await model.fit(tf.tensor2d(xs), tf.tensor2d(ys, [ys.length, 1]), {
      epochs: 40,
      batchSize: 5,
      verbose: 0
    });

    modelRef.current = model;
    const loss = history.history.loss.at(-1);
    setModelMetrics({ loss: loss.toFixed(4), samples: xs.length });
    setModelStatus("Trained");
    setIsTraining(false);
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

  const buildExportPayload = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      name: profileName,
      goal: profileGoal,
      affinities: profile
    },
    userFactors,
    feedbackLog
  });

  const downloadFile = (filename, content, type) => {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportJson = () => {
    const payload = buildExportPayload();
    downloadFile(
      `profile-export-${profileName || "user"}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  };

  const exportCsv = () => {
    const payload = buildExportPayload();
    const rows = GENRES.map((genre) => [
      profileName,
      profileGoal,
      genre,
      payload.profile.affinities[genre],
      userFactors[GENRES.indexOf(genre)] ?? "",
      feedbackLog[0]?.rating ?? ""
    ]);

    const csvContent = buildCsv(
      [
        "profileName",
        "profileGoal",
        "genre",
        "affinity",
        "userFactor",
        "latestRating"
      ],
      rows
    );
    downloadFile(`profile-export-${profileName || "user"}.csv`, csvContent, "text/csv");
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (file.name.endsWith(".json")) {
          const payload = JSON.parse(reader.result);
          if (!payload.profile || !payload.profile.affinities) {
            throw new Error("JSON profile missing.");
          }
          setProfileName(payload.profile.name || "Imported user");
          setProfileGoal(payload.profile.goal || "");
          setProfile({ ...createProfile(), ...payload.profile.affinities });
          setUserFactors(payload.userFactors || INITIAL_FACTORS.users.u1);
          setFeedbackLog(payload.feedbackLog || []);
          setImportMessage("JSON profile imported successfully.");
        } else if (file.name.endsWith(".csv")) {
          const rows = parseCsv(reader.result);
          if (!rows.length) {
            throw new Error("CSV file is empty.");
          }
          const name = rows[0].profileName || "Imported user";
          const goal = rows[0].profileGoal || "";
          const affinities = rows.reduce((acc, row) => {
            if (row.genre && GENRES.includes(row.genre)) {
              acc[row.genre] = Number(row.affinity) || 0;
            }
            return acc;
          }, {});
          const factors = rows.map((row) => Number(row.userFactor) || 0);
          setProfileName(name);
          setProfileGoal(goal);
          setProfile({ ...createProfile(), ...affinities });
          if (factors.length >= GENRES.length) {
            setUserFactors(factors.slice(0, userFactors.length));
          }
          setImportMessage("CSV profile imported successfully.");
        } else {
          throw new Error("Unsupported file format.");
        }
      } catch (error) {
        setImportMessage(`Import failed: ${error.message}`);
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const resetProfile = () => {
    setProfile(createProfile());
    setUserFactors(INITIAL_FACTORS.users.u1);
    setFeedbackLog([]);
    setModelStatus("Not trained");
    setModelMetrics(null);
    setImportMessage("");
    modelRef.current = null;
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
          <h2>User profile creation</h2>
          <div className="form-grid">
            <label className="field">
              <span>Profile name</span>
              <input
                type="text"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Viewing goal</span>
              <input
                type="text"
                value={profileGoal}
                onChange={(event) => setProfileGoal(event.target.value)}
              />
            </label>
          </div>
          <div className="profile-card">
            <strong>{profileName}</strong>
            <span>{profileGoal}</span>
            <p>
              Preference vector calibrated to your signals. Tune affinities below and train the
              model to update your personalized ranking.
            </p>
          </div>
        </section>

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
          <h2>Modeling & training</h2>
          <p>
            Train a lightweight TensorFlow.js model on your profile to refine content relevance
            signals. The trained model injects an additional score into the hybrid ranking.
          </p>
          <div className="training-grid">
            <div>
              <div className="status">Model status</div>
              <strong>{modelStatus}</strong>
            </div>
            <div>
              <div className="status">Training loss</div>
              <strong>{modelMetrics ? modelMetrics.loss : "--"}</strong>
            </div>
            <div>
              <div className="status">Samples</div>
              <strong>{modelMetrics ? modelMetrics.samples : "--"}</strong>
            </div>
          </div>
          <div className="controls">
            <button onClick={trainModel} disabled={isTraining}>
              Train profile model
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Import & export profiles</h2>
          <p>
            Export your profile and feedback to JSON or CSV, then re-import it later to resume
            personalized recommendations.
          </p>
          <div className="controls">
            <button onClick={exportJson}>Export JSON</button>
            <button className="secondary" onClick={exportCsv}>
              Export CSV
            </button>
            <button
              className="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Import JSON/CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              className="file-input"
              onChange={handleImport}
            />
          </div>
          {importMessage ? <div className="import-message">{importMessage}</div> : null}
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
                  <div className="score">Model score: {movie.modelScore.toFixed(2)}</div>
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
