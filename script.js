import {
  convertFromUsd,
  fetchBcvRates,
  formatCurrency,
  getCurrencyLabel,
  getExchangeRates,
  getRateMetadata
} from "./currency.js";
import { supabaseClient } from "./supabase-client.js";

const state = {
  transactions: [],
  period: "all",
  user: null,
  authInitialized: false,
  loadGeneration: 0
};

const elements = {
  accountTitle: document.querySelector("#account-title"),
  authForms: document.querySelector("#auth-forms"),
  authMessage: document.querySelector("#auth-message"),
  signInForm: document.querySelector("#sign-in-form"),
  signUpForm: document.querySelector("#sign-up-form"),
  sessionPanel: document.querySelector("#session-panel"),
  sessionEmail: document.querySelector("#session-email"),
  signOutButton: document.querySelector("#sign-out-button"),
  accountStatus: document.querySelector("#account-status"),
  accountContent: document.querySelector("#account-content"),
  retryLoadButton: document.querySelector("#retry-load-button"),
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
elements.signInForm.addEventListener("submit", handleSignIn);
elements.signUpForm.addEventListener("submit", handleSignUp);
elements.signOutButton.addEventListener("click", handleSignOut);
elements.retryLoadButton.addEventListener("click", () => {
  if (state.user) {
    void loadUserTransactions(state.user.id);
  }
});
elements.period.addEventListener("change", () => {
  state.period = elements.period.value;
  render();
});
if (supabaseClient) {
  setAuthMessage("Verificando tu sesión...");
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    void applyAuthSession(session);
  });
} else {
  setAuthMessage("Configura la URL y la clave pública de Supabase para activar tu cuenta.", true);
  elements.authForms.querySelectorAll("input, button").forEach((control) => {
    control.disabled = true;
  });
}

fetchBcvRates()
  .then(() => {
    if (state.user && !elements.accountContent.hidden) {
      render();
    } else {
      renderRateStatus();
    }
  })
  .catch(() => renderRateStatus());

async function handleSubmit(event) {
  event.preventDefault();
  const amount = Number(elements.amount.value);
  const description = elements.description.value.trim();
  const date = elements.date.value;
  const type = elements.type.value;

  if (!state.user) {
    showMessage("Inicia sesión para guardar tus movimientos.", true);
    return;
  }
  if (!description || !date || !["income", "expense"].includes(type)
    || !Number.isFinite(amount) || amount <= 0) {
    showMessage("Completa todos los campos con un monto mayor que cero.", true);
    return;
  }

  const userId = state.user.id;
  const submitButton = elements.form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const { data, error } = await supabaseClient
      .from("transactions")
      .insert({
        user_id: userId,
        type,
        description,
        amount: Math.round(amount * 100) / 100,
        date
      })
      .select("id, type, description, amount, date")
      .single();

    if (error) {
      showMessage("No se pudo guardar el movimiento. Inténtalo de nuevo.", true);
      return;
    }
    if (state.user?.id !== userId) {
      return;
    }

    state.transactions.push(normalizeTransaction(data));
    elements.form.reset();
    elements.date.value = new Date().toISOString().slice(0, 10);
    showMessage("Movimiento guardado.");
    render();
  } catch {
    showMessage("No se pudo guardar el movimiento. Inténtalo de nuevo.", true);
  } finally {
    submitButton.disabled = false;
  }
}

async function handleSignIn(event) {
  event.preventDefault();
  const formData = new FormData(elements.signInForm);
  await authenticate(
    () => supabaseClient.auth.signInWithPassword({
      email: formData.get("email"),
      password: formData.get("password")
    }),
    "No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo."
  );
}

async function handleSignUp(event) {
  event.preventDefault();
  const formData = new FormData(elements.signUpForm);
  const email = formData.get("email");
  await authenticate(
    () => supabaseClient.auth.signUp({
      email,
      password: formData.get("password"),
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`
      }
    }),
    "No se pudo crear la cuenta. Verifica los datos e inténtalo de nuevo.",
    (data) => {
      elements.signUpForm.reset();
      if (!data.session) {
        setAuthMessage("Cuenta creada. Revisa tu correo para confirmar la dirección antes de iniciar sesión.");
      } else {
        setAuthMessage("Cuenta creada correctamente.");
      }
    }
  );
}

async function authenticate(operation, errorMessage, onSuccess = null) {
  setAuthBusy(true);
  setAuthMessage("Conectando con tu cuenta...");
  try {
    const { data, error } = await operation();
    if (error) {
      setAuthMessage(errorMessage, true);
      return;
    }
    if (onSuccess) {
      onSuccess(data);
    } else {
      elements.signInForm.reset();
      setAuthMessage("Sesión iniciada.");
    }
  } catch {
    setAuthMessage(errorMessage, true);
  } finally {
    setAuthBusy(false);
  }
}

async function handleSignOut() {
  elements.signOutButton.disabled = true;
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      setAuthMessage("No se pudo cerrar la sesión. Inténtalo de nuevo.", true);
      return;
    }
    setAuthMessage("Sesión cerrada.");
  } catch {
    setAuthMessage("No se pudo cerrar la sesión. Inténtalo de nuevo.", true);
  } finally {
    elements.signOutButton.disabled = false;
  }
}

async function applyAuthSession(session) {
  const user = session?.user ?? null;
  if (state.authInitialized && state.user?.id === user?.id) {
    return;
  }

  state.authInitialized = true;
  state.loadGeneration += 1;
  state.user = user;
  state.transactions = [];
  render();
  elements.form.reset();
  elements.date.value = new Date().toISOString().slice(0, 10);
  elements.message.textContent = "";
  elements.accountContent.hidden = true;
  elements.retryLoadButton.hidden = true;
  elements.accountStatus.hidden = true;
  elements.authForms.hidden = Boolean(user);
  elements.sessionPanel.hidden = !user;

  if (!user) {
    elements.accountTitle.textContent = "Accede a tus finanzas";
    elements.sessionEmail.textContent = "";
    setAuthMessage("Inicia sesión o crea una cuenta para consultar tus movimientos.");
    return;
  }

  elements.accountTitle.textContent = "Tu cuenta";
  elements.sessionEmail.textContent = user.email ?? "Sesión activa";
  setAuthMessage("Cuenta conectada.");
  await loadUserTransactions(user.id);
}

async function loadUserTransactions(userId) {
  const generation = ++state.loadGeneration;
  elements.accountContent.hidden = true;
  elements.retryLoadButton.hidden = true;
  elements.accountStatus.hidden = false;
  elements.accountStatus.className = "form-message";
  elements.accountStatus.textContent = "Cargando tus movimientos...";

  try {
    const { data, error } = await supabaseClient
      .from("transactions")
      .select("id, type, description, amount, date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    if (generation !== state.loadGeneration || state.user?.id !== userId) {
      return;
    }

    state.transactions = data.map(normalizeTransaction).filter(isValidTransaction);
    elements.accountStatus.hidden = true;
    elements.accountContent.hidden = false;
    render();
  } catch {
    if (generation !== state.loadGeneration || state.user?.id !== userId) {
      return;
    }
    state.transactions = [];
    elements.accountStatus.className = "form-message form-message--error";
    elements.accountStatus.textContent = "No se pudieron cargar tus movimientos. Comprueba la conexión y vuelve a intentarlo.";
    elements.retryLoadButton.hidden = false;
  }
}

function normalizeTransaction(transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    description: transaction.description,
    amount: Number(transaction.amount),
    date: transaction.date
  };
}

function isValidTransaction(transaction) {
  return transaction
    && typeof transaction.id === "string"
    && (transaction.type === "income" || transaction.type === "expense")
    && typeof transaction.description === "string"
    && transaction.description.trim().length > 0
    && Number.isFinite(transaction.amount)
    && transaction.amount > 0
    && typeof transaction.date === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(transaction.date);
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
    .reduce((totalCents, transaction) => totalCents + Math.round(transaction.amount * 100), 0)
    / 100;
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
    const amounts = ["USD", "VES", "EUR"].map((currency) => {
      const amount = currency === "USD"
        ? transaction.amount
        : convertFromUsd(transaction.amount, currency);
      const label = getCurrencyLabel(currency);
      if (amount === null) {
        return `<span class="transaction-conversion transaction-conversion--unavailable">${label}: conversión no disponible</span>`;
      }

      const amountClass = currency === "USD"
        ? `transaction-amount transaction-amount--${transaction.type}`
        : "transaction-conversion";
      return `<span class="${amountClass}">${label}: ${sign}${formatCurrency(amount, currency)}</span>`;
    }).join("");

    item.innerHTML = `
      <div>
        <strong>${escapeHtml(transaction.description)}</strong>
        <time datetime="${transaction.date}">${formatDate(transaction.date)}</time>
      </div>
      <div class="transaction-amounts">${amounts}</div>
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

function setAuthMessage(message, isError = false) {
  elements.authMessage.textContent = message;
  elements.authMessage.className = `form-message${isError ? " form-message--error" : ""}`;
}

function setAuthBusy(isBusy) {
  elements.authForms.querySelectorAll('button[type="submit"]').forEach((button) => {
    button.disabled = isBusy;
  });
}
