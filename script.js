const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
}

function calculateBudget(values) {
  const expenseEntries = Object.entries(values.expenses);
  const totalExpenses = expenseEntries.reduce((sum, [, amount]) => sum + amount, 0);
  const safeToSpend = values.income - values.savingsGoal - totalExpenses;
  const dailyLimit = safeToSpend / 30;

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
    item.textContent = `${name[0].toUpperCase()}${name.slice(1)}: ${currency.format(amount)}`;
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorBox.textContent = "";

  try {
    const values = readForm(form);
    const result = calculateBudget(values);
    render(result);

    if (result.safeToSpend < 0) {
      errorBox.textContent = "Warning: your current plan exceeds your income. Reduce expenses or savings target.";
    }
  } catch (error) {
    errorBox.textContent = error.message;
  }
});

form.requestSubmit();
