"use client";

import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";

export default function AudioDropzone({ value, onChange, onClear }) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (!file) return;
      const ok =
        file.type.startsWith("audio/") ||
        /\.(mp3|m4a|aac|wav|ogg|webm)$/i.test(file.name);
      if (!ok) return;
      onChange(file);
    },
    [onChange],
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">Audio file</label>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-sm text-gray-200 truncate">{value.name}</p>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragging ? "border-blue-400 bg-blue-500/10" : "border-white/15 bg-white/5"
          }`}
        >
          <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-300 mb-1">Drag and drop audio here</p>
          <p className="text-xs text-gray-500 mb-4">MP3, M4A, AAC, WAV, OGG, or WebM - max 50 MB</p>
          <label className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium cursor-pointer">
            Choose file
            <input
              type="file"
              accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.webm"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
