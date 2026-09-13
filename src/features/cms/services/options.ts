import { adminApiGet } from "@/lib/api/admin-api";
import type { CmsResource } from "@/features/cms/registry";

export type CmsOptionsMap = Record<string, { id: string; name: string }[]>;

/**
 * Loads relation options for all relation/relationMany fields in the resource
 * and any child collections, returning a dictionary keyed by target resource slug.
 */
export async function fetchCmsFormOptions(resource: CmsResource): Promise<CmsOptionsMap> {
  const targets = new Set<string>();

  for (const field of resource.fields) {
    if ((field.kind === "relation" || field.kind === "relationMany") && field.target) {
      targets.add(field.target);
    }
  }

  for (const child of resource.children ?? []) {
    for (const field of child.fields) {
      if ((field.kind === "relation" || field.kind === "relationMany") && field.target) {
        targets.add(field.target);
      }
    }
  }

  const options: CmsOptionsMap = {};

  await Promise.all(
    Array.from(targets).map(async (target) => {
      const res = await adminApiGet<{ id: string; name: string }[]>(`/api/admin/cms/${target}/options`);
      if (res.ok && Array.isArray(res.data)) {
        options[target] = res.data;
      } else {
        options[target] = [];
      }
    }),
  );

  return options;
}
