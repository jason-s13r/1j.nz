import { TaxBrackets } from "../domain/calculate";
import { NumberInput } from "./NumberInput";
import { RemoveIcon } from "./icons";

interface TaxConfigProps {
  brackets: TaxBrackets;
  onChange: (brackets: TaxBrackets) => void;
}

export function TaxConfig({ brackets, onChange }: TaxConfigProps) {
  const update = (index: number, patch: { threshold?: number; rate?: number }) => {
    const next = brackets.brackets.map((b, i) => (i === index ? { ...b, ...patch } : b));
    onChange({ brackets: next });
  };
  const add = () =>
    onChange({
      brackets: [
        ...brackets.brackets,
        {
          threshold: brackets.brackets[brackets.brackets.length - 1].threshold + 10000,
          rate: 0.39,
        },
      ],
    });
  const remove = (index: number) =>
    onChange({ brackets: brackets.brackets.filter((_, i) => i !== index) });

  return (
    <table className="data-table tax-bracket-table">
      <thead>
        <tr>
          <th></th>
          <th className="numeric">Threshold</th>
          <th className="numeric">Rate</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {brackets.brackets.map((bracket, i) => (
          <tr key={i}>
            <td className="bracket-index">{i + 1}</td>
            <td className="numeric">
              <NumberInput
                value={bracket.threshold}
                onChange={(threshold) => update(i, { threshold })}
                prefix="$"
              />
            </td>
            <td className="numeric">
              <NumberInput
                value={bracket.rate * 100}
                onChange={(rate) => update(i, { rate: rate / 100 })}
                suffix="%"
                step={0.01}
              />
            </td>
            <td className="numeric">
              {brackets.brackets.length > 1 && (
                <button
                  className="icon-button remove-row-button"
                  onClick={() => remove(i)}
                  aria-label={`Remove bracket ${i + 1}`}
                >
                  <RemoveIcon />
                </button>
              )}
            </td>
          </tr>
        ))}
        <tr className="add-row">
          <td colSpan={4}>
            <button className="text-button add-button" onClick={add}>
              + Add bracket
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
