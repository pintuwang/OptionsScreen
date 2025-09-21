import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// global crumb + cookie store
let yahooCookie = "";
let yahooCrumb = "";

// middleware: allow CORS for GitHub Pages frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// helper: refresh crumb & cookie
async function refreshCrumb() {
  const url = "https://query1.finance.yahoo.com/v1/test/getcrumb";
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`Crumb fetch failed: ${r.status}`);
  const crumb = (await r.text()).trim();
  const cookie = r.headers.get("set-cookie") || "";
  if (!crumb || !cookie) throw new Error("No crumb/cookie received");
  yahooCrumb = crumb;
  yahooCookie = cookie;
  console.log("✅ Yahoo crumb refreshed:", crumb);
}

// helper: ensure crumb is valid (refresh if empty)
async function ensureCrumb() {
  if (!yahooCrumb || !yahooCookie) {
    await refreshCrumb();
  }
}

// route: options chain
app.get("/options", async (req, res) => {
  try {
    await ensureCrumb();

    const ticker = (req.query.ticker || "").toUpperCase().trim();
    const date = req.query.date ? `&date=${encodeURIComponent(req.query.date)}` : "";
    if (!ticker) return res.status(400).json({ error: "Missing ticker" });

    const url = `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(ticker)}?crumb=${encodeURIComponent(yahooCrumb)}${date}`;

    const r = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0",
        "cookie": yahooCookie
      }
    });

    if (r.status === 401 || r.status === 403) {
      // crumb expired → refresh and retry once
      console.log("⚠️ Crumb expired, refreshing…");
      await refreshCrumb();
      return res.redirect(req.originalUrl); // retry
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
  // warm up crumb at startup
  refreshCrumb().catch(e => console.error("Crumb init failed:", e));
});
