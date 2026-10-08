const APP_LOCALE = document.documentElement.dataset.locale || navigator.language || "en-US";
const APP_CURRENCY = document.documentElement.dataset.currency || "USD";
const EXPENSE_LABELS = {
  housing: "Housing",
  utilities: "Utilities",
  groceries: "Groceries",
  transport: "Transport",
  subscriptions: "Subscriptions",
  other: "Other spending",
};
const currency = new Intl.NumberFormat(APP_LOCALE, {
  style: "currency",
  currency: APP_CURRENCY,
  minimumFractionDigits: 2,
});
const DAYS_IN_MONTH = 30;

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
}

function calculateBudget(values) {
  const expenseEntries = Object.entries(values.expenses);
  const totalExpenses = expenseEntries.reduce((sum, [, amount]) => sum + amount, 0);
  const safeToSpend = values.income - values.savingsGoal - totalExpenses;
  const dailyLimit = Math.max(0, safeToSpend) / DAYS_IN_MONTH;

  return {
    totalExpenses,
    safeToSpend,
    dailyLimit,
    breakdown: expenseEntries,
  };
}

function render(result) {
  document.getElementById("total-expenses").textContent = currency.format(result.totalExpenses);
  document.getElementById("safe-to-spend").textContent = currency.format(result.safeToSpend);
  document.getElementById("daily-limit").textContent = currency.format(result.dailyLimit);

  const breakdown = document.getElementById("breakdown");
  breakdown.innerHTML = "";
  result.breakdown.forEach(([name, amount]) => {
    const item = document.createElement("li");
    item.textContent = `${EXPENSE_LABELS[name] || name}: ${currency.format(amount)}`;
    breakdown.appendChild(item);
  });
}

function readForm(form) {
  const fields = [
    "income",
    "savingsGoal",
    "housing",
    "utilities",
    "groceries",
    "transport",
    "subscriptions",
    "other",
  ];

  const values = Object.fromEntries(fields.map((field) => [field, toNumber(form.elements[field].value)]));
  const invalid = Object.values(values).some((value) => Number.isNaN(value));

  if (invalid) {
    throw new Error("Please enter valid non-negative numbers in all fields.");
  }

  return {
    income: values.income,
    savingsGoal: values.savingsGoal,
    expenses: {
      housing: values.housing,
      utilities: values.utilities,
      groceries: values.groceries,
      transport: values.transport,
      subscriptions: values.subscriptions,
      other: values.other,
    },
  };
}

const form = document.getElementById("budget-form");
const errorBox = document.getElementById("error");
const warningBox = document.getElementById("warning");

function runCalculation() {
  errorBox.textContent = "";
  warningBox.textContent = "";

  try {
    const values = readForm(form);
    const result = calculateBudget(values);
    render(result);

    if (result.safeToSpend < 0) {
      warningBox.textContent = "Warning: your current plan exceeds your income. Reduce expenses or savings target.";
    }
  } catch (error) {
    errorBox.textContent = error.message;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runCalculation();
});

runCalculation();
