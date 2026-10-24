# Monthly Money audit

Version audited: v1.1.1 (commit `4f08fad`), 2026-10-24. Bugs 1 to 4 and the contrast failures were fixed
afterwards on the `fix/audit-bugs-contrast` branch; each item below says so.

Scope: features, UI/UX design, colours and emojis. The audit comes from reading all of `src/`, the PWA config,
the design tokens and the i18n copy. No screenshots were taken (the Playwright browser is not installed on the
audit machine), so visual findings are inferred from the code. `npm run lint` passes with 4 warnings
(fast-refresh exports, and `new Date()` called during render in `src/pages/CalendarPage.tsx:23`).

The app uses three colours to carry meaning: ink (indigo) for brand and actions, mint for money kept, coral for
money out. Emojis appear only as user data (category and pot icons); all UI controls use Lucide line icons.

## 1. Features

### App-wide

- Offline PWA with an "Update" toast when a new build is ready, an install banner (Chrome/Edge) and a request
  for persistent storage.
- A first-launch welcome sheet that asks for name, language and currency.
- English and French, with number and date formatting that follows the language. Theme can be auto, light or
  dark.
- Swiping left or right changes the month on the Month, Calendar and Insights tabs.
- Toasts offer Undo after deleting a one-off expense, a recurring item, a pot or a pot entry.
- Navigation is a floating pill bar at the bottom on phones and a pill bar in the header on wider screens.

### Month tab

- Hero card with a month picker (dots mark months that have data), a time-of-day greeting and the large "left
  to spend" amount in mint, or coral when negative.
- A progress bar showing spent plus set aside.
- Chips for "X a day for N days", savings goal status, and over-budget (tapping it opens Insights).
- An empty-state card offering "Add recurring" or "Load example data".
- Income: salary, extra income, and a shortcut to "Use this as my default salary".
- Next 7 days: upcoming recurring payments (current month only).
- Recurring lines for the month: a checkbox skips one, tapping one changes its amount for this month only.
  Pills show "last one", "edited" and the billing interval.
- One-off expenses: add, edit, delete with undo. A floating mint "+" button also adds one.
- Savings pots: balance, progress to target, set aside or take out, and a detail sheet with history.
- A free-text note for the month.

### Calendar tab

- Month grid shaded like a heatmap: darker indigo means more money leaving that day. Today has a ring, and a
  coral dot marks days with several entries.
- "Gone out so far" and "Still to pay" cards (current month).
- Tapping a day lists its entries and lets you add an expense on that day.
- A notice for recurring items that have no payment day set.

### Recurring tab

- Summary line: number live, cost per month and per year.
- Search appears once there are more than 5 items.
- Grouped by type: credits, bills, subscriptions, other.
- Pills for paused, ended, starts, until and interval. Each row shows the next charge month and the monthly
  equivalent.
- Credits get a progress bar: payments done out of total, amount left and end month.
- Pause/resume, edit, and delete with undo.

### Insights tab

- "Where to look": 11 built-in rules sorted by severity (overspend, below goal, too much set aside, budget
  exceeded, subscriptions over 10% of income, credit over 35%, credit ending soon, non-monthly charge due,
  largest cost, spending spike). `personalRules()` in `src/lib/insights.ts` is still an empty stub.
- Budget bars: mint, then amber above 80%, then coral above 100%.
- Category donut (top 6 plus "Other") with change against last month.
- Over time: 6-month income vs expenses bars with a table, or a full-year "kept" chart that projects future
  months.
- Savings totals and fixed costs by type.

### Settings tab

- Language, name, currency (16 options), savings goal %, default salary, theme.
- Categories and budgets: 24 icons and 12 colours to pick from.
- JSON export and import, CSV export.
- Install steps for iOS, Android and Windows.
- Load example data, delete all data.

## 2. Visual design

| Aspect | What is used |
|---|---|
| Fonts | DM Sans for body text. Space Grotesk for headings and every amount, with tabular figures |
| Type scale | Hero 44px (32px for long amounts) · page titles 2xl · section titles 15px · pills 11px · nav labels 10px |
| Shape | Cards `rounded-2xl` (20px) · hero and sheets `rounded-3xl` (28px) · buttons, pills, nav and segmented controls fully rounded |
| Surfaces | Flat cards with 1px borders. Shadows only on things that float (nav, FAB, toast, popover, modal) |
| Modals | Bottom sheet with a drag handle on phones, centred dialog on desktop |
| Icons | Lucide: Wallet, CalendarDays, Repeat, ChartPie, Settings, Plus, Trash2, Pause/Play, Search, PiggyBank, the Chevrons, X, Download/Upload, FileSpreadsheet, plus the 4 severity icons (OctagonAlert, AlertTriangle, Info, CheckCircle2) |

## 3. Colours

### Design tokens (`src/index.css`)

| Role | Tokens |
|---|---|
| Ink (brand, actions) | 50 `#eef0fb` · 100 `#dfe2f7` · 200 `#c3c8ef` · 500 `#5b5bd6` · 600 `#4b48c9` · 700 `#3c3aa8` · 900 `#1f1d4f` (hero, theme colour) · 950 `#14132f` |
| Mint (money kept) | 100 `#d6f7e6` · 300 `#7ee2b0` · 400 `#45d492` (FAB, progress) · 600 `#159a5f` · 700 `#0f7a4b` |
| Coral (money out) | 100 `#ffe1da` · 400 `#fb8a6f` · 500 `#f4664a` · 600 `#b93720` (was `#d9492e`, darkened for text contrast) |
| Light surfaces | paper `#f2f3fa` · card `#ffffff` · line `#e5e7f2` |
| Dark surfaces | paper `#0e0f1e` · card `#181a30` · line `#2a2d4a` |

### Colours outside the tokens

- Tailwind's default slate for all neutral text and amber for warnings.
- Chart series: income `#2a78d6`, expenses `#eb6834`, kept `#1baf7a`, each with a dark-mode variant
  (`src/components/charts.tsx:8`).
- Calendar heat colour hardcoded as `rgba(75,72,201,…)`, which is ink-600 written out by hand.
- The donut's folded "Other" slice uses `#94a3b8`.

### Category palette

12 colours: `#2a78d6 #eb6834 #1baf7a #eda100 #e87ba4 #008300 #4a3aa7 #e34948 #0891b2 #7c3aed #b45309 #64748b`.
The first 8 are the colour-blind-safe set.

### Contrast (WCAG AA needs 4.5:1 for small text)

| Pair | Ratio at audit | Status |
|---|---|---|
| ink-600 on white, white on ink-600 | 6.84 | Pass |
| mint-300 on hero, coral-400 on hero | 9.94 / 6.66 | Pass |
| `slate-400` on white | 2.56 | Fixed: weekday names, calendar hint, "new" tag, chevrons, search, pause and dismiss icons moved to `slate-500` (4.76) |
| `slate-500` on paper | 4.30 | Fixed: Recurring summary and Settings footer moved to `slate-600` |
| `slate-500` on dark card (no `dark:` override) | 3.59 | Fixed: 27 places got `dark:text-slate-400` (6.66) |
| `mint-600` on white (positive deltas, "kept") | 3.61 | Fixed: text uses `mint-700` (5.38) |
| `coral-600` on white | 4.25 | Fixed: token darkened to `#b93720` (5.78) |
| `coral-600` on `coral-100` (bad pill, danger hover) | 3.45 | Fixed by the same token change (4.69) |
| White text on calendar heat cells (light mode) | 2.33 to 4.38 | Fixed: dark text in light mode, top intensity capped at 0.75 (4.55 or better) |
| Input placeholders, `slate-400` | 2.56 | Open: WCAG treats placeholders as advisory; left unchanged |

The last three failing rows were found while fixing, not in the first audit pass.

## 4. Emojis

All emojis are category or pot icons. None appear in UI copy.

- Default categories (12): 🏠 Housing · 💡 Utilities · 🛒 Groceries · 🚗 Transport · 🛡️ Insurance · 🏦 Loans ·
  🎬 Entertainment · ❤️ Health · 🍽️ Restaurants · 🛍️ Shopping · ✈️ Travel · 📦 Other
- Category icon picker (24): the 12 above plus 📱 🎓 👶 🐶 💇 🎁 ☕ 🎮 📚 💪 🧾 🏷️
- Pot icon picker (12): 🛟 🏖️ 🏠 🚗 💻 🎓 💍 👶 🎁 ✈️ 🐷 🎯
- Defaults: a new category gets 🏷️, a new pot gets 🐷, migrated categories get 🏷️, an unknown category falls
  back to 📦.
- Where they show: the tinted circle in every row, the donut legend, the budget insight title ("🛒 Groceries
  over budget") and the pot detail sheet title.

Emojis look different on Windows (Segoe), iOS and Android, so the app looks a bit different on each platform.
Because the circle behind each emoji is only a 12% tint (`${color}1f`), the emoji does most of the work of
identifying a category, and the colour barely shows in dark mode.

## 5. Problems found

### Bugs (confirmed by reading the code)

1. With more than 6 categories, if the real "Other" category is in the top 6, the donut's folded slice gets the
   same "📦 Other" name. The legend shows two identical rows in different greys, and React gets a duplicate key
   (`src/components/charts.tsx:86-87`, `key={d.name}`). Fixed: the real "Other" category now folds with the
   other small slices, and slices are keyed by category id.
2. The hero says "Over budget by" whenever `remaining < 0`, which also happens when more was set aside than
   kept, without any overspending (`src/pages/MonthPage.tsx:50`). Fixed: that case now reads "Set aside too
   much by" ("Mis de côté en trop"), through the new `hero.overAside` key.
3. Category budgets in Settings show a bare number such as "budget 350", with no currency formatting
   (`src/pages/SettingsPage.tsx:122`). Fixed: formatted with `formatMoneyFit()`.
4. The desktop header is `sticky` but has no background, so content scrolls visibly underneath it at 640px and
   wider (`src/App.tsx:47`). Fixed: translucent paper background with blur.
5. The savings goal field clamps on every keystroke. Clearing it gives 0 straight away, so a value cannot be
   freely retyped (`src/pages/SettingsPage.tsx:100`). Fixed: the field keeps a draft and commits on blur or
   Enter. Empty input keeps the current goal; other values are rounded to a whole percent and clamped to 0-100.

### UX and accessibility

6. Tap targets are small: the skip checkbox is 20px and icon buttons are 36px, below the 44px minimum. Bottom
   nav labels are 10px. Fixed: icon buttons, month arrows, pause, toast and banner dismiss buttons, and
   `Segmented` options get a 44px hit area through an invisible `::after` layer; the checkbox gets a padded
   label. The visible layout is unchanged. Nav labels stay at 10px, since 11px risks clipping French labels at 320px.
7. Destructive actions (delete pot, delete category, import, reset) use the browser's `confirm()` instead of
   the app's own sheet. Deleting a category has no undo, unlike every other delete. Fixed: `askConfirm()`
   (`src/lib/confirm.ts`) opens an in-app sheet with Cancel focused; deleting a category offers Undo.
8. The modal does not trap focus or return focus when closed, and `role="dialog"` sits on the backdrop rather
   than the panel. Fixed: focus moves into the sheet, Tab cycles inside it, focus returns to the opener on
   close, and Escape closes only the top sheet when two are stacked. The scroll lock is released only when
   the last sheet closes.
9. Chart colours are picked during render from `data-theme`, so if the OS theme changes while Insights is open,
   the charts keep the old palette until the next re-render. Fixed: series colours are CSS variables
   (`--chart-income`, `--chart-expenses`, `--chart-kept`) that switch with `data-theme`.
10. Colours are hardcoded outside the tokens (calendar rgba, chart hexes, amber, tooltip `slate-800`), so a
    palette change means editing several files. Fixed for charts (CSS variables), the calendar (`color-mix()`
    with `--color-ink-600`) and the tooltip (card and line tokens). Amber stays Tailwind's default palette.
11. `KIND_LABELS` and `INTERVAL_LABELS` in `src/lib/types.ts` are no longer used; i18n replaced them. Fixed: removed.

### Already working well

Money uses tabular figures, long amounts switch to a compact format, dark mode covers every screen, amount
inputs accept both comma and dot decimals, undo is available almost everywhere, and the empty states say what
to do next.

## 6. Suggested order

1. Bugs 1 to 4 and the contrast fixes. Done; not yet checked in a browser, since no screenshots could be taken.
2. Bug 5 and items 6 to 11. Done; also not yet checked in a browser.
3. Still open: input placeholder contrast, and the 32px ghost buttons in section titles (they pass WCAG AA
   at 24px, but not the 44px guideline).
