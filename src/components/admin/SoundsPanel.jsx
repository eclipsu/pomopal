"use client";

import { useState } from "react";
import { Loader2, Music, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import AudioDropzone from "@/components/admin/AudioDropzone";
import {
  useAdminSounds,
  useDeleteSound,
  useUpdateSound,
  useUploadSound,
} from "@/hooks/useAdminSounds";

const SOUND_TYPES = [
  { value: "background", label: "Background" },
  { value: "ring", label: "Ring" },
];

function nameFromFile(file) {
  const raw = file?.name?.trim() || "sound";
  return raw.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "") || "sound";
}

export default function SoundsPanel() {
  const [typeFilter, setTypeFilter] = useState("background");
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const { data: sounds = [], isLoading } = useAdminSounds(typeFilter, true);
  const uploadSound = useUploadSound();
  const updateSound = useUpdateSound();
  const deleteSound = useDeleteSound();

  const handleFileChange = (file) => {
    setPendingFile(file);
    setUploadName(file ? nameFromFile(file) : "");
    setUploadProgress(0);
    setError(null);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setError(null);
    setUploadProgress(0);
    try {
      await uploadSound.mutateAsync({
        file: pendingFile,
        name: uploadName.trim() || nameFromFile(pendingFile),
        type: typeFilter,
        onUploadProgress: (evt) => {
          if (!evt?.total) return;
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setPendingFile(null);
      setUploadName("");
      setUploadProgress(0);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(
        Array.isArray(msg)
          ? msg[0]
          : msg || err?.message || "Upload failed",
      );
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">Upload sound</h2>
            <p className="text-sm text-gray-400">
              Background sounds loop during focus. Ring sounds play when the timer ends.
            </p>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPendingFile(null);
              setUploadName("");
              setError(null);
            }}
            className="h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm w-full sm:w-48"
          >
            {SOUND_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-gray-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <AudioDropzone
          value={pendingFile}
          onChange={handleFileChange}
          onClear={() => {
            setPendingFile(null);
            setUploadName("");
            setUploadProgress(0);
          }}
        />

        {pendingFile && (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="text-sm text-gray-300">Display name</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                maxLength={120}
                className="mt-1 w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploadSound.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm disabled:opacity-50"
            >
              {uploadSound.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Music className="w-4 h-4" />
              )}
              Upload
            </Button>
          </div>
        )}

        {uploadSound.isPending && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Uploading audio</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-[width] duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium capitalize">{typeFilter} sounds</h2>

        {isLoading ? (
          <p className="text-gray-400">Loading sounds...</p>
        ) : sounds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-gray-400">
            <p>No {typeFilter} sounds uploaded yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sounds.map((sound) => (
              <article
                key={sound.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{sound.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                      {sound.type}
                    </span>
                    {!sound.active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                        hidden
                      </span>
                    )}
                  </div>
                  <audio
                    controls
                    preload="none"
                    src={sound.url}
                    className="w-full max-w-md h-8 mt-2"
                  />
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    onClick={() =>
                      updateSound.mutate({
                        id: sound.id,
                        payload: { active: !sound.active },
                      })
                    }
                    disabled={updateSound.isPending}
                    className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm"
                  >
                    {sound.active ? "Hide" : "Show"}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!confirm(`Delete "${sound.name}"?`)) return;
                      try {
                        await deleteSound.mutateAsync(sound.id);
                      } catch (err) {
                        alert(err?.response?.data?.message || "Delete failed");
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
