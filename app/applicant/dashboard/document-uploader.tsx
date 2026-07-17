"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";

export function DocumentUploader({ documentId, docName }: { documentId: string, docName: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      let fileToUpload = file;

      // Compress if image
      if (file.type.startsWith("image/")) {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
      }

      if (fileToUpload.size > 5 * 1024 * 1024) {
        throw new Error("File is too large. Maximum size is 5MB.");
      }

      const formData = new FormData();
      formData.append("documentId", documentId);
      formData.append("file", fileToUpload);

      const res = await fetch("/api/applicant/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Success
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-red-900">{docName}</p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*,.pdf"
        onChange={handleFileChange}
      />
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}