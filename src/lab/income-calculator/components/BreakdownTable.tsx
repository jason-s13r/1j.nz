import { CalculationResult, deannualise, WorkWeek } from "../domain/calculate";
import { formatCurrency, frequencies, frequencyLabels } from "../utils/format";

interface BreakdownTableProps {
  result: CalculationResult;
  week: WorkWeek;
}

export function BreakdownTable({ result, week }: BreakdownTableProps) {
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
      values: result.selfEmployed.additionalSavings,
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
                {formatCurrency(deannualise(row.values, f, week))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
