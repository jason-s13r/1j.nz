import { useMemo, useState } from "react";
import {
  calculate,
  Configuration,
  defaultConfiguration,
  deannualise,
  CalculationResult,
} from "../domain/calculate";
import { formatCurrency } from "../utils/format";
import { BreakdownTable } from "./BreakdownTable";
import { CogIcon } from "./icons";
import { Dialog } from "./Dialog";
import { FormulaHelp } from "./FormulaHelp";
import { ItemListSection } from "./ItemListSection";
import { NumberInput } from "./NumberInput";
import { TaxConfig } from "./TaxConfig";
import { Toggle } from "./Toggle";
import "./IncomeCalculator.scss";

type DialogKey = "tax";

function useIncomeCalculatorState() {
  const [config, setConfig] = useState<Configuration>(defaultConfiguration());
  const [dialog, setDialog] = useState<DialogKey | null>(null);

  const result = useMemo(() => calculate(config), [config]);

  const updateConfig = (patch: Partial<Configuration>) =>
    setConfig((c) => ({ ...c, ...patch }));

  const updateAcc = (patch: Partial<Configuration["acc"]>) =>
    setConfig((c) => ({ ...c, acc: { ...c.acc, ...patch } }));

  const updateKiwiSaver = (patch: Partial<Configuration["kiwiSaver"]>) =>
    setConfig((c) => ({ ...c, kiwiSaver: { ...c.kiwiSaver, ...patch } }));

  const updateStudentLoan = (patch: Partial<Configuration["studentLoan"]>) =>
    setConfig((c) => ({ ...c, studentLoan: { ...c.studentLoan, ...patch } }));

  return {
    config,
    result,
    dialog,
    setDialog,
    updateConfig,
    updateAcc,
    updateKiwiSaver,
    updateStudentLoan,
  };
}

function GrossIncomeRow({
  config,
  result,
  updateConfig,
}: {
  config: Configuration;
  result: CalculationResult;
  updateConfig: (patch: Partial<Configuration>) => void;
}) {
  const annualGross = result.selfEmployed.grossIncome;
  const displayedGross = deannualise(annualGross, config.frequency);

  return (
    <tr className="section-row">
      <td>
        <h2 className="section-title">Gross Income</h2>
      </td>
      <td colSpan={2} className="numeric">
        <div className="input-row">
          <NumberInput
            value={displayedGross}
            onChange={(grossIncome) => updateConfig({ grossIncome })}
            prefix="$"
          />
          <select
            value={config.frequency}
            onChange={(e) =>
              updateConfig({ frequency: e.target.value as Configuration["frequency"] })
            }
          >
            <option value="annual">Annual</option>
            <option value="monthly">Monthly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>
      </td>
    </tr>
  );
}

function ComparisonHeader() {
  return (
    <tr className="section-row">
      <td></td>
      <td className="numeric header-cell">
        <h2 className="section-title">Self-employed</h2>
      </td>
      <td className="numeric header-cell">
        <h2 className="section-title">Employee</h2>
      </td>
    </tr>
  );
}

function TaxableIncomeRow({ result }: { result: CalculationResult }) {
  return (
    <tr className="section-row">
      <td>
        <h2 className="section-title">Taxable Income</h2>
      </td>
      <td className="numeric">{formatCurrency(result.selfEmployed.taxableIncome)}</td>
      <td className="numeric">{formatCurrency(result.employee.taxableIncome)}</td>
    </tr>
  );
}

function AccEarnerLevyRow({
  config,
  result,
  updateAcc,
}: {
  config: Configuration;
  result: CalculationResult;
  updateAcc: (patch: Partial<Configuration["acc"]>) => void;
}) {
  return (
    <tr>
      <td>
        <span className="acc-inline-inputs">
          <span className="acc-inline-label acc-inline-label--grow">ACC earners' levy</span>
          <span className="inline-config-row">
            <NumberInput
              value={config.acc.incomeCap}
              onChange={(incomeCap) => updateAcc({ incomeCap })}
              prefix="$"
            />
            <NumberInput
              value={Number((config.acc.earnerRate * 100).toFixed(2))}
              onChange={(earnerRate) => updateAcc({ earnerRate: earnerRate / 100 })}
              suffix="%"
              step={0.01}
              min={0}
            />
          </span>
        </span>
      </td>
      <td className="numeric">{formatCurrency(result.selfEmployed.accEarnerLevy)}</td>
      <td className="numeric">{formatCurrency(result.employee.accEarnerLevy)}</td>
    </tr>
  );
}

function AccWorkLevyRow({
  config,
  result,
  updateAcc,
}: {
  config: Configuration;
  result: CalculationResult;
  updateAcc: (patch: Partial<Configuration["acc"]>) => void;
}) {
  return (
    <tr className={config.acc.workLevyEnabled ? "" : "disabled"}>
      <td>
        <span className="acc-inline-inputs acc-inline-inputs--right">
          <Toggle
            checked={config.acc.workLevyEnabled}
            onChange={(checked) => updateAcc({ workLevyEnabled: checked })}
            label={<span className="acc-inline-label">ACC work levy</span>}
          />
          <NumberInput
            value={config.acc.workLevy}
            onChange={(workLevy) => updateAcc({ workLevy })}
            prefix="$"
          />
        </span>
      </td>
      <td className="numeric">{formatCurrency(result.selfEmployed.accWorkLevy)}</td>
      <td className="numeric">-</td>
    </tr>
  );
}

function AccWorkingSaferRow({
  config,
  result,
  updateAcc,
}: {
  config: Configuration;
  result: CalculationResult;
  updateAcc: (patch: Partial<Configuration["acc"]>) => void;
}) {
  return (
    <tr className={config.acc.workingSaferEnabled ? "" : "disabled"}>
      <td>
        <span className="acc-inline-inputs acc-inline-inputs--right">
          <Toggle
            checked={config.acc.workingSaferEnabled}
            onChange={(checked) => updateAcc({ workingSaferEnabled: checked })}
            label={<span className="acc-inline-label">ACC working safer levy</span>}
          />
          <NumberInput
            value={Number((config.acc.workingSaferRate * 100).toFixed(2))}
            onChange={(workingSaferRate) =>
              updateAcc({ workingSaferRate: workingSaferRate / 100 })
            }
            suffix="%"
            step={0.01}
            min={0}
          />
        </span>
      </td>
      <td className="numeric">
        {formatCurrency(result.selfEmployed.accWorkingSaferLevy)}
      </td>
      <td className="numeric">-</td>
    </tr>
  );
}

function KiwiSaverRow({
  config,
  result,
  updateKiwiSaver,
}: {
  config: Configuration;
  result: CalculationResult;
  updateKiwiSaver: (patch: Partial<Configuration["kiwiSaver"]>) => void;
}) {
  return (
    <tr className={config.kiwiSaver.enabled ? "" : "disabled"}>
      <td>
        <span className="acc-inline-inputs">
          <Toggle
            checked={config.kiwiSaver.enabled}
            onChange={(checked) => updateKiwiSaver({ enabled: checked })}
            label={<span className="acc-inline-label">KiwiSaver</span>}
          />
          <NumberInput
            value={Number((config.kiwiSaver.rate * 100).toFixed(2))}
            onChange={(rate) => updateKiwiSaver({ rate: rate / 100 })}
            suffix="%"
            step={0.01}
            min={0}
            max={100}
          />
        </span>
      </td>
      <td className="numeric">{formatCurrency(result.selfEmployed.kiwiSaver)}</td>
      <td className="numeric">{formatCurrency(result.employee.kiwiSaver)}</td>
    </tr>
  );
}

function EmployerContributionRow({
  config,
  result,
  updateKiwiSaver,
}: {
  config: Configuration;
  result: CalculationResult;
  updateKiwiSaver: (patch: Partial<Configuration["kiwiSaver"]>) => void;
}) {
  return (
    <tr
      className={
        config.kiwiSaver.enabled && config.kiwiSaver.boostEmployerContribution
          ? ""
          : "disabled"
      }
    >
      <td>
        <span className="toggle">
          <input
            type="checkbox"
            checked={config.kiwiSaver.boostEmployerContribution}
            onChange={(e) =>
              updateKiwiSaver({ boostEmployerContribution: e.target.checked })
            }
          />
          <span className="toggle-label">Equivalent to employer contribution</span>
        </span>
      </td>
      <td className="numeric">
        {formatCurrency(result.selfEmployed.kiwiSaverEmployerContribution)}
      </td>
      <td className="numeric">-</td>
    </tr>
  );
}

function StudentLoanRow({
  config,
  result,
  updateStudentLoan,
}: {
  config: Configuration;
  result: CalculationResult;
  updateStudentLoan: (patch: Partial<Configuration["studentLoan"]>) => void;
}) {
  return (
    <tr className={config.studentLoan.enabled ? "" : "disabled"}>
      <td>
        <span className="acc-inline-inputs">
          <Toggle
            checked={config.studentLoan.enabled}
            onChange={(checked) => updateStudentLoan({ enabled: checked })}
            label={<span className="acc-inline-label">Student loan</span>}
          />
          <span className="inline-config-row">
            <NumberInput
              value={config.studentLoan.threshold}
              onChange={(threshold) => updateStudentLoan({ threshold })}
              prefix="$"
            />
            <NumberInput
              value={config.studentLoan.rate * 100}
              onChange={(rate) => updateStudentLoan({ rate: rate / 100 })}
              suffix="%"
              step={0.01}
              min={0}
              max={100}
            />
          </span>
        </span>
      </td>
      <td className="numeric">{formatCurrency(result.selfEmployed.studentLoan)}</td>
      <td className="numeric">{formatCurrency(result.employee.studentLoan)}</td>
    </tr>
  );
}

function NetIncomeRow({ result }: { result: CalculationResult }) {
  return (
    <tr className="section-row">
      <td>
        <h2 className="section-title">Net Income</h2>
      </td>
      <td className="numeric">{formatCurrency(result.selfEmployed.netIncome)}</td>
      <td className="numeric">{formatCurrency(result.employee.takeHomePay)}</td>
    </tr>
  );
}

function TakeHomeRow({ result }: { result: CalculationResult }) {
  return (
    <>
      <tr className="section-row highlight-row">
        <td>
          <h2 className="section-title">Take home pay</h2>
        </td>
        <td colSpan={2} className="numeric take-home-value">
          {formatCurrency(result.selfEmployed.takeHomePay)}
        </td>
      </tr>
      <tr className="highlight-row">
        <td colSpan={4} className="equivalent-salary">
          Equivalent employee gross salary:{" "}
          <strong>{formatCurrency(result.employee.grossSalary)}</strong>
        </td>
      </tr>
    </>
  );
}

export default function IncomeCalculator() {
  const {
    config,
    result,
    dialog,
    setDialog,
    updateConfig,
    updateAcc,
    updateKiwiSaver,
    updateStudentLoan,
  } = useIncomeCalculatorState();

  const annualGross = result.selfEmployed.grossIncome;
  const formulaContext = {
    grossIncome: annualGross,
    taxableIncome: result.selfEmployed.taxableIncome,
    netIncome: result.selfEmployed.netIncome,
  };

  return (
    <div className="income-calculator">
      <table className="data-table single-table">
        <tbody>
          <GrossIncomeRow config={config} result={result} updateConfig={updateConfig} />

          <ItemListSection
            title="Business expenses"
            items={config.expenses}
            total={result.selfEmployed.totalExpenses}
            context={formulaContext}
            onChange={(expenses) => updateConfig({ expenses })}
            addLabel="Add expense"
          />

          <ComparisonHeader />
          <TaxableIncomeRow result={result} />

          <tr>
            <td>
              <div className="label-with-action">
                <span>Income Tax</span>
                <button
                  className="icon-button"
                  onClick={() => setDialog("tax")}
                  aria-label="Configure tax brackets"
                >
                  <CogIcon />
                </button>
              </div>
            </td>
            <td className="numeric">{formatCurrency(result.selfEmployed.incomeTax)}</td>
            <td className="numeric">{formatCurrency(result.employee.incomeTax)}</td>
          </tr>

          <AccEarnerLevyRow config={config} result={result} updateAcc={updateAcc} />
          <AccWorkLevyRow config={config} result={result} updateAcc={updateAcc} />
          <AccWorkingSaferRow config={config} result={result} updateAcc={updateAcc} />
          <KiwiSaverRow config={config} result={result} updateKiwiSaver={updateKiwiSaver} />
          <EmployerContributionRow
            config={config}
            result={result}
            updateKiwiSaver={updateKiwiSaver}
          />
          <StudentLoanRow
            config={config}
            result={result}
            updateStudentLoan={updateStudentLoan}
          />
          <NetIncomeRow result={result} />

          <ItemListSection
            title="Additional Payments"
            items={config.deductions}
            total={result.selfEmployed.additionalSavings}
            context={formulaContext}
            onChange={(deductions) => updateConfig({ deductions })}
            addLabel="Add Payments"
          />

          <TakeHomeRow result={result} />
        </tbody>
      </table>

      <Dialog
        title="Income Tax Brackets"
        open={dialog === "tax"}
        onClose={() => setDialog(null)}
      >
        <TaxConfig
          brackets={config.taxBrackets}
          onChange={(taxBrackets) => updateConfig({ taxBrackets })}
        />
      </Dialog>

      <BreakdownTable result={result} />
      <FormulaHelp />
    </div>
  );
}
