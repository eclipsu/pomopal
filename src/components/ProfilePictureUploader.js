"use client";

import { useState, useCallback, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/app/lib/cropImage";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Profile picture picker + cropper.
 * `value` must be a string URL (current avatar) — never a File (that broke <img src>).
 * `onChange` is called with a cropped File when the user confirms crop.
 */
export default function ProfilePictureUploader({
  value,
  onChange,
  disabled = false,
  label = "Choose Photo",
}) {
  const inputId = useId();
  const [imageSrc, setImageSrc] = useState(null);
  const [selectedFileURL, setSelectedFileURL] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedPreview, setCroppedPreview] = useState(null);
  const [editing, setEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const currentAvatarUrl =
    typeof value === "string" && value.trim() ? value.trim() : null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;

    const url = URL.createObjectURL(file);
    if (selectedFileURL) URL.revokeObjectURL(selectedFileURL);
    setSelectedFileURL(url);
    setImageSrc(url);
    setCroppedPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setEditing(true);
  };

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
      );
      if (!croppedImage) return;
      const previewUrl = URL.createObjectURL(croppedImage);
      if (croppedPreview) URL.revokeObjectURL(croppedPreview);
      setCroppedPreview(previewUrl);
      setEditing(false);

      const finalImage = new File([croppedImage], "profile.jpg", {
        type: "image/jpeg",
      });
      onChange?.(finalImage);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (selectedFileURL) URL.revokeObjectURL(selectedFileURL);
      if (croppedPreview) URL.revokeObjectURL(croppedPreview);
    };
  }, [selectedFileURL, croppedPreview]);

  const previewSrc = croppedPreview || selectedFileURL || currentAvatarUrl;

  const cropModal =
    mounted &&
    editing &&
    imageSrc &&
    createPortal(
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setEditing(false)}
        >
          <motion.div
            className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 w-full overflow-hidden rounded-md bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Rotate</label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded bg-gray-200 px-3 py-1 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCrop}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
              >
                Crop
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body,
    );

  return (
    <motion.div
      className="flex w-full flex-col items-center gap-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-gray-500 bg-gray-200 shadow-md">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-gray-500">
            ?
          </span>
        )}
      </div>

      <label
        htmlFor={inputId}
        className={`cursor-pointer rounded px-3 py-1 text-sm text-white ${
          disabled
            ? "cursor-not-allowed bg-gray-500"
            : "bg-gray-700 hover:bg-gray-600"
        }`}
      >
        {label}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {cropModal}
    </motion.div>
  );
}
