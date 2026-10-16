import { useState } from "react";
import { formulaError } from "../domain/calculate";
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
  const [error, setError] = useState<string | null>(null);

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed === "" || /^-?\d+(\.\d+)?$/.test(trimmed)) {
      onChange(trimmed === "" ? 0 : parseFloat(trimmed), undefined);
    } else {
      // Keep editing an invalid formula rather than saving it and silently
      // showing the fallback amount.
      const message = formulaError(trimmed);
      if (message) {
        setError(message);
        return;
      }
      onChange(value, trimmed);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setText(formula ?? String(value));
    setError(null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <span className="formula-input-field">
        <span className={error ? "formula-input-wrap formula-input-wrap--error" : "formula-input-wrap"}>
          <input
            className="formula-input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            autoFocus
            placeholder="number or formula"
            title="Enter a number or formula, e.g. workdays * 15 or min(gross * 0.015, 1500)"
            aria-invalid={error ? true : undefined}
          />
        </span>
        {error && (
          <span className="formula-error" role="alert">
            {error}
            {/* preventDefault keeps focus in the input, so blur doesn't re-commit first. */}
            <button
              type="button"
              className="text-button formula-error-cancel"
              onMouseDown={(e) => e.preventDefault()}
              onClick={cancel}
            >
              Cancel
            </button>
          </span>
        )}
      </span>
    );
  }

  return (
    <button
      className="formula-value"
      onClick={() => {
        setText(formula ?? String(value));
        setError(null);
        setIsEditing(true);
      }}
      title={formula ? `Formula: ${formula}` : "Click to edit"}
    >
      {formatCurrency(computed)}
      {formula && <span className="formula-badge">ƒ</span>}
    </button>
  );
}
