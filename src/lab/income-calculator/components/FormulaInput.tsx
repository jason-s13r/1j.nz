import { useState } from "react";
import { evaluateFormula, FormulaContext } from "../domain/calculate";
import { formatCurrency } from "../utils/format";

interface FormulaInputProps {
  value: number;
  formula?: string;
  onChange: (amount: number, formula?: string) => void;
  context: FormulaContext;
  prefix?: string;
}

export function FormulaInput({ value, formula, onChange, context, prefix }: FormulaInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(formula ?? String(value));

  const computed = formula
    ? evaluateFormula(formula, context, value)
    : value;

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed === "" || /^-?\d+(\.\d+)?$/.test(trimmed)) {
      const num = trimmed === "" ? 0 : parseFloat(trimmed);
      onChange(Number.isNaN(num) ? 0 : num, undefined);
    } else {
      onChange(value, trimmed);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <span className="formula-input-wrap">
        {prefix && <span className="formula-input-prefix">{prefix}</span>}
        <input
          className="formula-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setText(formula ?? String(value));
              setIsEditing(false);
            }
          }}
          autoFocus
          placeholder="number or formula"
          title="Enter a number or formula using gross/taxable and min/max"
        />
      </span>
    );
  }

  return (
    <button
      className="formula-value"
      onClick={() => {
        setText(formula ?? String(value));
        setIsEditing(true);
      }}
      title={formula ? `Formula: ${formula}` : "Click to edit"}
    >
      {formatCurrency(computed)}
      {formula && <span className="formula-badge">ƒ</span>}
    </button>
  );
}
