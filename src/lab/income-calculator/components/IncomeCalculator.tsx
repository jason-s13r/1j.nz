import { useMemo, useState } from "react";
import {
  calculate,
  Configuration,
  defaultConfiguration,
  CalculationResult,
} from "../domain/calculate";
import { formatCurrency, formatNumber } from "../utils/format";
import { BreakdownTable } from "./BreakdownTable";
import { CogIcon } from "./icons";
import { Dialog } from "./Dialog";
import { FormulaHelp } from "./FormulaHelp";
import { ItemListSection } from "./ItemListSection";
import { NonWorkingDaysSection } from "./NonWorkingDaysSection";
import { NumberInput, PercentInput } from "./NumberInput";
import { TaxConfig } from "./TaxConfig";
import { Toggle } from "./Toggle";
import "./IncomeCalculator.scss";

type DialogKey = "tax" | "esct";

function useIncomeCalculatorState() {
  const [config, setConfig] = useState<Configuration>(defaultConfiguration);
  const [dialog, setDialog] = useState<DialogKey | null>(null);

  const result = useMemo(() => calculate(config), [config]);

  const updateConfig = (patch: Partial<Configuration>) =>
    setConfig((c) => ({ ...c, ...patch }));

  const updateSection =
    <K extends "acc" | "kiwiSaver" | "studentLoan">(key: K) =>
    (patch: Partial<Configuration[K]>) =>
      setConfig((c) => ({ ...c, [key]: { ...c[key], ...patch } }));

  return {
    config,
    result,
    dialog,
    setDialog,
    updateConfig,
    updateAcc: updateSection("acc"),
    updateKiwiSaver: updateSection("kiwiSaver"),
    updateStudentLoan: updateSection("studentLoan"),
  };
}

function IncomeRateRow({
  config,
  updateConfig,
}: {
  config: Configuration;
  updateConfig: (patch: Partial<Configuration>) => void;
}) {
  return (
    <tr className="section-row">
      <td>
        <h2 className="section-title">Income Rate</h2>
      </td>
      <td colSpan={2} className="numeric">
        <div className="input-row">
          <NumberInput
            value={config.grossIncome}
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

function WorkWeekRow({
  config,
  updateConfig,
}: {
  config: Configuration;
  updateConfig: (patch: Partial<Configuration>) => void;
}) {
  return (
    <tr>
      <td>
        <span className="work-week">
          Work week:
          <NumberInput
            value={config.hoursPerWeek}
            onChange={(hoursPerWeek) => updateConfig({ hoursPerWeek })}
            suffix="hours"
            step={0.5}
            min={0}
          />
          across
          <NumberInput
            value={config.daysPerWeek}
            onChange={(daysPerWeek) => updateConfig({ daysPerWeek: Math.min(7, daysPerWeek) })}
            suffix="days"
            step={0.5}
            min={0}
            max={7}
          />
        </span>
      </td>
      <td colSpan={2} className="numeric muted">
        {formatNumber(config.daysPerWeek > 0 ? config.hoursPerWeek / config.daysPerWeek : 0)}{" "}
        hrs/day
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
            <PercentInput
              value={config.acc.earnerRate}
              onChange={(earnerRate) => updateAcc({ earnerRate })}
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
          <PercentInput
            value={config.acc.workingSaferRate}
            onChange={(workingSaferRate) => updateAcc({ workingSaferRate })}
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
          <PercentInput
            value={config.kiwiSaver.rate}
            onChange={(rate) => updateKiwiSaver({ rate })}
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
  onConfigureEsct,
}: {
  config: Configuration;
  result: CalculationResult;
  updateKiwiSaver: (patch: Partial<Configuration["kiwiSaver"]>) => void;
  onConfigureEsct: () => void;
}) {
  const kiwiSaverDisabled = !config.kiwiSaver.enabled;
  return (
    <tr
      className={
        config.kiwiSaver.enabled && config.kiwiSaver.boostEmployerContribution
          ? ""
          : "disabled"
      }
    >
      <td className="sub-row-cell">
        <span className="acc-inline-inputs">
          <Toggle
            disabled={kiwiSaverDisabled}
            checked={config.kiwiSaver.boostEmployerContribution}
            onChange={(boostEmployerContribution) =>
              updateKiwiSaver({ boostEmployerContribution })
            }
            label={
              <span
                className="acc-inline-label"
                title="Equivalent to an employer's KiwiSaver contribution, after ESCT"
              >
                Employer equivalent{" "}
                <span className="section-note">
                  (less {formatNumber(result.selfEmployed.kiwiSaverEsctRate * 100)}% ESCT)
                </span>
              </span>
            }
          />
          <button
            className="icon-button"
            onClick={onConfigureEsct}
            disabled={kiwiSaverDisabled}
            aria-label="Configure ESCT rates"
          >
            <CogIcon />
          </button>
          <PercentInput
            value={config.kiwiSaver.employerRate}
            onChange={(employerRate) => updateKiwiSaver({ employerRate })}
            disabled={kiwiSaverDisabled}
            step={0.01}
            min={0}
            max={100}
          />
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
            <PercentInput
              value={config.studentLoan.rate}
              onChange={(rate) => updateStudentLoan({ rate })}
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

function DaysOffSavingsRow({
  config,
  result,
  updateConfig,
}: {
  config: Configuration;
  result: CalculationResult;
  updateConfig: (patch: Partial<Configuration>) => void;
}) {
  const { nonWorkingDays, daysOffSavings, grossIncome: revenue } = result.selfEmployed;
  return (
    <tr className={config.daysOffSavingsEnabled ? "" : "disabled"}>
      <td>
        <Toggle
          checked={config.daysOffSavingsEnabled}
          onChange={(daysOffSavingsEnabled) => updateConfig({ daysOffSavingsEnabled })}
          label={
            <span title="Share of revenue to set aside as it comes in, so pay continues through non-working days">
              Savings for {formatNumber(nonWorkingDays)} days off{" "}
              <span className="section-note">
                ({formatNumber(revenue > 0 ? (daysOffSavings / revenue) * 100 : 0)}% of revenue)
              </span>
            </span>
          }
        />
      </td>
      <td className="numeric">{formatCurrency(daysOffSavings)}</td>
      <td></td>
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
        <td colSpan={3} className="equivalent-salary">
          <strong>{formatCurrency(result.selfEmployed.grossIncome)}</strong> self-employed
          revenue is equivalent to a{" "}
          <strong>{formatCurrency(result.employee.grossSalary)}</strong> employee salary
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

  return (
    <div className="income-calculator">
      <table className="data-table single-table">
        <tbody>
          <IncomeRateRow config={config} updateConfig={updateConfig} />
          <WorkWeekRow config={config} updateConfig={updateConfig} />

          <NonWorkingDaysSection
            items={config.nonWorkingDays}
            result={result.selfEmployed}
            onChange={(nonWorkingDays) => updateConfig({ nonWorkingDays })}
          />

          <ItemListSection
            title="Business expenses"
            items={config.expenses}
            total={result.selfEmployed.totalExpenses}
            amounts={result.selfEmployed.expenseAmounts}
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
            onConfigureEsct={() => setDialog("esct")}
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
            amounts={result.selfEmployed.deductionAmounts}
            onChange={(deductions) => updateConfig({ deductions })}
            addLabel="Add Payments"
          />
          <DaysOffSavingsRow config={config} result={result} updateConfig={updateConfig} />

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

      <Dialog
        title="ESCT Rates"
        open={dialog === "esct"}
        onClose={() => setDialog(null)}
      >
        <p className="dialog-note">
          Employer superannuation contribution tax isn't progressive: one rate applies to the
          whole employer contribution, picked by salary plus employer contributions.
        </p>
        <TaxConfig
          brackets={config.kiwiSaver.esctBrackets}
          onChange={(esctBrackets) => updateKiwiSaver({ esctBrackets })}
        />
      </Dialog>

      <BreakdownTable result={result} week={config} />
      <FormulaHelp />
    </div>
  );
}
