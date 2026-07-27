"use client";

import { useState } from "react";
import { Loader2, Trash2, Type } from "lucide-react";
import Button from "@/components/Button";
import FontDropzone from "@/components/admin/FontDropzone";
import {
  useAdminFonts,
  useDeleteFont,
  useUpdateFont,
  useUploadFont,
} from "@/hooks/useAdminFonts";
import { resolveFontFaceUrl } from "@/lib/fontUrl";

function nameFromFile(file) {
  const raw = file?.name?.trim() || "font";
  return raw.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "") || "font";
}

export default function FontsPanel() {
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const { data: fonts = [], isLoading } = useAdminFonts(true);
  const uploadFont = useUploadFont();
  const updateFont = useUpdateFont();
  const deleteFont = useDeleteFont();

  const fontsWithUrls = fonts.map((font) => ({
    ...font,
    url: resolveFontFaceUrl(font.url, font.id),
  }));

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
      await uploadFont.mutateAsync({
        file: pendingFile,
        name: uploadName.trim() || nameFromFile(pendingFile),
        onUploadProgress: (evt) => {
          if (!evt?.total) return;
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setPendingFile(null);
      setUploadName("");
      setUploadProgress(0);
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Upload failed");
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium">Upload timer font</h2>
          <p className="text-sm text-gray-400">
            TTFs are stored in S3 and appear in the space editor font dropdown.
            When a creator saves a space, the font is baked into that space so
            viewers load it from the baked copy — no library round-trip.
          </p>
        </div>

        <FontDropzone
          value={pendingFile}
          onChange={handleFileChange}
          onClear={() => {
            setPendingFile(null);
            setUploadName("");
            setError(null);
          }}
          error={error}
        />

        {pendingFile && (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-400">Display name</label>
              <input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                maxLength={120}
                className="mt-1 w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploadFont.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm disabled:opacity-50"
            >
              {uploadFont.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Type className="w-4 h-4" />
              )}
              Upload
            </Button>
          </div>
        )}

        {uploadFont.isPending && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Uploading font</span>
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
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Library</h2>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : fontsWithUrls.length === 0 ? (
          <p className="text-sm text-gray-500">No fonts uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {fontsWithUrls.map((font) => (
              <li
                key={font.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium text-white truncate"
                    style={{ fontFamily: `"${font.family_name}", sans-serif` }}
                  >
                    {font.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {font.family_name} · {font.token}
                    {!font.active ? " · inactive" : ""}
                  </p>
                  {font.url && (
                    <style>{`
                      @font-face {
                        font-family: "${font.family_name}";
                        src: url("${font.url}") format("truetype");
                        font-display: swap;
                      }
                    `}</style>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateFont.mutate({
                        id: font.id,
                        payload: { active: !font.active },
                      })
                    }
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200"
                  >
                    {font.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete “${font.name}”?`)) {
                        deleteFont.mutate(font.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-red-300 hover:bg-red-500/20"
                    aria-label={`Delete ${font.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
