"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { InterviewRound, InterviewSlot } from "@/features/careers/types/careers";
import { Badge, Button, Card, CardHeader } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";
import { formatDate, formatDateTime } from "@/shared/utils/format";

import { ConfigureAvailabilityModal } from "./ConfigureAvailabilityModal";
import { CreateRoundModal } from "./CreateRoundModal";
import { EditMeetingLinkModal } from "./EditMeetingLinkModal";
import { SlotDetailsModal } from "./SlotDetailsModal";

interface InterviewSectionProps {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  initialRounds: InterviewRound[];
  canWrite: boolean;
}

export function InterviewSection({
  applicationId,
  candidateName,
  candidateEmail,
  initialRounds,
  canWrite,
}: InterviewSectionProps) {
  const router = useRouter();
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isNewRoundOpen, setIsNewRoundOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<InterviewSlot | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMeet, setCopiedMeet] = useState(false);
  const [isEditMeetOpen, setIsEditMeetOpen] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState("");

  const { mutate, isPending } = useApiMutation<Record<string, unknown>>();

  const currentRound = initialRounds[selectedRoundIndex] || null;

  async function handleGenerateToken() {
    if (!currentRound) return;
    const res = await mutate(
      `/api/admin/careers/interview-rounds/${currentRound.id}/token`,
      { method: "POST" },
    );
    const url = res?.schedulingUrl as string | undefined;
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      router.refresh();
    }
  }

  async function handleCopyExistingLink() {
    if (!currentRound?.activeToken) return;
    handleGenerateToken();
  }

  async function handleRevokeToken() {
    if (!currentRound) return;
    if (
      !confirm(
        "Are you sure you want to revoke this scheduling link? The candidate will no longer be able to use it to book.",
      )
    ) {
      return;
    }
    const res = await mutate(
      `/api/admin/careers/interview-rounds/${currentRound.id}/token/revoke`,
      { method: "POST" },
    );
    if (res?.success) {
      setInviteSuccessMsg("Candidate scheduling link revoked.");
      setTimeout(() => setInviteSuccessMsg(""), 4000);
      router.refresh();
    }
  }

  async function handleRegenerateToken() {
    if (!currentRound) return;
    const res = await mutate(
      `/api/admin/careers/interview-rounds/${currentRound.id}/token/regenerate`,
      { method: "POST" },
    );
    const url = res?.schedulingUrl as string | undefined;
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setInviteSuccessMsg("New scheduling link generated and copied to clipboard!");
      setTimeout(() => {
        setCopiedLink(false);
        setInviteSuccessMsg("");
      }, 4000);
      router.refresh();
    }
  }

  async function handleSendInvite() {
    if (!currentRound) return;
    const res = await mutate(
      `/api/admin/careers/interview-rounds/${currentRound.id}/send-invite`,
      { method: "POST" },
    );
    if (res?.success) {
      const sentTo = (res.sentTo as string) || candidateEmail;
      setInviteSuccessMsg(`Shortlist email sent to ${sentTo}!`);
      setTimeout(() => setInviteSuccessMsg(""), 4000);
      router.refresh();
    }
  }

  async function handleToggleBlock(slot: InterviewSlot) {
    const action = slot.status === "BLOCKED" ? "unblock" : "block";
    await mutate(`/api/admin/careers/interview-slots/${slot.id}/${action}`, {
      method: "PATCH",
    });
    router.refresh();
  }

  const formatSlotTime = (dateStr: string, tz: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: tz || "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(dateStr));
    } catch {
      return formatDateTime(dateStr);
    }
  };

  const formatSlotDate = (dateStr: string, tz: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: tz || "Asia/Kolkata",
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return formatDate(dateStr);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Interview Scheduling"
        description="Configure availability, manage interview slots, and dispatch candidate scheduling links."
        action={
          canWrite ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNewRoundOpen(true)}
              className="text-xs"
            >
              + Add Round
            </Button>
          ) : null
        }
      />

      <div className="p-4 space-y-4">
        {/* Rounds Navigation Tabs */}
        {initialRounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-8 text-center">
            <p className="text-sm font-medium text-slate-800">No interview rounds created yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Create an interview round (e.g. Round 1: Skills Assessment) to configure availability.
            </p>
            {canWrite ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsNewRoundOpen(true)}
                className="mt-3 text-xs"
              >
                + Create Round 1
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
              {initialRounds.map((round, idx) => (
                <button
                  key={round.id}
                  type="button"
                  onClick={() => setSelectedRoundIndex(idx)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedRoundIndex === idx
                      ? "bg-teal-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{round.title}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      round.status === "SCHEDULED"
                        ? "bg-teal-900 text-teal-100"
                        : round.status === "INVITED"
                        ? "bg-blue-900 text-blue-100"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {round.status}
                  </span>
                </button>
              ))}
            </div>

            {currentRound ? (
              <div className="space-y-4">
                {/* Round Overview & Actions Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{currentRound.title}</h3>
                      <Badge tone={currentRound.status === "SCHEDULED" ? "teal" : "neutral"}>
                        {currentRound.status}
                      </Badge>
                      <span className="text-xs text-slate-500">({currentRound.durationMinutes} mins)</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {currentRound.stats.totalSlots} slots generated &bull;{" "}
                      <span className="text-teal-700 font-medium">
                        {currentRound.stats.availableSlots} available
                      </span>{" "}
                      &bull;{" "}
                      <span className="text-slate-800 font-medium">
                        {currentRound.stats.bookedSlots} booked
                      </span>
                    </p>
                  </div>

                  {canWrite ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsConfigOpen(true)}
                        className="text-xs"
                      >
                        Configure Availability
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleGenerateToken}
                        disabled={isPending}
                        className="text-xs"
                      >
                        {copiedLink
                          ? "✓ Link Copied"
                          : currentRound.activeToken
                          ? "Copy Scheduling Link"
                          : "Generate Link"}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsEditMeetOpen(true)}
                        className="text-xs border-teal-300 text-teal-800 hover:bg-teal-50"
                      >
                        🎥 {currentRound.latestBooking?.meetingLink || currentRound.meetingLink ? "Edit Meeting Link" : "Set Google Meet"}
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleSendInvite}
                        disabled={isPending}
                        className="text-xs"
                      >
                        {isPending ? "Sending…" : "Send Shortlist Email"}
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* Prominent Meeting Link Card */}
                <div className="flex flex-col gap-2 rounded-2xl border border-sky-200/90 bg-sky-50/70 p-3 sm:flex-row sm:items-center sm:justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-600 shrink-0" />
                    <span className="font-semibold text-slate-800 shrink-0">Interview Meeting Room:</span>
                    {currentRound.latestBooking?.meetingLink || currentRound.meetingLink ? (
                      <a
                        href={currentRound.latestBooking?.meetingLink || currentRound.meetingLink!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-mono text-xs font-semibold text-sky-800 underline hover:text-sky-950 max-w-xs sm:max-w-md"
                        title="Click to test or open meeting room"
                      >
                        {currentRound.latestBooking?.meetingLink || currentRound.meetingLink}
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">
                        No Google Meet link set (auto-generates on booking)
                      </span>
                    )}
                  </div>

                  {canWrite ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {currentRound.latestBooking?.meetingLink || currentRound.meetingLink ? (
                        <>
                          <a
                            href={currentRound.latestBooking?.meetingLink || currentRound.meetingLink!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-sky-300 bg-white px-2.5 py-1 font-medium text-sky-800 shadow-sm hover:bg-sky-50"
                          >
                            Test Room ↗
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              const link = currentRound.latestBooking?.meetingLink || currentRound.meetingLink!;
                              navigator.clipboard.writeText(link);
                              setCopiedMeet(true);
                              setTimeout(() => setCopiedMeet(false), 2000);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            {copiedMeet ? "✓ Copied" : "Copy"}
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setIsEditMeetOpen(true)}
                        className="rounded-lg border border-sky-400 bg-sky-600 px-3 py-1 font-semibold text-white shadow-sm hover:bg-sky-700"
                      >
                        {currentRound.latestBooking?.meetingLink || currentRound.meetingLink
                          ? "Change Link"
                          : "+ Paste Google Meet Link"}
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Candidate Scheduling Link Banner */}
                {currentRound.activeToken ? (
                  <div className="flex flex-col gap-2 rounded-2xl border border-teal-200/70 bg-teal-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
                        <span className="text-xs font-semibold text-teal-950">Active Candidate Scheduling Link</span>
                        <span className="text-[11px] text-slate-500">
                          (Expires {formatDate(currentRound.activeToken.expiresAt)})
                        </span>
                      </div>
                      <p className="mt-1 truncate font-mono text-xs text-slate-700 select-all">
                        {currentRound.activeToken.schedulingUrl ||
                          `http://localhost:3000/careers/interview/schedule/${currentRound.activeToken.id}`}
                      </p>
                    </div>

                    {canWrite ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const url =
                              currentRound.activeToken?.schedulingUrl ||
                              `http://localhost:3000/careers/interview/schedule/${currentRound.activeToken?.id}`;
                            navigator.clipboard.writeText(url);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2500);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          {copiedLink ? "✓ Copied" : "Copy"}
                        </button>
                        <button
                          type="button"
                          onClick={handleRegenerateToken}
                          disabled={isPending}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                          title="Generate a fresh link and invalidate previous link"
                        >
                          Regenerate
                        </button>
                        <button
                          type="button"
                          onClick={handleRevokeToken}
                          disabled={isPending}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                          title="Revoke link immediately so it can no longer be used"
                        >
                          Revoke
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {inviteSuccessMsg ? (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-800">
                    ✓ {inviteSuccessMsg}
                  </div>
                ) : null}



                {/* Scheduled Booking Alert if candidate has booked */}
                {currentRound.latestBooking?.slot ? (
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
                          <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                            Interview Scheduled
                          </p>
                        </div>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {formatSlotDate(
                            currentRound.latestBooking.slot.startAt,
                            currentRound.latestBooking.candidateTimezone,
                          )}
                          ,{" "}
                          {formatSlotTime(
                            currentRound.latestBooking.slot.startAt,
                            currentRound.latestBooking.candidateTimezone,
                          )}{" "}
                          –{" "}
                          {formatSlotTime(
                            currentRound.latestBooking.slot.endAt,
                            currentRound.latestBooking.candidateTimezone,
                          )}{" "}
                          <span className="text-xs font-normal text-slate-600">
                            ({currentRound.latestBooking.candidateTimezone})
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Booked on{" "}
                          {formatDate(currentRound.latestBooking.bookedAt)} &bull; Candidate:{" "}
                          <strong className="text-slate-800">{candidateName}</strong> ({candidateEmail})
                        </p>
                      </div>

                      {canWrite ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              const found = (currentRound.slots ?? []).find(
                                (s) => s.id === currentRound.latestBooking?.slot?.id,
                              );
                              if (found) setSelectedSlot(found);
                            }}
                            className="text-xs"
                          >
                            Manage Booking
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    {/* Meeting Link row */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-teal-200/80 pt-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-teal-950 shrink-0">🎥 Meeting Room:</span>
                        {currentRound.latestBooking.meetingLink ? (
                          <a
                            href={currentRound.latestBooking.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate font-mono text-xs font-semibold text-teal-800 underline hover:text-teal-950 max-w-xs sm:max-w-md"
                            title="Click to open or test the meeting room"
                          >
                            {currentRound.latestBooking.meetingLink}
                          </a>
                        ) : (
                          <span className="text-xs italic text-slate-500">Not configured</span>
                        )}
                      </div>

                      {canWrite ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {currentRound.latestBooking.meetingLink ? (
                            <>
                              <a
                                href={currentRound.latestBooking.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-teal-300 bg-white px-2 py-1 text-xs font-medium text-teal-800 shadow-sm hover:bg-teal-50"
                              >
                                Join / Test ↗
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(currentRound.latestBooking!.meetingLink!);
                                  setCopiedMeet(true);
                                  setTimeout(() => setCopiedMeet(false), 2000);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                              >
                                {copiedMeet ? "✓ Copied" : "Copy"}
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setIsEditMeetOpen(true)}
                            className="rounded-lg border border-teal-300 bg-white px-2 py-1 text-xs font-medium text-teal-800 shadow-sm hover:bg-teal-50"
                          >
                            {currentRound.latestBooking.meetingLink ? "Change Link" : "+ Set Google Meet"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* Slots Grid */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Generated Interview Slots ({currentRound.slots?.length || 0})
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-teal-700" /> Booked
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500" /> Blocked
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-slate-300" /> Past
                      </span>
                    </div>
                  </div>

                  {currentRound.slots?.length === 0 ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                      No slots generated for this round yet. Click &ldquo;Configure Availability&rdquo; above to generate slots.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-96 overflow-y-auto pr-1">
                      {currentRound.slots?.map((slot) => {
                        const isPast = new Date(slot.startAt).getTime() <= Date.now();
                        const isBooked = slot.status === "BOOKED";
                        const isBlocked = slot.status === "BLOCKED";

                        return (
                          <div
                            key={slot.id}
                            className={`flex flex-col justify-between rounded-xl border p-2.5 transition-all ${
                              isBooked
                                ? "border-teal-300 bg-teal-50/80 shadow-sm"
                                : isBlocked
                                ? "border-red-200 bg-red-50/50"
                                : isPast
                                ? "border-slate-200 bg-slate-50/50 opacity-60"
                                : "border-slate-200 bg-white hover:border-teal-400"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <p className="text-xs font-semibold text-slate-900">
                                  {formatSlotDate(slot.startAt, slot.timezone)}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {formatSlotTime(slot.startAt, slot.timezone)} –{" "}
                                  {formatSlotTime(slot.endAt, slot.timezone)}
                                </p>
                              </div>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                  isBooked
                                    ? "bg-teal-700 text-white"
                                    : isBlocked
                                    ? "bg-red-700 text-white"
                                    : isPast
                                    ? "bg-slate-200 text-slate-600"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {isPast && slot.status === "AVAILABLE" ? "PAST" : slot.status}
                              </span>
                            </div>

                            {canWrite && !isPast ? (
                              <div className="mt-2 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-1.5">
                                {isBooked ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className="text-[11px] font-medium text-teal-800 hover:underline"
                                  >
                                    View Booking
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBlock(slot)}
                                    className={`text-[11px] font-medium ${
                                      isBlocked
                                        ? "text-teal-700 hover:underline"
                                        : "text-red-600 hover:underline"
                                    }`}
                                  >
                                    {isBlocked ? "Unblock" : "Block"}
                                  </button>
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Modals */}
      {currentRound ? (
        <>
          <ConfigureAvailabilityModal
            roundId={currentRound.id}
            roundTitle={currentRound.title}
            defaultDuration={currentRound.durationMinutes}
            isOpen={isConfigOpen}
            onClose={() => setIsConfigOpen(false)}
            onGenerated={() => router.refresh()}
          />

          <SlotDetailsModal
            slot={selectedSlot}
            round={currentRound}
            isOpen={Boolean(selectedSlot)}
            onClose={() => setSelectedSlot(null)}
            onActionComplete={() => router.refresh()}
          />

          <EditMeetingLinkModal
            roundId={currentRound.id}
            bookingId={currentRound.latestBooking?.id}
            candidateName={candidateName}
            currentLink={currentRound.latestBooking?.meetingLink || currentRound.meetingLink}
            isOpen={isEditMeetOpen}
            onClose={() => setIsEditMeetOpen(false)}
            onUpdated={() => router.refresh()}
          />
        </>
      ) : null}

      <CreateRoundModal
        applicationId={applicationId}
        existingRoundCount={initialRounds.length}
        isOpen={isNewRoundOpen}
        onClose={() => setIsNewRoundOpen(false)}
        onCreated={() => router.refresh()}
      />
    </Card>
  );
}
