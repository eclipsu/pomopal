"use client";

import { useState } from "react";
import { BookOpen, Check, Copy, Trash2 } from "lucide-react";
import ImageDropzone from "@/components/admin/ImageDropzone";
import {
  useAdminBlogImages,
  useDeleteBlogImage,
  useUploadBlogImage,
} from "@/hooks/useAdminBlogImages";
import { nameFromFile } from "@/utils/imageLibraryLabel";

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

export default function BlogImagesPanel() {
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [lastUploaded, setLastUploaded] = useState(null);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);

  const { data: images = [], isLoading } = useAdminBlogImages();
  const uploadImage = useUploadBlogImage();
  const deleteImage = useDeleteBlogImage();

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

  const handleCopy = async (label, text) => {
    try {
      await copyText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`Delete ${key}? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteImage.mutateAsync(key);
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <BookOpen className="h-5 w-5 text-blue-400" />
          Blog images
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Upload covers and in-post images to{" "}
          <code className="rounded bg-white/10 px-1 text-xs text-blue-200">
            blog/*.webp
          </code>{" "}
          on S3. Copy the key into MDX frontmatter or body.
        </p>
      </div>

      <div className="max-w-xl space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
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
              <label className="text-xs font-medium text-gray-400">
                Filename (S3 key slug)
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                maxLength={120}
                placeholder="e.g. welcome-cover"
                className="h-9 w-full rounded-md border border-white/20 bg-white/10 px-3 text-sm text-white"
              />
              <p className="text-[11px] text-gray-500">
                Becomes{" "}
                <code className="text-gray-400">
                  blog/{uploadName.trim() || "name"}.webp
                </code>
                . Re-upload with the same name to replace.
              </p>
            </div>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploadImage.isPending || !uploadName.trim()}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {uploadImage.isPending ? "Uploading…" : "Upload blog image"}
            </button>
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {lastUploaded && (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            <p>
              Uploaded —{" "}
              <code className="text-emerald-100">{lastUploaded.key}</code>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCopy("key", lastUploaded.key)}
                className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-xs text-white hover:bg-black/50"
              >
                {copied === "key" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy key
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    "cover",
                    `coverImage: ${lastUploaded.key}\ncoverImageAlt: `,
                  )
                }
                className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-xs text-white hover:bg-black/50"
              >
                {copied === "cover" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy frontmatter
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    "mdx",
                    `![Description](${lastUploaded.key})`,
                  )
                }
                className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-xs text-white hover:bg-black/50"
              >
                {copied === "mdx" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy MDX image
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">
          {isLoading
            ? "Loading…"
            : `${images.length} image${images.length === 1 ? "" : "s"}`}
        </h3>
        {images.length === 0 && !isLoading ? (
          <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-gray-500">
            No blog images yet. Upload one above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img) => (
              <div
                key={img.key}
                className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="mx-auto max-h-36 w-auto max-w-full rounded-lg border border-white/10 object-contain"
                />
                <div className="space-y-1">
                  <p className="truncate text-sm text-white" title={img.name}>
                    {img.name}
                  </p>
                  <p
                    className="truncate font-mono text-[11px] text-gray-500"
                    title={img.key}
                  >
                    {img.key}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(`${img.key}:key`, img.key)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] text-gray-300 hover:bg-white/5"
                  >
                    {copied === `${img.key}:key` ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    Key
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${img.key}:url`, img.url)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] text-gray-300 hover:bg-white/5"
                  >
                    {copied === `${img.key}:url` ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${img.key}:mdx`,
                        `![${img.name}](${img.key})`,
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] text-gray-300 hover:bg-white/5"
                  >
                    {copied === `${img.key}:mdx` ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    MDX
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(img.key)}
                    disabled={deleteImage.isPending}
                    className="ml-auto inline-flex items-center gap-1 rounded-md border border-red-500/30 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
