"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button, Field, Input, Select } from "@/shared/components/primitives";
import { useApiMutation } from "@/shared/hooks/use-api-mutation";

interface TimeWindow {
  startTime: string;
  endTime: string;
}

interface ConfigureAvailabilityModalProps {
  roundId: string;
  roundTitle: string;
  defaultDuration?: number;
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

const DAYS_OF_WEEK = [
  { id: "MON", label: "Mon" },
  { id: "TUE", label: "Tue" },
  { id: "WED", label: "Wed" },
  { id: "THU", label: "Thu" },
  { id: "FRI", label: "Fri" },
  { id: "SAT", label: "Sat" },
  { id: "SUN", label: "Sun" },
];

export function ConfigureAvailabilityModal({
  roundId,
  roundTitle,
  defaultDuration = 30,
  isOpen,
  onClose,
  onGenerated,
}: ConfigureAvailabilityModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to today and 7 days out
  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextWeek);
  const [selectedDays, setSelectedDays] = useState<string[]>(["MON", "TUE", "WED", "THU", "FRI"]);
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([
    { startTime: "10:00", endTime: "13:00" },
    { startTime: "14:00", endTime: "17:00" },
  ]);
  const [durationMinutes, setDurationMinutes] = useState(defaultDuration);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const [preview, setPreview] = useState<{
    totalSlots: number;
    totalDays: number;
    previewByDate: Record<string, number>;
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const { mutate, isPending, error } = useApiMutation<{
    totalSlots?: number;
    totalDays?: number;
    previewByDate?: Record<string, number>;
  }>();

  if (!isOpen) return null;

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
    setPreview(null);
  }

  function handleWindowChange(index: number, field: "startTime" | "endTime", value: string) {
    setTimeWindows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setPreview(null);
  }

  function addWindow() {
    setTimeWindows((prev) => [...prev, { startTime: "09:00", endTime: "12:00" }]);
    setPreview(null);
  }

  function removeWindow(index: number) {
    if (timeWindows.length <= 1) return;
    setTimeWindows((prev) => prev.filter((_, i) => i !== index));
    setPreview(null);
  }

  async function handlePreview() {
    setIsPreviewLoading(true);
    const result = await mutate(`/api/admin/careers/interview-rounds/${roundId}/preview-slots`, {
      method: "POST",
      body: {
        startDate,
        endDate,
        daysOfWeek: selectedDays,
        timeWindows,
        durationMinutes: Number(durationMinutes),
        bufferMinutes: Number(bufferMinutes),
        timezone,
      },
    });
    setIsPreviewLoading(false);
    if (result && typeof result.totalSlots === "number") {
      setPreview(result as { totalSlots: number; totalDays: number; previewByDate: Record<string, number> });
    }
  }

  async function handleGenerate() {
    const result = await mutate(`/api/admin/careers/interview-rounds/${roundId}/generate-slots`, {
      method: "POST",
      body: {
        startDate,
        endDate,
        daysOfWeek: selectedDays,
        timeWindows,
        durationMinutes: Number(durationMinutes),
        bufferMinutes: Number(bufferMinutes),
        timezone,
      },
    });

    if (result) {
      onGenerated();
      onClose();
    }
  }

  if (!isOpen || !mounted) return null;

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
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Configure Interview Availability</h3>
            <p className="text-xs text-slate-500">{roundTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Date Range */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Start Date" htmlFor="start-date" required>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                min={todayStr}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreview(null);
                }}
              />
            </Field>
            <Field label="End Date" htmlFor="end-date" required>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreview(null);
                }}
              />
            </Field>
          </div>

          {/* Days of Week */}
          <div>
            <label className="text-xs font-medium text-slate-700">Available Days of Week</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const active = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-teal-700 text-white shadow-sm ring-1 ring-teal-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Windows */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Daily Time Windows</label>
              <button
                type="button"
                onClick={addWindow}
                className="text-xs font-medium text-teal-700 hover:underline"
              >
                + Add Window
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {timeWindows.map((win, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={win.startTime}
                    onChange={(e) => handleWindowChange(idx, "startTime", e.target.value)}
                    className="w-36 text-xs"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <Input
                    type="time"
                    value={win.endTime}
                    onChange={(e) => handleWindowChange(idx, "endTime", e.target.value)}
                    className="w-36 text-xs"
                  />
                  {timeWindows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeWindow(idx)}
                      className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove window"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Slot Duration, Buffer & Timezone */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Duration" htmlFor="duration">
              <Select
                id="duration"
                value={durationMinutes}
                onChange={(e) => {
                  setDurationMinutes(Number(e.target.value));
                  setPreview(null);
                }}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </Select>
            </Field>

            <Field label="Buffer Time" htmlFor="buffer">
              <Select
                id="buffer"
                value={bufferMinutes}
                onChange={(e) => {
                  setBufferMinutes(Number(e.target.value));
                  setPreview(null);
                }}
              >
                <option value={0}>0 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
              </Select>
            </Field>

            <Field label="Timezone" htmlFor="timezone">
              <Select
                id="timezone"
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  setPreview(null);
                }}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC (GMT)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </Select>
            </Field>
          </div>

          {/* Preview Box */}
          {preview ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-900">
              <p className="font-semibold text-teal-950">Slot Generation Preview</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-slate-700">
                <span>
                  Total slots: <strong className="text-teal-800">{preview.totalSlots}</strong>
                </span>
                <span>
                  Across: <strong className="text-teal-800">{preview.totalDays} days</strong>
                </span>
                <span>
                  Duration: <strong>{durationMinutes}m</strong>
                </span>
                <span>
                  Buffer: <strong>{bufferMinutes}m</strong>
                </span>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
              {error.message}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePreview}
            disabled={isPending || isPreviewLoading || selectedDays.length === 0}
          >
            {isPreviewLoading ? "Calculating…" : "Preview Slots"}
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleGenerate}
              disabled={isPending || selectedDays.length === 0}
            >
              {isPending ? "Generating…" : "Generate Availability"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
