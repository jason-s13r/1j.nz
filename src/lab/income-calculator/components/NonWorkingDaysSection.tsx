import { NonWorkingDay, SelfEmployedResult } from "../domain/calculate";
import { formatCurrency, formatNumber } from "../utils/format";
import { RemoveIcon } from "./icons";
import { NumberInput } from "./NumberInput";
import { Toggle } from "./Toggle";

interface NonWorkingDaysSectionProps {
  items: NonWorkingDay[];
  result: SelfEmployedResult;
  onChange: (items: NonWorkingDay[]) => void;
}

export function NonWorkingDaysSection({ items, result, onChange }: NonWorkingDaysSectionProps) {
  const update = (id: string, patch: Partial<NonWorkingDay>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const add = () =>
    onChange([...items, { id: crypto.randomUUID(), name: "New item", days: 0, enabled: true }]);
  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));

  return (
    <>
      <tr className="section-row">
        <td>
          <h2 className="section-title">Non-working days</h2>
          {" "}
          <button className="text-button add-button" onClick={add}>
            + Add days
          </button>
        </td>
        <td className="numeric">{formatCurrency(result.lostRevenue)}</td>
        <td className="numeric">{formatNumber(result.nonWorkingDays)} days</td>
      </tr>
      {items.map((item) => (
        <tr key={item.id} className={item.enabled ? "" : "disabled"}>
          <td className="item-cell">
            <span className="acc-inline-inputs non-working-day">
              <button
                className="icon-button remove-row-button"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.name}`}
              >
                <RemoveIcon />
              </button>
              <Toggle
                checked={item.enabled}
                onChange={(enabled) => update(item.id, { enabled })}
                label={
                  <input
                    className="inline-name"
                    value={item.name}
                    onChange={(e) => update(item.id, { name: e.target.value })}
                  />
                }
              />
              <NumberInput
                value={item.days}
                onChange={(days) => update(item.id, { days })}
                suffix="days"
                step={0.5}
                min={0}
              />
            </span>
          </td>
          <td className="numeric">{formatCurrency(result.dayRate * Math.max(0, item.days))}</td>
          <td></td>
        </tr>
      ))}
      <tr className="section-row">
        <td>
          <h2 className="section-title">Revenue</h2>{" "}
          <span className="section-note">
            {formatNumber(result.workingDays)} of {formatNumber(result.totalWorkDays)} work days worked
          </span>
        </td>
        <td className="numeric">{formatCurrency(result.grossIncome)}</td>
        <td></td>
      </tr>
    </>
  );
}
