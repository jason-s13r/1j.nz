import { useState } from "react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step = 1,
  disabled,
}: NumberInputProps) {
  // While focused, show what was typed (including an empty field) rather than
  // the parsed value, so clearing the field doesn't snap back to 0.
  const [text, setText] = useState<string | null>(null);

  return (
    <label className="number-input">
      <span className="number-input-wrap">
        {prefix && <span className="number-input-prefix">{prefix}</span>}
        <input
          type="number"
          value={text ?? (Number.isFinite(value) ? value : "")}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            const v = parseFloat(e.target.value);
            onChange(Number.isNaN(v) ? 0 : v);
          }}
          onBlur={() => setText(null)}
        />
        {suffix && <span className="number-input-suffix">{suffix}</span>}
      </span>
    </label>
  );
}

export function PercentInput({
  value,
  onChange,
  ...props
}: Omit<NumberInputProps, "suffix">) {
  return (
    <NumberInput
      {...props}
      value={parseFloat((value * 100).toPrecision(12))}
      onChange={(percent) => onChange(percent / 100)}
      suffix="%"
    />
  );
}
