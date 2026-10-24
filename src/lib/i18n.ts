import { getState, useAppState } from './store'
import { setUndoLabel } from './toast'
import type { Language, RecurringKind } from './types'

/**
 * Tiny translation layer: flat dictionaries, `{param}` placeholders.
 * `t()` reads the current language from the store; components use `useT()` so they re-render on change.
 */
const en = {
  // navigation and shared
  'nav.month': 'Month', 'nav.calendar': 'Calendar', 'nav.recurring': 'Recurring', 'nav.insights': 'Insights', 'nav.settings': 'Settings',
  'app.name': 'Reserve',
  'common.cancel': 'Cancel', 'common.save': 'Save', 'common.add': 'Add', 'common.new': 'New', 'common.delete': 'Delete', 'common.close': 'Close',
  'common.undo': 'Undo', 'common.dismiss': 'Dismiss', 'common.update': 'Update', 'common.manage': 'Manage', 'common.create': 'Create', 'common.edit': 'Edit',
  'confirm.title': 'Please confirm', 'confirm.replace': 'Replace',
  'common.saveChanges': 'Save changes', 'common.thisMonth': '{amount} this month', 'common.note': 'Note (optional)',
  'common.day': 'day', 'common.days': 'days', 'common.perMonth': '{amount}/month', 'common.aboutPerMonth': 'about {amount} a month',
  'toast.newVersion': 'A new version is ready', 'toast.deleted': 'Deleted {name}', 'toast.saved': 'Saved {name}', 'toast.added': 'Added {name}',
  'toast.defaultSalary': 'Default salary updated', 'toast.exampleLoaded': 'Example data loaded', 'toast.entryRemoved': 'Entry removed',
  'toast.setAside': 'Set aside {amount} in {pot}', 'toast.tookOut': 'Took {amount} out of {pot}',
  'install.text': 'Install for quick access and offline use.', 'install.button': 'Install',
  // month nav
  'nav.prevMonth': 'Previous month', 'nav.nextMonth': 'Next month', 'nav.prevYear': 'Previous year', 'nav.nextYear': 'Next year', 'nav.pickMonth': 'Pick a month', 'nav.goToday': 'Go to this month',
  // hero
  'hero.left': 'Left to spend', 'hero.over': 'Over budget by', 'hero.overAside': 'Set aside too much by','hero.spentOf': '{spent} spent of {income}', 'hero.spentSetAsideOf': '{spent} spent, {aside} set aside of {income}',
  'hero.addSalary': 'Add your salary below to start', 'hero.perDay': '{amount} a day for {n} {unit}', 'hero.goalMet': 'Goal met', 'hero.goal': 'Goal', 'hero.keep': 'keep {pct}%', 'hero.now': '({pct} now)',
  'hero.overBudgetOne': '{name} over budget', 'hero.overBudgetMany': '{n} budgets exceeded', 'hero.progress': 'Share of income spent',
  'greet.morning': 'Good morning, {name}', 'greet.afternoon': 'Good afternoon, {name}', 'greet.evening': 'Good evening, {name}',
  // welcome sheet & card
  'welcome.title': 'Welcome', 'welcome.intro': 'A few quick settings. You can change them any time in Settings.',
  'welcome.name': 'Your first name', 'welcome.nameHint': 'Used for the greeting only', 'welcome.language': 'Language', 'welcome.currency': 'Currency',
  'welcome.start': 'Start', 'welcome.skip': 'Skip',
  'welcome.cardText': 'Enter your salary, then add what you pay every month under Recurring. Prefer to look around first? Load example data and clear it later in Settings.',
  'welcome.addRecurring': 'Add recurring expenses', 'welcome.loadExample': 'Load example data',
  // income
  'income.title': 'Income', 'income.salary': 'Salary', 'income.default': 'Your default salary', 'income.extra': 'Extra income', 'income.extraHint': 'Bonus, refund, side job',
  'income.useDefault': 'Use {amount} as my default salary',
  // upcoming
  'upcoming.title': 'Next 7 days',
  'upcoming.none': 'Nothing due in the next 7 days.',
  // tide hero
  'tide.aria': 'Money left through {month}: {start} at the start, {end} at the end.', 'tide.today': 'Today', 'tide.start': 'Start of month',
  'tide.dayLeft': '{amount} left', 'tide.dayOut': '{amount} goes out', 'tide.dayNothing': 'Nothing goes out', 'tide.scrubHint': 'Drag across the curve to see any day',
  // pace
  'pace.title': 'Today', 'pace.safe': 'Safe to spend today', 'pace.forDays': 'for each of the {n} {unit} left', 'pace.ahead': '{amount} under your pace so far', 'pace.behind': '{amount} over your pace so far',
  'pace.even': 'Right on pace', 'pace.over': 'This month is already over budget', 'pace.past': 'This month is over. You ended with {amount}.', 'pace.future': 'Planned: {amount} a day in {month}',
  // quick add and command bar
  'quick.recent': 'Recent', 'quick.today': 'Today', 'quick.yesterday': 'Yesterday', 'quick.pickDay': 'Pick a date', 'quick.saved': 'Added {name}', 'quick.updated': 'Saved {name}',
  'palette.label': 'Search and quick add', 'palette.placeholder': 'Search, or type "Coffee 4.50" to add', 'palette.add': 'Add {name} for {amount}', 'palette.addTo': 'in {category}, today',
  'palette.goTo': 'Go to', 'palette.expenses': 'Expenses', 'palette.recurring': 'Recurring', 'palette.none': 'Nothing matches "{q}".', 'palette.keys': 'Enter to open, Esc to close',
  'palette.placeholderShort': 'Search or quick add', 'palette.newExpense': 'New expense', 'palette.thisMonth': 'This month', 'palette.shortcuts': 'N new expense, 1 to 5 switch page, arrow keys change month',
  'nav.search': 'Search', 'nav.add': 'Add expense', 'nav.menu': 'Main',
  // forecast
  'fc.title': 'Next 6 months', 'fc.sub': 'Projected from your default salary and recurring costs', 'fc.coming': 'Coming months', 'fc.left': '{amount} left', 'fc.short': '{amount} short',
  'fc.ends': '{name} ends', 'fc.lump': '{name}: {amount}', 'fc.quiet': 'A usual month', 'fc.empty': 'Set a default salary in Settings to see the months ahead.', 'fc.more': 'All 6 months',
  // overview (home)
  'home.title': 'Overview', 'home.tide': 'Day by day', 'home.tideSub': 'What is left after each day. Drag across it, or turn the dial.',
  'home.spent': 'Spent', 'home.ofIncome': 'of {income} income', 'home.saved': 'Saved', 'home.noPots': 'No pots yet', 'home.legendSpent': 'spent', 'home.legendAside': 'set aside', 'home.legendLeft': 'left',
  'home.reserveOf': '{pct} of income still here', 'home.overBy': 'over by {amount}',
  'dial.label': 'Month dial: turn it to look at any day', 'dial.leftToday': 'left today', 'dial.left': 'left', 'dial.after': 'after {day}', 'dial.endsAt': 'month ends at {amount}',
  'theme.toDark': 'Switch to dark mode', 'theme.toLight': 'Switch to light mode',
  'stat.perMonth': 'Per month', 'stat.perYear': 'Per year', 'stat.active': 'Active', 'stat.nextCharge': 'Next payment', 'stat.none': 'None scheduled',
  'stat.biggestDay': 'Busiest day', 'stat.savingsRate': 'Savings rate', 'stat.vsLast': 'vs last month', 'stat.topCategory': 'Top category', 'stat.kept': 'Kept',
  'stat.endingSoon': '{n} ending within 3 months', 'stat.subsShare': '{pct} of it on subscriptions', 'stat.goal': 'goal {pct}%', 'stat.daysLeft': '{n} days left in the month',
  // recurring section
  'recurring.title': 'Recurring', 'recurring.empty': 'Nothing recurring applies to this month yet.', 'recurring.addOne': 'Add a recurring expense',
  'recurring.include': 'Include {name} this month', 'pill.lastOne': 'last one', 'pill.edited': 'edited', 'pill.paused': 'paused', 'pill.ended': 'ended', 'pill.starts': 'starts {month}', 'pill.until': 'until {month}',
  'recurring.day': 'day {n}', 'recurring.next': 'next {month}', 'recurring.chargedNow': 'charged this month',
  'override.usually': 'Usually {amount}. Change it for this month only, for a promo or a one-time increase. To change it for good, edit it under Recurring.',
  'override.amount': 'Amount this month', 'override.reset': 'Reset to usual', 'override.title': '{name} this month',
  // one-off
  'oneoff.title': 'One-off expenses', 'oneoff.empty': 'Log purchases that are not recurring: groceries, a repair, a gift.', 'oneoff.add': 'Add expense', 'oneoff.edit': 'Edit expense',
  'oneoff.what': 'What', 'oneoff.placeholder': 'Groceries, dentist, gift…', 'oneoff.amount': 'Amount', 'oneoff.date': 'Date', 'oneoff.category': 'Category', 'oneoff.deleteA': 'Delete {name}',
  'note.title': 'Note', 'note.placeholder': 'Anything to remember for this month',
  // savings
  'savings.title': 'Savings', 'savings.setAsideMonth': '{amount} set aside this month', 'savings.setAside': 'Set aside', 'savings.takeOut': 'Take out',
  'savings.empty': 'Track what you set aside: an emergency fund, a holiday, a new laptop.', 'savings.createPot': 'Create a pot', 'savings.newPot': 'New pot', 'savings.editPot': 'Edit pot',
  'savings.targetReached': 'Target reached', 'savings.thisMonth': '{amount} this month', 'savings.nothingMonth': 'Nothing this month', 'savings.toGo': '{amount} to go of {target}',
  'savings.savedSoFar': 'Saved so far', 'savings.pctOf': '{pct}% of {target}', 'savings.noEntries': 'No entries yet.', 'savings.removeEntry': 'Remove entry',
  'savings.setMoneyAside': 'Set money aside', 'savings.takeMoneyOut': 'Take money out', 'savings.pot': 'Pot',
  'savings.potName': 'Emergency fund, Holiday, Laptop', 'savings.target': 'Target (optional)', 'savings.targetHint': 'Shows progress towards the amount', 'savings.deletePot': 'Delete pot',
  'savings.deleteConfirm': 'Delete "{name}" and its {n} entries?', 'savings.noteIn': 'End of month transfer', 'savings.noteOut': 'Flights paid',
  'savings.total': 'across {n} {unit}', 'savings.pot1': 'pot', 'savings.potN': 'pots', 'savings.yearAside': '{amount} set aside in {year}',
  // calendar
  'cal.goneOut': 'Gone out so far', 'cal.stillToPay': 'Still to pay', 'cal.dayLabel': 'Day {d}', 'cal.hint': 'Tap a day for details or to add an expense. Darker means more money leaving.',
  'cal.noDay': '{names} {verb} no payment day, so {shows} on the 1st. Set the day under Recurring for an accurate calendar.',
  'cal.has': 'has', 'cal.have': 'have', 'cal.itShows': 'it shows', 'cal.theyShow': 'they show',
  'cal.nothing': 'Nothing scheduled this day.', 'cal.total': 'Total', 'cal.addOnDay': 'Add expense on this day', 'src.recurring': 'recurring', 'src.oneoff': 'one-off',
  // recurring page
  'rec.heading': 'Recurring', 'rec.summary': '{n} active, about {month} a month, {year} a year', 'rec.search': 'Name or category',
  'rec.empty': 'Add everything you pay regularly: rent, loans, phone, streaming, insurance. Give each a payment day to see it on the calendar.', 'rec.addFirst': 'Add the first one',
  'rec.newTitle': 'New recurring expense', 'rec.editTitle': 'Edit recurring expense', 'rec.pause': 'Pause', 'rec.resume': 'Resume', 'rec.pauseA': 'Pause {name}', 'rec.resumeA': 'Resume {name}',
  'rec.payments': '{done} of {total} payments', 'rec.inclThisMonth': ', including this month', 'rec.lastPayment': 'Last payment this month', 'rec.paidOff': 'Paid off', 'rec.toGo': '{amount} to go, ends {month}',
  'kind.subscription': 'Subscription', 'kind.credit': 'Credit / loan', 'kind.bill': 'Bill', 'kind.other': 'Other',
  'kind.subscriptions': 'Subscriptions', 'kind.credits': 'Credits / loans', 'kind.bills': 'Bills', 'kind.others': 'Other',
  'interval.1': 'Monthly', 'interval.2': 'Every 2 months', 'interval.3': 'Quarterly', 'interval.6': 'Every 6 months', 'interval.12': 'Yearly', 'interval.n': 'every {n} months',
  // recurring form
  'form.name': 'Name', 'form.namePlaceholder': 'Netflix, Rent, Car loan…', 'form.amount': 'Amount', 'form.billed': 'Billed', 'form.type': 'Type', 'form.dayOfMonth': 'Day of month', 'form.dayHint': 'When it leaves your account',
  'form.dayPlaceholder': 'e.g. 5', 'form.category': 'Category', 'form.firstCharge': 'First charge', 'form.fromMonth': 'From month', 'form.untilMonth': 'Until month', 'form.inclusive': 'Inclusive', 'form.openEnded': 'Off = open-ended',
  'form.hasEnd': 'Has end month', 'form.notePlaceholder': 'Contract ends, cancel before…',
  // insights
  'ins.whereToLook': 'Where to look', 'ins.budgets': 'Budgets', 'ins.budgetsSub': 'Set per category in Settings', 'ins.of': 'of', 'ins.over': '{amount} over', 'ins.left': '{amount} left',
  'ins.byCategory': 'By category', 'ins.byCategorySub': 'Change compared with last month', 'ins.noExpenses': 'No expenses this month.', 'ins.ofSpending': '{pct} of spending', 'ins.new': 'new',
  'ins.overTime': 'Over time', 'ins.sixMonths': '6 months', 'ins.fillIn': 'Fill in a few months to see the trend.',
  'ins.month': 'Month', 'ins.income': 'Income', 'ins.expenses': 'Expenses', 'ins.kept': 'Kept',
  'ins.yearNote': 'Money kept each month of {year}. Months without a salary stay empty.', 'ins.projected': ' Future months are projected from your default salary and recurring costs.',
  'ins.fixedByType': 'Fixed costs by type', 'ins.noFixed': 'No recurring costs this month.', 'ins.total': 'Total', 'ins.other': 'Other',
  'chart.income': 'Income', 'chart.expenses': 'Expenses', 'chart.kept': 'Kept', 'chart.trendLabel': 'Bar chart of income and expenses per month',
  // insight rules
  'rule.noIncome.t': 'Enter your salary', 'rule.noIncome.d': "Add this month's salary (or a default salary in Settings) to get savings rate and optimization tips.",
  'rule.overspend.t': 'Spending exceeds income', 'rule.overspend.d': 'You are {amount} over budget this month.',
  'rule.belowGoal.t': 'Below your {pct}% savings goal', 'rule.belowGoal.d': 'You keep {rate}. Trim {gap} to reach the goal.',
  'rule.onTrack.t': 'Savings goal reached', 'rule.onTrack.d': 'You keep {rate} of your income ({amount}).',
  'rule.potTooMuch.t': 'Set aside more than you kept', 'rule.potTooMuch.d': '{aside} went into pots but only {kept} was left after expenses. Consider taking {back} back out.',
  'rule.potNothing.t': 'Nothing set aside yet', 'rule.potNothing.d': "You kept {kept} this month. Move some of it into a pot so it doesn't get spent.",
  'rule.budget.t': '{name} over budget', 'rule.budget.d': '{spent} spent of a {budget} budget ({pct}).',
  'rule.subs.t': 'Subscriptions above 10% of income', 'rule.subs.d': '{n} subscriptions cost {total} this month ({pct}). Cancelling the smallest three would free {free}.',
  'rule.debt.t': 'Credit repayments above 35% of income', 'rule.debt.d': 'Loans take {pct} of your income. Lenders consider this the ceiling; avoid new credit.',
  'rule.ending.t': '{name} ends in {month}', 'rule.ending.d': '{amount}/month will be freed up. Consider redirecting it to savings.',
  'rule.yearly.t': '{name} is charged this month', 'rule.yearly.d': 'A {n}-month payment of {amount} lands now, not every month.',
  'rule.biggest.t': '{name} is your largest cost', 'rule.biggest.d': "{amount} is {pct} of income. Small wins elsewhere won't move the needle as much as renegotiating this one.",
  'rule.spike.t': 'Spending is up vs. recent months', 'rule.spike.d': '{now} this month vs. an average of {avg} over the last {n} months.',
  // settings
  'set.heading': 'Settings', 'set.prefs': 'Preferences', 'set.currency': 'Currency', 'set.goal': 'Savings goal (% of income)', 'set.defaultSalary': 'Default salary', 'set.defaultSalaryHint': "Pre-filled in every month you haven't edited",
  'set.appearance': 'Appearance', 'set.auto': 'Auto', 'set.light': 'Light', 'set.dark': 'Dark', 'set.language': 'Language', 'set.name': 'Your name', 'set.nameHint': 'Shown in the greeting on the Month screen',
  'set.categories': 'Categories and budgets', 'set.categoriesSub': 'Tap one to change its icon, colour or budget', 'set.budget': 'budget {amount}', 'set.noBudget': 'no budget',
  'set.backup': 'Backup', 'set.backupText': 'Your data lives only on this device. Export a backup to move it to your phone or keep a safe copy. The spreadsheet export lists every expense for Excel or Google Sheets.',
  'set.export': 'Export backup', 'set.import': 'Import backup', 'set.csv': 'Spreadsheet (CSV)', 'set.restored': 'Backup restored.', 'set.importFailed': 'Import failed: {error}', 'set.notBackup': 'Not a Reserve backup',
  'set.replaceConfirm': 'Replace all current data with this backup?', 'set.cleared': 'All data cleared.',
  'set.install': 'Install as an app', 'set.installed': 'You are using the installed app.',
  'set.ios1': 'Open this page in Safari.', 'set.ios2': 'Tap the Share button (square with an arrow).', 'set.ios3': 'Choose Add to Home Screen, then Add.',
  'set.android': 'Android (Chrome): tap the menu, then Add to Home screen / Install app.', 'set.windows': 'Windows (Edge or Chrome): click the install icon at the right of the address bar, or menu, Apps, Install this site as an app.',
  'set.exampleReset': 'Example data and reset', 'set.loadExample': 'Load example data', 'set.exampleConfirm': 'Replace current data with example data?', 'set.deleteAll': 'Delete all data',
  'set.deleteConfirm': 'Delete ALL data on this device? Export a backup first if you want to keep it.', 'set.footer': 'Reserve. Works offline, no account, no cloud.',
  'cat.new': 'New category', 'cat.edit': 'Edit category', 'cat.name': 'Name', 'cat.namePlaceholder': 'Kids, Pets, Coffee…', 'cat.icon': 'Icon', 'cat.colour': 'Colour', 'cat.iconA': 'Icon {icon}', 'cat.colourA': 'Colour {colour}',
  'cat.budget': 'Monthly budget (optional)', 'cat.budgetHint': "You'll be warned on the Month and Insights screens when you pass it", 'cat.delete': 'Delete category',
  'cat.deleteConfirm': '{n} expense(s) use "{name}". They will be moved to "Other". Continue?',
  // default category names
  'cat.housing': 'Housing', 'cat.utilities': 'Utilities', 'cat.groceries': 'Groceries', 'cat.transport': 'Transport', 'cat.insurance': 'Insurance', 'cat.loans': 'Loans',
  'cat.entertainment': 'Entertainment', 'cat.health': 'Health', 'cat.restaurants': 'Restaurants', 'cat.shopping': 'Shopping', 'cat.travel': 'Travel', 'cat.other': 'Other', 'cat.savings': 'Savings',
} as const

export type Key = keyof typeof en

const fr: Record<Key, string> = {
  'nav.month': 'Mois', 'nav.calendar': 'Calendrier', 'nav.recurring': 'Récurrents', 'nav.insights': 'Analyse', 'nav.settings': 'Réglages',
  'app.name': 'Reserve',
  'common.cancel': 'Annuler', 'common.save': 'Enregistrer', 'common.add': 'Ajouter', 'common.new': 'Nouveau', 'common.delete': 'Supprimer', 'common.close': 'Fermer',
  'common.undo': 'Annuler', 'common.dismiss': 'Ignorer', 'common.update': 'Mettre à jour', 'common.manage': 'Gérer', 'common.create': 'Créer', 'common.edit': 'Modifier',
  'confirm.title': 'Confirmation', 'confirm.replace': 'Remplacer',
  'common.saveChanges': 'Enregistrer', 'common.thisMonth': '{amount} ce mois-ci', 'common.note': 'Note (facultatif)',
  'common.day': 'jour', 'common.days': 'jours', 'common.perMonth': '{amount}/mois', 'common.aboutPerMonth': 'environ {amount} par mois',
  'toast.newVersion': 'Une nouvelle version est prête', 'toast.deleted': '{name} supprimé', 'toast.saved': '{name} enregistré', 'toast.added': '{name} ajouté',
  'toast.defaultSalary': 'Salaire par défaut mis à jour', 'toast.exampleLoaded': 'Données d’exemple chargées', 'toast.entryRemoved': 'Entrée supprimée',
  'toast.setAside': '{amount} mis de côté dans {pot}', 'toast.tookOut': '{amount} retiré de {pot}',
  'install.text': 'Installez l’app pour un accès rapide et hors ligne.', 'install.button': 'Installer',
  'nav.prevMonth': 'Mois précédent', 'nav.nextMonth': 'Mois suivant', 'nav.prevYear': 'Année précédente', 'nav.nextYear': 'Année suivante', 'nav.pickMonth': 'Choisir un mois', 'nav.goToday': 'Aller au mois en cours',
  'hero.left': 'Reste à dépenser', 'hero.over': 'Dépassement de', 'hero.overAside': 'Mis de côté en trop','hero.spentOf': '{spent} dépensés sur {income}', 'hero.spentSetAsideOf': '{spent} dépensés, {aside} mis de côté sur {income}',
  'hero.addSalary': 'Saisissez votre salaire ci-dessous pour commencer', 'hero.perDay': '{amount} par jour pendant {n} {unit}', 'hero.goalMet': 'Objectif atteint', 'hero.goal': 'Objectif', 'hero.keep': 'garder {pct} %', 'hero.now': '({pct} actuellement)',
  'hero.overBudgetOne': '{name} : budget dépassé', 'hero.overBudgetMany': '{n} budgets dépassés', 'hero.progress': 'Part du revenu dépensée',
  'greet.morning': 'Bonjour {name}', 'greet.afternoon': 'Bon après-midi {name}', 'greet.evening': 'Bonsoir {name}',
  'welcome.title': 'Bienvenue', 'welcome.intro': 'Quelques réglages rapides. Vous pourrez les changer à tout moment dans les Réglages.',
  'welcome.name': 'Votre prénom', 'welcome.nameHint': 'Utilisé uniquement pour vous saluer', 'welcome.language': 'Langue', 'welcome.currency': 'Devise',
  'welcome.start': 'Commencer', 'welcome.skip': 'Passer',
  'welcome.cardText': 'Saisissez votre salaire, puis ajoutez ce que vous payez chaque mois dans Récurrents. Envie de découvrir d’abord ? Chargez les données d’exemple et effacez-les plus tard dans les Réglages.',
  'welcome.addRecurring': 'Ajouter des dépenses récurrentes', 'welcome.loadExample': 'Charger des données d’exemple',
  'income.title': 'Revenus', 'income.salary': 'Salaire', 'income.default': 'Votre salaire par défaut', 'income.extra': 'Revenu extra', 'income.extraHint': 'Prime, remboursement, à-côté',
  'income.useDefault': 'Utiliser {amount} comme salaire par défaut',
  'upcoming.title': '7 prochains jours',
  'upcoming.none': 'Rien à payer dans les 7 prochains jours.',
  'tide.aria': 'Argent restant au fil de {month} : {start} au début, {end} à la fin.', 'tide.today': 'Aujourd’hui', 'tide.start': 'Début du mois',
  'tide.dayLeft': 'reste {amount}', 'tide.dayOut': '{amount} sortent', 'tide.dayNothing': 'Rien ne sort', 'tide.scrubHint': 'Glissez sur la courbe pour voir chaque jour',
  'pace.title': 'Aujourd’hui', 'pace.safe': 'Dépensable aujourd’hui', 'pace.forDays': 'pour chacun des {n} {unit} restants', 'pace.ahead': '{amount} sous votre rythme', 'pace.behind': '{amount} au-dessus de votre rythme',
  'pace.even': 'Pile dans le rythme', 'pace.over': 'Ce mois-ci dépasse déjà le budget', 'pace.past': 'Ce mois est terminé. Il vous restait {amount}.', 'pace.future': 'Prévu : {amount} par jour en {month}',
  'quick.recent': 'Récents', 'quick.today': 'Aujourd’hui', 'quick.yesterday': 'Hier', 'quick.pickDay': 'Choisir une date', 'quick.saved': '{name} ajouté', 'quick.updated': '{name} enregistré',
  'palette.label': 'Recherche et ajout rapide', 'palette.placeholder': 'Rechercher, ou tapez « Café 4,50 » pour ajouter', 'palette.add': 'Ajouter {name} pour {amount}', 'palette.addTo': 'dans {category}, aujourd’hui',
  'palette.goTo': 'Aller à', 'palette.expenses': 'Dépenses', 'palette.recurring': 'Récurrents', 'palette.none': 'Aucun résultat pour « {q} ».', 'palette.keys': 'Entrée pour ouvrir, Échap pour fermer',
  'palette.placeholderShort': 'Rechercher ou ajouter', 'palette.newExpense': 'Nouvelle dépense', 'palette.thisMonth': 'Ce mois-ci', 'palette.shortcuts': 'N nouvelle dépense, 1 à 5 changer de page, flèches pour changer de mois',
  'nav.search': 'Rechercher', 'nav.add': 'Ajouter une dépense', 'nav.menu': 'Principal',
  'fc.title': '6 prochains mois', 'fc.sub': 'Projection d’après votre salaire par défaut et vos dépenses récurrentes', 'fc.coming': 'Mois à venir', 'fc.left': 'reste {amount}', 'fc.short': 'manque {amount}',
  'fc.ends': 'fin de {name}', 'fc.lump': '{name} : {amount}', 'fc.quiet': 'Un mois habituel', 'fc.empty': 'Indiquez un salaire par défaut dans les Réglages pour voir les mois à venir.', 'fc.more': 'Les 6 mois',
  'home.title': 'Vue d’ensemble', 'home.tide': 'Jour après jour', 'home.tideSub': 'Ce qu’il reste après chaque jour. Glissez dessus, ou tournez le cadran.',
  'home.spent': 'Dépensé', 'home.ofIncome': 'sur {income} de revenus', 'home.saved': 'Épargné', 'home.noPots': 'Aucune cagnotte', 'home.legendSpent': 'dépensé', 'home.legendAside': 'mis de côté', 'home.legendLeft': 'restant',
  'home.reserveOf': '{pct} des revenus encore là', 'home.overBy': 'dépassement de {amount}',
  'dial.label': 'Cadran du mois : tournez-le pour voir chaque jour', 'dial.leftToday': 'reste aujourd’hui', 'dial.left': 'reste', 'dial.after': 'après {day}', 'dial.endsAt': 'fin du mois à {amount}',
  'theme.toDark': 'Passer en mode sombre', 'theme.toLight': 'Passer en mode clair',
  'stat.perMonth': 'Par mois', 'stat.perYear': 'Par an', 'stat.active': 'Actifs', 'stat.nextCharge': 'Prochain prélèvement', 'stat.none': 'Aucun prévu',
  'stat.biggestDay': 'Jour le plus chargé', 'stat.savingsRate': 'Taux d’épargne', 'stat.vsLast': 'par rapport au mois dernier', 'stat.topCategory': 'Première catégorie', 'stat.kept': 'Gardé',
  'stat.endingSoon': '{n} se terminent dans les 3 mois', 'stat.subsShare': 'dont {pct} en abonnements', 'stat.goal': 'objectif {pct} %', 'stat.daysLeft': '{n} jours restants dans le mois',
  'recurring.title': 'Récurrents', 'recurring.empty': 'Aucune dépense récurrente ne s’applique à ce mois pour l’instant.', 'recurring.addOne': 'Ajouter une dépense récurrente',
  'recurring.include': 'Inclure {name} ce mois-ci', 'pill.lastOne': 'dernier', 'pill.edited': 'modifié', 'pill.paused': 'en pause', 'pill.ended': 'terminé', 'pill.starts': 'débute {month}', 'pill.until': 'jusqu’en {month}',
  'recurring.day': 'le {n}', 'recurring.next': 'prochain {month}', 'recurring.chargedNow': 'prélevé ce mois-ci',
  'override.usually': 'Habituellement {amount}. Modifiez-le pour ce mois uniquement, par exemple une promo ou une hausse ponctuelle. Pour le changer définitivement, modifiez-le dans Récurrents.',
  'override.amount': 'Montant ce mois-ci', 'override.reset': 'Remettre le montant habituel', 'override.title': '{name} ce mois-ci',
  'oneoff.title': 'Dépenses ponctuelles', 'oneoff.empty': 'Notez les achats non récurrents : courses, réparation, cadeau.', 'oneoff.add': 'Ajouter une dépense', 'oneoff.edit': 'Modifier la dépense',
  'oneoff.what': 'Quoi', 'oneoff.placeholder': 'Courses, dentiste, cadeau…', 'oneoff.amount': 'Montant', 'oneoff.date': 'Date', 'oneoff.category': 'Catégorie', 'oneoff.deleteA': 'Supprimer {name}',
  'note.title': 'Note', 'note.placeholder': 'Quelque chose à retenir pour ce mois',
  'savings.title': 'Épargne', 'savings.setAsideMonth': '{amount} mis de côté ce mois-ci', 'savings.setAside': 'Mettre de côté', 'savings.takeOut': 'Retirer',
  'savings.empty': 'Suivez ce que vous mettez de côté : fonds d’urgence, vacances, nouvel ordinateur.', 'savings.createPot': 'Créer une cagnotte', 'savings.newPot': 'Nouvelle cagnotte', 'savings.editPot': 'Modifier la cagnotte',
  'savings.targetReached': 'Objectif atteint', 'savings.thisMonth': '{amount} ce mois-ci', 'savings.nothingMonth': 'Rien ce mois-ci', 'savings.toGo': 'reste {amount} sur {target}',
  'savings.savedSoFar': 'Épargné jusqu’ici', 'savings.pctOf': '{pct} % de {target}', 'savings.noEntries': 'Aucune entrée pour l’instant.', 'savings.removeEntry': 'Supprimer l’entrée',
  'savings.setMoneyAside': 'Mettre de l’argent de côté', 'savings.takeMoneyOut': 'Retirer de l’argent', 'savings.pot': 'Cagnotte',
  'savings.potName': 'Fonds d’urgence, Vacances, Ordinateur', 'savings.target': 'Objectif (facultatif)', 'savings.targetHint': 'Affiche la progression vers ce montant', 'savings.deletePot': 'Supprimer la cagnotte',
  'savings.deleteConfirm': 'Supprimer « {name} » et ses {n} entrées ?', 'savings.noteIn': 'Virement de fin de mois', 'savings.noteOut': 'Billets d’avion payés',
  'savings.total': 'dans {n} {unit}', 'savings.pot1': 'cagnotte', 'savings.potN': 'cagnottes', 'savings.yearAside': '{amount} mis de côté en {year}',
  'cal.goneOut': 'Déjà sorti', 'cal.stillToPay': 'Reste à payer', 'cal.dayLabel': 'Jour {d}', 'cal.hint': 'Touchez un jour pour le détail ou ajouter une dépense. Plus c’est foncé, plus il sort d’argent.',
  'cal.noDay': '{names} {verb} pas de jour de prélèvement, donc {shows} le 1er. Indiquez le jour dans Récurrents pour un calendrier exact.',
  'cal.has': 'n’a', 'cal.have': 'n’ont', 'cal.itShows': 'il apparaît', 'cal.theyShow': 'ils apparaissent',
  'cal.nothing': 'Rien de prévu ce jour-là.', 'cal.total': 'Total', 'cal.addOnDay': 'Ajouter une dépense ce jour-là', 'src.recurring': 'récurrent', 'src.oneoff': 'ponctuel',
  'rec.heading': 'Récurrents', 'rec.summary': '{n} actifs, environ {month} par mois, {year} par an', 'rec.search': 'Nom ou catégorie',
  'rec.empty': 'Ajoutez tout ce que vous payez régulièrement : loyer, crédits, téléphone, streaming, assurances. Indiquez un jour de prélèvement pour le voir dans le calendrier.', 'rec.addFirst': 'Ajouter le premier',
  'rec.newTitle': 'Nouvelle dépense récurrente', 'rec.editTitle': 'Modifier la dépense récurrente', 'rec.pause': 'Pause', 'rec.resume': 'Reprendre', 'rec.pauseA': 'Mettre {name} en pause', 'rec.resumeA': 'Reprendre {name}',
  'rec.payments': '{done} sur {total} mensualités', 'rec.inclThisMonth': ', y compris ce mois-ci', 'rec.lastPayment': 'Dernière mensualité ce mois-ci', 'rec.paidOff': 'Remboursé', 'rec.toGo': 'reste {amount}, fin {month}',
  'kind.subscription': 'Abonnement', 'kind.credit': 'Crédit / prêt', 'kind.bill': 'Facture', 'kind.other': 'Autre',
  'kind.subscriptions': 'Abonnements', 'kind.credits': 'Crédits / prêts', 'kind.bills': 'Factures', 'kind.others': 'Autres',
  'interval.1': 'Mensuel', 'interval.2': 'Tous les 2 mois', 'interval.3': 'Trimestriel', 'interval.6': 'Tous les 6 mois', 'interval.12': 'Annuel', 'interval.n': 'tous les {n} mois',
  'form.name': 'Nom', 'form.namePlaceholder': 'Netflix, Loyer, Crédit auto…', 'form.amount': 'Montant', 'form.billed': 'Fréquence', 'form.type': 'Type', 'form.dayOfMonth': 'Jour du mois', 'form.dayHint': 'Quand ça sort du compte',
  'form.dayPlaceholder': 'ex. 5', 'form.category': 'Catégorie', 'form.firstCharge': 'Premier prélèvement', 'form.fromMonth': 'À partir de', 'form.untilMonth': 'Jusqu’à', 'form.inclusive': 'Inclus', 'form.openEnded': 'Décoché = sans fin',
  'form.hasEnd': 'A un mois de fin', 'form.notePlaceholder': 'Fin de contrat, résilier avant…',
  'ins.whereToLook': 'Où regarder', 'ins.budgets': 'Budgets', 'ins.budgetsSub': 'À définir par catégorie dans les Réglages', 'ins.of': 'sur', 'ins.over': '{amount} de trop', 'ins.left': 'reste {amount}',
  'ins.byCategory': 'Par catégorie', 'ins.byCategorySub': 'Évolution par rapport au mois dernier', 'ins.noExpenses': 'Aucune dépense ce mois-ci.', 'ins.ofSpending': '{pct} des dépenses', 'ins.new': 'nouveau',
  'ins.overTime': 'Dans le temps', 'ins.sixMonths': '6 mois', 'ins.fillIn': 'Renseignez quelques mois pour voir la tendance.',
  'ins.month': 'Mois', 'ins.income': 'Revenus', 'ins.expenses': 'Dépenses', 'ins.kept': 'Gardé',
  'ins.yearNote': 'Argent gardé chaque mois de {year}. Les mois sans salaire restent vides.', 'ins.projected': ' Les mois à venir sont une projection basée sur votre salaire par défaut et vos dépenses récurrentes.',
  'ins.fixedByType': 'Charges fixes par type', 'ins.noFixed': 'Aucune charge récurrente ce mois-ci.', 'ins.total': 'Total', 'ins.other': 'Autres',
  'chart.income': 'Revenus', 'chart.expenses': 'Dépenses', 'chart.kept': 'Gardé', 'chart.trendLabel': 'Graphique des revenus et dépenses par mois',
  'rule.noIncome.t': 'Saisissez votre salaire', 'rule.noIncome.d': 'Ajoutez le salaire du mois (ou un salaire par défaut dans les Réglages) pour obtenir votre taux d’épargne et des conseils.',
  'rule.overspend.t': 'Les dépenses dépassent les revenus', 'rule.overspend.d': 'Vous dépassez votre budget de {amount} ce mois-ci.',
  'rule.belowGoal.t': 'Sous votre objectif d’épargne de {pct} %', 'rule.belowGoal.d': 'Vous gardez {rate}. Réduisez de {gap} pour atteindre l’objectif.',
  'rule.onTrack.t': 'Objectif d’épargne atteint', 'rule.onTrack.d': 'Vous gardez {rate} de vos revenus ({amount}).',
  'rule.potTooMuch.t': 'Plus mis de côté que gardé', 'rule.potTooMuch.d': '{aside} sont allés dans les cagnottes mais il ne restait que {kept} après les dépenses. Pensez à retirer {back}.',
  'rule.potNothing.t': 'Rien mis de côté pour l’instant', 'rule.potNothing.d': 'Vous avez gardé {kept} ce mois-ci. Placez-en une partie dans une cagnotte pour ne pas la dépenser.',
  'rule.budget.t': '{name} : budget dépassé', 'rule.budget.d': '{spent} dépensés sur un budget de {budget} ({pct}).',
  'rule.subs.t': 'Abonnements au-delà de 10 % des revenus', 'rule.subs.d': '{n} abonnements coûtent {total} ce mois-ci ({pct}). Résilier les trois plus petits libérerait {free}.',
  'rule.debt.t': 'Remboursements au-delà de 35 % des revenus', 'rule.debt.d': 'Les crédits prennent {pct} de vos revenus. C’est le plafond retenu par les banques ; évitez tout nouveau crédit.',
  'rule.ending.t': '{name} se termine en {month}', 'rule.ending.d': '{amount}/mois seront libérés. Pensez à les rediriger vers l’épargne.',
  'rule.yearly.t': '{name} est prélevé ce mois-ci', 'rule.yearly.d': 'Un paiement de {amount} tous les {n} mois tombe maintenant, pas chaque mois.',
  'rule.biggest.t': '{name} est votre plus gros poste', 'rule.biggest.d': '{amount}, soit {pct} des revenus. Les petites économies ailleurs pèseront moins que renégocier celui-ci.',
  'rule.spike.t': 'Dépenses en hausse par rapport aux derniers mois', 'rule.spike.d': '{now} ce mois-ci contre une moyenne de {avg} sur les {n} derniers mois.',
  'set.heading': 'Réglages', 'set.prefs': 'Préférences', 'set.currency': 'Devise', 'set.goal': 'Objectif d’épargne (% des revenus)', 'set.defaultSalary': 'Salaire par défaut', 'set.defaultSalaryHint': 'Pré-rempli pour chaque mois non modifié',
  'set.appearance': 'Apparence', 'set.auto': 'Auto', 'set.light': 'Clair', 'set.dark': 'Sombre', 'set.language': 'Langue', 'set.name': 'Votre prénom', 'set.nameHint': 'Affiché dans la salutation de l’écran Mois',
  'set.categories': 'Catégories et budgets', 'set.categoriesSub': 'Touchez-en une pour changer l’icône, la couleur ou le budget', 'set.budget': 'budget {amount}', 'set.noBudget': 'pas de budget',
  'set.backup': 'Sauvegarde', 'set.backupText': 'Vos données restent uniquement sur cet appareil. Exportez une sauvegarde pour la transférer sur votre téléphone ou en garder une copie. L’export tableur liste chaque dépense pour Excel ou Google Sheets.',
  'set.export': 'Exporter la sauvegarde', 'set.import': 'Importer une sauvegarde', 'set.csv': 'Tableur (CSV)', 'set.restored': 'Sauvegarde restaurée.', 'set.importFailed': 'Import impossible : {error}', 'set.notBackup': 'Ce n’est pas une sauvegarde Reserve',
  'set.replaceConfirm': 'Remplacer toutes les données actuelles par cette sauvegarde ?', 'set.cleared': 'Toutes les données ont été effacées.',
  'set.install': 'Installer comme application', 'set.installed': 'Vous utilisez l’application installée.',
  'set.ios1': 'Ouvrez cette page dans Safari.', 'set.ios2': 'Touchez le bouton Partager (carré avec une flèche).', 'set.ios3': 'Choisissez Sur l’écran d’accueil, puis Ajouter.',
  'set.android': 'Android (Chrome) : touchez le menu, puis Ajouter à l’écran d’accueil / Installer l’application.', 'set.windows': 'Windows (Edge ou Chrome) : cliquez sur l’icône d’installation à droite de la barre d’adresse, ou menu, Applications, Installer ce site en tant qu’application.',
  'set.exampleReset': 'Données d’exemple et réinitialisation', 'set.loadExample': 'Charger des données d’exemple', 'set.exampleConfirm': 'Remplacer les données actuelles par les données d’exemple ?', 'set.deleteAll': 'Tout supprimer',
  'set.deleteConfirm': 'Supprimer TOUTES les données de cet appareil ? Exportez d’abord une sauvegarde si vous voulez les garder.', 'set.footer': 'Reserve. Fonctionne hors ligne, sans compte, sans cloud.',
  'cat.new': 'Nouvelle catégorie', 'cat.edit': 'Modifier la catégorie', 'cat.name': 'Nom', 'cat.namePlaceholder': 'Enfants, Animaux, Café…', 'cat.icon': 'Icône', 'cat.colour': 'Couleur', 'cat.iconA': 'Icône {icon}', 'cat.colourA': 'Couleur {colour}',
  'cat.budget': 'Budget mensuel (facultatif)', 'cat.budgetHint': 'Vous serez prévenu sur les écrans Mois et Analyse en cas de dépassement', 'cat.delete': 'Supprimer la catégorie',
  'cat.deleteConfirm': '{n} dépense(s) utilisent « {name} ». Elles seront déplacées vers « Autre ». Continuer ?',
  'cat.housing': 'Logement', 'cat.utilities': 'Énergie et télécom', 'cat.groceries': 'Courses', 'cat.transport': 'Transport', 'cat.insurance': 'Assurances', 'cat.loans': 'Crédits',
  'cat.entertainment': 'Loisirs', 'cat.health': 'Santé', 'cat.restaurants': 'Restaurants', 'cat.shopping': 'Shopping', 'cat.travel': 'Voyages', 'cat.other': 'Autre', 'cat.savings': 'Épargne',
}

const dicts: Record<Language, Record<Key, string>> = { en, fr }

const fill = (s: string, params?: Record<string, string | number>) =>
  params ? s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`)) : s

export const translate = (lang: Language, key: Key, params?: Record<string, string | number>) => fill(dicts[lang][key] ?? en[key] ?? key, params)

/** Non-hook translation for library code; reads the language from the store at call time. */
export const t = (key: Key, params?: Record<string, string | number>) => translate(getState().language, key, params)

export const getLang = (): Language => getState().language
setUndoLabel(() => t('common.undo'))
export const getLocale = () => (getLang() === 'fr' ? 'fr-FR' : 'en-GB')

/** Hook: components re-render when the language changes. */
export const useT = () => {
  const { language } = useAppState()
  return (key: Key, params?: Record<string, string | number>) => translate(language, key, params)
}

export const kindLabel = (kind: RecurringKind, plural = false) =>
  t(plural ? (`kind.${kind}s` as Key) : (`kind.${kind}` as Key))

export const intervalLabel = (n: number) =>
  [1, 2, 3, 6, 12].includes(n) ? t(`interval.${n}` as Key) : t('interval.n', { n })

/** Default categories keep their English name in storage; show it translated unless the user renamed it. */
const DEFAULT_NAMES: Record<string, string> = {
  housing: 'Housing', utilities: 'Utilities', groceries: 'Groceries', transport: 'Transport', insurance: 'Insurance', loans: 'Loans',
  entertainment: 'Entertainment', health: 'Health', restaurants: 'Restaurants', shopping: 'Shopping', travel: 'Travel', other: 'Other',
}
export const categoryName = (id: string, storedName: string) =>
  DEFAULT_NAMES[id] === storedName ? t(`cat.${id}` as Key) : storedName

export const greeting = (name: string) => {
  const h = new Date().getHours()
  return t(h < 12 ? 'greet.morning' : h < 18 ? 'greet.afternoon' : 'greet.evening', { name })
}
