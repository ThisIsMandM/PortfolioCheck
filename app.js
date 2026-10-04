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

function formatIrr(value) {
  return `${formatNumber(value)} ریال`;
}

function formatToman(valueInRials) {
  return `${formatNumber(valueInRials / 10)} تومان`;
}

function removeSkeleton(element) {
  element.classList.remove("skeleton");
}

function setStatus(type, text) {
  elements.statusDot.className = `status-dot ${type}`;
  elements.statusText.textContent = text;
}

function setLoading(isLoading) {
  elements.refreshButton.disabled = isLoading;
  elements.refreshButton.classList.toggle("is-loading", isLoading);

  if (isLoading) {
    setStatus("loading", "Updating market prices...");
  }
}

function updateChangeBadge(element) {
  element.textContent = "Live";
  element.className = "change-badge positive";
}

async function getAssetPrice(symbol) {
  const response = await fetch(
    `${CONFIG.GOLD_API_BASE_URL}/price/${encodeURIComponent(symbol)}`
  );

  if (!response.ok) {
    throw new Error(`${symbol} request failed: ${response.status}`);
  }

  const data = await response.json();

  const price = Number(
    data?.price ??
    data?.data?.price ??
    data?.rate ??
    data?.value
  );

  if (!Number.isFinite(price)) {
    console.log(`${symbol} API response:`, data);
    throw new Error(`Could not read a valid price for ${symbol}`);
  }

  return price;
}

function renderCrypto({ bitcoin, ethereum, dogecoin }) {
  elements.bitcoinPrice.textContent = formatUsd(bitcoin, 2);
  elements.ethereumPrice.textContent = formatUsd(ethereum, 2);
  elements.dogecoinPrice.textContent = formatUsd(dogecoin, 5);

  removeSkeleton(elements.bitcoinPrice);
  removeSkeleton(elements.ethereumPrice);
  removeSkeleton(elements.dogecoinPrice);

  updateChangeBadge(elements.bitcoinChange);
  updateChangeBadge(elements.ethereumChange);
  updateChangeBadge(elements.dogecoinChange);
}

function renderGold(goldOunceUsd) {
  elements.goldOuncePrice.textContent = formatUsd(goldOunceUsd, 2);
  elements.formulaGoldOunce.textContent = formatUsd(goldOunceUsd, 2);

  removeSkeleton(elements.goldOuncePrice);

  elements.goldUpdatedAt.textContent = "Live API";
}

function setIrrNotConnected() {
  elements.usdIrrPrice.textContent = "Add USD/IRR source";
  elements.usdIrrToman.textContent = "Bon-bast or another source";

  elements.gold18Price.textContent = "Waiting for USD/IRR";
  elements.gold18Toman.textContent = "—";

  elements.formulaUsdIrr.textContent = "—";
  elements.formulaGold18.textContent = "—";

  removeSkeleton(elements.usdIrrPrice);
  removeSkeleton(elements.gold18Price);
}

function renderLastUpdated() {
  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date());

  elements.lastUpdated.textContent = `Last update: ${formatted}`;
}

async function loadMarketData() {
  setLoading(true);

  try {
    const [goldResult, bitcoinResult, ethereumResult, dogecoinResult] =
      await Promise.all([
        getAssetPrice("XAU"),
        getAssetPrice("BTC"),
        getAssetPrice("ETH"),
        getAssetPrice("DOGE")
      ]);

    renderGold(goldResult);

    renderCrypto({
      bitcoin: bitcoinResult,
      ethereum: ethereumResult,
      dogecoin: dogecoinResult
    });

    /*
      USD/IRR and 18K gold calculation come in Step 2,
      after you choose an Iranian-rial-rate source.
    */
    setIrrNotConnected();

    renderLastUpdated();
    setStatus("", "Gold and crypto updated");
  } catch (error) {
    console.error(error);
    setStatus("error", "Could not load market prices");
    elements.lastUpdated.textContent =
      "Update failed — open browser console to see the API error.";
  } finally {
    setLoading(false);
  }
}

elements.refreshButton.addEventListener("click", loadMarketData);

loadMarketData();

setInterval(() => {
  loadMarketData();
}, CONFIG.REFRESH_INTERVAL_MS);
