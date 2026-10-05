import { describe, expect, it } from "vitest";
import {
  authorize,
  type ActorContext,
  type AuthorizationInput,
  type AuthorizationPolicy,
  type MembershipRecord,
  type Permission,
  type Role,
} from "@/domain/tenancy/authorization";

const ownerId = "owner-a";
const merchantA = "merchant-a";
const merchantB = "merchant-b";
const locationA1 = "location-a1";
const locationA2 = "location-a2";
const locationB1 = "location-b1";

const rolePermissions: Record<Role, ReadonlySet<Permission>> = {
  owner: new Set([
    "merchant.settings.read",
    "merchant.profile.update",
    "location.settings.read",
    "location.operations.update",
  ]),
  manager: new Set([
    "merchant.settings.read",
    "location.settings.read",
    "location.operations.update",
  ]),
  staff: new Set([
    "merchant.settings.read",
    "location.settings.read",
    "orders.read",
  ]),
};

const statusPermissions = {
  onboarding: new Set<Permission>([
    "merchant.settings.read",
    "merchant.profile.update",
    "location.settings.read",
    "location.operations.update",
  ]),
  active: new Set<Permission>([
    "merchant.settings.read",
    "merchant.profile.update",
    "location.settings.read",
    "location.operations.update",
    "orders.read",
  ]),
  suspended: new Set<Permission>(["merchant.settings.read"]),
  archived: new Set<Permission>(),
};

const policy: AuthorizationPolicy = {
  rolePermissions,
  merchantStatusPermissions: statusPermissions,
};

const actor: ActorContext = {
  kind: "restaurant_user",
  userId: ownerId,
  emailVerified: true,
};

const activeOwner: MembershipRecord = {
  merchantId: merchantA,
  userId: ownerId,
  role: "owner",
  status: "active",
  membershipVersion: 4,
  locationScope: { kind: "all" },
};

function request(
  overrides: Partial<AuthorizationInput> = {},
): AuthorizationInput {
  return {
    actor,
    membership: activeOwner,
    merchantId: merchantA,
    merchantStatus: "active",
    merchantLocationIds: [locationA1, locationA2],
    location: { kind: "merchant" },
    permission: "merchant.settings.read",
    policy,
    ...overrides,
  };
}

function expectError(input: AuthorizationInput, code: string) {
  const result = authorize(input);
  expect(result).toEqual({
    ok: false,
    error: expect.objectContaining({ code }),
  });
  return result;
}

describe("pure tenant authorization", () => {
  it("requires verified restaurant identity and does not treat BWE access as membership", () => {
    expectError(
      request({ actor: { kind: "anonymous" }, membership: null }),
      "unauthenticated",
    );

    expect(
      authorize(
        request({
          actor: { kind: "unverified_user", userId: ownerId },
          membership: null,
        }),
      ),
    ).toEqual({
      ok: false,
      error: {
        code: "unauthenticated",
        message: "Verified sign-in required.",
        reason: "verification_required",
      },
    });

    expectError(
      request({
        actor: {
          kind: "bwe_operator",
          userId: ownerId,
          operatorId: "operator-a",
        },
        membership: null,
      }),
      "not_found",
    );
  });

  it("returns indistinguishable not-found errors for missing, mismatched and inactive membership", () => {
    const results = [
      authorize(request({ membership: null })),
      authorize(request({ merchantId: merchantB })),
      authorize(
        request({
          membership: { ...activeOwner, status: "revoked" },
        }),
      ),
      authorize(
        request({
          membership: { ...activeOwner, userId: "other-user" },
        }),
      ),
    ];
    for (const result of results) {
      expect(result).toEqual({
        ok: false,
        error: { code: "not_found", message: "Resource not found." },
      });
    }
  });

  it("does not disclose archived merchants", () => {
    expectError(request({ merchantStatus: "archived" }), "not_found");
  });

  it("creates a sealed scope only after membership, status and permission checks", () => {
    const result = authorize(
      request({
        permission: "merchant.profile.update",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.scope).toMatchObject({
      userId: ownerId,
      merchantId: merchantA,
      role: "owner",
      permission: "merchant.profile.update",
      membershipVersion: 4,
      locationIds: [locationA1, locationA2],
    });
    expect(Object.isFrozen(result.scope)).toBe(true);
    expect(Object.isFrozen(result.scope.locationIds)).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("uses only the injected role permissions; it invents no default grants", () => {
    expectError(
      request({
        membership: { ...activeOwner, role: "staff" },
        permission: "merchant.profile.update",
      }),
      "forbidden",
    );
    expectError(request({ permission: "members.manage" }), "forbidden");
    expectError(request({ permission: "not-in-the-catalog" }), "forbidden");
    expectError(request({ policy: null }), "forbidden");
    const denied = authorize(
      request({
        membership: { ...activeOwner, role: "staff" },
        permission: "merchant.profile.update",
      }),
    );
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(Object.isFrozen(denied)).toBe(true);
      expect(Object.isFrozen(denied.error)).toBe(true);
    }
  });

  it("requires the caller to inject merchant-status policy explicitly", () => {
    expect(
      authorize(
        request({
          merchantStatus: "suspended",
          permission: "merchant.settings.read",
        }),
      ),
    ).toMatchObject({ ok: true });
    expect(
      expectError(
        request({
          merchantStatus: "suspended",
          permission: "merchant.profile.update",
        }),
        "forbidden",
      ),
    ).toMatchObject({
      error: { reason: "merchant_suspended" },
    });

    const noOnboardingGrants: AuthorizationPolicy = {
      ...policy,
      merchantStatusPermissions: {
        ...statusPermissions,
        onboarding: new Set(),
      },
    };
    expectError(
      request({
        merchantStatus: "onboarding",
        policy: noOnboardingGrants,
      }),
      "forbidden",
    );
  });

  it("denies malformed membership versions", () => {
    for (const membershipVersion of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expectError(
        request({
          membership: { ...activeOwner, membershipVersion },
        }),
        "not_found",
      );
    }
  });

  it("resolves only locations in both the merchant and membership scopes", () => {
    const allLocations = authorize(request({ location: { kind: "merchant" } }));
    expect(allLocations).toMatchObject({
      ok: true,
      scope: { locationIds: [locationA1, locationA2] },
    });

    const selectedLocation = authorize(
      request({
        location: { kind: "location", locationId: locationA2 },
        permission: "location.settings.read",
      }),
    );
    expect(selectedLocation).toMatchObject({
      ok: true,
      scope: { locationIds: [locationA2] },
    });

    expectError(
      request({
        location: { kind: "location", locationId: locationB1 },
        permission: "location.settings.read",
      }),
      "not_found",
    );

    expectError(
      request({
        location: { kind: "merchant" },
        permission: "location.settings.read",
      }),
      "not_found",
    );
  });

  it("intersects location-scoped membership with actual merchant locations", () => {
    const scopedMembership: MembershipRecord = {
      ...activeOwner,
      locationScope: {
        kind: "selected",
        locationIds: [locationA2, locationB1],
      },
    };
    const result = authorize(
      request({
        membership: scopedMembership,
        location: { kind: "merchant" },
        permission: "merchant.settings.read",
      }),
    );
    expect(result).toMatchObject({
      ok: true,
      scope: { locationIds: [locationA2] },
    });
    expectError(
      request({
        membership: scopedMembership,
        location: { kind: "location", locationId: locationA1 },
        permission: "location.settings.read",
      }),
      "not_found",
    );
  });

  it("does not mutate caller-owned location data", () => {
    const locations = [locationA1, locationA2];
    const membership: MembershipRecord = {
      ...activeOwner,
      locationScope: { kind: "selected", locationIds: locations },
    };
    authorize(request({ membership, merchantLocationIds: locations }));
    expect(locations).toEqual([locationA1, locationA2]);
    expect(Object.isFrozen(locations)).toBe(false);
  });
});
