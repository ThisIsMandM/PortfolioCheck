const CRYPTO_URL =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=bitcoin,ethereum,dogecoin" +
  "&vs_currencies=usd" +
  "&include_24hr_change=true";

const FIAT_URL =
  "https://raw.githubusercontent.com/HosseinOdd/Navasan-API/main/data/fiat.json";

const GOLD_URL =
  "https://raw.githubusercontent.com/HosseinOdd/Navasan-API/main/data/gold.json";

const REFRESH_INTERVAL = 5 * 60 * 1000;
const CRYPTO_CACHE_TIME = 5 * 60 * 1000;
const IRAN_CACHE_TIME = 30 * 60 * 1000;

const elements = {
  goldOuncePrice: document.getElementById("goldOuncePrice"),
  goldUpdatedAt: document.getElementById("goldUpdatedAt"),

  usdIrrPrice: document.getElementById("usdIrrPrice"),
  usdIrrToman: document.getElementById("usdIrrToman"),

  gold18Price: document.getElementById("gold18Price"),
  gold18Toman: document.getElementById("gold18Toman"),

  bitcoinPrice: document.getElementById("bitcoinPrice"),
  ethereumPrice: document.getElementById("ethereumPrice"),
  dogecoinPrice: document.getElementById("dogecoinPrice"),

  bitcoinChange: document.getElementById("bitcoinChange"),
  ethereumChange: document.getElementById("ethereumChange"),
  dogecoinChange: document.getElementById("dogecoinChange"),

  formulaGoldOunce: document.getElementById("formulaGoldOunce"),
  formulaUsdIrr: document.getElementById("formulaUsdIrr"),
  formulaGold18: document.getElementById("formulaGold18"),

  refreshButton: document.getElementById("refreshButton"),
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  lastUpdated: document.getElementById("lastUpdated")
};

function formatUsd(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits
  }).format(value);
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits
  }).format(value);
}

function formatToman(value) {
  return `${formatNumber(value)} تومان`;
}

function formatRial(value) {
  return `${formatNumber(value)} ریال`;
}

function setText(element, text) {
  if (!element) return;

  element.textContent = text;
  element.classList.remove("skeleton");
}

function setStatus(type, message) {
  if (elements.statusDot) {
    elements.statusDot.className = `status-dot ${type}`;
  }

  if (elements.statusText) {
    elements.statusText.textContent = message;
  }
}

function setLoading(isLoading) {
  if (!elements.refreshButton) return;

  elements.refreshButton.disabled = isLoading;
  elements.refreshButton.classList.toggle("is-loading", isLoading);
}

function showChange(element, percentage) {
  if (!element) return;

  const change = Number(percentage);

  if (!Number.isFinite(change)) {
    element.textContent = "—";
    element.className = "change-badge neutral";
    return;
  }

  const positive = change >= 0;
  const sign = positive ? "+" : "";

  element.textContent = `${sign}${change.toFixed(2)}%`;
  element.className = positive
    ? "change-badge positive"
    : "change-badge negative";
}

function readCache(key, maxAge) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));

    if (!saved || Date.now() - saved.savedAt > maxAge) {
      return null;
    }

    return saved.data;
  } catch {
    return null;
  }
}

function readExpiredCache(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved?.data ?? null;
  } catch {
    return null;
  }
}

function saveCache(key, data) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        savedAt: Date.now()
      })
    );
  } catch {
    // The website can continue if localStorage is unavailable.
  }
}

async function fetchJson(url, cacheKey, maxAge) {
  const freshCache = readCache(cacheKey, maxAge);

  if (freshCache) {
    return freshCache;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    saveCache(cacheKey, data);

    return data;
  } catch (error) {
    const oldCache = readExpiredCache(cacheKey);

    if (oldCache) {
      console.warn(`${cacheKey}: using cached data`, error);
      return oldCache;
    }

    throw error;
  }
}

async function getCryptoPrices() {
  const data = await fetchJson(
    CRYPTO_URL,
    "market-crypto",
    CRYPTO_CACHE_TIME
  );

  const result = {
    bitcoin: Number(data?.bitcoin?.usd),
    ethereum: Number(data?.ethereum?.usd),
    dogecoin: Number(data?.dogecoin?.usd),

    bitcoinChange: Number(data?.bitcoin?.usd_24h_change),
    ethereumChange: Number(data?.ethereum?.usd_24h_change),
    dogecoinChange: Number(data?.dogecoin?.usd_24h_change)
  };

  if (
    !Number.isFinite(result.bitcoin) ||
    !Number.isFinite(result.ethereum) ||
    !Number.isFinite(result.dogecoin)
  ) {
    throw new Error("CoinGecko returned invalid prices.");
  }

  return result;
}

async function getUsdToman() {
  const data = await fetchJson(
    FIAT_URL,
    "market-fiat",
    IRAN_CACHE_TIME
  );

  const usdToman = Number(data?.usd?.value);

  if (!Number.isFinite(usdToman) || usdToman <= 0) {
    throw new Error("USD/Toman value is invalid.");
  }

  return usdToman;
}

async function getGoldPrices() {
  const data = await fetchJson(
    GOLD_URL,
    "market-gold",
    IRAN_CACHE_TIME
  );

  const gold18Toman = Number(data?.["18ayar"]?.value);
  const goldOunceUsd = Number(data?.usd_xau?.value);

  if (!Number.isFinite(gold18Toman) || gold18Toman <= 0) {
    throw new Error("18K gold value is invalid.");
  }

  if (!Number.isFinite(goldOunceUsd) || goldOunceUsd <= 0) {
    throw new Error("International gold value is invalid.");
  }

  return {
    gold18Toman,
    goldOunceUsd
  };
}

function renderCrypto(crypto) {
  setText(elements.bitcoinPrice, formatUsd(crypto.bitcoin));
  setText(elements.ethereumPrice, formatUsd(crypto.ethereum));
  setText(elements.dogecoinPrice, formatUsd(crypto.dogecoin, 5));

  showChange(elements.bitcoinChange, crypto.bitcoinChange);
  showChange(elements.ethereumChange, crypto.ethereumChange);
  showChange(elements.dogecoinChange, crypto.dogecoinChange);
}

function renderUsd(usdToman) {
  const usdRial = usdToman * 10;

  setText(elements.usdIrrPrice, formatRial(usdRial));
  setText(elements.usdIrrToman, formatToman(usdToman));
  setText(elements.formulaUsdIrr, formatNumber(usdRial));
}

function renderGold(gold) {
  const gold18Rial = gold.gold18Toman * 10;

  setText(
    elements.goldOuncePrice,
    formatUsd(gold.goldOunceUsd)
  );

  setText(
    elements.gold18Price,
    formatRial(gold18Rial)
  );

  setText(
    elements.gold18Toman,
    formatToman(gold.gold18Toman)
  );

  setText(
    elements.formulaGoldOunce,
    formatUsd(gold.goldOunceUsd)
  );

  setText(
    elements.formulaGold18,
    formatRial(gold18Rial)
  );

  setText(elements.goldUpdatedAt, "Live market");
}

function updateLastUpdated() {
  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date());

  setText(
    elements.lastUpdated,
    `Last update: ${formatted}`
  );
}

async function loadMarketData() {
  setLoading(true);
  setStatus("loading", "Updating prices...");

  const results = await Promise.allSettled([
    getCryptoPrices(),
    getUsdToman(),
    getGoldPrices()
  ]);

  const [cryptoResult, usdResult, goldResult] = results;

  if (cryptoResult.status === "fulfilled") {
    renderCrypto(cryptoResult.value);
  } else {
    console.error("Crypto failed:", cryptoResult.reason);
  }

  if (usdResult.status === "fulfilled") {
    renderUsd(usdResult.value);
  } else {
    console.error("USD/Toman failed:", usdResult.reason);
  }

  if (goldResult.status === "fulfilled") {
    renderGold(goldResult.value);
  } else {
    console.error("Gold failed:", goldResult.reason);
  }

  updateLastUpdated();
  setLoading(false);

  const successful = results.filter(
    result => result.status === "fulfilled"
  ).length;

  if (successful === 3) {
    setStatus("", "All markets updated");
  } else if (successful > 0) {
    setStatus("error", "Some prices could not update");
  } else {
    setStatus("error", "Could not load market prices");
  }
}

if (elements.refreshButton) {
  elements.refreshButton.addEventListener(
    "click",
    loadMarketData
  );
}

loadMarketData();

setInterval(loadMarketData, REFRESH_INTERVAL);
