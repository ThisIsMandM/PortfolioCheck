const TROY_OUNCE_TO_GRAMS = 31.1034768;
const GOLD_18K_PURITY = 0.75;

const elements = {
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  refreshButton: document.getElementById("refreshButton"),

  goldOuncePrice: document.getElementById("goldOuncePrice"),
  usdIrrPrice: document.getElementById("usdIrrPrice"),
  usdIrrToman: document.getElementById("usdIrrToman"),
  gold18Price: document.getElementById("gold18Price"),
  gold18Toman: document.getElementById("gold18Toman"),
  goldUpdatedAt: document.getElementById("goldUpdatedAt"),

  bitcoinPrice: document.getElementById("bitcoinPrice"),
  ethereumPrice: document.getElementById("ethereumPrice"),
  dogecoinPrice: document.getElementById("dogecoinPrice"),

  bitcoinChange: document.getElementById("bitcoinChange"),
  ethereumChange: document.getElementById("ethereumChange"),
  dogecoinChange: document.getElementById("dogecoinChange"),

  formulaGoldOunce: document.getElementById("formulaGoldOunce"),
  formulaUsdIrr: document.getElementById("formulaUsdIrr"),
  formulaGold18: document.getElementById("formulaGold18"),

  lastUpdated: document.getElementById("lastUpdated")
};

function formatUsd(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits
  }).format(value);
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits
  }).format(value);
}

function formatIrr(value) {
  return `${formatNumber(value)} ریال`;
}

function formatToman(valueInRials) {
  return `${formatNumber(valueInRials / 10)} تومان`;
}

function removeSkeleton(element) {
  element.classList.remove("skeleton");
}

function setStatus(type, message) {
  elements.statusDot.className = `status-dot ${type}`;
  elements.statusText.textContent = message;
}

function setLoading(isLoading) {
  elements.refreshButton.disabled = isLoading;
  elements.refreshButton.classList.toggle("is-loading", isLoading);

  if (isLoading) {
    setStatus("loading", "Updating live prices...");
  }
}

function updateChangeBadge(element, change) {
  const isValidChange = Number.isFinite(change);

  if (!isValidChange) {
    element.textContent = "—";
    element.className = "change-badge neutral";
    return;
  }

  const sign = change > 0 ? "+" : "";
  element.textContent = `${sign}${change.toFixed(2)}%`;
  element.className = `change-badge ${change >= 0 ? "positive" : "negative"}`;
}

function getCoinGeckoUrl() {
  const baseUrl =
    "https://api.coingecko.com/api/v3/simple/price" +
    "?ids=bitcoin,ethereum,dogecoin" +
    "&vs_currencies=usd" +
    "&include_24hr_change=true" +
    "&include_last_updated_at=true";

  if (
    CONFIG.COINGECKO_DEMO_API_KEY &&
    !CONFIG.COINGECKO_DEMO_API_KEY.includes("PASTE_")
  ) {
    return `${baseUrl}&x_cg_demo_api_key=${encodeURIComponent(
      CONFIG.COINGECKO_DEMO_API_KEY
    )}`;
  }

  return baseUrl;
}

async function fetchCryptoPrices() {
  const response = await fetch(getCoinGeckoUrl());

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    bitcoin: {
      price: data.bitcoin?.usd,
      change: data.bitcoin?.usd_24h_change
    },
    ethereum: {
      price: data.ethereum?.usd,
      change: data.ethereum?.usd_24h_change
    },
    dogecoin: {
      price: data.dogecoin?.usd,
      change: data.dogecoin?.usd_24h_change
    }
  };
}

async function fetchGoldPrice() {
  if (
    !CONFIG.METALS_DEV_API_KEY ||
    CONFIG.METALS_DEV_API_KEY.includes("PASTE_")
  ) {
    throw new Error("Add your Metals.dev API key in config.js");
  }

  const url =
    "https://api.metals.dev/v1/metal/spot" +
    `?api_key=${encodeURIComponent(CONFIG.METALS_DEV_API_KEY)}` +
    "&metal=gold" +
    "&currency=USD";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Metals.dev request failed: ${response.status}`);
  }

  const data = await response.json();

  const goldPrice =
    data?.rate ??
    data?.price ??
    data?.gold ??
    data?.metal?.price;

  if (!Number.isFinite(Number(goldPrice))) {
    throw new Error("Could not read gold price from Metals.dev response");
  }

  return Number(goldPrice);
}

async function fetchUsdIrrPrice() {
  const username = CONFIG.BONBAST_USERNAME;
  const hash = CONFIG.BONBAST_SECRET_HASH;

  if (
    !username ||
    !hash ||
    username.includes("PASTE_") ||
    hash.includes("PASTE_")
  ) {
    throw new Error("Add your Bonbast username and secret hash in config.js");
  }

  const response = await fetch(
    `https://bonbast.com/api/${encodeURIComponent(username)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ hash }).toString()
    }
  );

  if (!response.ok) {
    throw new Error(`Bonbast request failed: ${response.status}`);
  }

  const data = await response.json();

  /*
    Bonbast documentation examples:
    usd1 = USD sell price
    usd2 = USD buy price

    We use usd1 as the dashboard USD/IRR price.
    Depending on the exact Bonbast plan/response, a value might be
    returned in Toman. This code treats the documented API value as IRR.
    Verify with one live response and adjust only if your account returns Toman.
  */
  const usdIrr = Number(data?.usd1);

  if (!Number.isFinite(usdIrr) || usdIrr <= 0) {
    throw new Error("Could not read USD/IRR price from Bonbast response");
  }

  return usdIrr;
}

function renderCrypto(data) {
  elements.bitcoinPrice.textContent = formatUsd(data.bitcoin.price, 2);
  elements.ethereumPrice.textContent = formatUsd(data.ethereum.price, 2);
  elements.dogecoinPrice.textContent = formatUsd(data.dogecoin.price, 5);

  removeSkeleton(elements.bitcoinPrice);
  removeSkeleton(elements.ethereumPrice);
  removeSkeleton(elements.dogecoinPrice);

  updateChangeBadge(elements.bitcoinChange, data.bitcoin.change);
  updateChangeBadge(elements.ethereumChange, data.ethereum.change);
  updateChangeBadge(elements.dogecoinChange, data.dogecoin.change);
}

function renderGoldAndIrr(goldOunceUsd, usdIrr) {
  const gold18PerGramIrr =
    (goldOunceUsd / TROY_OUNCE_TO_GRAMS) *
    GOLD_18K_PURITY *
    usdIrr;

  elements.goldOuncePrice.textContent = formatUsd(goldOunceUsd, 2);
  elements.usdIrrPrice.textContent = formatIrr(usdIrr);
  elements.usdIrrToman.textContent = formatToman(usdIrr);

  elements.gold18Price.textContent = formatIrr(gold18PerGramIrr);
  elements.gold18Toman.textContent = formatToman(gold18PerGramIrr);

  elements.formulaGoldOunce.textContent = formatUsd(goldOunceUsd, 2);
  elements.formulaUsdIrr.textContent = formatNumber(usdIrr);
  elements.formulaGold18.textContent = formatIrr(gold18PerGramIrr);

  [
    elements.goldOuncePrice,
    elements.usdIrrPrice,
    elements.gold18Price
  ].forEach(removeSkeleton);

  elements.goldUpdatedAt.textContent = "Live API";
}

function renderLastUpdated() {
  const now = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date());

  elements.lastUpdated.textContent = `Last update: ${now}`;
}

async function loadMarketData() {
  setLoading(true);

  try {
    const [cryptoResult, goldResult, irrResult] = await Promise.allSettled([
      fetchCryptoPrices(),
      fetchGoldPrice(),
      fetchUsdIrrPrice()
    ]);

    const errors = [];

    if (cryptoResult.status === "fulfilled") {
      renderCrypto(cryptoResult.value);
    } else {
      errors.push(`Crypto: ${cryptoResult.reason.message}`);
    }

    if (goldResult.status === "fulfilled" && irrResult.status === "fulfilled") {
      renderGoldAndIrr(goldResult.value, irrResult.value);
    } else {
      if (goldResult.status === "rejected") {
        errors.push(`Gold: ${goldResult.reason.message}`);
      }

      if (irrResult.status === "rejected") {
        errors.push(`USD/IRR: ${irrResult.reason.message}`);
      }
    }

    renderLastUpdated();

    if (errors.length === 0) {
      setStatus("", "All markets updated");
    } else if (errors.length < 3) {
      console.error(errors.join("\n"));
      setStatus("error", "Some market data could not be updated");
    } else {
      throw new Error(errors.join("\n"));
    }
  } catch (error) {
    console.error(error);
    setStatus("error", "Unable to load market data");
    elements.lastUpdated.textContent = "Last update failed — check API keys and browser console.";
  } finally {
    setLoading(false);
  }
}

elements.refreshButton.addEventListener("click", loadMarketData);

loadMarketData();

setInterval(() => {
  loadMarketData();
}, CONFIG.REFRESH_INTERVAL_MS);
