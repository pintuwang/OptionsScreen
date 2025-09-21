import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Allow CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/options", async (req, res) => {
  const ticker = (req.query.ticker || "").toUpperCase().trim();
  const date = req.query.date ? `?date=${encodeURIComponent(req.query.date)}` : "";

  if (!ticker) return res.status(400).json({ error: "Missing ticker" });

  const url = `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(ticker)}${date}`;
  try {
    const r = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "accept": "application/json"
      }
    });
    if (!r.ok) {
      throw new Error(`Yahoo responded ${r.status}`);
    }
    const text = await r.text();
    res.setHeader("content-type", "application/json");
    res.send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on ${PORT}`);
});

