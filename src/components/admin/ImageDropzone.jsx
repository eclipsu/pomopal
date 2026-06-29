"use client";

import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { mediaUrl } from "@/utils/mediaUrl";

export default function ImageDropzone({ value, previewUrl, onChange, onClear }) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      onChange(file);
    },
    [onChange],
  );

  const displayUrl = value ? URL.createObjectURL(value) : previewUrl ? mediaUrl(previewUrl) : null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">Image</label>
      {displayUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt="Template preview" className="w-full h-40 object-contain bg-gray-950" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
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
          <p className="text-sm text-gray-300 mb-1">Drag and drop an image here</p>
          <p className="text-xs text-gray-500 mb-4">PNG, JPG, GIF, or WebP — converted to WebP on upload</p>
          <label className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium cursor-pointer">
            Choose file
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
