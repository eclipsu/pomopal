"use client";

import { useCallback, useState } from "react";
import { Type, Upload, X } from "lucide-react";
import { MAX_FONT_UPLOAD_BYTES } from "@/hooks/useAdminFonts";

const MAX_MB = Math.round(MAX_FONT_UPLOAD_BYTES / (1024 * 1024));

export default function FontDropzone({ value, onChange, onClear, error }) {
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      setLocalError(null);
      if (!file) return;
      const ok =
        /\.ttf$/i.test(file.name) ||
        /font|ttf|sfnt|octet/i.test(file.type || "");
      if (!ok) {
        setLocalError("Use a .ttf font file");
        return;
      }
      if (file.size > MAX_FONT_UPLOAD_BYTES) {
        setLocalError(
          `File is ${Math.round(file.size / (1024 * 1024))} MB — max is ${MAX_MB} MB`,
        );
        return;
      }
      onChange(file);
    },
    [onChange],
  );

  const shownError = error || localError;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">TTF font file</label>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm text-gray-200 truncate">{value.name}</p>
            <p className="text-xs text-gray-500">
              {(value.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              onClear();
            }}
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
            dragging
              ? "border-blue-400 bg-blue-500/10"
              : "border-white/15 bg-white/5"
          }`}
        >
          <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-300 mb-1">Drag and drop a TTF here</p>
          <p className="text-xs text-gray-500 mb-4">
            TrueType (.ttf) — up to {MAX_MB} MB
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium cursor-pointer">
            <Type className="w-4 h-4" />
            Choose file
            <input
              type="file"
              accept=".ttf,font/ttf,application/x-font-ttf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </div>
      )}
      {shownError && <p className="text-sm text-red-400">{shownError}</p>}
    </div>
  );
}
