import { notFound, redirect } from "next/navigation";

import { CmsForm } from "@/features/cms/components/cms-form";
import { PageHeader } from "@/shared/components/admin/page-header";
import { Card, ErrorState } from "@/shared/components/primitives";
import { adminApiGet } from "@/lib/api/admin-api";
import { getResource, isCmsResourceKey } from "@/features/cms/registry";
import { CAPABILITIES } from "@/contracts";
import { getSession } from "@/lib/auth";

interface PageProps {
  params: Promise<{ resource: string }>;
}

type Options = Record<string, { id: string; name: string }[]>;

export default async function CmsCreatePage({ params }: PageProps) {
  const { resource: key } = await params;

  if (!isCmsResourceKey(key)) notFound();

  const resource = getResource(key);
  const session = await getSession();

  // The API enforces this too; redirecting just avoids showing a form that
  // could never be submitted.
  if (!session || !session.capabilities.includes(CAPABILITIES.CMS_WRITE)) {
    redirect(`/cms/${key}`);
  }

  const optionsResult = await adminApiGet<Options>(`/api/admin/cms/${key}/options`);

  return (
    <>
      <PageHeader
        title={`New ${resource.singular.toLowerCase()}`}
        description="Saved as a draft. Publish it from the edit screen once it is ready."
        breadcrumbs={[
          { label: "CMS", href: "/cms" },
          { label: resource.label, href: `/cms/${key}` },
          { label: "New" },
        ]}
      />

      {!optionsResult.ok ? (
        <ErrorState code={optionsResult.code} message={optionsResult.message} />
      ) : (
        <Card>
          <div className="px-4 py-4">
            <CmsForm
              resourceKey={key}
              resourceLabel={resource.singular}
              fields={resource.fields}
              childConfigs={resource.children}
              record={null}
              options={optionsResult.data}
            />
          </div>
        </Card>
      )}
    </>
  );
}

