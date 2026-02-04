import React from 'react';

const fallbackPoster = 'https://via.placeholder.com/320x480?text=No+Poster';

const ContentCard = ({
  content,
  badge,
  reason,
  footer,
  onRate,
  currentRating = 0,
}) => {
  if (!content) return null;

  const poster = content.poster && content.poster !== 'N/A' ? content.poster : fallbackPoster;
  const title = content.title || content.Title || '-';
  const year = content.year || content.Year || '-';
  const genre = content.genre || content.Genre || '-';
  const director = content.director || content.Director || '-';
  const actors = content.actors || content.Actors || '-';
  const plot = content.plot || content.Plot || '-';

  return (
    <article className="content-card">
      <div className="content-card-media">
        <img src={poster} alt={title} />
        {badge && <span className="content-card-badge">{badge}</span>}
      </div>
      <div className="content-card-body">
        <div>
          <h3 className="content-card-title">{title}</h3>
          <p className="content-card-meta">
            {year} • {genre}
          </p>
        </div>
        <p className="content-card-detail">
          <strong>Yönetmen:</strong> {director}
        </p>
        <p className="content-card-detail">
          <strong>Ana Kadro:</strong> {actors}
        </p>
        <p className="content-card-plot">{plot}</p>
        {reason && (
          <div className="content-card-reason">
            <span>Neden önerildi:</span>
            <p>{reason}</p>
          </div>
        )}
        {onRate && (
          <div className="content-card-rating">
            <span>Puanla:</span>
            <div className="rating-stars compact">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-button ${star <= currentRating ? 'filled' : ''}`}
                  onClick={() => onRate(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        )}
        {footer && <div className="content-card-footer">{footer}</div>}
      </div>
    </article>
  );
};

export default ContentCard;
