import styles from "./components.module.css";

export type FulfillmentStatus =
  "new" | "accepted" | "preparing" | "ready" | "picked_up" | "cancelled";

export type PaymentStatus =
  "paid" | "pending" | "action_needed" | "failed" | "refunded";

const fulfillmentLabels: Record<FulfillmentStatus, string> = {
  new: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

const paymentLabels: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  action_needed: "Action needed",
  failed: "Failed",
  refunded: "Refunded",
};

export function FulfillmentBadge({ status }: { status: FulfillmentStatus }) {
  return (
    <span
      className={`${styles.badge} ${styles.badgeFulfillment}`}
      data-kind="fulfillment"
      data-status={status}
    >
      <span aria-hidden="true">●</span>
      {fulfillmentLabels[status]}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const pending = status === "pending" || status === "action_needed";
  return (
    <span
      className={`${styles.badge} ${pending ? styles.badgeNeutral : styles.badgePayment}`}
      data-kind="payment"
      data-status={status}
    >
      <span aria-hidden="true">●</span>
      Payment: {paymentLabels[status]}
    </span>
  );
}
