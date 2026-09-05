/**
 * Storage configuration probe for the admin UI.
 *
 * The admin no longer talks to S3 directly — uploads go through the NestJS
 * backend (`POST /admin/cms/media/upload`). This only tells the media page
 * whether the *backend* has storage configured, surfaced as a public env flag,
 * so the page can show the "not configured" notice instead of a broken upload.
 *
 * `NEXT_PUBLIC_STORAGE_CONFIGURED=true` once the backend has AWS_S3_BUCKET set.
 */

export function isStorageConfigured(): boolean {
  return process.env.NEXT_PUBLIC_STORAGE_CONFIGURED === "true";
}

export function missingStorageEnvVars(): string[] {
  return isStorageConfigured() ? [] : ["AWS_S3_BUCKET (on the backend)"];
}
