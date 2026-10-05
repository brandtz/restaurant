"use client";

import { ActionButton } from "@/design-system";
import styles from "../storefront.module.css";

export function QuantityStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const actionLabel = label.charAt(0).toLowerCase() + label.slice(1);
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <ActionButton
        aria-label={`Decrease ${actionLabel}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        variant="secondary"
      >
        −
      </ActionButton>
      <output aria-live="polite" className={styles.stepperValue}>
        {value}
      </output>
      <ActionButton
        aria-label={`Increase ${actionLabel}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        variant="secondary"
      >
        +
      </ActionButton>
    </div>
  );
}
