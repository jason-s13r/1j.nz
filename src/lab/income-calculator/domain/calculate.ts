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

export interface FormulaContext {
  grossIncome: number;
  taxableIncome: number;
  netIncome: number;
}

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
}

export interface StudentLoanConfig {
  enabled: boolean;
  threshold: number;
  rate: number; // e.g. 0.12
}

export interface Configuration {
  grossIncome: number;
  frequency: "annual" | "monthly" | "fortnightly" | "weekly" | "daily" | "hourly";
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

const DEFAULT_KIWISAVER: KiwiSaverConfig = {
  rate: 0.035,
  enabled: true,
  boostEmployerContribution: false,
};

const DEFAULT_STUDENT_LOAN: StudentLoanConfig = {
  enabled: false,
  threshold: 24128,
  rate: 0.12,
};

export const DEFAULT_HOURS_WEEK = 40;

export function defaultConfiguration(): Configuration {
  return {
    grossIncome: 200000,
    frequency: "annual",
    expenses: [
      { id: "accountant", name: "Accountant", amount: 1500, formula: "min(gross * 0.015, 1500)", enabled: true },
      { id: "insurance", name: "Insurance", amount: 1000, enabled: true },
      { id: "phone-plan", name: "Phone plan", amount: 520, enabled: false },
    ],
    deductions: [
      { id: 'annual-leave', name: '4 weeks annual leave (savings)', amount: 0, formula: 'gross * 4 / 52', enabled: true },
      { id: 'sick-leave', name: '2 weeks sick leave (savings)', amount: 0, formula: 'gross * 2 / 52', enabled: true },
      { id: "expense-fund", name: "Funds set aside for Business Expenses (savings)", amount: 0, formula: "gross * 0.025", enabled: false },
    ],
    taxBrackets: DEFAULT_TAX_BRACKETS,
    acc: DEFAULT_ACC,
    kiwiSaver: DEFAULT_KIWISAVER,
    studentLoan: DEFAULT_STUDENT_LOAN,
  };
}

export function annualise(amount: number, frequency: "annual" | "monthly" | "fortnightly" | "weekly" | "daily" | "hourly"): number {
  switch (frequency) {
    case "monthly":
      return amount * 12;
    case "fortnightly":
      return amount * 26;
    case "weekly":
      return amount * 52;
    case "daily":
      return amount * 365;
    case "hourly":
      return annualise(amount * DEFAULT_HOURS_WEEK, 'weekly');
    default:
      return amount;
  }
}

export function deannualise(amount: number, frequency: "annual" | "monthly" | "fortnightly" | "weekly" | "daily" | "hourly"): number {
  switch (frequency) {
    case "monthly":
      return amount / 12;
    case "fortnightly":
      return amount / 26;
    case "weekly":
      return amount / 52;
    case "daily":
      return amount / 365;
    case "hourly":
      return deannualise(amount, 'weekly') / DEFAULT_HOURS_WEEK;
    default:
      return amount;
  }
}

function parseFormula(formula: string, context: FormulaContext): number {
  let pos = 0;
  const text = formula;

  const peek = () => text[pos];
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
        if (name !== "min" && name !== "max") {
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
        return name === "min" ? Math.min(...args) : Math.max(...args);
      }

      switch (name) {
        case "gross":
          return context.grossIncome;
        case "taxable":
          return context.taxableIncome;
        case "net":
          return context.netIncome;
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

export function calculateIncomeTax(taxableIncome: number, brackets: TaxBrackets): number {
  let tax = 0;
  const list = brackets.brackets;
  for (let i = 0; i < list.length; i++) {
    const { threshold, rate } = list[i];
    if (taxableIncome <= threshold) break;
    const nextThreshold = i + 1 < list.length ? list[i + 1].threshold : Infinity;
    const band = Math.min(taxableIncome, nextThreshold) - threshold;
    if (band > 0) {
      tax += band * rate;
    }
  }
  return tax;
}

export interface SelfEmployedResult {
  grossIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  incomeTax: number;
  accEarnerLevy: number;
  accWorkLevy: number;
  accWorkingSaferLevy: number;
  kiwiSaver: number;
  kiwiSaverEmployerContribution: number;
  studentLoan: number;
  totalDeductions: number;
  netIncome: number;
  additionalSavings: number;
  takeHomePay: number;
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
  const annualGross = annualise(config.grossIncome, config.frequency);

  // First pass: compute expenses using gross income context.
  const expensesWithFormula = config.expenses.map((e) => {
    if (!e.enabled || !e.formula) return { ...e, computedAmount: e.amount };
    const computedAmount = evaluateFormula(
      e.formula,
      { grossIncome: annualGross, taxableIncome: annualGross, netIncome: annualGross },
      e.amount
    );
    return { ...e, computedAmount };
  });
  const totalExpenses = expensesWithFormula
    .filter((e) => e.enabled)
    .reduce((sum, e) => sum + e.computedAmount, 0);
  const taxableIncome = annualGross - totalExpenses;

  // Second pass: recompute formula-based expenses using taxable income context.
  const finalExpenses = expensesWithFormula.map((e) => {
    if (!e.enabled || !e.formula) return { ...e, computedAmount: e.amount };
    const computedAmount = evaluateFormula(
      e.formula,
      { grossIncome: annualGross, taxableIncome, netIncome: taxableIncome },
      e.amount
    );
    return { ...e, computedAmount };
  });
  const finalTotalExpenses = finalExpenses
    .filter((e) => e.enabled)
    .reduce((sum, e) => sum + e.computedAmount, 0);
  const finalTaxableIncome = annualGross - finalTotalExpenses;

  const incomeTax = calculateIncomeTax(finalTaxableIncome, config.taxBrackets);
  const accEarnerLevy = Math.min(Math.max(0, finalTaxableIncome), config.acc.incomeCap) * config.acc.earnerRate;
  const accWorkLevy = config.acc.workLevyEnabled ? config.acc.workLevy : 0;
  const accWorkingSaferLevy = config.acc.workingSaferEnabled
    ? Math.max(0, finalTaxableIncome) * config.acc.workingSaferRate
    : 0;
  const employeeKiwiSaver = config.kiwiSaver.enabled ? Math.max(0, finalTaxableIncome) * config.kiwiSaver.rate : 0;
  const employerKiwiSaver = config.kiwiSaver.enabled && config.kiwiSaver.boostEmployerContribution
    ? Math.max(0, finalTaxableIncome - incomeTax) * config.kiwiSaver.rate
    : 0;
  const kiwiSaver = employeeKiwiSaver;
  const kiwiSaverEmployerContribution = employerKiwiSaver;
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

  const deductionsWithFormula = config.deductions.map((d) => {
    if (!d.enabled || !d.formula) return { ...d, computedAmount: d.amount };
    const computedAmount = evaluateFormula(
      d.formula,
      { grossIncome: annualGross, taxableIncome: finalTaxableIncome, netIncome },
      d.amount
    );
    return { ...d, computedAmount };
  });
  const additionalSavings = deductionsWithFormula
    .filter((d) => d.enabled)
    .reduce((sum, d) => sum + d.computedAmount, 0);
  const takeHomePay = netIncome - additionalSavings;

  return {
    grossIncome: annualGross,
    totalExpenses: finalTotalExpenses,
    taxableIncome: finalTaxableIncome,
    incomeTax,
    accEarnerLevy,
    accWorkLevy,
    accWorkingSaferLevy,
    kiwiSaver,
    kiwiSaverEmployerContribution,
    studentLoan,
    totalDeductions,
    netIncome,
    additionalSavings,
    takeHomePay,
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
  const annualGross = annualise(config.grossIncome, config.frequency);
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
