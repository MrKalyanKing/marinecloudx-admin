"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { InterviewRound, InterviewSlot } from "@/features/careers/types/careers";
import { Badge, Button, Field, Input, Select } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";
import { formatDateTime } from "@/shared/utils/format";

interface SlotDetailsModalProps {
  slot: InterviewSlot | null;
  round: InterviewRound;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export function SlotDetailsModal({
  slot,
  round,
  isOpen,
  onClose,
  onActionComplete,
}: SlotDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [mode, setMode] = useState<"view" | "cancel" | "reschedule">("view");
  const [cancelReason, setCancelReason] = useState("");
  const [newSlotId, setNewSlotId] = useState("");

  const { mutate, isPending, error } = useApiMutation();

  if (!isOpen || !slot || !mounted) return null;

  const booking = slot.booking;
  const isBooked = slot.status === "BOOKED";

  const availableSlots = (round.slots ?? []).filter(
    (s) => s.status === "AVAILABLE" && s.id !== slot.id && new Date(s.startAt).getTime() > Date.now(),
  );

  async function handleCancel() {
    if (!booking) return;
    const res = await mutate(`/api/admin/careers/interview-bookings/${booking.id}/cancel`, {
      method: "POST",
      body: { reason: cancelReason || "Cancelled by admin" },
    });
    if (res) {
      onActionComplete();
      onClose();
    }
  }

  async function handleReschedule() {
    if (!booking || !newSlotId) return;
    const res = await mutate(`/api/admin/careers/interview-bookings/${booking.id}/reschedule`, {
      method: "POST",
      body: { newSlotId, reason: "Rescheduled by admin" },
    });
    if (res) {
      onActionComplete();
      onClose();
    }
  }

  const formatSlotTime = (dateStr: string, tz: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: tz || "Asia/Kolkata",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(dateStr));
    } catch {
      return formatDateTime(dateStr);
    }
  };

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
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {mode === "cancel"
                ? "Cancel Interview Booking"
                : mode === "reschedule"
                ? "Reschedule Interview"
                : "Slot Details"}
            </h3>
            <p className="text-xs text-slate-500">
              {formatSlotTime(slot.startAt, slot.timezone)} ({slot.timezone})
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

        <div className="mt-4 space-y-3 text-sm">
          {mode === "view" ? (
            <>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="text-xs font-medium text-slate-500">Status</span>
                <Badge
                  tone={
                    slot.status === "BOOKED"
                      ? "teal"
                      : slot.status === "AVAILABLE"
                      ? "green"
                      : slot.status === "BLOCKED"
                      ? "red"
                      : "neutral"
                  }
                >
                  {slot.status}
                </Badge>
              </div>

              {booking ? (
                <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs">
                  <div>
                    <span className="font-medium text-slate-500">Booking ID:</span>{" "}
                    <span className="font-mono text-slate-800">{booking.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Booked At:</span>{" "}
                    <span className="text-slate-800">
                      {formatDateTime(booking.bookedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Candidate Timezone:</span>{" "}
                    <span className="text-slate-800">{booking.candidateTimezone}</span>
                  </div>
                  {booking.meetingLink ? (
                    <div>
                      <span className="font-medium text-slate-500">Meeting Link:</span>{" "}
                      <a
                        href={booking.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-teal-800 underline hover:text-teal-950"
                      >
                        {booking.meetingLink}
                      </a>
                    </div>
                  ) : null}
                  {booking.notes ? (
                    <div>
                      <span className="font-medium text-slate-500">Candidate Notes:</span>
                      <p className="mt-0.5 text-slate-800 whitespace-pre-wrap">{booking.notes}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  This slot is currently {slot.status.toLowerCase()} and has not been booked by any candidate.
                </p>
              )}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                  {error.message}
                </div>
              ) : null}

              {isBooked ? (
                <div className="mt-4 flex gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setMode("reschedule")}
                    disabled={isPending}
                    className="flex-1"
                  >
                    Reschedule
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setMode("cancel")}
                    disabled={isPending}
                    className="flex-1"
                  >
                    Cancel Booking
                  </Button>
                </div>
              ) : null}
            </>
          ) : mode === "cancel" ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Are you sure you want to cancel this interview booking? The slot will be restored to available.
              </p>
              <Field label="Cancellation Reason" htmlFor="cancel-reason">
                <Input
                  id="cancel-reason"
                  placeholder="e.g. Candidate requested reschedule, internal conflict..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </Field>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                  {error.message}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setMode("view")}>
                  Back
                </Button>
                <Button type="button" variant="danger" onClick={handleCancel} disabled={isPending}>
                  {isPending ? "Cancelling…" : "Confirm Cancellation"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Choose a new available slot to reschedule this candidate:
              </p>
              {availableSlots.length === 0 ? (
                <p className="text-xs text-amber-700">
                  No other available slots found. Please configure more availability first.
                </p>
              ) : (
                <Field label="Select New Slot" htmlFor="new-slot">
                  <Select
                    id="new-slot"
                    value={newSlotId}
                    onChange={(e) => setNewSlotId(e.target.value)}
                  >
                    <option value="">-- Choose a slot --</option>
                    {availableSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {formatSlotTime(s.startAt, s.timezone)} ({s.timezone})
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                  {error.message}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setMode("view")}>
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleReschedule}
                  disabled={isPending || !newSlotId}
                >
                  {isPending ? "Rescheduling…" : "Confirm Reschedule"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
