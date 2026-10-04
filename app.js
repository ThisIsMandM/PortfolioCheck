const CRYPTO_URL =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=bitcoin,ethereum,dogecoin" +
  "&vs_currencies=usd" +
  "&include_24hr_change=true";

/*
  Free USD/Toman JSON feed.
  Toman × 10 = Rial.
*/
const FIAT_URL =
  "https://raw.githubusercontent.com/HosseinOdd/Navasan-API/main/data/fiat.json";

/*
  TEMPORARY:
  Put current international gold price per troy ounce in USD here manually.
  Example: 3000 means $3,000 per ounce.

  Later we can replace this with a stable gold API/proxy.
*/
const GOLD_OUNCE_USD = 3000;

const TROY_OUNCE_TO_GRAMS = 31.1034768;
const GOLD_18K_PURITY = 0.75;

const elements = {
  bitcoinPrice: document.getElementById("bitcoinPrice"),
  ethereumPrice: document.getElementById("ethereumPrice"),
  dogecoinPrice: document.getElementById("dogecoinPrice"),

  bitcoinChange: document.getElementById("bitcoinChange"),
  ethereumChange: document.getElementById("ethereumChange"),
  dogecoinChange: document.getElementById("dogecoinChange"),

  usdIrrPrice: document.getElementById("usdIrrPrice"),
  usdIrrToman: document.getElementById("usdIrrToman"),

  goldOuncePrice: document.getElementById("goldOuncePrice"),
  gold18Price: document.getElementById("gold18Price"),
  gold18Toman: document.getElementById("gold18Toman"),

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

function removeSkeleton(element) {
  if (element) {
    element.classList.remove("skeleton");
  }
}

function setText(element, text) {
  if (element) {
    element.textContent = text;
    removeSkeleton(element);
  }
}

function setStatus(type, text) {
  if (elements.statusDot) {
    elements.statusDot.className = `status-dot ${type}`;
  }

  if (elements.statusText) {
    elements.statusText.textContent = text;
  }
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

  console.log("CoinGecko response:", data);

  return {
    bitcoin: Number(data?.bitcoin?.usd),
    ethereum: Number(data?.ethereum?.usd),
    dogecoin: Number(data?.dogecoin?.usd),

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

  console.log("Iran Fiat response:", data);

  /*
    Different versions of this community JSON may use:
    usd.sell
    usd.value
    usd.price
    usd
  */
  const usdToman = Number(
    data?.usd?.sell ??
    data?.usd?.value ??
    data?.usd?.price ??
    data?.usd
  );

  if (!Number.isFinite(usdToman) || usdToman <= 0) {
    throw new Error(
      "USD/Toman price not found. Open Console and check 'Iran Fiat response'."
    );
  }

  return usdToman;
}

function renderCrypto(crypto) {
  if (!Number.isFinite(crypto.bitcoin)) {
    throw new Error("Invalid Bitcoin price.");
  }

  setText(elements.bitcoinPrice, formatUsd(crypto.bitcoin, 2));
  setText(elements.ethereumPrice, formatUsd(crypto.ethereum, 2));
  setText(elements.dogecoinPrice, formatUsd(crypto.dogecoin, 5));

  showChange(elements.bitcoinChange, crypto.bitcoinChange);
  showChange(elements.ethereumChange, crypto.ethereumChange);
  showChange(elements.dogecoinChange, crypto.dogecoinChange);
}

function renderIranRates(usdToman) {
  const usdRial = usdToman * 10;

  /*
    18K gold per gram:
    Gold ounce USD ÷ 31.1034768 × 0.75 × USD/Rial
  */
  const gold18PerGramRial =
    (GOLD_OUNCE_USD / TROY_OUNCE_TO_GRAMS) *
    GOLD_18K_PURITY *
    usdRial;

  const gold18PerGramToman = gold18PerGramRial / 10;

  setText(elements.usdIrrPrice, formatRial(usdRial));
  setText(elements.usdIrrToman, formatToman(usdToman));

  setText(elements.goldOuncePrice, formatUsd(GOLD_OUNCE_USD, 2));
  setText(elements.gold18Price, formatRial(gold18PerGramRial));
  setText(elements.gold18Toman, formatToman(gold18PerGramToman));

  setText(elements.formulaGoldOunce, formatUsd(GOLD_OUNCE_USD, 2));
  setText(elements.formulaUsdIrr, formatNumber(usdRial));
  setText(elements.formulaGold18, formatRial(gold18PerGramRial));
}
