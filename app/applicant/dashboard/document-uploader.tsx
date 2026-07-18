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
    <div className="bg-slate-900/50 p-4 rounded-2xl border border-red-500/10 flex flex-col gap-3">
      <div className="flex justify-between items-center gap-4">
        <p className="text-sm font-bold text-slate-200">{docName}</p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50 transition-all active:scale-95 whitespace-nowrap"
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </div>
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*,.pdf"
        onChange={handleFileChange}
      />
      {error && <p className="text-[10px] text-red-400 font-bold tracking-wide">{error}</p>}
    </div>
  );
}