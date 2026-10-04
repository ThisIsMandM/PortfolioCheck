const CRYPTO_URL =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=bitcoin,ethereum,dogecoin" +
  "&vs_currencies=usd" +
  "&include_24hr_change=true";

const elements = {
  bitcoinPrice: document.getElementById("bitcoinPrice"),
  ethereumPrice: document.getElementById("ethereumPrice"),
  dogecoinPrice: document.getElementById("dogecoinPrice"),

  bitcoinChange: document.getElementById("bitcoinChange"),
  ethereumChange: document.getElementById("ethereumChange"),
  dogecoinChange: document.getElementById("dogecoinChange"),

  refreshButton: document.getElementById("refreshButton"),

  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),

  lastUpdated: document.getElementById("lastUpdated")
};

function formatUsd(value, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals
  }).format(value);
}

function removeSkeleton(element) {
  if (element) {
    element.classList.remove("skeleton");
  }
}

function setStatus(type, message) {
  if (elements.statusDot) {
    elements.statusDot.className = `status-dot ${type}`;
  }

  if (elements.statusText) {
    elements.statusText.textContent = message;
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

  const isPositive = change >= 0;
  const sign = isPositive ? "+" : "";

  element.textContent = `${sign}${change.toFixed(2)}%`;

  element.className = isPositive
    ? "change-badge positive"
    : "change-badge negative";
}

async function getCryptoPrices() {
  const response = await fetch(CRYPTO_URL);

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  const data = await response.json();

  console.log("CoinGecko response:", data);

  const bitcoin = Number(data?.bitcoin?.usd);
  const ethereum = Number(data?.ethereum?.usd);
  const dogecoin = Number(data?.dogecoin?.usd);

  const bitcoinChange = Number(data?.bitcoin?.usd_24h_change);
  const ethereumChange = Number(data?.ethereum?.usd_24h_change);
  const dogecoinChange = Number(data?.dogecoin?.usd_24h_change);

  if (
    !Number.isFinite(bitcoin) ||
    !Number.isFinite(ethereum) ||
    !Number.isFinite(dogecoin)
  ) {
    throw new Error("CoinGecko returned an unexpected price format.");
  }

  return {
    bitcoin,
    ethereum,
    dogecoin,
    bitcoinChange,
    ethereumChange,
    dogecoinChange
  };
}

function renderCrypto(crypto) {
  /*
    These console logs tell you whether the HTML elements were found.
    They should NOT be null.
  */
  console.log("Frontend elements found:", {
    bitcoinPrice: elements.bitcoinPrice,
    ethereumPrice: elements.ethereumPrice,
    dogecoinPrice: elements.dogecoinPrice
  });

  if (
    !elements.bitcoinPrice ||
    !elements.ethereumPrice ||
    !elements.dogecoinPrice
  ) {
    throw new Error(
      "HTML IDs are missing. Add bitcoinPrice, ethereumPrice, and dogecoinPrice to index.html."
    );
  }

  elements.bitcoinPrice.textContent = formatUsd(crypto.bitcoin, 2);
  elements.ethereumPrice.textContent = formatUsd(crypto.ethereum, 2);
  elements.dogecoinPrice.textContent = formatUsd(crypto.dogecoin, 5);

  removeSkeleton(elements.bitcoinPrice);
  removeSkeleton(elements.ethereumPrice);
  removeSkeleton(elements.dogecoinPrice);

  showChange(elements.bitcoinChange, crypto.bitcoinChange);
  showChange(elements.ethereumChange, crypto.ethereumChange);
  showChange(elements.dogecoinChange, crypto.dogecoinChange);
}

function updateLastUpdated() {
  if (!elements.lastUpdated) {
    return;
  }

  const time = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date());

  elements.lastUpdated.textContent = `Last update: ${time}`;
}

async function loadCryptoPrices() {
  if (elements.refreshButton) {
    elements.refreshButton.disabled = true;
    elements.refreshButton.classList.add("is-loading");
  }

  setStatus("loading", "Updating crypto prices...");

  try {
    const crypto = await getCryptoPrices();

    renderCrypto(crypto);
    updateLastUpdated();

    setStatus("", "Crypto market updated");
  } catch (error) {
    console.error("Crypto loading error:", error);

    setStatus("error", "Could not show crypto prices");

    if (elements.bitcoinPrice) {
      elements.bitcoinPrice.textContent = "Error";
    }

    if (elements.ethereumPrice) {
      elements.ethereumPrice.textContent = "Error";
    }

    if (elements.dogecoinPrice) {
      elements.dogecoinPrice.textContent = "Error";
    }
  } finally {
    if (elements.refreshButton) {
      elements.refreshButton.disabled = false;
      elements.refreshButton.classList.remove("is-loading");
    }
  }
}

if (elements.refreshButton) {
  elements.refreshButton.addEventListener("click", loadCryptoPrices);
}

loadCryptoPrices();

setInterval(loadCryptoPrices, 60 * 1000);const CRYPTO_URL =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=bitcoin,ethereum,dogecoin" +
  "&vs_currencies=usd" +
  "&include_24hr_change=true";

const goldPriceElement = document.getElementById("goldPrice");
const bitcoinPriceElement = document.getElementById("bitcoinPrice");
const ethereumPriceElement = document.getElementById("ethereumPrice");
const dogecoinPriceElement = document.getElementById("dogecoinPrice");
const refreshButton = document.getElementById("refreshButton");

function formatUsd(price, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals
  }).format(price);
}

async function getCryptoPrices() {
  const response = await fetch(CRYPTO_URL);

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  const data = await response.json();

  console.log("CoinGecko response:", data);

  const bitcoin = Number(data?.bitcoin?.usd);
  const ethereum = Number(data?.ethereum?.usd);
  const dogecoin = Number(data?.dogecoin?.usd);

  if (
    !Number.isFinite(bitcoin) ||
    !Number.isFinite(ethereum) ||
    !Number.isFinite(dogecoin)
  ) {
    throw new Error("CoinGecko returned an unexpected price format.");
  }

  return {
    bitcoin,
    ethereum,
    dogecoin
  };
}

async function loadPrices() {
  refreshButton.disabled = true;
  refreshButton.textContent = "Loading...";

  bitcoinPriceElement.textContent = "Loading...";
  ethereumPriceElement.textContent = "Loading...";
  dogecoinPriceElement.textContent = "Loading...";

  if (goldPriceElement) {
    goldPriceElement.textContent = "Gold source needed";
  }

  try {
    const crypto = await getCryptoPrices();

    bitcoinPriceElement.textContent = formatUsd(crypto.bitcoin, 2);
    ethereumPriceElement.textContent = formatUsd(crypto.ethereum, 2);
    dogecoinPriceElement.textContent = formatUsd(crypto.dogecoin, 5);
  } catch (error) {
    console.error("Crypto loading error:", error);

    bitcoinPriceElement.textContent = "Could not load";
    ethereumPriceElement.textContent = "Could not load";
    dogecoinPriceElement.textContent = "Could not load";
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "Refresh prices";
  }
}

refreshButton.addEventListener("click", loadPrices);

loadPrices();

setInterval(loadPrices, 60 * 1000);
