"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button, Field, Input, Select } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";

interface CreateRoundModalProps {
  applicationId: string;
  existingRoundCount: number;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateRoundModal({
  applicationId,
  existingRoundCount,
  isOpen,
  onClose,
  onCreated,
}: CreateRoundModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const nextRoundNumber = existingRoundCount + 1;
  const defaultTitle =
    nextRoundNumber === 1
      ? "Round 1: Skills Assessment"
      : nextRoundNumber === 2
      ? "Round 2: Technical Interview"
      : nextRoundNumber === 3
      ? "Round 3: HR Discussion"
      : `Round ${nextRoundNumber}: Interview`;

  const [title, setTitle] = useState(defaultTitle);
  const [roundNumber, setRoundNumber] = useState(nextRoundNumber);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const { mutate, isPending, error } = useApiMutation();

  if (!isOpen || !mounted) return null;

  async function handleCreate() {
    const res = await mutate(`/api/admin/careers/applications/${applicationId}/interview-rounds`, {
      method: "POST",
      body: {
        roundNumber: Number(roundNumber),
        title: title.trim(),
        durationMinutes: Number(durationMinutes),
        notes: notes.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
      },
    });

    if (res) {
      onCreated();
      onClose();
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-semibold text-slate-900">Add Interview Round</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Round Number" htmlFor="round-num" required>
            <Input
              id="round-num"
              type="number"
              min={1}
              value={roundNumber}
              onChange={(e) => setRoundNumber(Number(e.target.value))}
            />
          </Field>

          <Field label="Round Title" htmlFor="round-title" required>
            <Input
              id="round-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Round 1: Skills Assessment"
            />
          </Field>

          <Field label="Duration" htmlFor="round-duration">
            <Select
              id="round-duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </Select>
          </Field>

          <Field label="Round Notes (Optional)" htmlFor="round-notes">
            <Input
              id="round-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes or focus areas"
            />
          </Field>

          <Field
            label="Meeting Link (Google Meet / Zoom / Custom)"
            htmlFor="round-meet-link"
            hint="Leave blank to generate an instant room, or paste a Google Meet link."
          >
            <div className="flex gap-2">
              <Input
                id="round-meet-link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
              />
              <button
                type="button"
                onClick={() => window.open("https://meet.google.com/new", "_blank")}
                className="shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                title="Open Google Meet in a new tab to create a real meeting room, then paste the URL here"
              >
                + New Google Meet
              </button>
            </div>
          </Field>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-800">
              {error.message}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleCreate} disabled={isPending || !title.trim()}>
            {isPending ? "Creating…" : "Create Round"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
