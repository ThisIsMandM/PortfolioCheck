const CRYPTO_URL =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=bitcoin,ethereum,dogecoin" +
  "&vs_currencies=usd" +
  "&include_24hr_change=true";

const FIAT_URL =
  "https://raw.githubusercontent.com/HosseinOdd/Navasan-API/main/data/fiat.json";

const GOLD_IRAN_URL =
  "https://raw.githubusercontent.com/HosseinOdd/Navasan-API/main/data/gold.json";

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

function parseNumber(value) {
  if (value === null || value === undefined) {
    return NaN;
  }

  /*
    Handles values such as:
    "1,234,567"
    "1٬234٬567"
    "1,234,567 تومان"
  */
  return Number(String(value).replace(/[^\d.-]/g, ""));
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
    throw new Error(`Iran currency source error: ${response.status}`);
  }

  const data = await response.json();

  console.log("Iran fiat full response:", data);

  const rawUsdValue =
    data?.usd?.sell ??
    data?.usd?.value ??
    data?.usd?.price ??
    data?.usd;

  const usdToman = parseNumber(rawUsdValue);

  console.log("USD raw value:", rawUsdValue);
  console.log("USD parsed toman:", usdToman);

  if (
    !Number.isFinite(usdToman) ||
    usdToman < 10000 ||
    usdToman > 1000000
  ) {
    throw new Error(`USD/Toman invalid. Raw value: ${rawUsdValue}`);
  }

  return usdToman;
}

async function getIran18KGoldToman() {
  const response = await fetch(GOLD_IRAN_URL);

  if (!response.ok) {
    throw new Error(`Iran gold source error: ${response.status}`);
  }

  const data = await response.json();

  console.log("Iran gold full response:", data);

  /*
    This source calls 18K gold:
    bub_18ayar
  */
  const gold18Data = data?.bub_18ayar;

  console.log("18K gold object:", gold18Data);

  const rawGold18Value =
    gold18Data?.value ??
    gold18Data?.price ??
    gold18Data?.sell ??
    gold18Data?.buy ??
    gold18Data;

  const gold18Toman = parseNumber(rawGold18Value);

  console.log("18K gold raw value:", rawGold18Value);
  console.log("18K gold parsed toman:", gold18Toman);

  if (
    !Number.isFinite(gold18Toman) ||
    gold18Toman < 100000 ||
    gold18Toman > 100000000
  ) {
    throw new Error(`18K gold invalid. Raw value: ${rawGold18Value}`);
  }

  return gold18Toman;
}

function renderCrypto(crypto) {
  setText(elements.bitcoinPrice, formatUsd(crypto.bitcoin, 2));
  setText(elements.ethereumPrice, formatUsd(crypto.ethereum, 2));
  setText(elements.dogecoinPrice, formatUsd(crypto.dogecoin, 5));

  showChange(elements.bitcoinChange, crypto.bitcoinChange);
  showChange(elements.ethereumChange, crypto.ethereumChange);
  showChange(elements.dogecoinChange, crypto.dogecoinChange);
}

function renderIranPrices(usdToman, gold18Toman) {
  const usdRial = usdToman * 10;
  const gold18Rial = gold18Toman * 10;

  setText(elements.usdIrrPrice, formatRial(usdRial));
  setText(elements.usdIrrToman, formatToman(usdToman));

  setText(elements.gold18Price, formatRial(gold18Rial));
  setText(elements.gold18Toman, formatToman(gold18Toman));

  /*
    This free source does not include
    international gold ounce in USD.
  */
  setText(elements.goldOuncePrice, "Unavailable");
  setText(elements.goldUpdatedAt, "Iran market JSON");

  setText(elements.formulaGoldOunce, "—");
  setText(elements.formulaUsdIrr, formatNumber(usdRial));
  setText(elements.formulaGold18, formatRial(gold18Rial));
}

function updateLastUpdated() {
  if (!elements.lastUpdated) {
    return;
  }

  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date());

  elements.lastUpdated.textContent = `Last update: ${date}`;
}

async function loadMarketData() {
  setLoading(true);
  setStatus("loading", "Updating prices...");

  try {
    const results = await Promise.allSettled([
      getCryptoPrices(),
      getUsdToman(),
      getIran18KGoldToman()
    ]);

    const cryptoResult = results[0];
    const usdResult = results[1];
    const goldResult = results[2];

    if (cryptoResult.status === "fulfilled") {
      renderCrypto(cryptoResult.value);
    } else {
      console.error("Crypto failed:", cryptoResult.reason);
    }

    if (
      usdResult.status === "fulfilled" &&
      goldResult.status === "fulfilled"
    ) {
      renderIranPrices(
        usdResult.value,
        goldResult.value
      );
    } else {
      if (usdResult.status === "rejected") {
        console.error("USD/Toman failed:", usdResult.reason);
      }

      if (goldResult.status === "rejected") {
        console.error("18K gold failed:", goldResult.reason);
      }
    }

    updateLastUpdated();

    const allSuccessful = results.every(
      (result) => result.status === "fulfilled"
    );

    setStatus(
      allSuccessful ? "" : "error",
      allSuccessful
        ? "Market updated"
        : "Some prices could not load"
    );
  } catch (error) {
    console.error("Market loading error:", error);
    setStatus("error", "Could not load market data");
  } finally {
    setLoading(false);
  }
}

if (elements.refreshButton) {
  elements.refreshButton.addEventListener("click", loadMarketData);
}

loadMarketData();

setInterval(loadMarketData, 60 * 1000);
