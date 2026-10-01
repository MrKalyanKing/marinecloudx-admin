"use client";

import Link from "next/link";
import { useState } from "react";

import { BulkStatusBar } from "@/features/careers/components/bulk-status-bar";
import {
  ApplicationStatusBadge,
  CandidateAvatar,
  applicationSourceLabel,
  experienceLabel,
  formatDateTime,
  formatRelativeTime,
} from "@/features/careers/components/display";
import { ResumeActions } from "@/features/careers/components/resume-actions";
import { ApplicationStatusSelect } from "@/features/careers/components/status-select";
import type { ApplicationListItem } from "@/features/careers/types/careers";
import { ButtonLink, TableWrap, Td, Th } from "@/shared/components/primitives";

export function ApplicationsTable({
  applications,
  canWrite,
  nowIso,
}: {
  applications: ApplicationListItem[];
  canWrite: boolean;
  nowIso: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const now = new Date(nowIso);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === applications.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(applications.map((a) => a.id)));
  }

  return (
    <>
      {canWrite ? (
        <BulkStatusBar
          selectedIds={[...selected]}
          onCleared={() => setSelected(new Set())}
        />
      ) : null}

      <TableWrap>
        <thead>
          <tr>
            {canWrite ? (
              <Th className="w-10">
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={selected.size === applications.length && applications.length > 0}
                  onChange={toggleAll}
                />
              </Th>
            ) : null}
            <Th>Candidate</Th>
            <Th>Application ID</Th>
            <Th>Position</Th>
            <Th>Method</Th>
            <Th>Experience</Th>
            <Th>Location</Th>
            <Th>Applied On</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-slate-50">
              {canWrite ? (
                <Td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${app.candidateName}`}
                    checked={selected.has(app.id)}
                    onChange={() => toggle(app.id)}
                  />
                </Td>
              ) : null}
              <Td>
                <div className="flex items-start gap-3">
                  <CandidateAvatar name={app.candidateName} />
                  <div className="min-w-0">
                    <Link
                      href={`/careers/applications/${app.id}`}
                      className="font-medium text-slate-900 hover:text-teal-700 hover:underline"
                    >
                      {app.candidateName}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{app.email}</p>
                    {app.phone ? (
                      <p className="text-xs text-slate-500">{app.phone}</p>
                    ) : null}
                    {app.skills.length > 0 ? (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {app.skills.slice(0, 4).join(" · ")}
                        {app.skills.length > 4 ? "…" : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Td>
              <Td>
                <p className="font-mono text-xs text-slate-800">{app.applicationCode}</p>
              </Td>
              <Td>
                <p className="text-sm text-slate-800">{app.job?.title ?? "—"}</p>
                {app.job?.jobCode ? (
                  <p className="font-mono text-xs text-slate-500">{app.job.jobCode}</p>
                ) : null}
                {app.currentJobTitle ? (
                  <p className="text-xs text-slate-500">{app.currentJobTitle}</p>
                ) : null}
              </Td>
              <Td>
                <span className="text-xs text-slate-700">
                  {applicationSourceLabel(app.applicationSource)}
                </span>
              </Td>
              <Td className="tabular-nums">{experienceLabel(app.yearsOfExperience)}</Td>
              <Td>{app.location ?? "—"}</Td>
              <Td>
                <time dateTime={app.createdAt} title={formatDateTime(app.createdAt)}>
                  {formatRelativeTime(app.createdAt, now)}
                </time>
              </Td>
              <Td>
                {canWrite ? (
                  <ApplicationStatusSelect
                    applicationId={app.id}
                    currentStatus={app.status}
                    hideLabel
                    compact
                  />
                ) : (
                  <ApplicationStatusBadge status={app.status} />
                )}
              </Td>
              <Td>
                <div className="relative flex flex-wrap items-center gap-1.5">
                  <ButtonLink
                    href={`/careers/applications/${app.id}`}
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                  >
                    View
                  </ButtonLink>
                  {app.hasResume ? (
                    <div className="contents">
                      <ResumeQuickDownload applicationId={app.id} />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    aria-expanded={menuOpen === app.id}
                    aria-haspopup="menu"
                    onClick={() => setMenuOpen(menuOpen === app.id ? null : app.id)}
                  >
                    More
                  </button>
                  {menuOpen === app.id ? (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-10 mt-1 min-w-40 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
                    >
                      <Link
                        role="menuitem"
                        href={`/careers/applications/${app.id}`}
                        className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setMenuOpen(null)}
                      >
                        Open profile
                      </Link>
                      {app.job ? (
                        <Link
                          role="menuitem"
                          href={`/careers/applications?jobId=${app.job.id}`}
                          className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setMenuOpen(null)}
                        >
                          View job applications
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </>
  );
}

function ResumeQuickDownload({ applicationId }: { applicationId: string }) {
  const [pending, setPending] = useState(false);

  async function download() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(
        `/api/admin/careers/applications/${encodeURIComponent(applicationId)}/resume-url?disposition=download`,
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: { url: string };
      };
      if (payload.success && payload.data?.url) {
        window.open(payload.data.url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void download()}
      disabled={pending}
      className="rounded-md px-2 py-1 text-xs text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-60"
    >
      {pending ? "…" : "Resume"}
    </button>
  );
}
