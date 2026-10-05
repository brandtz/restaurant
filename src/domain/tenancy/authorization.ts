export type Role = "owner" | "manager" | "staff";

export type MembershipStatus = "active" | "invited" | "suspended" | "revoked";

export type MerchantStatus = "onboarding" | "active" | "suspended" | "archived";

export const permissionCatalog = [
  "merchant.settings.read",
  "merchant.profile.update",
  "location.settings.read",
  "location.operations.update",
  "location.notifications.update",
  "members.read",
  "members.manage",
  "branding.update",
  "branding.publish",
  "menu.update",
  "menu.publish",
  "connections.update",
  "orders.read",
  "orders.accept",
  "orders.fulfillment.update",
  "orders.cancel",
  "payments.refund",
  "ordering.enable",
] as const;

export type Permission = (typeof permissionCatalog)[number];

const knownPermissions: ReadonlySet<string> = new Set(permissionCatalog);
const locationBoundPermissions: ReadonlySet<Permission> = new Set([
  "location.settings.read",
  "location.operations.update",
  "location.notifications.update",
  "orders.read",
  "orders.accept",
  "orders.fulfillment.update",
  "orders.cancel",
  "payments.refund",
  "ordering.enable",
]);

export type ActorContext =
  | { readonly kind: "anonymous" }
  | { readonly kind: "unverified_user"; readonly userId: string }
  | {
      readonly kind: "restaurant_user";
      readonly userId: string;
      readonly emailVerified: true;
    }
  | {
      readonly kind: "bwe_operator";
      readonly userId: string;
      readonly operatorId: string;
    };

export type LocationMembershipScope =
  | { readonly kind: "all" }
  | { readonly kind: "selected"; readonly locationIds: readonly string[] };

export type MembershipRecord = Readonly<{
  merchantId: string;
  userId: string;
  role: Role;
  status: MembershipStatus;
  membershipVersion: number;
  locationScope: LocationMembershipScope;
}>;

export type LocationSelection =
  | { readonly kind: "merchant" }
  | { readonly kind: "location"; readonly locationId: string };

export type AuthorizationPolicy = Readonly<{
  rolePermissions: Readonly<Record<Role, ReadonlySet<Permission>>>;
  merchantStatusPermissions: Readonly<
    Record<MerchantStatus, ReadonlySet<Permission>>
  >;
}>;

const authorizedScopeBrand: unique symbol = Symbol("authorized-scope");

export type AuthorizedScope = Readonly<{
  readonly [authorizedScopeBrand]: true;
  readonly userId: string;
  readonly merchantId: string;
  readonly role: Role;
  readonly permission: Permission;
  readonly membershipVersion: number;
  readonly locationIds: readonly string[];
}>;

export type AuthorizationError = Readonly<{
  code: "unauthenticated" | "not_found" | "forbidden";
  message: string;
  reason?: "verification_required" | "merchant_suspended";
}>;

export type AuthorizationResult =
  | Readonly<{ ok: true; scope: AuthorizedScope }>
  | Readonly<{ ok: false; error: AuthorizationError }>;

export type AuthorizationInput = Readonly<{
  actor: ActorContext;
  membership: MembershipRecord | null;
  merchantId: string;
  merchantStatus: MerchantStatus;
  merchantLocationIds: readonly string[];
  location: LocationSelection;
  permission: string;
  policy: AuthorizationPolicy | null;
}>;

const notFound: AuthorizationError = Object.freeze({
  code: "not_found",
  message: "Resource not found.",
});

const unauthenticated: AuthorizationError = Object.freeze({
  code: "unauthenticated",
  message: "Sign-in required.",
});

const verificationRequired: AuthorizationError = Object.freeze({
  code: "unauthenticated",
  message: "Verified sign-in required.",
  reason: "verification_required",
});

const forbidden: AuthorizationError = Object.freeze({
  code: "forbidden",
  message: "Operation not permitted.",
});

function deny(error: AuthorizationError): AuthorizationResult {
  return Object.freeze({ ok: false as const, error });
}

export function authorize(input: AuthorizationInput): AuthorizationResult {
  const { actor, membership } = input;

  if (actor.kind === "anonymous") {
    return deny(unauthenticated);
  }
  if (actor.kind === "unverified_user") {
    return deny(verificationRequired);
  }
  if (actor.kind === "bwe_operator") {
    return deny(notFound);
  }
  if (actor.kind !== "restaurant_user" || !membership) {
    return deny(notFound);
  }

  if (
    !actor.emailVerified ||
    membership.userId !== actor.userId ||
    membership.merchantId !== input.merchantId ||
    !membership.merchantId ||
    membership.status !== "active" ||
    !Number.isSafeInteger(membership.membershipVersion) ||
    membership.membershipVersion < 1 ||
    input.merchantStatus === "archived"
  ) {
    return deny(notFound);
  }
  if (!knownPermissions.has(input.permission)) {
    return deny(forbidden);
  }
  const permission = input.permission as Permission;
  if (
    locationBoundPermissions.has(permission) &&
    input.location.kind !== "location"
  ) {
    return deny(notFound);
  }
  const allowedByStatus =
    input.policy?.merchantStatusPermissions[input.merchantStatus];
  const allowedByRole = input.policy?.rolePermissions[membership.role];

  if (!allowedByStatus?.has(permission) || !allowedByRole?.has(permission)) {
    if (input.merchantStatus === "suspended") {
      return deny(
        Object.freeze({ ...forbidden, reason: "merchant_suspended" }),
      );
    }
    return deny(forbidden);
  }

  const merchantLocations = new Set(input.merchantLocationIds);
  const membershipLocations =
    membership.locationScope.kind === "all"
      ? merchantLocations
      : new Set(
          membership.locationScope.locationIds.filter((id) =>
            merchantLocations.has(id),
          ),
        );

  let resolvedLocationIds: string[];
  if (input.location.kind === "location") {
    if (
      !merchantLocations.has(input.location.locationId) ||
      !membershipLocations.has(input.location.locationId)
    ) {
      return deny(notFound);
    }
    resolvedLocationIds = [input.location.locationId];
  } else {
    resolvedLocationIds = [...membershipLocations];
  }

  return Object.freeze({
    ok: true as const,
    scope: Object.freeze({
      [authorizedScopeBrand]: true as const,
      userId: actor.userId,
      merchantId: membership.merchantId,
      role: membership.role,
      permission,
      membershipVersion: membership.membershipVersion,
      locationIds: Object.freeze(resolvedLocationIds),
    }),
  });
}
