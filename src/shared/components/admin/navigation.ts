/**
 * Admin navigation definition.
 *
 * Every entry declares the capability required to see it. Nothing here checks
 * a role name — that would be a second permission system alongside the one in
 * src/server/auth/roles.ts.
 *
 * Visibility is convenience, not security. Each API endpoint enforces the same
 * capability independently, so hiding a link never stands alone as protection.
 */

import type { Capability } from "@/contracts";
import { CAPABILITIES } from "@/contracts";
import { CMS_NAV_RESOURCES } from "@/features/cms/registry";

export interface NavItem {
  label: string;
  href: string;
  /** Omitted means visible to anyone who can reach the admin area. */
  capability?: Capability;
  /** Marks a destination that does not exist yet. Rendered disabled. */
  comingSoon?: boolean;
}

export interface NavSection {
  label: string;
  /** Hides the whole section when the user lacks this capability. */
  capability?: Capability;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/" }],
  },
  {
    label: "CRM",
    capability: CAPABILITIES.CRM_READ,
    items: [
      { label: "CRM overview", href: "/crm", capability: CAPABILITIES.CRM_READ },
      { label: "Pipeline", href: "/crm/pipeline", capability: CAPABILITIES.CRM_READ },
      { label: "Leads", href: "/crm/leads", capability: CAPABILITIES.CRM_READ },
      { label: "Contacts", href: "/crm/contacts", capability: CAPABILITIES.CRM_READ },
      { label: "Tasks", href: "/crm/tasks", capability: CAPABILITIES.CRM_READ },
    ],
  },
  {
    label: "CMS",
    capability: CAPABILITIES.CMS_READ,
    // Built from the CMS registry so a new content type appears in the
    // navigation without this list being edited.
    items: [
      { label: "Content overview", href: "/cms", capability: CAPABILITIES.CMS_READ },
      ...CMS_NAV_RESOURCES.map((resource) => ({
        label: resource.label,
        href: `/cms/${resource.key}`,
        capability: CAPABILITIES.CMS_READ,
      })),
    ],
  },
  {
    label: "Administration",
    capability: CAPABILITIES.TEAM_MANAGE,
    items: [
      { label: "Team", href: "#", capability: CAPABILITIES.TEAM_MANAGE, comingSoon: true },
      { label: "Settings", href: "#", capability: CAPABILITIES.TEAM_MANAGE, comingSoon: true },
    ],
  },
];

/** Filters the navigation down to what these capabilities allow. */
export function visibleSections(capabilities: readonly Capability[]): NavSection[] {
  const has = (capability?: Capability) => !capability || capabilities.includes(capability);

  return NAV_SECTIONS.filter((section) => has(section.capability))
    .map((section) => ({ ...section, items: section.items.filter((item) => has(item.capability)) }))
    .filter((section) => section.items.length > 0);
}
