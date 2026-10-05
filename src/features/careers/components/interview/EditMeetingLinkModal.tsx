"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button, Field, Input } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";

interface EditMeetingLinkModalProps {
  roundId: string;
  bookingId?: string | null;
  candidateName: string;
  currentLink?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditMeetingLinkModal({
  roundId,
  bookingId,
  candidateName,
  currentLink,
  isOpen,
  onClose,
  onUpdated,
}: EditMeetingLinkModalProps) {
  const [mounted, setMounted] = useState(false);
  const [meetingLink, setMeetingLink] = useState(currentLink || "");
  const { mutate, isPending, error } = useApiMutation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMeetingLink(currentLink || "");
    }
  }, [isOpen, currentLink]);

  if (!isOpen || !mounted) return null;

  function handleGenerateInstantRoom() {
    const safeName = candidateName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15) || "Candidate";
    const randPart = Math.random().toString(36).substring(2, 8);
    const link = `https://meet.jit.si/MCX-Interview-${safeName}-${randPart}`;
    setMeetingLink(link);
  }

  async function handleSave() {
    if (!meetingLink.trim()) return;

    const endpoint = bookingId
      ? `/api/admin/careers/interview-bookings/${bookingId}/meeting-link`
      : `/api/admin/careers/interview-rounds/${roundId}/meeting-link`;

    const res = await mutate(endpoint, {
      method: "PATCH",
      body: { meetingLink: meetingLink.trim() },
    });

    if (res) {
      onUpdated();
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
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {bookingId ? "Update Candidate Meeting Link" : "Set Round Meeting Link"}
            </h3>
            <p className="text-xs text-slate-500">
              Candidate: <strong className="text-slate-800">{candidateName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <Field
            label="Interview Meeting Link"
            htmlFor="custom-meeting-link"
            hint="Paste a Google Meet, Zoom, or Teams link, or generate a link below."
            required
          >
            <Input
              id="custom-meeting-link"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-yyyy-zzz"
            />
          </Field>

          {/* Generator Helpers */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-700">Quick Generator Options:</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.open("https://meet.google.com/new", "_blank")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-sm hover:bg-teal-50"
              >
                <span>🎥</span> Open Google Meet (Create Room) &rarr;
              </button>
              <button
                type="button"
                onClick={handleGenerateInstantRoom}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
              >
                <span>⚡</span> Auto-Generate Instant Video Room
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              &bull; <strong>Google Meet</strong>: Clicking opens Google Meet in a new tab where a verified room is created. Copy the URL and paste it in the box above.<br/>
              &bull; <strong>Instant Video Room</strong>: Creates an encrypted instant room with video, mic & screen share with no login required.
            </p>
          </div>

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
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isPending || !meetingLink.trim()}
          >
            {isPending ? "Saving…" : "Save Meeting Link"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
