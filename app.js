const CRYPTO_URL =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=bitcoin,ethereum,dogecoin" +
  "&vs_currencies=usd" +
  "&include_24hr_change=true";

const FIAT_URL =
  "https://raw.githubusercontent.com/HosseinOdd/Navasan-API/main/data/fiat.json";

const GOLD_URL =
  "https://api.goldprice.dev/v1/prices?symbol=XAU-USD-SPOT";

const TROY_OUNCE_TO_GRAMS = 31.1034768;
const GOLD_18K_PURITY = 0.75;

const elements = {
  goldOuncePrice: document.getElementById("goldOuncePrice"),
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

  goldUpdatedAt: document.getElementById("goldUpdatedAt"),
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
  if (!element) {
    return;
  }

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
  if (!elements.refreshButton) {
    return;
  }

  elements.refreshButton.disabled = isLoading;
  elements.refreshButton.classList.toggle("is-loading", isLoading);
}

function showChange(element, percentage) {
  if (!element) {
    return;
  }

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

async function getCryptoPrices() {
  const response = await fetch(CRYPTO_URL);

  if (!response.ok) {
    throw new Error(`CoinGecko error: ${response.status}`);
  }

  const data = await response.json();

  console.log("CoinGecko:", data);

  const bitcoin = Number(data?.bitcoin?.usd);
  const ethereum = Number(data?.ethereum?.usd);
  const dogecoin = Number(data?.dogecoin?.usd);

  if (
    !Number.isFinite(bitcoin) ||
    !Number.isFinite(ethereum) ||
    !Number.isFinite(dogecoin)
  ) {
    throw new Error("CoinGecko returned invalid prices.");
  }

  return {
    bitcoin,
    ethereum,
    dogecoin,

    bitcoinChange: Number(data?.bitcoin?.usd_24h_change),
    ethereumChange: Number(data?.ethereum?.usd_24h_change),
    dogecoinChange: Number(data?.dogecoin?.usd_24h_change)
  };
}

async function getUsdToman() {
  const response = await fetch(FIAT_URL);

  if (!response.ok) {
    throw new Error(`USD/Toman source error: ${response.status}`);
  }

  const data = await response.json();

  console.log("Iran fiat:", data);

  const usdToman = Number(
    data?.usd?.sell ??
    data?.usd?.value ??
    data?.usd?.price ??
    data?.usd
  );

  if (
    !Number.isFinite(usdToman) ||
    usdToman < 10000 ||
    usdToman > 1000000
  ) {
    throw new Error("USD/Toman value is missing or suspicious.");
  }

  return usdToman;
}

async function getGoldPrice() {
  const response = await fetch(GOLD_URL);

  if (!response.ok) {
    throw new Error(`Gold API error: ${response.status}`);
  }

  const data = await response.json();

  console.log("Gold API:", data);

  const goldOunceUsd = Number(
    data?.prices?.[0]?.price ??
    data?.symbols?.[0]?.price ??
    data?.price
  );

  if (!Number.isFinite(goldOunceUsd) || goldOunceUsd <= 0) {
    throw new Error("Gold price was not found.");
  }

  return goldOunceUsd;
}

function renderCrypto(crypto) {
  setText(elements.bitcoinPrice, formatUsd(crypto.bitcoin, 2));
  setText(elements.ethereumPrice, formatUsd(crypto.ethereum, 2));
  setText(elements.dogecoinPrice, formatUsd(crypto.dogecoin, 5));

  showChange(elements.bitcoinChange, crypto.bitcoinChange);
  showChange(elements.ethereumChange, crypto.ethereumChange);
  showChange(elements.dogecoinChange, crypto.dogecoinChange);
}

function renderGoldAndIranRates(usdToman, goldOunceUsd) {
  const usdRial = usdToman * 10;

  const gold18PerGramRial =
    (goldOunceUsd / TROY_OUNCE_TO_GRAMS) *
    GOLD_18K_PURITY *
    usdRial;

  const gold18PerGramToman = gold18PerGramRial / 10;

  setText(elements.goldOuncePrice, formatUsd(goldOunceUsd, 2));

  setText(elements.usdIrrPrice, formatRial(usdRial));
  setText(elements.usdIrrToman, formatToman(usdToman));

  setText(elements.gold18Price, formatRial(gold18PerGramRial));
  setText(elements.gold18Toman, formatToman(gold18PerGramToman));

  setText(elements.formulaGoldOunce, formatUsd(goldOunceUsd, 2));
  setText(elements.formulaUsdIrr, formatNumber(usdRial));
  setText(elements.formulaGold18, formatRial(gold18PerGramRial));

  setText(elements.goldUpdatedAt, "Live API");
}

function updateLastUpdated() {
  if (!elements.lastUpdated) {
    return;
  }

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date());

  elements.lastUpdated.textContent = `Last update: ${formattedDate}`;
}

async function loadMarketData() {
  setLoading(true);
  setStatus("loading", "Updating prices...");

  try {
    const [crypto, usdToman, goldOunceUsd] = await Promise.all([
      getCryptoPrices(),
      getUsdToman(),
      getGoldPrice()
    ]);

    renderCrypto(crypto);
    renderGoldAndIranRates(usdToman, goldOunceUsd);
    updateLastUpdated();

    setStatus("", "Market updated");
  } catch (error) {
    console.error("Market loading error:", error);
    setStatus("error", "Could not load some prices");
  } finally {
    setLoading(false);
  }
}

if (elements.refreshButton) {
  elements.refreshButton.addEventListener("click", loadMarketData);
}

loadMarketData();

/*
  Refresh every 60 seconds.
*/
setInterval(loadMarketData, 60 * 1000);
