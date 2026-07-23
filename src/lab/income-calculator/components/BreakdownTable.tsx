import { CalculationResult, deannualise } from "../domain/calculate";
import { formatCurrency, frequencies, frequencyLabels } from "../utils/format";

interface BreakdownTableProps {
  result: CalculationResult;
}

export function BreakdownTable({ result }: BreakdownTableProps) {
  const rows = [
    {
      key: "gross",
      label: "Gross Pay",
      values: result.selfEmployed.grossIncome,
      enabled: true,
    },
    {
      key: "expenses",
      label: "Expenses",
      values: result.selfEmployed.totalExpenses,
      enabled: true,
    },
    {
      key: "incomeTax",
      label: "TAX",
      values: result.selfEmployed.incomeTax,
      enabled: true,
    },
    {
      key: "acc",
      label: "ACC",
      values:
        result.selfEmployed.accEarnerLevy +
        result.selfEmployed.accWorkLevy +
        result.selfEmployed.accWorkingSaferLevy,
      enabled: true,
    },
    {
      key: "kiwiSaver",
      label: "KiwiSaver",
      values: result.selfEmployed.kiwiSaver + result.selfEmployed.kiwiSaverEmployerContribution,
      enabled: true,
    },
    {
      key: "studentLoan",
      label: "Student Loan",
      values: result.selfEmployed.studentLoan,
      enabled: true,
    },
    {
      key: "payments",
      label: "Payments",
      values: result.selfEmployed.additionalSavings,
      enabled: true,
    },
    {
      key: "takeHome",
      label: "Take Home Pay",
      values: result.selfEmployed.takeHomePay,
      enabled: true,
      highlight: true,
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
          <tr key={row.key} className={row.highlight ? "highlight-row" : ""}>
            <td>
              <span className="breakdown-row-label">{row.label}</span>
            </td>
            {frequencies.map((f) => (
              <td key={f} className="numeric">
                {formatCurrency(deannualise(row.values, f))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
