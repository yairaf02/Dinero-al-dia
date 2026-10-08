const CURRENCY_CONFIG = Object.freeze({
  USD: { locale: "en-US", symbol: "US$", label: "Dólares" },
  VES: { locale: "es-VE", symbol: "Bs.", label: "Bolívares" },
  EUR: { locale: "de-DE", symbol: "€", label: "Euros" }
});

const BCV_RATE_URL = "https://bcv.today/api/v1/rate.json";
const RATES_STORAGE_KEY = "dinero-al-dia-bcv-rates";
const fallbackRates = Object.freeze({
  USD: 1,
  VES: 36.5,
  EUR: 0.92
});

let exchangeRates = { ...fallbackRates };
let rateMetadata = {
  date: null,
  isLive: false,
  source: "Tasa de respaldo manual"
};

restoreSavedRates();

export function getExchangeRates() {
  return { ...exchangeRates };
}

export function getRateMetadata() {
  return { ...rateMetadata };
}

export async function fetchBcvRates() {
  const response = await fetch(BCV_RATE_URL, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`BCV request failed with status ${response.status}`);
  }

  const data = await response.json();
  const vesPerUsd = Number(data.USD);
  const vesPerEur = Number(data.EUR);
  if (!Number.isFinite(vesPerUsd) || vesPerUsd <= 0
    || !Number.isFinite(vesPerEur) || vesPerEur <= 0) {
    throw new Error("BCV response does not contain valid rates");
  }

  exchangeRates = {
    USD: 1,
    VES: vesPerUsd,
    EUR: vesPerUsd / vesPerEur
  };
  rateMetadata = {
    date: typeof data.effective_date === "string" ? data.effective_date : data.date,
    isLive: true,
    source: "Tasa referencial basada en BCV"
  };
  saveRates();
  return getExchangeRates();
}

export function formatCurrency(amount, currency = "USD") {
  const config = CURRENCY_CONFIG[currency];
  if (!config || !Number.isFinite(amount)) {
    return "";
  }

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace(/US\$/, config.symbol);
}

export function convertFromUsd(amount, currency) {
  const rate = exchangeRates[currency];
  if (!Number.isFinite(amount) || !Number.isFinite(rate) || rate <= 0) {
    return null;
  }
  return amount * rate;
}

export function getCurrencyLabel(currency) {
  return CURRENCY_CONFIG[currency]?.label ?? currency;
}

function restoreSavedRates() {
  try {
    const saved = JSON.parse(localStorage.getItem(RATES_STORAGE_KEY) ?? "null");
    if (!saved || !isValidSavedRates(saved.rates)) {
      return;
    }
    exchangeRates = saved.rates;
    rateMetadata = {
      date: typeof saved.date === "string" ? saved.date : null,
      isLive: true,
      source: "Última tasa válida basada en BCV"
    };
  } catch {
    rateMetadata = {
      date: null,
      isLive: false,
      source: "Tasa de respaldo manual"
    };
  }
}

function isValidSavedRates(rates) {
  return rates
    && Number.isFinite(rates.USD)
    && Number.isFinite(rates.VES)
    && rates.VES > 0
    && Number.isFinite(rates.EUR)
    && rates.EUR > 0;
}

function saveRates() {
  localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify({
    rates: exchangeRates,
    date: rateMetadata.date
  }));
}
