export interface Expense {
  id: string;
  name: string;
  amount: number;
  formula?: string;
  enabled: boolean;
}

export interface Deduction {
  id: string;
  name: string;
  amount: number;
  formula?: string;
  enabled: boolean;
}

export interface NonWorkingDay {
  id: string;
  name: string;
  days: number;
  enabled: boolean;
}

export interface WorkContext {
  workingDays: number;
  nonWorkingDays: number;
  dayRate: number;
  hourRate: number;
  hoursPerWeek: number;
}

export interface FormulaContext extends WorkContext {
  grossIncome: number;
  taxableIncome: number;
  netIncome: number;
}

const FORMULA_FUNCTIONS: Record<string, { arity?: number; fn: (...args: number[]) => number }> = {
  min: { fn: Math.min },
  max: { fn: Math.max },
  round: { arity: 1, fn: Math.round },
};

export type LineItem = Expense | Deduction;

export interface TaxBrackets {
  brackets: Array<{ threshold: number; rate: number }>;
}

export interface AccConfig {
  earnerRate: number; // e.g. 0.0175
  incomeCap: number; // e.g. 156641
  workLevy: number; // e.g. 501
  workLevyEnabled: boolean;
  workingSaferRate: number; // e.g. 0.0008
  workingSaferEnabled: boolean;
}

export interface KiwiSaverConfig {
  rate: number; // e.g. 0.04
  enabled: boolean;
  boostEmployerContribution: boolean;
  employerRate: number; // e.g. 0.035, before ESCT
  esctBrackets: TaxBrackets; // flat rate on the whole contribution, by salary + contribution
}

export interface StudentLoanConfig {
  enabled: boolean;
  threshold: number;
  rate: number; // e.g. 0.12
}

export interface WorkWeek {
  hoursPerWeek: number;
  daysPerWeek: number;
}

export type Frequency = "annual" | "monthly" | "fortnightly" | "weekly" | "daily" | "hourly";

export interface Configuration {
  grossIncome: number;
  frequency: Frequency;
  hoursPerWeek: number;
  daysPerWeek: number;
  nonWorkingDays: NonWorkingDay[];
  daysOffSavingsEnabled: boolean;
  expenses: Expense[];
  deductions: Deduction[];
  taxBrackets: TaxBrackets;
  acc: AccConfig;
  kiwiSaver: KiwiSaverConfig;
  studentLoan: StudentLoanConfig;
}

const DEFAULT_TAX_BRACKETS: TaxBrackets = {
  brackets: [
    { threshold: 0, rate: 0.105 },
    { threshold: 15600, rate: 0.175 },
    { threshold: 53500, rate: 0.30 },
    { threshold: 78100, rate: 0.33 },
    { threshold: 180000, rate: 0.39 },
  ],
};

const DEFAULT_ACC: AccConfig = {
  earnerRate: 0.0175,
  incomeCap: 156641,
  workLevy: 501,
  workLevyEnabled: true,
  workingSaferRate: 0.0008,
  workingSaferEnabled: true,
};

// ESCT rate thresholds from 1 April 2025.
const DEFAULT_ESCT_BRACKETS: TaxBrackets = {
  brackets: [
    { threshold: 0, rate: 0.105 },
    { threshold: 18720, rate: 0.175 },
    { threshold: 64200, rate: 0.30 },
    { threshold: 93720, rate: 0.33 },
    { threshold: 216000, rate: 0.39 },
  ],
};

// Minimum employee and compulsory employer rates from 1 April 2026.
const DEFAULT_KIWISAVER: KiwiSaverConfig = {
  rate: 0.035,
  enabled: true,
  boostEmployerContribution: true,
  employerRate: 0.035,
  esctBrackets: DEFAULT_ESCT_BRACKETS,
};

const DEFAULT_STUDENT_LOAN: StudentLoanConfig = {
  enabled: false,
  threshold: 24128,
  rate: 0.12,
};

export const WEEKS_YEAR = 52;
export const DEFAULT_WORK_WEEK: WorkWeek = { hoursPerWeek: 40, daysPerWeek: 5 };

export const workDaysYear = (week: WorkWeek) => week.daysPerWeek * WEEKS_YEAR;

export function defaultConfiguration(): Configuration {
  return {
    grossIncome: 100,
    frequency: "hourly",
    ...DEFAULT_WORK_WEEK,
    nonWorkingDays: [
      { id: "annual-leave", name: "4 weeks annual leave", days: 20, enabled: true },
      { id: "sick-leave", name: "10 days sick leave", days: 10, enabled: true },
      { id: "public-holidays", name: "Public holidays", days: 12, enabled: true },
      { id: "between-contracts", name: "Days between contracts", days: 18, enabled: false },
    ],
    daysOffSavingsEnabled: true,
    expenses: [
      { id: "accountant", name: "Accountant", amount: 1500, formula: "min(gross * 0.015, 1500)", enabled: false },
      { id: "insurance", name: "Insurance", amount: 1000, enabled: false },
      { id: "phone-plan", name: "Phone plan", amount: 520, enabled: false },
    ],
    deductions: [
      { id: "expense-fund", name: "Funds set aside for Business Expenses (savings)", amount: 0, formula: "gross * 0.025", enabled: false },
    ],
    taxBrackets: DEFAULT_TAX_BRACKETS,
    acc: DEFAULT_ACC,
    kiwiSaver: DEFAULT_KIWISAVER,
    studentLoan: DEFAULT_STUDENT_LOAN,
  };
}

export function annualise(amount: number, frequency: Frequency, week: WorkWeek = DEFAULT_WORK_WEEK): number {
  switch (frequency) {
    case "monthly":
      return amount * 12;
    case "fortnightly":
      return amount * 26;
    case "weekly":
      return amount * WEEKS_YEAR;
    case "daily":
      return amount * workDaysYear(week);
    case "hourly":
      return annualise(amount * week.hoursPerWeek, 'weekly');
    default:
      return amount;
  }
}

export function deannualise(amount: number, frequency: Frequency, week: WorkWeek = DEFAULT_WORK_WEEK): number {
  switch (frequency) {
    case "monthly":
      return amount / 12;
    case "fortnightly":
      return amount / 26;
    case "weekly":
      return amount / WEEKS_YEAR;
    case "daily":
      return week.daysPerWeek > 0 ? amount / workDaysYear(week) : 0;
    case "hourly":
      return week.hoursPerWeek > 0 ? deannualise(amount, 'weekly') / week.hoursPerWeek : 0;
    default:
      return amount;
  }
}

function parseFormula(formula: string, context: FormulaContext): number {
  let pos = 0;
  const text = formula;

  const peek = () => text[pos] ?? "";
  const consume = (expected?: string) => {
    if (expected && text[pos] !== expected) {
      throw new Error(`Expected ${expected} at position ${pos}`);
    }
    return text[pos++];
  };
  const skipWhitespace = () => {
    while (/\s/.test(peek())) pos++;
  };

  const parseExpression = (): number => {
    let value = parseTerm();
    while (true) {
      skipWhitespace();
      const op = peek();
      if (op === "+" || op === "-") {
        pos++;
        const right = parseTerm();
        value = op === "+" ? value + right : value - right;
      } else {
        break;
      }
    }
    return value;
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    while (true) {
      skipWhitespace();
      const op = peek();
      if (op === "*" || op === "/" || op === "%") {
        pos++;
        const right = parseFactor();
        if (op === "*") value = value * right;
        else if (op === "/") value = value / right;
        else value = value % right;
      } else {
        break;
      }
    }
    return value;
  };

  const parseFactor = (): number => {
    skipWhitespace();
    let sign = 1;
    while (peek() === "+" || peek() === "-") {
      if (consume() === "-") sign = -sign;
    }
    const value = parsePrimary();
    return sign * value;
  };

  const parsePrimary = (): number => {
    skipWhitespace();
    const char = peek();

    if (char === "(") {
      pos++;
      const value = parseExpression();
      skipWhitespace();
      consume(")");
      return value;
    }

    if (/\d/.test(char) || char === ".") {
      const start = pos;
      while (/\d/.test(peek())) pos++;
      if (peek() === ".") {
        pos++;
        while (/\d/.test(peek())) pos++;
      }
      const value = parseFloat(text.slice(start, pos));
      if (Number.isNaN(value)) throw new Error("Invalid number");
      return value;
    }

    if (/[a-zA-Z_]/.test(char)) {
      const start = pos;
      while (/[a-zA-Z0-9_]/.test(peek())) pos++;
      const name = text.slice(start, pos);
      skipWhitespace();

      if (peek() === "(") {
        const func = FORMULA_FUNCTIONS[name];
        if (!func) {
          throw new Error(`Unknown function: ${name}`);
        }
        pos++;
        const args: number[] = [];
        if (peek() !== ")") {
          args.push(parseExpression());
          while (true) {
            skipWhitespace();
            if (peek() === ",") {
              pos++;
              args.push(parseExpression());
            } else {
              break;
            }
          }
        }
        consume(")");
        if (args.length === 0) throw new Error(`${name} requires at least one argument`);
        if (func.arity !== undefined && args.length !== func.arity) {
          throw new Error(`${name} takes ${func.arity} argument(s)`);
        }
        return func.fn(...args);
      }

      switch (name) {
        case "gross":
          return context.grossIncome;
        case "taxable":
          return context.taxableIncome;
        case "net":
          return context.netIncome;
        case "workdays":
          return context.workingDays;
        case "offdays":
          return context.nonWorkingDays;
        case "dayrate":
          return context.dayRate;
        case "hourrate":
          return context.hourRate;
        case "hours":
          return context.hoursPerWeek;
        default:
          throw new Error(`Unknown variable: ${name}`);
      }
    }

    throw new Error(`Unexpected character: ${char}`);
  };

  const result = parseExpression();
  skipWhitespace();
  if (pos !== text.length) throw new Error(`Unexpected character at position ${pos}`);
  return result;
}

export function evaluateFormula(
  formula: string | undefined,
  context: FormulaContext,
  fallback: number
): number {
  if (!formula || !formula.trim()) return fallback;
  try {
    const result = parseFormula(formula, context);
    return Number.isFinite(result) ? result : fallback;
  } catch {
    return fallback;
  }
}

// Brackets can be edited in any order, so sort by threshold before applying them.
function sortedBrackets(brackets: TaxBrackets) {
  return [...brackets.brackets].sort((a, b) => a.threshold - b.threshold);
}

export function calculateIncomeTax(taxableIncome: number, brackets: TaxBrackets): number {
  let tax = 0;
  const list = sortedBrackets(brackets);
  for (let i = 0; i < list.length; i++) {
    const { threshold, rate } = list[i];
    if (taxableIncome <= threshold) break;
    const nextThreshold = i + 1 < list.length ? list[i + 1].threshold : Infinity;
    tax += (Math.min(taxableIncome, nextThreshold) - threshold) * rate;
  }
  return tax;
}

export function calculateEsctRate(salary: number, contribution: number, brackets: TaxBrackets): number {
  // ESCT isn't progressive: one rate applies to the whole employer contribution,
  // picked by the employee's salary plus that contribution.
  const threshold = salary + contribution;
  const list = sortedBrackets(brackets);
  let rate = list[0]?.rate ?? 0;
  for (const bracket of list) {
    if (threshold > bracket.threshold) rate = bracket.rate;
  }
  return rate;
}

// Amount of every item (for display, enabled or not) and the total of the enabled ones.
function evaluateItems(items: LineItem[], context: FormulaContext) {
  const amounts: Record<string, number> = {};
  let total = 0;
  for (const item of items) {
    const amount = evaluateFormula(item.formula, context, item.amount);
    amounts[item.id] = amount;
    if (item.enabled) total += amount;
  }
  return { amounts, total };
}

export interface SelfEmployedResult {
  potentialIncome: number;
  dayRate: number;
  hourRate: number;
  totalWorkDays: number;
  nonWorkingDays: number;
  workingDays: number;
  lostRevenue: number;
  grossIncome: number;
  totalExpenses: number;
  expenseAmounts: Record<string, number>;
  taxableIncome: number;
  incomeTax: number;
  accEarnerLevy: number;
  accWorkLevy: number;
  accWorkingSaferLevy: number;
  kiwiSaver: number;
  kiwiSaverEmployerContribution: number;
  kiwiSaverEsctRate: number;
  studentLoan: number;
  totalDeductions: number;
  netIncome: number;
  otherPayments: number;
  additionalSavings: number;
  deductionAmounts: Record<string, number>;
  takeHomePay: number;
  daysOffSavings: number;
}

export interface EmployeeResult {
  grossSalary: number;
  taxableIncome: number;
  incomeTax: number;
  accEarnerLevy: number;
  kiwiSaver: number;
  studentLoan: number;
  totalDeductions: number;
  takeHomePay: number;
}

export interface CalculationResult {
  selfEmployed: SelfEmployedResult;
  employee: EmployeeResult;
}

export function calculateSelfEmployed(config: Configuration): SelfEmployedResult {
  // The entered rate assumes every work day is worked; revenue only comes from
  // the days left after leave, holidays and gaps between contracts.
  const potentialIncome = annualise(config.grossIncome, config.frequency, config);
  const totalWorkDays = workDaysYear(config);
  const nonWorkingDays = Math.min(
    totalWorkDays,
    config.nonWorkingDays
      .filter((d) => d.enabled)
      .reduce((sum, d) => sum + Math.max(0, d.days), 0)
  );
  const workingDays = totalWorkDays - nonWorkingDays;
  const dayRate = totalWorkDays > 0 ? potentialIncome / totalWorkDays : 0;
  const lostRevenue = dayRate * nonWorkingDays;
  const annualGross = potentialIncome - lostRevenue;
  const hourRate = config.hoursPerWeek > 0 ? potentialIncome / WEEKS_YEAR / config.hoursPerWeek : 0;
  const work: WorkContext = {
    workingDays,
    nonWorkingDays,
    dayRate,
    hourRate,
    hoursPerWeek: config.hoursPerWeek,
  };

  // First pass: compute expenses using gross income context.
  const { total: totalExpenses } = evaluateItems(config.expenses, {
    ...work,
    grossIncome: annualGross,
    taxableIncome: annualGross,
    netIncome: annualGross,
  });
  const taxableIncome = annualGross - totalExpenses;

  // Second pass: recompute formula-based expenses using taxable income context.
  const { amounts: expenseAmounts, total: finalTotalExpenses } = evaluateItems(config.expenses, {
    ...work,
    grossIncome: annualGross,
    taxableIncome,
    netIncome: taxableIncome,
  });
  const finalTaxableIncome = annualGross - finalTotalExpenses;

  const incomeTax = calculateIncomeTax(finalTaxableIncome, config.taxBrackets);
  const positiveIncome = Math.max(0, finalTaxableIncome);
  const accEarnerLevy = Math.min(positiveIncome, config.acc.incomeCap) * config.acc.earnerRate;
  const accWorkLevy = config.acc.workLevyEnabled ? config.acc.workLevy : 0;
  const accWorkingSaferLevy = config.acc.workingSaferEnabled
    ? positiveIncome * config.acc.workingSaferRate
    : 0;
  const kiwiSaver = config.kiwiSaver.enabled ? positiveIncome * config.kiwiSaver.rate : 0;
  // What an employer would pay into KiwiSaver on an equivalent salary, after ESCT.
  const employerKiwiSaverGross = positiveIncome * config.kiwiSaver.employerRate;
  const kiwiSaverEsctRate = calculateEsctRate(
    positiveIncome,
    employerKiwiSaverGross,
    config.kiwiSaver.esctBrackets
  );
  const kiwiSaverEmployerContribution = config.kiwiSaver.enabled && config.kiwiSaver.boostEmployerContribution
    ? employerKiwiSaverGross * (1 - kiwiSaverEsctRate)
    : 0;
  const studentLoan =
    config.studentLoan.enabled && finalTaxableIncome > config.studentLoan.threshold
      ? (finalTaxableIncome - config.studentLoan.threshold) * config.studentLoan.rate
      : 0;

  const totalDeductions =
    incomeTax +
    accEarnerLevy +
    accWorkLevy +
    accWorkingSaferLevy +
    kiwiSaver +
    kiwiSaverEmployerContribution +
    studentLoan;
  const netIncome = finalTaxableIncome - totalDeductions;

  const { amounts: deductionAmounts, total: otherPayments } = evaluateItems(config.deductions, {
    ...work,
    grossIncome: annualGross,
    taxableIncome: finalTaxableIncome,
    netIncome,
  });
  // Pay is only earned on working days; this is the share of it to set aside
  // so pay continues through the non-working days, like an employee's would.
  const daysOffSavings = totalWorkDays > 0
    ? ((netIncome - otherPayments) / totalWorkDays) * nonWorkingDays
    : 0;
  const additionalSavings = otherPayments + (config.daysOffSavingsEnabled ? daysOffSavings : 0);
  const takeHomePay = netIncome - additionalSavings;

  return {
    potentialIncome,
    dayRate,
    hourRate,
    totalWorkDays,
    nonWorkingDays,
    workingDays,
    lostRevenue,
    grossIncome: annualGross,
    totalExpenses: finalTotalExpenses,
    expenseAmounts,
    taxableIncome: finalTaxableIncome,
    incomeTax,
    accEarnerLevy,
    accWorkLevy,
    accWorkingSaferLevy,
    kiwiSaver,
    kiwiSaverEmployerContribution,
    kiwiSaverEsctRate,
    studentLoan,
    totalDeductions,
    netIncome,
    otherPayments,
    additionalSavings,
    deductionAmounts,
    takeHomePay,
    daysOffSavings,
  };
}

function employeeDeductions(grossSalary: number, config: Configuration) {
  const taxableIncome = grossSalary;
  const incomeTax = calculateIncomeTax(taxableIncome, config.taxBrackets);
  const accEarnerLevy = Math.min(Math.max(0, taxableIncome), config.acc.incomeCap) * config.acc.earnerRate;
  const kiwiSaver = config.kiwiSaver.enabled ? Math.max(0, taxableIncome) * config.kiwiSaver.rate : 0;
  const studentLoan =
    config.studentLoan.enabled && taxableIncome > config.studentLoan.threshold
      ? (taxableIncome - config.studentLoan.threshold) * config.studentLoan.rate
      : 0;
  const totalDeductions = incomeTax + accEarnerLevy + kiwiSaver + studentLoan;
  const takeHomePay = grossSalary - totalDeductions;
  return { taxableIncome, incomeTax, accEarnerLevy, kiwiSaver, studentLoan, totalDeductions, takeHomePay };
}

export function calculateEmployee(targetTakeHome: number, config: Configuration): EmployeeResult {
  // Solve gross salary such that take-home equals targetTakeHome.
  // Deductions are monotonic in gross salary, so binary search.
  // The employee equivalent can never exceed the self-employed annual gross,
  // so use that as a sensible upper-bound floor instead of an arbitrary number.
  const annualGross = annualise(config.grossIncome, config.frequency, config);
  let low = 0;
  let high = Math.max(targetTakeHome * 2, annualGross);
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const { takeHomePay } = employeeDeductions(mid, config);
    if (takeHomePay < targetTakeHome) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const grossSalary = (low + high) / 2;
  return { grossSalary, ...employeeDeductions(grossSalary, config) };
}

export function calculate(config: Configuration): CalculationResult {
  const selfEmployed = calculateSelfEmployed(config);
  const employee = calculateEmployee(selfEmployed.takeHomePay, config);
  return { selfEmployed, employee };
}
