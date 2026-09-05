/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source of truth: packages/contracts/endpoints.ts
 * Regenerate:      npm run sync:contracts   (from the repo root)
 */

/**
 * REST path builders for the backend API.
 *
 * Framework-agnostic: these return plain relative paths (no leading host). The
 * client in `client.ts` joins them onto the configured base URL.
 *
 * Namespacing rule (unchanged from the legacy app): everything under
 * `/admin/**` is authenticated and capability-checked; everything else is public.
 */

const enc = encodeURIComponent;

export const endpoints = {
  auth: {
    login: () => `/auth/login`,
    logout: () => `/auth/logout`,
    session: () => `/auth/session`,
    refresh: () => `/auth/refresh`,
  },

  /** Public, unauthenticated. */
  public: {
    leads: () => `/public/leads`,
    services: () => `/services`,
    sitemapEntries: () => `/public/sitemap-entries`,
    conversations: {
      start: () => `/conversations`,
      bySession: (sessionId: string) => `/conversations/${enc(sessionId)}`,
      messages: (sessionId: string) => `/conversations/${enc(sessionId)}/messages`,
    },
  },

  /** Authenticated + capability-checked. */
  admin: {
    dashboard: () => `/admin/dashboard`,

    crm: {
      config: () => `/admin/crm/config`,
      pipeline: () => `/admin/pipeline`,
    },

    leads: {
      list: () => `/admin/leads`,
      create: () => `/admin/leads`,
      detail: (id: string) => `/admin/leads/${enc(id)}`,
      update: (id: string) => `/admin/leads/${enc(id)}`,
      stage: (id: string) => `/admin/leads/${enc(id)}/stage`,
      assign: (id: string) => `/admin/leads/${enc(id)}/assign`,
      notes: (id: string) => `/admin/leads/${enc(id)}/notes`,
      activities: (id: string) => `/admin/leads/${enc(id)}/activities`,
    },

    contacts: {
      list: () => `/admin/contacts`,
      create: () => `/admin/contacts`,
      detail: (id: string) => `/admin/contacts/${enc(id)}`,
    },

    tasks: {
      list: () => `/admin/tasks`,
      create: () => `/admin/tasks`,
      update: (id: string) => `/admin/tasks/${enc(id)}`,
    },

    conversations: {
      detail: (id: string) => `/admin/conversations/${enc(id)}`,
    },

    cms: {
      summary: () => `/admin/cms/summary`,
      options: (resource: string) => `/admin/cms/${enc(resource)}/options`,
      list: (resource: string) => `/admin/cms/${enc(resource)}`,
      create: (resource: string) => `/admin/cms/${enc(resource)}`,
      detail: (resource: string, id: string) => `/admin/cms/${enc(resource)}/${enc(id)}`,
      update: (resource: string, id: string) => `/admin/cms/${enc(resource)}/${enc(id)}`,
      publish: (resource: string, id: string) => `/admin/cms/${enc(resource)}/${enc(id)}/publish`,
    },

    media: {
      list: () => `/admin/cms/media`,
      upload: () => `/admin/cms/media/upload`,
      detail: (id: string) => `/admin/cms/media/${enc(id)}`,
      update: (id: string) => `/admin/cms/media/${enc(id)}`,
      remove: (id: string) => `/admin/cms/media/${enc(id)}`,
    },
  },
} as const;

/** Every CMS resource key the generic `admin.cms.*` routes accept. */
export const CMS_RESOURCE_KEYS = [
  "services",
  "industries",
  "technologies",
  "projects",
  "project-categories",
  "case-studies",
  "testimonials",
  "faqs",
  "blog",
  "blog-categories",
  "blog-tags",
  "media",
] as const;

export type CmsResourceKey = (typeof CMS_RESOURCE_KEYS)[number];
