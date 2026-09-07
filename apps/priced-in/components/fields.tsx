"use client";

import { useId, useState } from "react";
import { SCALE_MULTIPLIERS, type Scale } from "@/domain/intake/metrics";

interface BaseProps {
  label: string;
  hint?: string;
  badge?: React.ReactNode;
  disabled?: boolean;
}

interface NumericProps extends BaseProps {
  /** Value already converted into the units the user sees. */
  displayValue: number;
  onCommit: (displayValue: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}

/**
 * Numeric input that keeps its own text while typing so partial entries like
 * "-" or "1." do not get rewritten, and only commits finite numbers.
 */
function NumericInput({ label, hint, badge, displayValue, onCommit, step, min, max, suffix, disabled }: NumericProps) {
  const id = useId();
  const [text, setText] = useState(() => String(displayValue));
  const [focused, setFocused] = useState(false);
  const [lastExternal, setLastExternal] = useState(displayValue);

  // Adjust during render rather than in an effect: while the field has focus the
  // typed text wins, and an external change is picked up once focus leaves.
  if (!focused && displayValue !== lastExternal) {
    setLastExternal(displayValue);
    setText(String(displayValue));
  }

  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {badge}
      </label>
      <div className="row" style={{ gap: "0.4rem", flexWrap: "nowrap" }}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className="num"
          value={text}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(String(displayValue));
          }}
          onChange={(event) => {
            setText(event.target.value);
            const parsed = Number(event.target.value);
            if (event.target.value.trim() !== "" && Number.isFinite(parsed)) onCommit(parsed);
          }}
        />
        {suffix ? (
          <span className="footnote" style={{ whiteSpace: "nowrap" }}>
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

/** Percentage input: the user types 5, the model stores 0.05. */
export function RateField({
  label,
  hint,
  badge,
  rate,
  onCommit,
  step = 0.1,
  disabled,
}: BaseProps & { rate: number; onCommit: (rate: number) => void; step?: number }) {
  return (
    <NumericInput
      label={label}
      hint={hint}
      badge={badge}
      disabled={disabled}
      displayValue={Number((rate * 100).toFixed(6))}
      onCommit={(value) => onCommit(value / 100)}
      step={step}
      suffix="%"
    />
  );
}

/** Currency input shown in the chosen display scale, stored as unrounded USD. */
export function MoneyField({
  label,
  hint,
  badge,
  usd,
  scale,
  onCommit,
  disabled,
}: BaseProps & { usd: number; scale: Scale; onCommit: (usd: number) => void }) {
  const multiplier = SCALE_MULTIPLIERS[scale];
  return (
    <NumericInput
      label={label}
      hint={hint}
      badge={badge}
      disabled={disabled}
      displayValue={Number((usd / multiplier).toFixed(6))}
      onCommit={(value) => onCommit(value * multiplier)}
      step={0.1}
      suffix={scale === "units" ? "USD" : `USD ${scale}`}
    />
  );
}

export function CountField({
  label,
  hint,
  badge,
  value,
  onCommit,
  suffix,
  disabled,
}: BaseProps & { value: number; onCommit: (value: number) => void; suffix?: string }) {
  return (
    <NumericInput
      label={label}
      hint={hint}
      badge={badge}
      disabled={disabled}
      displayValue={value}
      onCommit={onCommit}
      step={1}
      suffix={suffix}
    />
  );
}

export function TextField({
  label,
  hint,
  value,
  onCommit,
  placeholder,
}: BaseProps & { value: string; onCommit: (value: string) => void; placeholder?: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" value={value} placeholder={placeholder} onChange={(event) => onCommit(event.target.value)} />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

export function DateField({
  label,
  hint,
  value,
  onCommit,
}: BaseProps & { value: string; onCommit: (value: string) => void }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="date" value={value} onChange={(event) => onCommit(event.target.value)} />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

export function BasisBadge({ basis }: { basis: "reported" | "assumed" | "derived" | undefined }) {
  const resolved = basis ?? "assumed";
  return <span className={`badge badge-${resolved}`}>{resolved}</span>;
}
