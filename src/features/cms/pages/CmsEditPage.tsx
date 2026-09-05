import { notFound } from "next/navigation";

import { CmsForm } from "@/features/cms/components/cms-form";
import { PublishToggle } from "@/features/cms/components/publish-toggle";
import { PageHeader } from "@/shared/components/admin/page-header";
import { Card, CardHeader, ErrorState } from "@/shared/components/primitives";
import { adminApiGet } from "@/lib/api/admin-api";
import { getResource, isCmsResourceKey } from "@/features/cms/registry";
import { CAPABILITIES } from "@/contracts";
import { getSession } from "@/lib/auth";

interface PageProps {
  params: Promise<{ resource: string; id: string }>;
}

type Row = Record<string, unknown>;
type Options = Record<string, { id: string; name: string }[]>;

export default async function CmsEditPage({ params }: PageProps) {
  const { resource: key, id } = await params;

  if (!isCmsResourceKey(key)) notFound();

  const resource = getResource(key);
  const session = await getSession();
  const canWrite =
    Boolean(session) && session!.capabilities.includes(CAPABILITIES.CMS_WRITE);

  const [recordResult, optionsResult] = await Promise.all([
    adminApiGet<Row>(`/api/admin/cms/${key}/${id}`),
    adminApiGet<Options>(`/api/admin/cms/${key}/options`),
  ]);

  if (!recordResult.ok) {
    if (recordResult.code === "NOT_FOUND") notFound();

    return (
      <>
        <PageHeader
          title={resource.singular}
          breadcrumbs={[
            { label: "CMS", href: "/cms" },
            { label: resource.label, href: `/cms/${key}` },
          ]}
        />
        <ErrorState code={recordResult.code} message={recordResult.message} />
      </>
    );
  }

  const record = recordResult.data;
  const title =
    String(record[resource.titleField] ?? "") ||
    String((record.project as Row)?.title ?? resource.singular);

  const isPublished =
    resource.publication === "active"
      ? record[resource.publicationField ?? ""] === true
      : record[resource.publicationField ?? ""] === "PUBLISHED";

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: "CMS", href: "/cms" },
          { label: resource.label, href: `/cms/${key}` },
          { label: "Edit" },
        ]}
      />

      {resource.publication !== "none" ? (
        <Card className="mb-4">
          <CardHeader
            title="Publication"
            description="Publishing is a separate action — saving changes never puts content live."
          />
          <div className="px-4 py-3">
            {canWrite ? (
              <PublishToggle
                resourceKey={key}
                id={id}
                isPublished={isPublished}
                publishedAt={record.publishedAt ? String(record.publishedAt) : null}
              />
            ) : (
              <p className="text-sm text-slate-600">
                {isPublished ? "Published" : "Draft"} — your role cannot change this.
              </p>
            )}
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="px-4 py-4">
          {canWrite && optionsResult.ok ? (
            <CmsForm
              resourceKey={key}
              resourceLabel={resource.singular}
              fields={resource.fields}
              childConfigs={resource.children}
              record={record}
              options={optionsResult.data}
            />
          ) : (
            <dl className="divide-y divide-slate-100">
              {resource.fields.map((field) => (
                <div key={field.name} className="grid gap-1 py-2 sm:grid-cols-3">
                  <dt className="text-xs font-medium text-slate-500">{field.label}</dt>
                  <dd className="sm:col-span-2 whitespace-pre-wrap text-sm text-slate-800">
                    {record[field.name] === null || record[field.name] === undefined
                      ? "—"
                      : String(record[field.name])}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Card>
    </>
  );
}

