import { CalculationResult, deannualise, Frequency, WorkWeek } from "../domain/calculate";
import { formatCurrency, frequencies, frequencyLabels } from "../utils/format";

interface BreakdownTableProps {
  result: CalculationResult;
  week: WorkWeek;
}

export function BreakdownTable({ result, week }: BreakdownTableProps) {
  // Annual totals only accrue on working days, so every column but the year is
  // per worked period: spread over the worked share of the year, not all of it.
  // That keeps the entered rate in its own column and hour x hours/day = day, etc.
  const { workingDays, nonWorkingDays, totalWorkDays } = result.selfEmployed;
  const perPeriod = (annual: number, frequency: Frequency) => {
    if (frequency === "annual") return annual;
    if (workingDays <= 0) return 0;
    return deannualise(annual * (totalWorkDays / workingDays), frequency, week);
  };

  const rows = [
    {
      key: "gross",
      label: "Gross Pay",
      values: result.selfEmployed.grossIncome,
      className: "subtotal-row",
    },
    {
      key: "expenses",
      label: "Expenses",
      values: result.selfEmployed.totalExpenses,
    },
    {
      key: "taxableIncome",
      label: "Taxable Income",
      values: result.selfEmployed.taxableIncome,
      className: "subtotal-row",
    },
    {
      key: "incomeTax",
      label: "TAX",
      values: result.selfEmployed.incomeTax,
    },
    {
      key: "acc",
      label: "ACC",
      values:
        result.selfEmployed.accEarnerLevy +
        result.selfEmployed.accWorkLevy +
        result.selfEmployed.accWorkingSaferLevy,
    },
    {
      key: "kiwiSaver",
      label: "KiwiSaver",
      values: result.selfEmployed.kiwiSaver + result.selfEmployed.kiwiSaverEmployerContribution,
    },
    {
      key: "studentLoan",
      label: "Student Loan",
      values: result.selfEmployed.studentLoan,
    },
    {
      key: "netIncome",
      label: "Net Income",
      values: result.selfEmployed.netIncome,
      className: "subtotal-row",
    },
    {
      key: "payments",
      label: "Payments",
      values: result.selfEmployed.otherPayments,
    },
    {
      key: "daysOffSavings",
      label: "Days Off Savings",
      values: result.selfEmployed.additionalSavings - result.selfEmployed.otherPayments,
    },
    {
      key: "takeHome",
      label: "Take Home Pay",
      values: result.selfEmployed.takeHomePay,
      className: "highlight-row",
    },
  ];

  return (
    <table className="data-table breakdown-table">
      <caption>
        Hour, Day, Week, Fortnight and Month show a period of work with no time off. Year is
        the total for the {workingDays} days you work.
        Days Off Savings is set aside while working to pay the same take home pay on the{" "}
        {nonWorkingDays} days off.
      </caption>
      <thead>
        <tr>
          <th></th>
          {frequencies.map((f) => (
            <th key={f} className="numeric">{frequencyLabels[f]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className={row.className}>
            <td>
              <span className="breakdown-row-label">{row.label}</span>
            </td>
            {frequencies.map((f) => (
              <td key={f} className="numeric">
                {formatCurrency(perPeriod(row.values, f))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
