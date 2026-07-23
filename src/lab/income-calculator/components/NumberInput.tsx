interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberInput({
  value,
  onChange,
  label,
  prefix,
  suffix,
  min,
  max,
  step = 1,
}: NumberInputProps) {
  return (
    <label className="number-input">
      {label && <span className="number-input-label">{label}</span>}
      <span className="number-input-wrap">
        {prefix && <span className="number-input-prefix">{prefix}</span>}
        <input
          type="number"
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = e.target.value === "" ? 0 : parseFloat(e.target.value);
            onChange(Number.isNaN(v) ? 0 : v);
          }}
        />
        {suffix && <span className="number-input-suffix">{suffix}</span>}
      </span>
    </label>
  );
}
