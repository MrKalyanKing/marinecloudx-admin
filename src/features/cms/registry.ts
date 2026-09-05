/**
 * CMS resource registry — the single description of every manageable content
 * type.
 *
 * Twelve resources with near-identical CRUD would otherwise mean twelve copies
 * of the same repository, service, route and page. Instead each resource is
 * declared once here (model, select shape, fields, publication behaviour) and
 * one generic stack drives all of them. Adding a content type is an entry in
 * this file, not a new subsystem.
 *
 * The select shapes below are still explicit per resource — nothing returns a
 * whole Prisma object.
 *
 * Publication is deliberately NOT uniform, because the schema is not uniform:
 *
 *   "status"    PublicationStatus + publishedAt   Service, Project, CaseStudy,
 *                                                 Testimonial, BlogPost
 *   "statusOnly" PublicationStatus, no timestamp  Faq
 *   "active"     isActive boolean                 Industry, Technology
 *   "none"       always live taxonomy             categories, tags, media
 *
 * Forcing one scheme onto all of them would have meant a migration. None was
 * needed.
 */

import {
  MediaType,
  ProjectMediaRole,
  ProjectStatus,
  TechnologyCategory,
} from "@/contracts";

/** Prisma model delegates the CMS is allowed to touch. */
export type CmsModelName =
  | "service"
  | "serviceFeature"
  | "industry"
  | "technology"
  | "project"
  | "projectCategory"
  | "projectMedia"
  | "caseStudy"
  | "testimonial"
  | "faq"
  | "blogPost"
  | "blogCategory"
  | "blogTag"
  | "media";

export type FieldKind =
  | "text"
  | "textarea"
  | "slug"
  | "number"
  | "url"
  | "enum"
  | "relation"
  | "relationMany"
  | "boolean";

export interface CmsField {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  help?: string;
  rows?: number;
  max?: number;
  /** Enum members, for kind "enum". */
  options?: readonly string[];
  /**
   * Target resource key, for relation kinds.
   *
   * Typed as `string` rather than `CmsResourceKey` on purpose: the key type is
   * derived from the registry, and referring to it here would make the registry
   * reference its own type. Validated at runtime with `isCmsResourceKey`.
   */
  target?: string;
  /** Field whose value seeds a slug suggestion. */
  slugFrom?: string;
  /**
   * Section heading this field belongs to on the edit form.
   *
   * Optional throughout: a resource that declares no groups renders as one flat
   * block exactly as before, so grouping is opt-in per resource rather than a
   * change every content type has to absorb.
   */
  group?: string;
  /**
   * Shown instead of an empty dropdown when the relation target has no rows.
   *
   * A select containing only "None" tells an editor nothing about why. This
   * says what is actually missing.
   */
  emptyHint?: string;
}

/** A repeatable child collection edited inline on the parent's form. */
export interface CmsChild {
  key: string;
  label: string;
  model: CmsModelName;
  /** Foreign key on the child pointing at the parent. */
  parentField: string;
  fields: CmsField[];
  select: Record<string, true>;
}

export type PublicationMode = "status" | "statusOnly" | "active" | "none";

export interface CmsResource {
  key: string;
  label: string;
  singular: string;
  model: CmsModelName;
  /** Column shown as the row's title in list views. */
  titleField: string;
  /** Fields a search term is matched against, case-insensitively. */
  searchFields: string[];
  /** Default ordering. */
  orderBy: Record<string, "asc" | "desc">[];
  publication: PublicationMode;
  /** Publication column: "status", "publicationStatus" or "isActive". */
  publicationField?: string;
  /** True when the model also carries publishedAt. */
  hasPublishedAt?: boolean;
  /** Unique slug column, if the model has one. */
  slugField?: string;
  fields: CmsField[];
  /** Explicit select for list rows — keeps long content out of lists. */
  listSelect: Record<string, unknown>;
  /** Explicit select for the edit form. */
  detailSelect: Record<string, unknown>;
  children?: CmsChild[];
  /** Shown in the CMS navigation, rather than only reachable as a sub-resource. */
  inNav: boolean;
}

const TIMESTAMPS = { createdAt: true, updatedAt: true };

/** Compact id/name shape used for relation dropdown options. */
export const OPTION_SELECT = { id: true, name: true } as const;

export const CMS_RESOURCES = {
  services: {
    key: "services",
    label: "Services",
    singular: "Service",
    model: "service",
    titleField: "name",
    searchFields: ["name", "slug"],
    orderBy: [{ order: "asc" }, { name: "asc" }],
    publication: "status",
    publicationField: "status",
    hasPublishedAt: true,
    slugField: "slug",
    inNav: true,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, max: 150 },
      { name: "slug", label: "Slug", kind: "slug", required: true, slugFrom: "name", help: "Used in the public URL, e.g. /services/web-development" },
      { name: "shortDescription", label: "Short description", kind: "textarea", rows: 2, max: 500 },
      { name: "fullDescription", label: "Full description", kind: "textarea", rows: 8, max: 20_000 },
      { name: "order", label: "Display order", kind: "number" },
      { name: "seoTitle", label: "SEO title", kind: "text", max: 200 },
      { name: "seoDescription", label: "SEO description", kind: "textarea", rows: 2, max: 500 },
      { name: "coverMediaId", label: "Cover image", kind: "relation", target: "media" },
    ],
    listSelect: {
      id: true, name: true, slug: true, status: true, order: true, publishedAt: true, ...TIMESTAMPS,
      _count: { select: { features: true, projects: true } },
    },
    detailSelect: {
      id: true, name: true, slug: true, shortDescription: true, fullDescription: true,
      status: true, publishedAt: true, order: true, seoTitle: true, seoDescription: true,
      coverMediaId: true, ...TIMESTAMPS,
    },
    children: [
      {
        key: "features",
        label: "Features",
        model: "serviceFeature",
        parentField: "serviceId",
        select: { id: true, name: true, description: true, order: true },
        fields: [
          { name: "name", label: "Feature", kind: "text", required: true, max: 200 },
          { name: "description", label: "Description", kind: "text", max: 500 },
          { name: "order", label: "Order", kind: "number" },
        ],
      },
    ],
  },

  industries: {
    key: "industries",
    label: "Industries",
    singular: "Industry",
    model: "industry",
    titleField: "name",
    searchFields: ["name", "slug"],
    orderBy: [{ order: "asc" }, { name: "asc" }],
    // No PublicationStatus on this model — isActive is the visibility switch.
    publication: "active",
    publicationField: "isActive",
    slugField: "slug",
    inNav: true,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, max: 150 },
      { name: "slug", label: "Slug", kind: "slug", required: true, slugFrom: "name" },
      { name: "description", label: "Description", kind: "textarea", rows: 3, max: 2_000 },
      { name: "order", label: "Display order", kind: "number" },
    ],
    listSelect: { id: true, name: true, slug: true, isActive: true, order: true, ...TIMESTAMPS },
    detailSelect: { id: true, name: true, slug: true, description: true, isActive: true, order: true, ...TIMESTAMPS },
  },

  technologies: {
    key: "technologies",
    label: "Technologies",
    singular: "Technology",
    model: "technology",
    titleField: "name",
    searchFields: ["name", "slug"],
    orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
    publication: "active",
    publicationField: "isActive",
    slugField: "slug",
    inNav: true,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, max: 150 },
      { name: "slug", label: "Slug", kind: "slug", required: true, slugFrom: "name" },
      { name: "category", label: "Category", kind: "enum", options: Object.values(TechnologyCategory), required: true },
      { name: "order", label: "Display order", kind: "number" },
    ],
    listSelect: { id: true, name: true, slug: true, category: true, isActive: true, order: true, ...TIMESTAMPS },
    detailSelect: { id: true, name: true, slug: true, category: true, isActive: true, order: true, ...TIMESTAMPS },
  },

  projects: {
    key: "projects",
    label: "Projects",
    singular: "Project",
    model: "project",
    titleField: "title",
    searchFields: ["title", "slug"],
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    // Project carries TWO states: publicationStatus (is it on the website) and
    // status (how the real engagement is going). Publishing touches the former.
    publication: "status",
    publicationField: "publicationStatus",
    hasPublishedAt: true,
    slugField: "slug",
    inNav: true,
    // Grouped so the editor reads as a form rather than a wall of inputs. The
    // publication state is deliberately absent — it belongs to the publish
    // endpoint, not to this payload.
    fields: [
      { name: "title", label: "Title", kind: "text", required: true, max: 200, group: "Project information" },
      { name: "slug", label: "Slug", kind: "slug", required: true, slugFrom: "title", group: "Project information", help: "Used in the public URL, e.g. /projects/loyalty-platform. Changing it after publishing breaks existing links." },
      { name: "shortDescription", label: "Short description", kind: "textarea", rows: 2, max: 500, group: "Project information", help: "Shown on the projects listing and in search results." },
      { name: "fullDescription", label: "Full description", kind: "textarea", rows: 8, max: 20_000, group: "Project information" },
      { name: "categoryId", label: "Category", kind: "relation", target: "project-categories", group: "Project information", emptyHint: "No project categories exist yet. Create one under Project categories first." },

      { name: "industries", label: "Industries", kind: "relationMany", target: "industries", group: "Business context", emptyHint: "No industries exist yet." },
      { name: "services", label: "Services", kind: "relationMany", target: "services", group: "Business context", emptyHint: "No services exist yet." },
      { name: "technologies", label: "Technologies", kind: "relationMany", target: "technologies", group: "Business context", emptyHint: "No technologies exist yet." },
      { name: "status", label: "Delivery status", kind: "enum", options: Object.values(ProjectStatus), group: "Business context", help: "How the engagement itself is going — separate from whether it is published." },
      { name: "liveUrl", label: "Live URL", kind: "url", max: 500, group: "Business context" },

      { name: "coverMediaId", label: "Cover image", kind: "relation", target: "media", group: "Media", emptyHint: "No media uploaded yet. Upload an image in the Media library first." },

      { name: "featured", label: "Featured", kind: "boolean", group: "Presentation & SEO" },
      { name: "order", label: "Display order", kind: "number", group: "Presentation & SEO" },
      { name: "seoTitle", label: "SEO title", kind: "text", max: 200, group: "Presentation & SEO" },
      { name: "seoDescription", label: "SEO description", kind: "textarea", rows: 2, max: 500, group: "Presentation & SEO" },
    ],
    listSelect: {
      id: true, title: true, slug: true, publicationStatus: true, status: true,
      featured: true, order: true, publishedAt: true, ...TIMESTAMPS,
      category: { select: { id: true, name: true } },
    },
    detailSelect: {
      id: true, title: true, slug: true, shortDescription: true, fullDescription: true,
      categoryId: true, publicationStatus: true, status: true, featured: true, order: true,
      liveUrl: true, seoTitle: true, seoDescription: true, coverMediaId: true, publishedAt: true,
      ...TIMESTAMPS,
      services: { select: { id: true } },
      industries: { select: { id: true } },
      technologies: { select: { id: true } },
    },
    children: [
      {
        key: "media",
        label: "Gallery",
        model: "projectMedia",
        parentField: "projectId",
        select: { id: true, mediaId: true, role: true, caption: true, order: true },
        fields: [
          { name: "mediaId", label: "Media", kind: "relation", target: "media", required: true, emptyHint: "No media uploaded yet." },
          { name: "role", label: "Role", kind: "enum", options: Object.values(ProjectMediaRole) },
          { name: "caption", label: "Caption", kind: "text", max: 300 },
          { name: "order", label: "Order", kind: "number" },
        ],
      },
    ],
  },

  "project-categories": {
    key: "project-categories",
    label: "Project categories",
    singular: "Project category",
    model: "projectCategory",
    titleField: "name",
    searchFields: ["name", "slug"],
    orderBy: [{ order: "asc" }, { name: "asc" }],
    // Taxonomy: no status column exists, so there is nothing to publish.
    publication: "none",
    slugField: "slug",
    inNav: true,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, max: 150 },
      { name: "slug", label: "Slug", kind: "slug", required: true, slugFrom: "name" },
      { name: "description", label: "Description", kind: "textarea", rows: 3, max: 2_000 },
      { name: "order", label: "Display order", kind: "number" },
    ],
    listSelect: { id: true, name: true, slug: true, order: true, ...TIMESTAMPS, _count: { select: { projects: true } } },
    detailSelect: { id: true, name: true, slug: true, description: true, order: true, ...TIMESTAMPS },
  },

  "case-studies": {
    key: "case-studies",
    label: "Case studies",
    singular: "Case study",
    model: "caseStudy",
    titleField: "id",
    searchFields: [],
    orderBy: [{ createdAt: "desc" }],
    publication: "status",
    publicationField: "status",
    hasPublishedAt: true,
    inNav: true,
    fields: [
      { name: "projectId", label: "Project", kind: "relation", target: "projects", required: true, group: "Project", help: "One case study per project. The public URL is the project's slug, and the page stays hidden until BOTH the project and this case study are published.", emptyHint: "No projects exist yet. Create the project first." },

      { name: "challenge", label: "Challenge", kind: "textarea", rows: 5, max: 20_000, group: "Narrative" },
      { name: "approach", label: "Approach", kind: "textarea", rows: 5, max: 20_000, group: "Narrative" },
      { name: "solution", label: "Solution", kind: "textarea", rows: 5, max: 20_000, group: "Narrative" },
      { name: "implementation", label: "Implementation", kind: "textarea", rows: 5, max: 20_000, group: "Narrative" },
      { name: "results", label: "Results", kind: "textarea", rows: 5, max: 20_000, group: "Narrative", help: "Leave blank until real, verified outcomes are available. Blank sections are omitted from the public page." },

      { name: "seoTitle", label: "SEO title", kind: "text", max: 200, group: "SEO" },
      { name: "seoDescription", label: "SEO description", kind: "textarea", rows: 2, max: 500, group: "SEO" },
    ],
    listSelect: {
      id: true, status: true, publishedAt: true, ...TIMESTAMPS,
      project: { select: { id: true, title: true, slug: true } },
    },
    detailSelect: {
      id: true, projectId: true, challenge: true, approach: true, solution: true,
      implementation: true, results: true, status: true, publishedAt: true,
      seoTitle: true, seoDescription: true, ...TIMESTAMPS,
    },
  },

  testimonials: {
    key: "testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    model: "testimonial",
    titleField: "authorName",
    searchFields: ["authorName", "companyName"],
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    publication: "status",
    publicationField: "status",
    hasPublishedAt: true,
    inNav: true,
    fields: [
      { name: "authorName", label: "Author name", kind: "text", required: true, max: 150 },
      { name: "authorRole", label: "Author role", kind: "text", max: 150 },
      { name: "companyName", label: "Company", kind: "text", max: 200 },
      { name: "content", label: "Testimonial", kind: "textarea", rows: 5, required: true, max: 5_000 },
      { name: "rating", label: "Rating (1–5)", kind: "number", help: "Leave blank if not rated." },
      { name: "projectId", label: "Related project", kind: "relation", target: "projects" },
      { name: "photoMediaId", label: "Photo", kind: "relation", target: "media" },
      { name: "order", label: "Display order", kind: "number" },
    ],
    listSelect: {
      id: true, authorName: true, companyName: true, rating: true, status: true,
      order: true, publishedAt: true, ...TIMESTAMPS,
    },
    detailSelect: {
      id: true, authorName: true, authorRole: true, companyName: true, content: true,
      rating: true, projectId: true, photoMediaId: true, status: true, publishedAt: true,
      order: true, ...TIMESTAMPS,
    },
  },

  faqs: {
    key: "faqs",
    label: "FAQs",
    singular: "FAQ",
    model: "faq",
    titleField: "question",
    searchFields: ["question", "category"],
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    // Faq has status but no publishedAt column — nothing to stamp.
    publication: "statusOnly",
    publicationField: "status",
    inNav: true,
    fields: [
      { name: "question", label: "Question", kind: "text", required: true, max: 500 },
      { name: "answer", label: "Answer", kind: "textarea", rows: 6, required: true, max: 10_000 },
      { name: "category", label: "Category", kind: "text", max: 100, help: "A simple grouping label, e.g. Pricing." },
      { name: "order", label: "Display order", kind: "number" },
    ],
    listSelect: { id: true, question: true, category: true, status: true, order: true, ...TIMESTAMPS },
    detailSelect: { id: true, question: true, answer: true, category: true, status: true, order: true, ...TIMESTAMPS },
  },

  blog: {
    key: "blog",
    label: "Blog posts",
    singular: "Blog post",
    model: "blogPost",
    titleField: "title",
    searchFields: ["title", "slug"],
    orderBy: [{ createdAt: "desc" }],
    publication: "status",
    publicationField: "status",
    hasPublishedAt: true,
    slugField: "slug",
    inNav: true,
    fields: [
      { name: "title", label: "Title", kind: "text", required: true, max: 250, group: "Post" },
      { name: "slug", label: "Slug", kind: "slug", required: true, slugFrom: "title", group: "Post", help: "Used in the public URL, e.g. /blog/how-we-scope-work. Changing it after publishing breaks existing links." },
      { name: "excerpt", label: "Excerpt", kind: "textarea", rows: 2, max: 1_000, group: "Post", help: "Shown on the blog listing and used as the meta description when no SEO description is set." },
      { name: "content", label: "Content", kind: "textarea", rows: 16, max: 100_000, group: "Post", help: "Plain text. Blank lines separate paragraphs. Markup is escaped, not rendered — see docs/blog.md." },

      { name: "categoryId", label: "Category", kind: "relation", target: "blog-categories", group: "Classification", emptyHint: "No blog categories exist yet. Create one under Blog categories first." },
      { name: "tags", label: "Tags", kind: "relationMany", target: "blog-tags", group: "Classification", emptyHint: "No blog tags exist yet." },

      { name: "coverMediaId", label: "Cover image", kind: "relation", target: "media", group: "Media", emptyHint: "No media uploaded yet. Upload an image in the Media library first." },

      { name: "seoTitle", label: "SEO title", kind: "text", max: 200, group: "SEO", help: "Falls back to the post title when blank." },
      { name: "seoDescription", label: "SEO description", kind: "textarea", rows: 2, max: 500, group: "SEO", help: "Falls back to the excerpt when blank." },
    ],
    listSelect: {
      id: true, title: true, slug: true, status: true, publishedAt: true, ...TIMESTAMPS,
      category: { select: { id: true, name: true } },
      author: { select: { id: true, name: true } },
    },
    detailSelect: {
      id: true, title: true, slug: true, excerpt: true, content: true, categoryId: true,
      coverMediaId: true, status: true, publishedAt: true, seoTitle: true, seoDescription: true,
      ...TIMESTAMPS,
      tags: { select: { id: true } },
    },
  },

  "blog-categories": {
    key: "blog-categories",
    label: "Blog categories",
    singular: "Blog category",
    model: "blogCategory",
    titleField: "name",
    searchFields: ["name", "slug"],
    orderBy: [{ order: "asc" }, { name: "asc" }],
    publication: "none",
    slugField: "slug",
    inNav: true,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, max: 150 },
      { name: "slug", label: "Slug", kind: "slug", required: true, slugFrom: "name" },
      { name: "description", label: "Description", kind: "textarea", rows: 3, max: 2_000 },
      { name: "order", label: "Display order", kind: "number" },
    ],
    listSelect: { id: true, name: true, slug: true, order: true, ...TIMESTAMPS, _count: { select: { posts: true } } },
    detailSelect: { id: true, name: true, slug: true, description: true, order: true, ...TIMESTAMPS },
  },

  "blog-tags": {
    key: "blog-tags",
    label: "Blog tags",
    singular: "Blog tag",
    model: "blogTag",
    titleField: "name",
    searchFields: ["name", "slug"],
    orderBy: [{ name: "asc" }],
    publication: "none",
    slugField: "slug",
    inNav: true,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, max: 100 },
      { name: "slug", label: "Slug", kind: "slug", required: true, slugFrom: "name" },
    ],
    listSelect: { id: true, name: true, slug: true, ...TIMESTAMPS, _count: { select: { posts: true } } },
    detailSelect: { id: true, name: true, slug: true, ...TIMESTAMPS },
  },

  media: {
    key: "media",
    label: "Media",
    singular: "Media item",
    model: "media",
    titleField: "filename",
    searchFields: ["filename", "originalFilename", "altText"],
    orderBy: [{ createdAt: "desc" }],
    publication: "none",
    inNav: true,
    fields: [
      { name: "filename", label: "Filename", kind: "text", required: true, max: 255 },
      { name: "storageKey", label: "Storage key", kind: "text", required: true, max: 500, help: "Server-generated on upload. Editing it here does not move the stored object." },
      { name: "url", label: "URL", kind: "url", max: 1_000 },
      { name: "type", label: "Type", kind: "enum", options: Object.values(MediaType), required: true },
      { name: "mimeType", label: "MIME type", kind: "text", max: 150 },
      { name: "altText", label: "Alt text", kind: "text", max: 500, help: "Describes the image for screen readers." },
      { name: "width", label: "Width (px)", kind: "number" },
      { name: "height", label: "Height (px)", kind: "number" },
    ],
    // size/width/height feed the media library's thumbnails and file sizes.
    // BigInt `size` is converted by the repository before serialisation.
    listSelect: {
      id: true, filename: true, type: true, mimeType: true, url: true, altText: true,
      size: true, width: true, height: true, storageKey: true, ...TIMESTAMPS,
    },
    detailSelect: {
      id: true, filename: true, originalFilename: true, storageKey: true, url: true, type: true,
      mimeType: true, altText: true, width: true, height: true, ...TIMESTAMPS,
    },
  },
} as const satisfies Record<string, CmsResource>;

export type CmsResourceKey = keyof typeof CMS_RESOURCES;

export function isCmsResourceKey(value: string): value is CmsResourceKey {
  return value in CMS_RESOURCES;
}

export function getResource(key: CmsResourceKey): CmsResource {
  return CMS_RESOURCES[key] as CmsResource;
}

/** Resolves a relation `target` string, which cannot be typed as a key here. */
export function resolveTarget(key: string): CmsResource {
  if (!isCmsResourceKey(key)) {
    throw new Error(`Unknown CMS relation target: ${key}`);
  }

  return getResource(key);
}

export const CMS_NAV_RESOURCES: CmsResource[] = Object.values(
  CMS_RESOURCES as Record<string, CmsResource>,
).filter((resource) => resource.inNav);
