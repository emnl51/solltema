const contentList = document.getElementById("content-list");
const recommendationsList = document.getElementById("recommendations");
const profileTags = document.getElementById("profile-tags");

const api = {
  async getContent() {
    const response = await fetch("/api/content");
    return response.json();
  },
  async getProfile() {
    const response = await fetch("/api/profile");
    return response.json();
  },
  async rateContent(contentId, rating) {
    const response = await fetch("/api/ratings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ contentId, rating })
    });
    return response.json();
  },
  async getRecommendations() {
    const response = await fetch("/api/recommendations");
    return response.json();
  }
};

const renderTags = (tagWeights = {}) => {
  profileTags.innerHTML = "";
  const entries = Object.entries(tagWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (entries.length === 0) {
    const item = document.createElement("li");
    item.className = "tag muted";
    item.textContent = "Henüz veri yok";
    profileTags.appendChild(item);
    return;
  }

  entries.forEach(([tag, score]) => {
    const item = document.createElement("li");
    item.className = "tag";
    item.textContent = `${tag} (${score})`;
    profileTags.appendChild(item);
  });
};

const createRatingButtons = (contentId) => {
  const container = document.createElement("div");
  container.className = "rating";

  for (let rating = 1; rating <= 5; rating += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = rating;
    button.addEventListener("click", async () => {
      await api.rateContent(contentId, rating);
      await refreshProfile();
      await refreshRecommendations();
    });
    container.appendChild(button);
  }

  return container;
};

const renderContentCatalog = (content) => {
  contentList.innerHTML = "";
  content.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <div>
        <p class="pill">${item.type} • ${item.year}</p>
        <h3>${item.title}</h3>
        <p class="meta">Etiketler: ${item.tags.join(", ")}</p>
      </div>
    `;

    card.appendChild(createRatingButtons(item.id));
    contentList.appendChild(card);
  });
};

const renderRecommendations = (items) => {
  recommendationsList.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card recommend";
    card.innerHTML = `
      <div>
        <p class="pill">Skor ${item.score}</p>
        <h3>${item.title}</h3>
        <p class="meta">${item.type} • ${item.year}</p>
        <p class="meta">Etiketler: ${item.tags.join(", ")}</p>
      </div>
    `;
    recommendationsList.appendChild(card);
  });
};

const refreshProfile = async () => {
  const { profile } = await api.getProfile();
  renderTags(profile.tagWeights);
};

const refreshRecommendations = async () => {
  const { recommendations } = await api.getRecommendations();
  renderRecommendations(recommendations);
};

const init = async () => {
  const { content } = await api.getContent();
  renderContentCatalog(content);
  await refreshProfile();
  await refreshRecommendations();
};

init();
