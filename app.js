const CRYPTO_URL =
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

function setLoadingText() {
  goldPriceElement.textContent = "Gold source needed";
  bitcoinPriceElement.textContent = "Loading...";
  ethereumPriceElement.textContent = "Loading...";
  dogecoinPriceElement.textContent = "Loading...";
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

  setLoadingText();

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
