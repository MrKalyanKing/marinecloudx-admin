/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source of truth: packages/contracts/capabilities.ts
 * Regenerate:      npm run sync:contracts   (from the repo root)
 */

/**
 * Capabilities — the vocabulary the admin UI uses to decide what to render.
 *
 * Ported from the pre-monorepo `src/features/auth/services/roles.ts`.
 *
 * IMPORTANT: this is UI vocabulary only. The role → capability mapping and every
 * real authorization decision live in the backend (`apps/backend`), which is the
 * final authority. Hiding a button in the admin app is UX, not security.
 */

export const CAPABILITIES = {
  /** Read CRM data: leads, contacts, activities, tasks, conversations. */
  CRM_READ: "crm:read",
  /** Create and modify CRM records. */
  CRM_WRITE: "crm:write",
  /** Read CMS content including unpublished drafts. */
  CMS_READ: "cms:read",
  /** Create and modify CMS content. */
  CMS_WRITE: "cms:write",
  /** Administer team members and roles. */
  TEAM_MANAGE: "team:manage",
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export const ALL_CAPABILITIES: readonly Capability[] = Object.values(CAPABILITIES);

export function isCapability(value: string): value is Capability {
  return (ALL_CAPABILITIES as readonly string[]).includes(value);
}
