const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");
const feedbackEvents = [];

const sendJson = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
};

const sendFile = (res, filePath, contentType) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
};

const parseBody = (req) =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (error) {
        resolve({});
      }
    });
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { status: "ok", events: feedbackEvents.length });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/feedback") {
    const body = await parseBody(req);
    const { movieId, rating, reason } = body;
    if (!movieId || typeof rating !== "number") {
      sendJson(res, 400, { error: "movieId and numeric rating are required." });
      return;
    }

    const event = {
      movieId,
      rating,
      reason: reason || "User feedback",
      receivedAt: new Date().toISOString()
    };

    feedbackEvents.unshift(event);
    feedbackEvents.splice(50);

    sendJson(res, 200, { saved: true, event });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/feedback") {
    sendJson(res, 200, { events: feedbackEvents });
    return;
  }

  if (req.method === "GET") {
    const filePath = path.join(publicDir, url.pathname === "/" ? "index.html" : url.pathname);
    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".jsx": "text/babel",
      ".js": "text/javascript"
    };

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      sendFile(res, filePath, contentTypes[ext] || "application/octet-stream");
      return;
    }

    sendFile(res, path.join(publicDir, "index.html"), "text/html");
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain" });
  res.end("Method not allowed");
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
