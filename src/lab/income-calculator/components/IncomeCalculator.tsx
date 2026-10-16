import { useMemo, useState } from "react";
import {
  calculate,
  Configuration,
  defaultConfiguration,
  CalculationResult,
  Frequency,
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
type SectionKey = "acc" | "kiwiSaver" | "studentLoan";
type UpdateConfig = (patch: Partial<Configuration>) => void;
type UpdateSection<K extends SectionKey> = (patch: Partial<Configuration[K]>) => void;

interface RowProps {
  config: Configuration;
  result: CalculationResult;
}

function useIncomeCalculatorState() {
  const [config, setConfig] = useState<Configuration>(defaultConfiguration);
  const [dialog, setDialog] = useState<DialogKey | null>(null);

  const result = useMemo(() => calculate(config), [config]);

  const updateConfig: UpdateConfig = (patch) => setConfig((c) => ({ ...c, ...patch }));

  const updateSection =
    <K extends SectionKey>(key: K): UpdateSection<K> =>
    (patch) =>
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

// A label cell, then the self-employed and employee amounts. Leave out
// employee for amounts only the self-employed pay.
function ComparisonRow({
  label,
  selfEmployed,
  employee,
  enabled = true,
  className,
  labelClassName,
}: {
  label: React.ReactNode;
  selfEmployed: number;
  employee?: number;
  enabled?: boolean;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <tr className={[className, enabled ? "" : "disabled"].filter(Boolean).join(" ")}>
      <td className={labelClassName}>{label}</td>
      <td className="numeric">{formatCurrency(selfEmployed)}</td>
      <td className="numeric">{employee === undefined ? "-" : formatCurrency(employee)}</td>
    </tr>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}

function IncomeRateRow({ config, updateConfig }: { config: Configuration; updateConfig: UpdateConfig }) {
  return (
    <tr className="section-row">
      <td>
        <SectionTitle>Income Rate</SectionTitle>
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
            onChange={(e) => updateConfig({ frequency: e.target.value as Frequency })}
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

function WorkWeekRow({ config, updateConfig }: { config: Configuration; updateConfig: UpdateConfig }) {
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
        <SectionTitle>Self-employed</SectionTitle>
      </td>
      <td className="numeric header-cell">
        <SectionTitle>Employee</SectionTitle>
      </td>
    </tr>
  );
}

function IncomeTaxRow({ result, onConfigure }: { result: CalculationResult; onConfigure: () => void }) {
  return (
    <ComparisonRow
      label={
        <div className="label-with-action">
          <span>Income Tax</span>
          <button className="icon-button" onClick={onConfigure} aria-label="Configure tax brackets">
            <CogIcon />
          </button>
        </div>
      }
      selfEmployed={result.selfEmployed.incomeTax}
      employee={result.employee.incomeTax}
    />
  );
}

function AccEarnerLevyRow({ config, result, updateAcc }: RowProps & { updateAcc: UpdateSection<"acc"> }) {
  return (
    <ComparisonRow
      label={
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
      }
      selfEmployed={result.selfEmployed.accEarnerLevy}
      employee={result.employee.accEarnerLevy}
    />
  );
}

function AccWorkLevyRow({ config, result, updateAcc }: RowProps & { updateAcc: UpdateSection<"acc"> }) {
  return (
    <ComparisonRow
      enabled={config.acc.workLevyEnabled}
      label={
        <span className="acc-inline-inputs acc-inline-inputs--right">
          <Toggle
            checked={config.acc.workLevyEnabled}
            onChange={(workLevyEnabled) => updateAcc({ workLevyEnabled })}
            label={<span className="acc-inline-label">ACC work levy</span>}
          />
          <NumberInput
            value={config.acc.workLevy}
            onChange={(workLevy) => updateAcc({ workLevy })}
            prefix="$"
          />
        </span>
      }
      selfEmployed={result.selfEmployed.accWorkLevy}
    />
  );
}

function AccWorkingSaferRow({ config, result, updateAcc }: RowProps & { updateAcc: UpdateSection<"acc"> }) {
  return (
    <ComparisonRow
      enabled={config.acc.workingSaferEnabled}
      label={
        <span className="acc-inline-inputs acc-inline-inputs--right">
          <Toggle
            checked={config.acc.workingSaferEnabled}
            onChange={(workingSaferEnabled) => updateAcc({ workingSaferEnabled })}
            label={<span className="acc-inline-label">ACC working safer levy</span>}
          />
          <PercentInput
            value={config.acc.workingSaferRate}
            onChange={(workingSaferRate) => updateAcc({ workingSaferRate })}
            step={0.01}
            min={0}
          />
        </span>
      }
      selfEmployed={result.selfEmployed.accWorkingSaferLevy}
    />
  );
}

function KiwiSaverRow({
  config,
  result,
  updateKiwiSaver,
}: RowProps & { updateKiwiSaver: UpdateSection<"kiwiSaver"> }) {
  return (
    <ComparisonRow
      enabled={config.kiwiSaver.enabled}
      label={
        <span className="acc-inline-inputs">
          <Toggle
            checked={config.kiwiSaver.enabled}
            onChange={(enabled) => updateKiwiSaver({ enabled })}
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
      }
      selfEmployed={result.selfEmployed.kiwiSaver}
      employee={result.employee.kiwiSaver}
    />
  );
}

function EmployerContributionRow({
  config,
  result,
  updateKiwiSaver,
  onConfigureEsct,
}: RowProps & { updateKiwiSaver: UpdateSection<"kiwiSaver">; onConfigureEsct: () => void }) {
  const kiwiSaverDisabled = !config.kiwiSaver.enabled;
  return (
    <ComparisonRow
      enabled={config.kiwiSaver.enabled && config.kiwiSaver.boostEmployerContribution}
      labelClassName="sub-row-cell"
      label={
        <span className="acc-inline-inputs">
          <Toggle
            disabled={kiwiSaverDisabled}
            checked={config.kiwiSaver.boostEmployerContribution}
            onChange={(boostEmployerContribution) => updateKiwiSaver({ boostEmployerContribution })}
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
      }
      selfEmployed={result.selfEmployed.kiwiSaverEmployerContribution}
    />
  );
}

function StudentLoanRow({
  config,
  result,
  updateStudentLoan,
}: RowProps & { updateStudentLoan: UpdateSection<"studentLoan"> }) {
  return (
    <ComparisonRow
      enabled={config.studentLoan.enabled}
      label={
        <span className="acc-inline-inputs">
          <Toggle
            checked={config.studentLoan.enabled}
            onChange={(enabled) => updateStudentLoan({ enabled })}
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
      }
      selfEmployed={result.selfEmployed.studentLoan}
      employee={result.employee.studentLoan}
    />
  );
}

function DaysOffSavingsRow({ config, result, updateConfig }: RowProps & { updateConfig: UpdateConfig }) {
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
          <SectionTitle>Take home pay</SectionTitle>
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
          <ComparisonRow
            className="section-row"
            label={<SectionTitle>Taxable Income</SectionTitle>}
            selfEmployed={result.selfEmployed.taxableIncome}
            employee={result.employee.taxableIncome}
          />
          <IncomeTaxRow result={result} onConfigure={() => setDialog("tax")} />
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
          <ComparisonRow
            className="section-row"
            label={<SectionTitle>Net Income</SectionTitle>}
            selfEmployed={result.selfEmployed.netIncome}
            employee={result.employee.takeHomePay}
          />

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
