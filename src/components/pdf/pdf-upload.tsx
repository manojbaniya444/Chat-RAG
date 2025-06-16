"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { useRouter } from "next/navigation";
import { uploadPDFFormAction } from "@/lib/actions/pdf.actions";
import { Button } from "@/components/ui/button";

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type UploadStatus = 
  | "idle" 
  | "uploading" 
  | "processing" 
  | "success" 
  | "error";

interface PdfUploadProps {
  onSuccess?: (chatId: string) => void;
  className?: string;
}

export default function PdfUpload({ onSuccess, className = "" }: PdfUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const resetState = useCallback(() => {
    setError(null);
    setSelectedFile(null);
    setStatus("idle");
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    resetState();

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Client-side validation
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File size must be less than ${MAX_SIZE_MB}MB.`);
      return;
    }

    setSelectedFile(file);
  }, [resetState]);

  const onDropRejected = useCallback((fileRejections: Array<{ file: File; errors: Array<{ code: string; message: string }> }>) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      const error = rejection.errors[0];
      
      if (error.code === "file-too-large") {
        setError(`File size must be less than ${MAX_SIZE_MB}MB.`);
      } else if (error.code === "file-invalid-type") {
        setError("Only PDF files are allowed.");
      } else {
        setError("File could not be accepted.");
      }
    }
    setSelectedFile(null);
    setStatus("idle");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    disabled: isPending || status === "processing",
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setError(null);

    try {
      // Step 1: Get signed upload URL
      const urlResponse = await fetch("/api/get-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
        }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { url, path } = await urlResponse.json();

      // Step 2: Upload file directly to Supabase
      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      setStatus("processing");

      // Step 3: Process PDF using Server Action
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append("filePath", path);

          const result = await processPdfAction(null, formData);

          if (result.success && result.data?.chatId) {
            setStatus("success");
            
            // Trigger a custom event to notify other components
            window.dispatchEvent(new CustomEvent('chatListUpdate', {
              detail: { newChatId: result.data.chatId }
            }));
            
            // Force router refresh to update cached data
            router.refresh();
            
            if (onSuccess) {
              onSuccess(result.data.chatId);
            } else {
              router.push(`/chat/${result.data.chatId}`);
            }
          } else {
            setError(result.error || "Processing failed");
            setStatus("error");
          }
        } catch (err) {
          console.error("Processing error:", err);
          setError("An unexpected error occurred during processing");
          setStatus("error");
        }
      });
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStatus("error");
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "uploading":
        return "Uploading PDF to storage...";
      case "processing":
        return "Processing document and creating embeddings...";
      case "success":
        return "Success! Redirecting to chat...";
      default:
        return null;
    }
  };

  const isLoading = isPending || status === "uploading" || status === "processing";

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
          } ${
            isLoading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-gray-700 font-medium">
                {isDragActive ? "Drop your PDF here" : "Drag & drop a PDF file here"}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                or click to select a file
              </p>
            </div>
            
            <div className="text-xs text-gray-400">
              <p>Only PDF files • Max size: {MAX_SIZE_MB}MB</p>
            </div>
          </div>
        </div>

        {/* File Info */}
        {selectedFile && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              
              {!isLoading && (
                <button
                  onClick={resetState}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Remove file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        {getStatusMessage() && (
          <div className="mt-4 flex items-center justify-center space-x-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <span className={`text-sm font-medium ${
              status === "success" ? "text-green-600" : 
              status === "error" ? "text-red-600" : 
              "text-blue-600"
            }`}>
              {getStatusMessage()}
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && status === "idle" && (
          <Button
            onClick={handleUpload}
            disabled={isLoading}
            className="w-full mt-6"
            size="lg"
          >
            {isLoading ? "Processing..." : "Upload & Process PDF"}
          </Button>
        )}
      </div>
    </div>
  );
} 