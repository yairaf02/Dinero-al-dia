import {
  convertFromUsd,
  fetchBcvRates,
  formatCurrency,
  getCurrencyLabel,
  getExchangeRates,
  getRateMetadata
} from "./currency.js";

const STORAGE_KEY = "dinero-al-dia-transactions";
const state = {
  transactions: loadTransactions(),
  period: "all"
};

const elements = {
  form: document.querySelector("#transaction-form"),
  type: document.querySelector("#transaction-type"),
  description: document.querySelector("#transaction-description"),
  amount: document.querySelector("#transaction-amount"),
  date: document.querySelector("#transaction-date"),
  message: document.querySelector("#form-message"),
  period: document.querySelector("#period-filter"),
  balance: document.querySelector("#balance-value"),
  income: document.querySelector("#income-value"),
  expense: document.querySelector("#expense-value"),
  conversions: document.querySelector("#conversion-list"),
  rateStatus: document.querySelector("#rate-status"),
  list: document.querySelector("#transaction-list"),
  empty: document.querySelector("#empty-state"),
  count: document.querySelector("#transaction-count")
};

elements.date.value = new Date().toISOString().slice(0, 10);
elements.form.addEventListener("submit", handleSubmit);
elements.period.addEventListener("change", () => {
  state.period = elements.period.value;
  render();
  fetchBcvRates()
    .then(() => render())
    .catch(() => renderRateStatus());
});
render();

function handleSubmit(event) {
  event.preventDefault();
  const amount = Number(elements.amount.value);
  const description = elements.description.value.trim();
  const date = elements.date.value;

  if (!description || !date || !Number.isFinite(amount) || amount <= 0) {
    showMessage("Completa todos los campos con un monto mayor que cero.", true);
    return;
  }

  state.transactions.push({
    id: crypto.randomUUID(),
    type: elements.type.value,
    description,
    amount: Math.round(amount * 100) / 100,
    date
  });
  saveTransactions();
  elements.form.reset();
  elements.date.value = new Date().toISOString().slice(0, 10);
  showMessage("Movimiento guardado.");
  render();
}

function loadTransactions() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter(isValidTransaction) : [];
  } catch {
    return [];
  }
}

function isValidTransaction(transaction) {
  return transaction
    && (transaction.type === "income" || transaction.type === "expense")
    && typeof transaction.description === "string"
    && Number.isFinite(transaction.amount)
    && transaction.amount > 0
    && typeof transaction.date === "string";
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
}

function getVisibleTransactions() {
  if (state.period === "all") {
    return state.transactions;
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  return state.transactions.filter((transaction) => transaction.date.startsWith(currentMonth));
}

function render() {
  const transactions = getVisibleTransactions();
  const income = sumByType(transactions, "income");
  const expense = sumByType(transactions, "expense");
  const balance = income - expense;

  elements.balance.textContent = formatCurrency(balance);
  elements.income.textContent = formatCurrency(income);
  elements.expense.textContent = formatCurrency(expense);
  renderConversions(balance);
  renderTransactions(transactions);
}

function sumByType(transactions, type) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function renderConversions(balance) {
  elements.conversions.replaceChildren();
  const exchangeRates = getExchangeRates();
  for (const currency of ["VES", "EUR"]) {
    const converted = convertFromUsd(balance, currency);
    if (converted === null) {
      continue;
    }
    const item = document.createElement("span");
    item.textContent = `${getCurrencyLabel(currency)}: ${formatCurrency(converted, currency)}`;
    elements.conversions.append(item);
  }
  if (Object.keys(exchangeRates).length < 3) {
    const note = document.createElement("small");
    note.textContent = "Algunas tasas no están disponibles.";
    elements.conversions.append(note);
  }
  renderRateStatus();
}

function renderRateStatus() {
  const metadata = getRateMetadata();
  const dateText = metadata.date ? ` · Fecha: ${metadata.date}` : "";
  elements.rateStatus.textContent = `${metadata.source}${dateText}`;
  elements.rateStatus.className = metadata.isLive
    ? "rate-status"
    : "rate-status rate-status--fallback";
}

function renderTransactions(transactions) {
  const ordered = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  elements.list.replaceChildren();
  elements.empty.hidden = ordered.length > 0;
  elements.count.textContent = `${ordered.length} ${ordered.length === 1 ? "movimiento" : "movimientos"}`;

  for (const transaction of ordered) {
    const item = document.createElement("li");
    item.className = `transaction transaction--${transaction.type}`;
    const sign = transaction.type === "income" ? "+" : "−";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(transaction.description)}</strong>
        <time datetime="${transaction.date}">${formatDate(transaction.date)}</time>
      </div>
      <span class="transaction-amount transaction-amount--${transaction.type}">
        ${sign}${formatCurrency(transaction.amount)}
      </span>
    `;
    elements.list.append(item);
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

function showMessage(message, isError = false) {
  elements.message.textContent = message;
  elements.message.className = `form-message${isError ? " form-message--error" : ""}`;
}
