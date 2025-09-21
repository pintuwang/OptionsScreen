// server.js (replace your current file with this and redeploy)
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/options", async (req, res) => {
  const ticker = (req.query.ticker || "").toUpperCase().trim();
  const date = req.query.date; // optional epoch seconds
  if (!ticker) return res.status(400).json({ error: "Missing ticker" });

  const url = `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(ticker)}${date ? `?date=${encodeURIComponent(date)}` : ""}`;

  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    const text = await r.text(); // pass through raw body (Yahoo returns JSON)
    res.setHeader("content-type", "application/json");
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(PORT, () => console.log(`Proxy running on ${PORT}`));
