import { useState } from "react";
import { formatCurrency } from "../utils/format";

interface FormulaInputProps {
  value: number;
  formula?: string;
  onChange: (amount: number, formula?: string) => void;
  computed: number;
}

export function FormulaInput({ value, formula, onChange, computed }: FormulaInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(formula ?? String(value));

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed === "" || /^-?\d+(\.\d+)?$/.test(trimmed)) {
      onChange(trimmed === "" ? 0 : parseFloat(trimmed), undefined);
    } else {
      onChange(value, trimmed);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <span className="formula-input-wrap">
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
          title="Enter a number or formula, e.g. workdays * 15 or min(gross * 0.015, 1500)"
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
