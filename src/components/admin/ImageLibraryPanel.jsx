"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Pencil, Check, X } from "lucide-react";
import ImageDropzone from "@/components/admin/ImageDropzone";
import TemplateImage from "@/components/admin/TemplateImage";
import {
  useAdminTemplateImages,
  useRenameTemplateImage,
  useUploadTemplateImage,
} from "@/hooks/useAdminTemplates";
import { imageLibraryLabel, nameFromFile } from "@/utils/imageLibraryLabel";

function ImageNameEditor({ image, onRenamed }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(image.name || "");
  const [error, setError] = useState(null);
  const renameImage = useRenameTemplateImage();

  useEffect(() => {
    if (!editing) setDraft(image.name || "");
  }, [image.name, editing]);

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    if (trimmed === image.name) {
      setEditing(false);
      setError(null);
      return;
    }
    setError(null);
    try {
      await renameImage.mutateAsync({ key: image.key, name: trimmed });
      setEditing(false);
      onRenamed?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Rename failed");
    }
  };

  if (editing) {
    return (
      <div className="space-y-1">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={120}
          className="w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-xs text-white"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setEditing(false);
              setDraft(image.name || "");
              setError(null);
            }
          }}
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={save}
            disabled={renameImage.isPending}
            className="p-1 rounded text-emerald-400 hover:bg-white/10 disabled:opacity-50"
            title="Save name"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setDraft(image.name || "");
              setError(null);
            }}
            className="p-1 rounded text-gray-400 hover:bg-white/10"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {error && <p className="text-[10px] text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-1 min-w-0">
      <p className="text-xs text-gray-200 truncate flex-1" title={image.name}>
        {imageLibraryLabel(image)}
      </p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="shrink-0 p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-white/10"
        title="Rename"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function ImageLibraryPanel() {
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [lastUploaded, setLastUploaded] = useState(null);
  const [error, setError] = useState(null);

  const { data: images = [], isLoading } = useAdminTemplateImages();
  const uploadImage = useUploadTemplateImage();

  const handleFileChange = (file) => {
    setPendingFile(file);
    setUploadName(file ? nameFromFile(file) : "");
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setError(null);
    try {
      const uploaded = await uploadImage.mutateAsync({
        file: pendingFile,
        name: uploadName,
      });
      setLastUploaded(uploaded);
      setPendingFile(null);
      setUploadName("");
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed");
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-sky-400" />
          Image library
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Upload images here once, then pick them from the library when creating templates, announcements, or revive messages.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-4 max-w-xl">
        <ImageDropzone
          value={pendingFile}
          onChange={handleFileChange}
          onClear={() => {
            setPendingFile(null);
            setUploadName("");
          }}
        />
        {pendingFile && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Image name</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                maxLength={120}
                placeholder="e.g. streak-reward"
                className="w-full h-9 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploadImage.isPending || !uploadName.trim()}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm disabled:opacity-50"
            >
              {uploadImage.isPending ? "Uploading…" : "Upload to library"}
            </button>
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {lastUploaded && (
          <p className="text-sm text-emerald-300">
            Uploaded — {imageLibraryLabel(lastUploaded)}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">
          {isLoading ? "Loading…" : `${images.length} image${images.length === 1 ? "" : "s"}`}
        </h3>
        {images.length === 0 && !isLoading ? (
          <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-gray-500 text-sm">
            No images yet. Upload one above.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((img) => (
              <div
                key={img.key}
                className="rounded-xl border border-white/10 bg-black/20 p-2 space-y-2"
              >
                <TemplateImage
                  src={img.url}
                  alt={imageLibraryLabel(img)}
                  maxHeightClass="max-h-28"
                  className="mx-auto"
                />
                <ImageNameEditor image={img} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
