# AGENTS.md

## Purpose

Dinero al Día is a Spanish-language personal-finance assistant that helps
people understand, organize, and improve their finances in a simple, visual
way. Users record daily income and expenses, review a current balance, and use
clear summaries to make informed financial decisions.

This file defines the project-specific workflow, technical constraints, and
quality requirements for AI agents working in this repository.

---

## 1. Core Workflow (Spec-Driven Development)

- **Plan first:** Use PLAN mode and design thinking before generating or
  editing code.
- **Review specifications:** Read `requirements.md`, `README.md`, and relevant
  local documentation before making changes. Treat the GIVEN/WHEN/THEN
  criteria in `requirements.md` as the definition of done.
- **Propose focused changes:** Present a concise file-modification plan and
  obtain approval before implementation.
- **Preserve scope:** Make small, maintainable changes that preserve existing
  behavior. Do not add unrelated features or refactor outside the approved
  plan.
- **Validate changes:** Add or update focused tests when behavior changes, then
  run the smallest relevant validation available.

## 2. Technical Environment and Commands

- **Language and stack:** Plain HTML5, CSS3, and vanilla JavaScript. This is a
  static site; do not introduce React, Tailwind, Bootstrap, or other external
  UI frameworks.
- **Project structure:** Keep files simple and purpose-focused, using names
  such as `index.html`, `styles.css`, and `script.js`. Split larger features
  into small, clearly named modules.
- **Build and local development:** No build step is required. Open `index.html`
  directly in a browser or use a simple local live server.
- **Design aesthetic:** Create a clean, responsive financial dashboard with
  accessible, high-contrast colors. Use a calm, trustworthy palette such as
  navy, cream, and teal, with a clear distinction between income and expense
  states.

## 3. Style, Privacy, and Quality Constraints

- **Spanish interface:** Keep all user-facing text in clear, accessible Spanish
  unless a requirement explicitly states otherwise.
- **Assistant-like experience:** Use supportive, concise language that helps
  people understand their finances without judgment. Present information
  visually and prioritize clarity over financial jargon.
- **Semantic accessibility:** Use semantic HTML, explicit labels, keyboard-
  operable controls, visible focus states, and sufficient color contrast. Do
  not use color alone to convey financial status.
- **Financial-data privacy:** Treat transactions and balances as sensitive
  data. Do not log, expose, or transmit financial entries unnecessarily, and
  never include them in error messages.
- **Input safety:** Validate transaction input before saving it. Reject missing,
  zero, malformed, or otherwise invalid monetary amounts and show a helpful
  Spanish validation message.
- **Financial accuracy:** Format currency consistently using the configured
  currency and exactly two decimal places. Avoid floating-point behavior that
  can produce inaccurate financial totals.
- **Data behavior:** Preserve correct income and expense totals, selected-period
  balance calculation, zero-state summaries, and newest-first transaction
  ordering.
- **Performance:** Keep transaction storage, calculations, and rendering
  responsive for at least 1,000 transactions.
- **Code quality:** Keep code lightweight, modular, and readable. Prefer native
  browser APIs and existing patterns over dependencies. Comment only
  non-obvious logic.
- **Documentation:** Update `README.md` when setup, usage, or user-facing
  behavior changes.

## 4. Currency Conversion Feature

- **Purpose:** Let users see the equivalent value of their recorded money in
  Bolívares (VES), Dólares (USD), and Euros (EUR) so they can understand their
  finances across currencies.
- **Base currency:** Transactions and balances remain stored in the user's
  configured base currency. Conversions are a read-only, derived view and must
  never alter stored transaction amounts.
- **Exchange rates:** Maintain a simple, swappable rates source (e.g. a small
  config object or module) mapping VES, USD, and EUR rates relative to the
  base currency. Allow the rate values to be updated without touching
  unrelated app logic.
- **Display:** Show the current balance (and optionally totals) converted into
  the other two currencies alongside the base-currency amount, each formatted
  with its correct currency symbol and exactly two decimal places.
- **Clarity and trust:** Label each converted amount clearly (e.g. "Bs.",
  "US$", "€") and, if rates are static/manual, indicate that the rate may not
  reflect the real-time market rate.
- **Graceful degradation:** If a rate is missing or invalid, hide or omit that
  currency's conversion and show a helpful Spanish message instead of
  breaking the balance display.
- **Accessibility and privacy:** Follow the same semantic accessibility and
  financial-data privacy rules as section 3 — converted amounts are still
  sensitive financial data.
