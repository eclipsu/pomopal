"use client";

import { useState, useCallback, useEffect } from "react";
import { storage, ID } from "@/app/lib/appwrite";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/app/lib/cropImage";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePictureUploader({ onUpload }) {
  const [selectedFileURL, setSelectedFileURL] = useState(null); // raw selected image
  const [imageSrc, setImageSrc] = useState(null); // for cropper
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedPreview, setCroppedPreview] = useState(null); // final cropped
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedFileURL(url);
    setImageSrc(url);
    setCroppedPreview(null);
  };

  const handleCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const previewUrl = URL.createObjectURL(croppedImage);
      setCroppedPreview(previewUrl);
      setEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async () => {
    const finalImage = croppedPreview || selectedFileURL;
    if (!finalImage) return alert("Please select or crop a photo first!");

    setUploading(true);
    const response = await fetch(finalImage);
    const blob = await response.blob();
    const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

    try {
      const res = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_BUCKET,
        ID.unique(),
        file
      );
      const fileUrl = storage.getFilePreview(process.env.NEXT_PUBLIC_APPWRITE_BUCKET, res.$id).href;
      if (onUpload) onUpload(fileUrl);
      alert("Profile uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (selectedFileURL) URL.revokeObjectURL(selectedFileURL);
      if (croppedPreview) URL.revokeObjectURL(croppedPreview);
    };
  }, [selectedFileURL, croppedPreview]);

  return (
    <motion.div
      className="flex flex-col items-center gap-4 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Profile Image Preview */}
      <motion.div
        className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-500 shadow-md"
        whileHover={{ scale: 1.05 }}
      >
        <img
          src={croppedPreview || selectedFileURL || "/default-avatar.png"}
          alt="Profile"
          className="object-cover w-full h-full"
        />
      </motion.div>

      {/* Upload + Edit Controls */}
      <div className="flex gap-2">
        <label
          htmlFor="upload"
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded cursor-pointer"
        >
          Choose Photo
        </label>
        <input
          id="upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {selectedFileURL && (
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {editing && imageSrc && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="relative w-full h-64 bg-black rounded-md overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  onCropChange={setCrop}
                  onRotationChange={setRotation}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Zoom:</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Rotate:</label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-3 gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1 text-sm bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCrop}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                >
                  Crop
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      <motion.button
        onClick={handleUpload}
        disabled={uploading}
        whileTap={{ scale: 0.95 }}
        className="px-5 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-500"
      >
        {uploading ? "Uploading..." : "Upload"}
      </motion.button>
    </motion.div>
  );
}
