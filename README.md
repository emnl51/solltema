# Solltema Hybrid Movie Recommender

A lightweight hybrid movie recommendation demo that combines real-time signal ingestion, content-based filtering, matrix factorization, modeling, and online learning. The prototype uses a small Node.js HTTP server and a React + TensorFlow.js front-end.

## Features

- **User profile creation** with affinity sliders and goal setting.
- **Hybrid ranking** that blends content scores, matrix-factorization embeddings, and a trained profile model.
- **Client-side model training** with TensorFlow.js to refine recommendation quality.
- **Online learning loop** that updates the user factors with every feedback tap.
- **Profile import/export** via JSON or CSV to resume personalization.
- **Live signal panel** showcasing simulated real-time data insights.
- **Responsive UI** designed for web and mobile layouts.

## Tech Stack

- **Node.js** for the minimal HTTP server and feedback endpoints.
- **React** for the interactive UI.
- **TensorFlow.js** for client-side recommendation math.

## Getting Started

1. Start the server:
   ```bash
   node server.js
   ```
2. Open the app in your browser:
   ```
   http://localhost:3000
   ```

## Demo Flow

1. Create or update a user profile and adjust genre affinities.
2. Train the profile model to generate personalized content scores.
3. Export the profile to JSON or CSV as needed.
4. Import a profile later to restore personalization.
5. Tap a recommendation to send feedback and trigger online learning.
6. Watch the hybrid ranking update in real time.

## API Endpoints

- `GET /api/health` — sanity check for server status and feedback count.
- `POST /api/feedback` — ingest a rating event.
- `GET /api/feedback` — retrieve the most recent feedback events.

## Notes

This is a prototype intended to illustrate the architecture and user experience of a hybrid recommender. The data is mocked and updated in-memory only.
