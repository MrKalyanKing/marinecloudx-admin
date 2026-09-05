"use client";

/**
 * Pipeline stage control.
 *
 * The single stage-change implementation in the UI — the lead table, the lead
 * detail page and the Kanban cards all use this, so there is one code path
 * calling PATCH /api/admin/leads/{id}/stage.
 *
 * It is also the keyboard-accessible route to moving a lead: drag-and-drop on
 * the board is an enhancement, never the only way.
 */

import { useState } from "react";

import { Select } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";
import type { CrmConfig } from "@/features/crm/types/crm";

export function StageSelect({
  leadId,
  currentStageId,
  stages,
  label = "Pipeline stage",
  hideLabel = false,
  compact = false,
}: {
  leadId: string;
  currentStageId: string;
  stages: CrmConfig["pipelineStages"];
  label?: string;
  hideLabel?: boolean;
  compact?: boolean;
}) {
  const { mutate, isPending, error } = useApiMutation();
  const [value, setValue] = useState(currentStageId);
  const controlId = `stage-${leadId}`;

  async function handleChange(nextStageId: string) {
    const previous = value;

    setValue(nextStageId);

    const result = await mutate(`/api/admin/leads/${leadId}/stage`, {
      method: "PATCH",
      body: { pipelineStageId: nextStageId },
    });

    // Restore the previous selection so the control never shows a stage the
    // server rejected.
    if (!result) setValue(previous);
  }

  return (
    <div className={compact ? "" : "flex flex-col gap-1"}>
      <label
        htmlFor={controlId}
        className={hideLabel ? "sr-only" : "text-xs font-medium text-slate-700"}
      >
        {label}
      </label>

      <Select
        id={controlId}
        value={value}
        disabled={isPending}
        onChange={(event) => void handleChange(event.target.value)}
        className={compact ? "py-1 text-xs" : undefined}
      >
        {stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
            {stage.isWon ? " (won)" : stage.isLost ? " (lost)" : ""}
          </option>
        ))}
      </Select>

      {isPending ? <p className="mt-1 text-xs text-slate-500">Moving…</p> : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
