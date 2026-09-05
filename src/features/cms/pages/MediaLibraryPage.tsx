import Link from "next/link";

import {
  CopyUrlButton,
  DeleteMediaButton,
  MediaUploader,
} from "@/features/cms/components/media-manager";
import { PageHeader } from "@/shared/components/admin/page-header";
import { Pagination } from "@/shared/components/pagination";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Input,
  Td,
  TableWrap,
  Th,
} from "@/shared/components/primitives";
import { adminApiGet, toQueryString } from "@/lib/api/admin-api";
import { formatDate } from "@/shared/utils/format";
import { CAPABILITIES } from "@/contracts";
import { getSession } from "@/lib/auth";
import { isStorageConfigured, missingStorageEnvVars } from "@/features/cms/services/s3";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

interface MediaRow {
  id: string;
  filename: string;
  storageKey: string;
  url: string | null;
  type: string;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: string;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Media library.
 *
 * Overrides the generic CMS list for this one resource, because media needs
 * thumbnails, an upload control and a reference-aware delete that a generic
 * table cannot express. Reads still go through the same
 * `GET /api/admin/cms/media` endpoint and the same pagination convention.
 */
export default async function MediaLibraryPage({ searchParams }: PageProps) {
  const { page, search } = await searchParams;
  const session = await getSession();
  const canWrite =
    Boolean(session) && session!.capabilities.includes(CAPABILITIES.CMS_WRITE);

  const configured = isStorageConfigured();
  const result = await adminApiGet<MediaRow[]>(
    `/api/admin/cms/media${toQueryString({ page, search })}`,
  );

  const header = (
    <PageHeader
      title="Media"
      description="Images available to the CMS. Files are stored in object storage; only metadata lives in the database."
      breadcrumbs={[{ label: "CMS", href: "/cms" }, { label: "Media" }]}
    />
  );

  return (
    <>
      {header}

      {/* Configuration is reported plainly rather than as a crash. The page,
          the rest of the CMS and the public site all keep working without it. */}
      {!configured ? (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-amber-900">Object storage is not configured</p>
            <p className="mt-1 text-sm text-amber-800">
              Uploads are unavailable until these environment variables are set:{" "}
              <span className="font-mono text-xs">{missingStorageEnvVars().join(", ")}</span>. See{" "}
              <span className="font-mono text-xs">docs/media.md</span> for setup. Existing metadata
              is still listed below.
            </p>
          </div>
        </Card>
      ) : null}

      {canWrite && configured ? (
        <Card className="mb-4">
          <CardHeader title="Upload" description="JPEG, PNG or WebP, up to 10 MB." />
          <MediaUploader />
        </Card>
      ) : null}

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap items-end gap-2 px-4 py-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="media-search" className="text-xs font-medium text-slate-700">
              Search
            </label>
            <Input
              id="media-search"
              name="search"
              type="search"
              defaultValue={search ?? ""}
              placeholder="Filename or alt text"
            />
          </div>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          {search ? (
            <Link
              href="/cms/media"
              className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </Card>

      <Card>
        {!result.ok ? (
          <div className="p-4">
            <ErrorState code={result.code} message={result.message} />
          </div>
        ) : result.data.length === 0 ? (
          <EmptyState
            title={search ? "No media matches" : "No media yet"}
            description={
              search
                ? "Try clearing the search."
                : configured
                  ? "Upload an image above to get started."
                  : "Configure object storage to start uploading."
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Preview</Th>
                <Th>Filename</Th>
                <Th>Type</Th>
                <Th>Size</Th>
                <Th>Alt text</Th>
                <Th>Added</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {result.data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <Td>
                    <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
                      {item.url ? (
                        /* Object-storage URLs are arbitrary external hosts;
                           next/image would need remotePatterns configured per
                           deployment, so a plain img is used here. */
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt={item.altText ?? ""}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">No URL</span>
                      )}
                    </div>
                  </Td>

                  <Td className="font-medium text-slate-900">
                    <Link href={`/cms/media/${item.id}`} className="hover:text-teal-700 hover:underline">
                      {item.filename}
                    </Link>
                    {item.width && item.height ? (
                      <span className="block text-xs text-slate-500">
                        {item.width} × {item.height}
                      </span>
                    ) : null}
                  </Td>

                  <Td>
                    <Badge tone="neutral">{item.mimeType ?? item.type}</Badge>
                  </Td>

                  <Td className="tabular-nums">{formatBytes(item.size)}</Td>

                  <Td className="max-w-xs truncate text-slate-600">
                    {item.altText ?? <span className="text-slate-400">Not set</span>}
                  </Td>

                  <Td className="text-xs tabular-nums text-slate-500">{formatDate(item.createdAt)}</Td>

                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      {item.url ? <CopyUrlButton url={item.url} /> : null}
                      {canWrite ? <DeleteMediaButton id={item.id} filename={item.filename} /> : null}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}

        {result.ok && result.pagination && result.pagination.totalPages > 1 ? (
          <Pagination
            pagination={result.pagination}
            basePath="/cms/media"
            params={{ search }}
          />
        ) : null}
      </Card>
    </>
  );
}
