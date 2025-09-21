import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Allow CORS for your GitHub Pages frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/options", async (req, res) => {
  const ticker = (req.query.ticker || "").toUpperCase().trim();
  const date = req.query.date ? `?date=${encodeURIComponent(req.query.date)}` : "";

  if (!ticker) {
    return res.status(400).json({ error: "Missing ticker parameter" });
  }

  const url = `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(ticker)}${date}`;
  console.log(`🔎 Fetching: ${url}`);

  try {
    const r = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0",
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "referer": "https://finance.yahoo.com/"
      }
    });

    const body = await r.text(); // read raw text for logging
    console.log(`📡 Yahoo response: ${r.status}`);
    if (!r.ok) {
      console.error("❌ Yahoo error body:", body.slice(0, 500)); // log first 500 chars
      return res.status(r.status).send(body);
    }

    // Forward JSON back to client
    res.setHeader("content-type", "application/json");
    res.send(body);
  } catch (err) {
    console.error("🔥 Proxy error:", err);
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy running on port ${PORT}`);
});
