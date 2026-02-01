# Solltema Hybrid Movie Recommender

A lightweight hybrid movie recommendation demo that combines real-time signal ingestion, content-based filtering, matrix factorization, and online learning. The prototype uses a small Node.js HTTP server and a React + TensorFlow.js front-end.

## Features

- **Hybrid ranking** that blends content scores with matrix-factorization embeddings.
- **Online learning loop** that updates the user factors with every feedback tap.
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

## API Endpoints

- `GET /api/health` — sanity check for server status and feedback count.
- `POST /api/feedback` — ingest a rating event.
- `GET /api/feedback` — retrieve the most recent feedback events.

## Notes

This is a prototype intended to illustrate the architecture and user experience of a hybrid recommender. The data is mocked and updated in-memory only.
