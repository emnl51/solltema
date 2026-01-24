const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

const contentCatalog = [
  {
    id: "show-001",
    title: "Karanlık Sokaklar",
    type: "Dizi",
    tags: ["suç", "gerilim", "polis"],
    year: 2022
  },
  {
    id: "movie-002",
    title: "Güneşin Ardında",
    type: "Film",
    tags: ["dram", "romantik", "aile"],
    year: 2021
  },
  {
    id: "show-003",
    title: "Gelecek Kodu",
    type: "Dizi",
    tags: ["bilim-kurgu", "teknoloji", "aksiyon"],
    year: 2023
  },
  {
    id: "movie-004",
    title: "Deniz Feneri",
    type: "Film",
    tags: ["gizem", "gerilim", "psikolojik"],
    year: 2019
  },
  {
    id: "show-005",
    title: "Mutfak Günlükleri",
    type: "Dizi",
    tags: ["komedi", "aile", "yaşam"],
    year: 2020
  },
  {
    id: "movie-006",
    title: "Sıfır Noktası",
    type: "Film",
    tags: ["aksiyon", "macera", "bilim-kurgu"],
    year: 2024
  }
];

const userProfiles = {
  guest: {
    tagWeights: {},
    ratedContent: {}
  }
};

const clampRating = (rating) => Math.max(1, Math.min(5, rating));

const updateProfile = (profile, content, rating) => {
  const normalizedRating = clampRating(rating);
  const delta = normalizedRating - 3;

  content.tags.forEach((tag) => {
    const current = profile.tagWeights[tag] ?? 0;
    const updated = current + delta * 0.6;
    profile.tagWeights[tag] = Math.round(updated * 10) / 10;
  });

  profile.ratedContent[content.id] = {
    rating: normalizedRating,
    updatedAt: new Date().toISOString()
  };
};

const scoreContent = (profile, content) => {
  const baseScore = content.tags.reduce((sum, tag) => sum + (profile.tagWeights[tag] ?? 0), 0);
  const noveltyBoost = profile.ratedContent[content.id] ? -1.5 : 0.8;
  return Math.round((baseScore + noveltyBoost) * 10) / 10;
};

const sendJson = (res, payload, statusCode = 200) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

const serveStatic = (req, res, pathname) => {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    const contentType =
      extension === ".css"
        ? "text/css"
        : extension === ".js"
          ? "text/javascript"
          : "text/html";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (pathname.startsWith("/api")) {
    if (pathname === "/api/content" && req.method === "GET") {
      return sendJson(res, { content: contentCatalog });
    }

    if (pathname === "/api/profile" && req.method === "GET") {
      return sendJson(res, { profile: userProfiles.guest });
    }

    if (pathname === "/api/ratings" && req.method === "POST") {
      try {
        const { contentId, rating } = await parseBody(req);
        const content = contentCatalog.find((item) => item.id === contentId);

        if (!content) {
          return sendJson(res, { error: "İçerik bulunamadı." }, 404);
        }

        const profile = userProfiles.guest;
        updateProfile(profile, content, Number(rating));
        return sendJson(res, { profile });
      } catch (error) {
        return sendJson(res, { error: "Geçersiz istek." }, 400);
      }
    }

    if (pathname === "/api/recommendations" && req.method === "GET") {
      const profile = userProfiles.guest;
      const recommendations = contentCatalog
        .map((item) => ({
          ...item,
          score: scoreContent(profile, item)
        }))
        .sort((a, b) => b.score - a.score);

      return sendJson(res, { recommendations });
    }

    res.writeHead(404);
    res.end("Not found");
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
