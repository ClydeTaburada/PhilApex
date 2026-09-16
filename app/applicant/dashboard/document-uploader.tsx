"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, AlertCircle } from "lucide-react";
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
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </>
          )}
        </button>
        <span className="text-[11px] text-gray-400">PDF, JPG, PNG (Max 5MB)</span>
      </div>

      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*,.pdf"
        onChange={handleFileChange}
      />
      {error && (
        <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}