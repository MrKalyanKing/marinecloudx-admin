"use client";

/**
 * CMS editor form.
 *
 * Rendered from the resource's field declarations, so every content type gets
 * the same validation display, submit handling and duplicate-submission
 * guarding without twelve hand-written forms.
 *
 * The form never sends a publication column — publishing is a separate action
 * with its own button, so saving cannot put content live by accident.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Field, Input, Select, Textarea } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";
import type { CmsChild, CmsField } from "@/features/cms/registry";

type Row = Record<string, unknown>;
type Options = Record<string, { id: string; name: string }[]>;

/** Lowercase, hyphenated, no repeated or trailing separators. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Splits fields into their declared sections, preserving declaration order.
 *
 * A resource that declares no groups yields a single untitled section, so the
 * eleven other content types render exactly as they did before.
 */
function groupFields(fields: CmsField[]): [string | undefined, CmsField[]][] {
  const groups: [string | undefined, CmsField[]][] = [];

  for (const field of fields) {
    const existing = groups.find(([name]) => name === field.group);

    if (existing) {
      existing[1].push(field);
    } else {
      groups.push([field.group, [field]]);
    }
  }

  return groups;
}

function initialValue(field: CmsField, record: Row | null): unknown {
  const existing = record?.[field.name];

  if (field.kind === "relationMany") {
    return Array.isArray(existing) ? existing.map((row) => String((row as Row).id)) : [];
  }

  if (existing !== undefined && existing !== null) return existing;

  if (field.kind === "boolean") return false;
  if (field.kind === "number") return 0;
  if (field.kind === "enum") return field.options?.[0] ?? "";

  return "";
}

export function CmsForm({
  resourceKey,
  resourceLabel,
  fields,
  childConfigs,
  record,
  options,
}: {
  resourceKey: string;
  resourceLabel: string;
  fields: CmsField[];
  /** Not named `children` — that is React's reserved prop. */
  childConfigs?: CmsChild[];
  /** Null when creating. */
  record: Row | null;
  options: Options;
}) {
  const router = useRouter();
  const { mutate, isPending, error } = useApiMutation();

  const [values, setValues] = useState<Row>(() => {
    const initial: Row = {};
    for (const field of fields) initial[field.name] = initialValue(field, record);
    return initial;
  });

  const [childRows, setChildRows] = useState<Record<string, Row[]>>(() => {
    const initial: Record<string, Row[]> = {};
    for (const child of childConfigs ?? []) {
      const existing = record?.[child.key];
      initial[child.key] = Array.isArray(existing) ? (existing as Row[]) : [];
    }
    return initial;
  });

  const isEdit = record !== null;

  function set(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  /** Suggests a slug while the slug field is still untouched/empty. */
  function handleTitleChange(field: CmsField, value: string) {
    set(field.name, value);

    const slugField = fields.find((f) => f.slugFrom === field.name);

    if (slugField && !isEdit && !values[slugField.name]) {
      set(slugField.name, slugify(value));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: Row = { ...values };

    for (const child of childConfigs ?? []) {
      payload[child.key] = childRows[child.key];
    }

    const result = isEdit
      ? await mutate(`/api/admin/cms/${resourceKey}/${String(record.id)}`, {
          method: "PATCH",
          body: payload,
        })
      : await mutate(`/api/admin/cms/${resourceKey}`, { method: "POST", body: payload });

    if (result && !isEdit) {
      const created = result as Row;
      router.push(`/cms/${resourceKey}/${String(created.id)}`);
    }
  }

  function renderField(field: CmsField, value: unknown, onChange: (next: unknown) => void, idPrefix = "") {
    const id = `${idPrefix}${field.name}`;
    const fieldError = error?.fields?.[field.name];
    const describedBy = fieldError ? `${id}-error` : undefined;

    const common = {
      id,
      "aria-invalid": fieldError ? true : undefined,
      "aria-describedby": describedBy,
      disabled: isPending,
    } as const;

    switch (field.kind) {
      case "textarea":
        return (
          <Textarea
            {...common}
            rows={field.rows ?? 4}
            value={String(value ?? "")}
            onChange={(event) => onChange(event.target.value)}
          />
        );

      case "number":
        return (
          <Input
            {...common}
            type="number"
            value={value === null || value === "" ? "" : String(value)}
            onChange={(event) =>
              onChange(event.target.value === "" ? null : Number(event.target.value))
            }
          />
        );

      case "boolean":
        return (
          <input
            {...common}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          />
        );

      case "enum":
        return (
          <Select {...common} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            {!field.required ? <option value="">None</option> : null}
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0) + option.slice(1).toLowerCase().replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        );

      case "relation": {
        const available = options[field.target ?? ""] ?? [];

        // An empty dropdown containing only "None" tells an editor nothing.
        // Say what is actually missing instead of offering a dead control.
        if (available.length === 0) {
          return (
            <p className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500">
              {field.emptyHint ?? "Nothing available to link yet."}
            </p>
          );
        }

        return (
          <Select {...common} value={String(value ?? "")} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">None</option>
            {available.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        );
      }

      case "relationMany": {
        const selected = Array.isArray(value) ? (value as string[]) : [];

        return (
          <div className="flex flex-wrap gap-2 rounded-md border border-slate-300 bg-white p-2">
            {(options[field.target ?? ""] ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">{field.emptyHint ?? "None available yet."}</p>
            ) : (
              (options[field.target ?? ""] ?? []).map((option) => (
                <label key={option.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    disabled={isPending}
                    checked={selected.includes(option.id)}
                    onChange={(event) =>
                      onChange(
                        event.target.checked
                          ? [...selected, option.id]
                          : selected.filter((id) => id !== option.id),
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  {option.name}
                </label>
              ))
            )}
          </div>
        );
      }

      case "url":
      case "slug":
      case "text":
      default:
        return (
          <Input
            {...common}
            value={String(value ?? "")}
            onChange={(event) =>
              field.slugFrom
                ? onChange(event.target.value)
                : fields.some((f) => f.slugFrom === field.name)
                  ? handleTitleChange(field, event.target.value)
                  : onChange(event.target.value)
            }
            onBlur={
              field.kind === "slug"
                ? (event) => onChange(slugify(event.target.value))
                : undefined
            }
          />
        );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && !error.fields ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error.message}
        </p>
      ) : null}

      {groupFields(fields).map(([groupName, groupFieldList]) => (
        <section key={groupName ?? "__default"}>
          {groupName ? (
            <h2 className="mb-2 border-b border-slate-200 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {groupName}
            </h2>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {groupFieldList.map((field) => {
              const wide =
                field.kind === "textarea" || field.kind === "relationMany" || field.rows !== undefined;

              return (
                <div key={field.name} className={wide ? "sm:col-span-2" : undefined}>
                  <Field
                    label={field.label}
                    htmlFor={field.name}
                    required={field.required}
                    hint={field.help}
                    error={error?.fields?.[field.name]}
                  >
                    {renderField(field, values[field.name], (next) => set(field.name, next))}
                  </Field>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {(childConfigs ?? []).map((child) => (
        <fieldset key={child.key} className="rounded-md border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-700">{child.label}</legend>

          <div className="flex flex-col gap-2">
            {(childRows[child.key] ?? []).map((row, index) => (
              <div
                key={index}
                className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-2 sm:grid-cols-4"
              >
                {child.fields.map((field) => (
                  <Field
                    key={field.name}
                    label={field.label}
                    htmlFor={`${child.key}-${index}-${field.name}`}
                    required={field.required}
                  >
                    {renderField(
                      field,
                      row[field.name],
                      (next) =>
                        setChildRows((current) => {
                          const rows = [...(current[child.key] ?? [])];
                          rows[index] = { ...rows[index], [field.name]: next };
                          return { ...current, [child.key]: rows };
                        }),
                      `${child.key}-${index}-`,
                    )}
                  </Field>
                ))}

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() =>
                      setChildRows((current) => ({
                        ...current,
                        [child.key]: (current[child.key] ?? []).filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            <div>
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() =>
                  setChildRows((current) => ({
                    ...current,
                    [child.key]: [...(current[child.key] ?? []), {}],
                  }))
                }
              >
                Add {child.label.toLowerCase().replace(/s$/, "")}
              </Button>
            </div>
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-2 border-t border-slate-200 pt-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : isEdit ? "Save changes" : `Create ${resourceLabel.toLowerCase()}`}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => router.push(`/cms/${resourceKey}`)}
        >
          Cancel
        </Button>
        {isEdit ? (
          <span className="ml-auto text-xs text-slate-500">
            Saving does not publish. Use the publish control above.
          </span>
        ) : null}
      </div>
    </form>
  );
}
