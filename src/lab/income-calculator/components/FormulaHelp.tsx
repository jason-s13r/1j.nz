export function FormulaHelp() {
  return (
    <div className="formula-help">
      <h3>Expense &amp; payment formula DSL</h3>
      <p>
        Amounts can be plain numbers or formulas. Formulas use JavaScript math
        syntax and have access to these variables and helper functions:
      </p>
      <ul>
        <li>
          <strong>gross</strong> — annual revenue from working days, before
          expenses
        </li>
        <li>
          <strong>taxable</strong> — annual taxable income after business
          expenses
        </li>
        <li>
          <strong>net</strong> — annual net income after tax, ACC, KiwiSaver
          and student loan deductions
        </li>
        <li>
          <strong>workdays</strong> — working days in the year, after
          non-working days
        </li>
        <li>
          <strong>offdays</strong> — non-working days in the year
        </li>
        <li>
          <strong>dayrate</strong> / <strong>hourrate</strong> — the
          full-time rate per work day / hour
        </li>
        <li>
          <strong>hours</strong> — hours in the work week
        </li>
        <li>
          <strong>min(a, b)</strong> / <strong>max(a, b)</strong> — standard
          minimum and maximum helpers
        </li>
        <li>
          <strong>round(a)</strong> — round to the nearest whole number
        </li>
      </ul>
      <p>Examples:</p>
      <ul>
        <li>
          <code>gross * 0.025</code> — set aside 2.5% of gross income
        </li>
        <li>
          <code>min(gross * 0.015, 1500)</code> — 1.5% of gross, capped at{" "}
          $1,500
        </li>
        <li>
          <code>workdays * 15</code> — $15 parking on each working day
        </li>
        <li>
          <code>2 * dayrate</code> — two days of training
        </li>
        <li>
          <code>round(hours * 0.1) * 52 * hourrate</code> — unbilled admin
          time of 10% of each work week
        </li>
        <li>
          <code>taxable * 0.1</code> — 10% of taxable income
        </li>
        <li>
          <code>net * 0.2</code> — 20% of net income
        </li>
      </ul>
    </div>
  );
}
