/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source of truth: packages/contracts/index.ts
 * Regenerate:      npm run sync:contracts   (from the repo root)
 */

/**
 * Barrel for the shared API contract.
 *
 * Apps import from their own synced copy, e.g.:
 *   import { ApiResponse, PublicationStatus } from "@/contracts";
 *
 * Edit the files in `packages/contracts/` and run `npm run sync:contracts`
 * from the repo root — never edit an app's `src/contracts/` directly.
 */

export * from "./envelope";
export * from "./enums";
export * from "./capabilities";
export * from "./endpoints";
export * from "./client";
