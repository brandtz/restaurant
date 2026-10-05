"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ActionButton } from "@/design-system";
import { scaleMoney } from "@/domain/money/money";
import {
  describeGroupRule,
  MAX_INSTRUCTIONS_LENGTH,
  MAX_LINE_QUANTITY,
  unitPrice,
  validateLineInput,
  validateSelections,
  type CartIssue,
} from "../cart";
import { newCartLineId, useCart } from "../cart-store";
import { formatMoney, formatPriceDelta } from "../format";
import styles from "../storefront.module.css";
import type { MenuItemView, ModifierGroupView } from "../view-models";
import { QuantityStepper } from "./QuantityStepper";

type Selections = Record<string, string[]>;

function toggle(
  group: ModifierGroupView,
  current: readonly string[],
  optionId: string,
  checked: boolean,
): string[] {
  if (group.minSelections === 1 && group.maxSelections === 1) {
    return [optionId];
  }
  return checked
    ? [...current.filter((id) => id !== optionId), optionId]
    : current.filter((id) => id !== optionId);
}

export function ItemConfigurator({
  merchantSlug,
  locationSlug,
  menuHref,
  item,
}: {
  merchantSlug: string;
  locationSlug: string;
  menuHref: string;
  item: MenuItemView;
}) {
  const router = useRouter();
  const { add } = useCart(merchantSlug, locationSlug);
  const formId = useId();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [selections, setSelections] = useState<Selections>({});
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt > 0) {
      summaryRef.current?.focus();
    }
  }, [attempt]);

  const currentIssues = (): CartIssue[] => [
    ...validateSelections(item, selections),
    ...validateLineInput(quantity, instructions.trim()),
  ];
  // Errors appear after the first submit, then update live as choices change.
  const issues = attempt > 0 ? currentIssues() : [];
  const total = scaleMoney(unitPrice(item, selections), quantity);
  const issuesFor = (groupId: string) =>
    issues.filter((issue) => issue.groupId === groupId);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentIssues().length > 0) {
      setAttempt((value) => value + 1);
      return;
    }
    add({
      lineId: newCartLineId(),
      itemId: item.id,
      quantity,
      selections,
      instructions: instructions.trim(),
    });
    router.push(`${menuHref}?added=${encodeURIComponent(item.id)}`);
  }

  return (
    <form className={styles.form} noValidate onSubmit={onSubmit}>
      {issues.length > 0 ? (
        <div
          className={styles.errorSummary}
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
        >
          <h2>Finish choosing your options</h2>
          <ul>
            {issues.map((issue, index) => (
              <li key={`${issue.code}-${issue.groupId ?? "item"}-${index}`}>
                {issue.groupId ? (
                  <a href={`#${formId}-${issue.groupId}`}>{issue.message}</a>
                ) : (
                  issue.message
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {item.modifierGroups.map((group) => {
        const chosen = selections[group.id] ?? [];
        const single = group.minSelections === 1 && group.maxSelections === 1;
        const groupIssues = issuesFor(group.id);
        const ruleId = `${formId}-${group.id}-rule`;
        const errorId = `${formId}-${group.id}-error`;
        return (
          <fieldset
            aria-describedby={
              groupIssues.length > 0 ? `${ruleId} ${errorId}` : ruleId
            }
            className={[
              styles.fieldset,
              groupIssues.length > 0 ? styles.fieldsetInvalid : "",
            ]
              .filter(Boolean)
              .join(" ")}
            id={`${formId}-${group.id}`}
            key={group.id}
            tabIndex={-1}
          >
            <legend>{group.name}</legend>
            <p className={styles.rule} id={ruleId}>
              {describeGroupRule(group)}
            </p>
            {groupIssues.length > 0 ? (
              <p className={styles.fieldError} id={errorId}>
                {groupIssues.map((issue) => issue.message).join(" ")}
              </p>
            ) : null}
            {group.options.map((option) => {
              const checked = chosen.includes(option.id);
              const atLimit =
                !single && !checked && chosen.length >= group.maxSelections;
              const disabled = !option.available || atLimit;
              return (
                <label
                  className={[
                    styles.option,
                    disabled ? styles.optionDisabled : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={option.id}
                >
                  <input
                    checked={checked}
                    disabled={disabled}
                    name={`${formId}-${group.id}`}
                    onChange={(event) =>
                      setSelections((current) => ({
                        ...current,
                        [group.id]: toggle(
                          group,
                          current[group.id] ?? [],
                          option.id,
                          event.target.checked,
                        ),
                      }))
                    }
                    type={single ? "radio" : "checkbox"}
                    value={option.id}
                  />
                  <span className={styles.optionName}>
                    {option.name}
                    {option.available ? "" : " (sold out)"}
                  </span>
                  <span className={styles.muted}>
                    {formatPriceDelta(option.priceDelta)}
                  </span>
                </label>
              );
            })}
          </fieldset>
        );
      })}

      <div className={styles.fieldset}>
        <label htmlFor={`${formId}-instructions`}>
          <strong>Special instructions</strong>{" "}
          <span className={styles.muted}>(optional)</span>
        </label>
        <p className={styles.rule} id={`${formId}-instructions-hint`}>
          Allergies and requests are passed to the kitchen but can’t be
          guaranteed.
        </p>
        <textarea
          aria-describedby={`${formId}-instructions-hint`}
          className={styles.textarea}
          id={`${formId}-instructions`}
          maxLength={MAX_INSTRUCTIONS_LENGTH}
          onChange={(event) => setInstructions(event.target.value)}
          value={instructions}
        />
      </div>

      <div className={styles.formActions}>
        <QuantityStepper
          label="Quantity"
          max={MAX_LINE_QUANTITY}
          min={1}
          onChange={setQuantity}
          value={quantity}
        />
        <ActionButton type="submit">
          Add to cart · {formatMoney(total)}
        </ActionButton>
      </div>
    </form>
  );
}
