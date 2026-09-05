/**
 * Public surface of the cms feature.
 *
 * Everything here is safe to import from a client component.
 *
 * Two folders are deliberately absent.
 *
 * `services/` is marked `server-only`. Re-exporting it here would pull server
 * code into the client graph the moment a component imported this barrel — a
 * build failure whose error does not point back at this file.
 *
 * `pages/` holds route entry points, not a reusable API. Every page exports
 * `metadata`, so exporting them together collides; and nothing should import a
 * page except the `app/` route file that owns it.
 *
 * Import from either directly:
 *
 *     import { getPublishedServices } from "@/features/content/services/content";
 */

export * from "./components/cms-form";
export * from "./components/media-manager";
export * from "./components/publish-toggle";
