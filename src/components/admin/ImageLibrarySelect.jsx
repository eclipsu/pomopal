"use client";

import { useMemo } from "react";
import TemplateImage from "@/components/admin/TemplateImage";
import { useAdminTemplateImages } from "@/hooks/useAdminTemplates";
import { imageLibraryLabel } from "@/utils/imageLibraryLabel";

export default function ImageLibrarySelect({
  value,
  onChange,
  label = "Image",
  noneLabel = "No image",
  hint = "Upload new images in the Images tab.",
  disabled = false,
  showPreview = true,
}) {
  const { data: libraryImages = [], isLoading } = useAdminTemplateImages();

  const selected = useMemo(
    () => libraryImages.find((img) => img.key === value),
    [libraryImages, value],
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled || isLoading}
        className="w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm disabled:opacity-50"
      >
        <option value="" className="bg-gray-900">
          {isLoading ? "Loading images…" : noneLabel}
        </option>
        {libraryImages.map((img) => (
          <option key={img.key} value={img.key} className="bg-gray-900">
            {imageLibraryLabel(img)}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {showPreview && selected?.url && (
        <TemplateImage
          src={selected.url}
          alt={imageLibraryLabel(selected)}
          maxHeightClass="max-h-24"
        />
      )}
    </div>
  );
}
