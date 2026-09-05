"use client";

/**
 * Media upload and delete controls.
 *
 * A client component because uploading needs form state and progress. The
 * listing itself stays server-rendered — only these controls ship JavaScript.
 *
 * Upload posts multipart to /api/admin/cms/media/upload. The browser never
 * chooses a storage key, never sees a credential, and never talks to object
 * storage directly: the file goes to our server, which validates the bytes and
 * decides where it lands.
 */

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button, Field, Input } from "@/shared/components/primitives";

/** Mirrors the server limit so obvious mistakes are caught before uploading. */
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export function MediaUploader() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isUploading) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");

    setError(null);
    setSuccess(null);

    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a file to upload.");
      return;
    }

    // Client-side pre-check only. The server re-validates the bytes regardless,
    // because nothing the browser reports can be trusted.
    if (file.size > MAX_BYTES) {
      setError(`File is too large. The maximum is ${MAX_BYTES / (1024 * 1024)} MB.`);
      return;
    }

    setUploading(true);

    try {
      const response = await fetch("/api/admin/cms/media/upload", { method: "POST", body: data });
      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
        data?: { filename?: string };
        error?: { message?: string; details?: { path: string; message: string }[] };
      } | null;

      if (!response.ok || !body?.success) {
        setError(body?.error?.details?.[0]?.message ?? body?.error?.message ?? "Upload failed. Please try again.");
        return;
      }

      setSuccess(`Uploaded ${body.data?.filename ?? "file"}.`);
      form.reset();
      // Re-renders the server component so the new item appears in the list.
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="px-4 py-4">
      {error ? (
        <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {success ? (
        <p role="status" className="mb-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {success}
        </p>
      ) : null}

      <fieldset disabled={isUploading} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Image" htmlFor="media-file" required hint="JPEG, PNG or WebP. Up to 10 MB.">
          <input
            id="media-file"
            name="file"
            type="file"
            accept={ACCEPT}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-sm"
          />
        </Field>

        <Field label="Alt text" htmlFor="media-alt" hint="Describes the image for screen readers.">
          <Input id="media-alt" name="altText" maxLength={500} />
        </Field>

        <Button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
      </fieldset>
    </form>
  );
}

/**
 * Delete control.
 *
 * The server refuses when the item is still referenced by content, so a 409
 * here is an expected outcome and its message is shown to the user rather than
 * being treated as a failure.
 */
export function DeleteMediaButton({ id, filename }: { id: string; filename: string }) {
  const router = useRouter();
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/cms/media/${id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: { message?: string };
      } | null;

      if (!response.ok || !body?.success) {
        setError(body?.error?.message ?? "Could not delete this item.");
        setConfirming(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  if (error) {
    return (
      <div className="text-right">
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
        <button type="button" onClick={() => setError(null)} className="mt-1 text-xs text-slate-500 underline">
          Dismiss
        </button>
      </div>
    );
  }

  if (!confirming) {
    return (
      <Button variant="ghost" onClick={() => setConfirming(true)} className="text-red-700">
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-xs text-slate-600">Delete {filename}?</span>
      <Button variant="danger" disabled={isPending} onClick={() => void handleDelete()}>
        {isPending ? "Deleting…" : "Confirm"}
      </Button>
      <Button variant="ghost" disabled={isPending} onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}

/** Copies the public URL to the clipboard. */
export function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="text-xs text-teal-700 hover:underline"
    >
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}
