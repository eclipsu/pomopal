"use client";

import { useState } from "react";
import { PauseCircle, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import {
  useAddStreakPause,
  useRemoveStreakPause,
  useStreakPauses,
} from "@/hooks/useAdminActions";

export default function StreakPausesPanel() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: pauses = [], isLoading, error: loadError } = useStreakPauses();
  const unsupported = loadError?.response?.status === 404;
  const addPause = useAddStreakPause();
  const removePause = useRemoveStreakPause();
  const error = addPause.error?.response?.data?.message;

  const submit = (e) => {
    e.preventDefault();
    addPause.mutate(
      { start_date: startDate, end_date: endDate || startDate, reason },
      {
        onSuccess: () => {
          setStartDate("");
          setEndDate("");
          setReason("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <PauseCircle className="h-5 w-5" /> Streak pauses
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Days in a pause never count as missed, for everyone. Use it for
          outages. Adding a pause after the fact brings back streaks it broke,
          as long as the user hasn&apos;t restarted since.
        </p>
      </div>

      {unsupported ? (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          The backend doesn&apos;t support streak pauses yet. Deploy the backend
          update (and run <code>add-streak-protection.sql</code>) first.
        </p>
      ) : (
      <>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
        <label className="text-sm text-white/70">
          Start
          <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="text-sm text-white/70">
          End
          <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label className="text-sm text-white/70">
          Reason
          <Input value={reason} maxLength={200} placeholder="EC2 outage" onChange={(e) => setReason(e.target.value)} />
        </label>
        <Button type="submit" disabled={!startDate || addPause.isPending}>
          {addPause.isPending ? "Adding…" : "Add pause"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="divide-y divide-white/10 rounded-xl border border-white/10">
        {isLoading && <p className="p-4 text-sm text-white/50">Loading…</p>}
        {!isLoading && pauses.length === 0 && (
          <p className="p-4 text-sm text-white/50">No streak pauses.</p>
        )}
        {pauses.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-white tabular-nums">
                {p.start_date === p.end_date ? p.start_date : `${p.start_date} → ${p.end_date}`}
              </p>
              {p.reason && <p className="text-sm text-white/60">{p.reason}</p>}
            </div>
            <button
              type="button"
              onClick={() => removePause.mutate(p.id)}
              disabled={removePause.isPending}
              className="rounded-md p-2 text-white/50 hover:bg-white/10 hover:text-red-300"
              aria-label={`Remove pause ${p.start_date} to ${p.end_date}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  );
}
