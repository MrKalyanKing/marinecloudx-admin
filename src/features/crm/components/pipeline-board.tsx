"use client";

/**
 * Kanban pipeline board.
 *
 * Columns come from the database — the component receives configured stages and
 * never contains a stage name of its own.
 *
 * Drag-and-drop uses the native HTML5 API. No drag library was added: the board
 * needs one interaction, and a keyboard-accessible `<select>` has to exist on
 * every card regardless (drag-and-drop alone is not accessible), so a
 * dependency would buy very little.
 *
 * Optimistic moves are tracked in `moves`. On failure the entry is dropped, the
 * card returns to its original column and an error is shown — the UI never
 * pretends a rejected change succeeded.
 */

import Link from "next/link";
import { useState } from "react";

import {
  LeadStatusBadge,
  PriorityBadge,
  contactName,
  formatBudget,
} from "@/features/crm/components/display";
import { StageSelect } from "@/features/crm/components/stage-select";
import { cn } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";
import type { CrmConfig, LeadListItem } from "@/features/crm/types/crm";

export interface PipelineColumnData {
  stage: CrmConfig["pipelineStages"][number];
  leadCount: number;
  leads: LeadListItem[];
}

export function PipelineBoard({
  columns,
  cardsPerStage,
  canWrite,
}: {
  columns: PipelineColumnData[];
  cardsPerStage: number;
  canWrite: boolean;
}) {
  const { mutate, error } = useApiMutation();
  /** leadId → optimistic target stage id. */
  const [moves, setMoves] = useState<Record<string, string>>({});
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);

  const stages = columns.map((column) => column.stage);
  const allLeads = columns.flatMap((column) =>
    column.leads.map((lead) => ({ lead, originStageId: column.stage.id })),
  );

  const effectiveStageId = (leadId: string, originStageId: string) =>
    moves[leadId] ?? originStageId;

  async function moveLead(leadId: string, toStageId: string, fromStageId: string) {
    if (!canWrite || toStageId === fromStageId) return;

    setMoves((current) => ({ ...current, [leadId]: toStageId }));
    setMovingLeadId(leadId);

    const result = await mutate(`/api/admin/leads/${leadId}/stage`, {
      method: "PATCH",
      body: { pipelineStageId: toStageId },
    });

    setMovingLeadId(null);

    if (!result) {
      // Rejected — put the card back where it came from.
      setMoves((current) => {
        const next = { ...current };
        delete next[leadId];
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error.message} — the card was returned to its previous stage.
        </p>
      ) : null}

      {/* Horizontal scroll on narrow screens rather than eight crushed columns. */}
      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-3">
          {columns.map((column) => {
            const stageId = column.stage.id;

            const cards = allLeads.filter(
              ({ lead, originStageId }) => effectiveStageId(lead.id, originStageId) === stageId,
            );

            // Server count adjusted by optimistic moves, so the header stays
            // truthful without another round trip.
            const movedIn = allLeads.filter(
              ({ lead, originStageId }) =>
                moves[lead.id] === stageId && originStageId !== stageId,
            ).length;
            const movedOut = allLeads.filter(
              ({ lead, originStageId }) =>
                originStageId === stageId && moves[lead.id] && moves[lead.id] !== stageId,
            ).length;
            const displayCount = column.leadCount + movedIn - movedOut;

            const isTerminal = column.stage.isWon || column.stage.isLost;

            return (
              <section
                key={stageId}
                aria-label={`${column.stage.name}: ${displayCount} leads`}
                onDragOver={(event) => {
                  if (!canWrite) return;
                  event.preventDefault();
                  setDragOverStage(stageId);
                }}
                onDragLeave={() => setDragOverStage((s) => (s === stageId ? null : s))}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOverStage(null);
                  const leadId = event.dataTransfer.getData("text/lead-id");
                  const fromStageId = event.dataTransfer.getData("text/from-stage-id");
                  if (leadId) void moveLead(leadId, stageId, fromStageId);
                }}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-lg border bg-slate-100/70 transition-colors",
                  dragOverStage === stageId
                    ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/30"
                    : "border-slate-200",
                )}
              >
                <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-2 w-2 rounded-full",
                        column.stage.isWon
                          ? "bg-green-600"
                          : column.stage.isLost
                            ? "bg-slate-400"
                            : "bg-teal-600",
                      )}
                    />
                    <h2 className="text-sm font-semibold text-slate-800">{column.stage.name}</h2>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600 ring-1 ring-inset ring-slate-200">
                    {displayCount}
                  </span>
                </header>

                <div className="flex flex-1 flex-col gap-2 p-2">
                  {cards.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-slate-400">
                      {isTerminal ? "None yet" : "No leads"}
                    </p>
                  ) : (
                    cards.map(({ lead, originStageId }) => (
                      <article
                        key={lead.id}
                        draggable={canWrite}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/lead-id", lead.id);
                          event.dataTransfer.setData(
                            "text/from-stage-id",
                            effectiveStageId(lead.id, originStageId),
                          );
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        className={cn(
                          "rounded-md border border-slate-200 bg-white p-2.5 shadow-sm transition-opacity",
                          canWrite && "cursor-grab active:cursor-grabbing",
                          movingLeadId === lead.id && "opacity-60",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/crm/leads/${lead.id}`}
                            className="text-sm font-medium text-slate-900 hover:text-teal-700 hover:underline"
                          >
                            {contactName(lead.contact)}
                          </Link>
                          <PriorityBadge priority={lead.priority} />
                        </div>

                        {lead.companyName ?? lead.contact.company ? (
                          <p className="mt-0.5 truncate text-xs text-slate-600">
                            {lead.companyName ?? lead.contact.company}
                          </p>
                        ) : null}

                        <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          {lead.service ? (
                            <div className="flex gap-1">
                              <dt className="sr-only">Service</dt>
                              <dd>{lead.service.name}</dd>
                            </div>
                          ) : null}
                          <div className="flex gap-1">
                            <dt className="sr-only">Source</dt>
                            <dd>{lead.source.name}</dd>
                          </div>
                        </dl>

                        {lead.budgetMin !== null || lead.budgetMax !== null ? (
                          <p className="mt-1 text-xs tabular-nums text-slate-600">
                            {formatBudget(lead.budgetMin, lead.budgetMax, lead.budgetCurrency)}
                          </p>
                        ) : null}

                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                          <span className="truncate text-xs text-slate-500">
                            {lead.assignedUser?.name ?? "Unassigned"}
                          </span>
                          {isTerminal ? <LeadStatusBadge status={lead.status} /> : null}
                        </div>

                        {/* Keyboard-accessible equivalent of dragging. */}
                        {canWrite ? (
                          <div className="mt-2">
                            <StageSelect
                              leadId={lead.id}
                              currentStageId={effectiveStageId(lead.id, originStageId)}
                              stages={stages}
                              label={`Move ${contactName(lead.contact)} to stage`}
                              hideLabel
                              compact
                            />
                          </div>
                        ) : null}
                      </article>
                    ))
                  )}

                  {displayCount > cards.length ? (
                    <Link
                      href={`/crm/leads?pipelineStageId=${stageId}`}
                      className="rounded-md px-2 py-1.5 text-center text-xs text-teal-700 hover:bg-white hover:underline"
                    >
                      View all {displayCount} in {column.stage.name}
                    </Link>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Showing up to {cardsPerStage} cards per stage. Column totals are full database counts.
      </p>
    </div>
  );
}
