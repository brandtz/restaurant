import { z } from "zod";
import { addMoney, money, scaleMoney, type Money } from "@/domain/money/money";
import type {
  MenuItemView,
  ModifierGroupView,
  PublishedMenuView,
} from "./view-models";

/*
 * Browser cart rules. Prices computed here are a preview only: checkout must
 * reprice the cart on the server from the published menu (S-020/S-026).
 */

export const MAX_LINE_QUANTITY = 20;
export const MAX_CART_LINES = 50;
export const MAX_INSTRUCTIONS_LENGTH = 200;

export type CartSelections = Readonly<Record<string, readonly string[]>>;

export type CartLine = Readonly<{
  lineId: string;
  itemId: string;
  quantity: number;
  selections: CartSelections;
  instructions: string;
}>;

export type CartIssueCode =
  | "unknown_item"
  | "item_unavailable"
  | "unknown_option"
  | "option_unavailable"
  | "duplicate_option"
  | "below_minimum"
  | "above_maximum"
  | "invalid_quantity"
  | "instructions_too_long";

export type CartIssue = Readonly<{
  code: CartIssueCode;
  groupId: string | null;
  message: string;
}>;

export function describeGroupRule(group: ModifierGroupView): string {
  if (group.minSelections === group.maxSelections) {
    return `Required · choose ${group.minSelections}`;
  }
  if (group.minSelections === 0) {
    return `Optional · choose up to ${group.maxSelections}`;
  }
  return `Required · choose ${group.minSelections} to ${group.maxSelections}`;
}

export function validateSelections(
  item: MenuItemView,
  selections: CartSelections,
): CartIssue[] {
  const issues: CartIssue[] = [];
  if (!item.available) {
    issues.push({
      code: "item_unavailable",
      groupId: null,
      message: `${item.name} is sold out at this location.`,
    });
  }

  const groupIds = new Set(item.modifierGroups.map((group) => group.id));
  for (const groupId of Object.keys(selections)) {
    if (!groupIds.has(groupId)) {
      issues.push({
        code: "unknown_option",
        groupId,
        message: `${item.name} options have changed. Remove it and add it again.`,
      });
    }
  }

  for (const group of item.modifierGroups) {
    const chosen = selections[group.id] ?? [];
    const unique = new Set(chosen);
    if (unique.size !== chosen.length) {
      issues.push({
        code: "duplicate_option",
        groupId: group.id,
        message: `${group.name}: each option can be chosen once.`,
      });
    }
    for (const optionId of unique) {
      const option = group.options.find(
        (candidate) => candidate.id === optionId,
      );
      if (!option) {
        issues.push({
          code: "unknown_option",
          groupId: group.id,
          message: `${group.name}: an option is no longer offered.`,
        });
      } else if (!option.available) {
        issues.push({
          code: "option_unavailable",
          groupId: group.id,
          message: `${group.name}: ${option.name} is sold out.`,
        });
      }
    }
    if (unique.size < group.minSelections) {
      issues.push({
        code: "below_minimum",
        groupId: group.id,
        message:
          group.minSelections === 1
            ? `${group.name}: choose an option.`
            : `${group.name}: choose ${group.minSelections}.`,
      });
    } else if (unique.size > group.maxSelections) {
      issues.push({
        code: "above_maximum",
        groupId: group.id,
        message: `${group.name}: choose no more than ${group.maxSelections}.`,
      });
    }
  }

  return issues;
}

export function validateLineInput(
  quantity: number,
  instructions: string,
): CartIssue[] {
  const issues: CartIssue[] = [];
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_LINE_QUANTITY
  ) {
    issues.push({
      code: "invalid_quantity",
      groupId: null,
      message: `Quantity must be between 1 and ${MAX_LINE_QUANTITY}.`,
    });
  }
  if (instructions.length > MAX_INSTRUCTIONS_LENGTH) {
    issues.push({
      code: "instructions_too_long",
      groupId: null,
      message: `Special instructions must be ${MAX_INSTRUCTIONS_LENGTH} characters or fewer.`,
    });
  }
  return issues;
}

export function unitPrice(
  item: MenuItemView,
  selections: CartSelections,
): Money {
  let total = item.basePrice;
  for (const group of item.modifierGroups) {
    for (const optionId of new Set(selections[group.id] ?? [])) {
      const option = group.options.find(
        (candidate) => candidate.id === optionId,
      );
      if (option) {
        total = addMoney(total, option.priceDelta);
      }
    }
  }
  return total;
}

export function selectedOptionNames(
  item: MenuItemView,
  selections: CartSelections,
): string[] {
  return item.modifierGroups.flatMap((group) =>
    group.options
      .filter((option) => (selections[group.id] ?? []).includes(option.id))
      .map((option) => option.name),
  );
}

export function findMenuItem(
  menu: PublishedMenuView,
  itemId: string,
): MenuItemView | null {
  for (const category of menu.categories) {
    const item = category.items.find((candidate) => candidate.id === itemId);
    if (item) {
      return item;
    }
  }
  return null;
}

export type EvaluatedCartLine = Readonly<{
  line: CartLine;
  item: MenuItemView | null;
  optionNames: readonly string[];
  unitPrice: Money | null;
  lineTotal: Money | null;
  issues: readonly CartIssue[];
}>;

export type CartEvaluation = Readonly<{
  lines: readonly EvaluatedCartLine[];
  itemCount: number;
  /** Preview subtotal of lines without issues; never authoritative. */
  subtotal: Money;
  orderable: boolean;
}>;

export function evaluateCart(
  menu: PublishedMenuView,
  lines: readonly CartLine[],
): CartEvaluation {
  let subtotal = money(0, menu.currency);
  let itemCount = 0;
  const evaluated = lines.map((line): EvaluatedCartLine => {
    const item = findMenuItem(menu, line.itemId);
    if (!item) {
      return {
        line,
        item: null,
        optionNames: [],
        unitPrice: null,
        lineTotal: null,
        issues: [
          {
            code: "unknown_item",
            groupId: null,
            message: "This item is no longer on the menu.",
          },
        ],
      };
    }
    const issues = [
      ...validateSelections(item, line.selections),
      ...validateLineInput(line.quantity, line.instructions),
    ];
    const price = unitPrice(item, line.selections);
    const lineTotal = issues.some((issue) => issue.code === "invalid_quantity")
      ? null
      : scaleMoney(price, line.quantity);
    if (issues.length === 0 && lineTotal) {
      subtotal = addMoney(subtotal, lineTotal);
      itemCount += line.quantity;
    }
    return {
      line,
      item,
      optionNames: selectedOptionNames(item, line.selections),
      unitPrice: price,
      lineTotal,
      issues,
    };
  });

  return {
    lines: evaluated,
    itemCount,
    subtotal,
    orderable:
      evaluated.length > 0 &&
      evaluated.every((entry) => entry.issues.length === 0),
  };
}

function selectionKey(selections: CartSelections): string {
  return JSON.stringify(
    Object.keys(selections)
      .filter((groupId) => (selections[groupId] ?? []).length > 0)
      .sort()
      .map((groupId) => [groupId, [...(selections[groupId] ?? [])].sort()]),
  );
}

/** Adds a line, merging with an identical existing line. */
export function addCartLine(
  lines: readonly CartLine[],
  next: CartLine,
): readonly CartLine[] {
  const key = selectionKey(next.selections);
  const match = lines.find(
    (line) =>
      line.itemId === next.itemId &&
      line.instructions === next.instructions &&
      selectionKey(line.selections) === key,
  );
  if (match) {
    return lines.map((line) =>
      line === match
        ? {
            ...line,
            quantity: Math.min(
              MAX_LINE_QUANTITY,
              line.quantity + next.quantity,
            ),
          }
        : line,
    );
  }
  if (lines.length >= MAX_CART_LINES) {
    return lines;
  }
  return [...lines, next];
}

export function setCartLineQuantity(
  lines: readonly CartLine[],
  lineId: string,
  quantity: number,
): readonly CartLine[] {
  if (!Number.isSafeInteger(quantity)) {
    return lines;
  }
  if (quantity < 1) {
    return removeCartLine(lines, lineId);
  }
  return lines.map((line) =>
    line.lineId === lineId
      ? { ...line, quantity: Math.min(MAX_LINE_QUANTITY, quantity) }
      : line,
  );
}

export function removeCartLine(
  lines: readonly CartLine[],
  lineId: string,
): readonly CartLine[] {
  return lines.filter((line) => line.lineId !== lineId);
}

const storedCartSchema = z
  .array(
    z.object({
      lineId: z.string().min(1).max(64),
      itemId: z.string().min(1).max(128),
      quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
      selections: z.record(
        z.string().max(128),
        z.array(z.string().max(128)).max(50),
      ),
      instructions: z.string().max(MAX_INSTRUCTIONS_LENGTH),
    }),
  )
  .max(MAX_CART_LINES);

/** Parses untrusted browser storage; anything invalid yields an empty cart. */
export function parseStoredCart(raw: string | null): readonly CartLine[] {
  if (!raw) {
    return [];
  }
  try {
    const result = storedCartSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}
