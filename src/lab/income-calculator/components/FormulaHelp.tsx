export function FormulaHelp() {
  return (
    <div className="formula-help">
      <h3>Expense &amp; payment formula DSL</h3>
      <p>
        Amounts can be plain numbers or formulas. Formulas use JavaScript math
        syntax and have access to two variables and two helper functions:
      </p>
      <ul>
        <li>
          <strong>gross</strong> — annual gross income before expenses
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
          <strong>min(a, b)</strong> / <strong>max(a, b)</strong> — standard
          minimum and maximum helpers
        </li>
      </ul>
      <p>Examples:</p>
      <ul>
        <li>
          <code>gross * 0.025</code> — set aside 2.5% of gross income
        </li>
        <li>
          <code>gross * 4 / 52</code> — four weeks of gross pay
        </li>
        <li>
          <code>min(gross * 0.015, 1500)</code> — 1.5% of gross, capped at{" "}
          $1,500
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
