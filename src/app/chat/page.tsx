"use client";

import React, { useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { useDropzone } from "react-dropzone";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Spinner from "./_components/spinner";

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ChatRootPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [selectedFile, setselectedFile] = useState<File | null>(null);

  const [status, setStatus] = useState<
    null | "preparing-upload" | "uploading" | "processing" | "done"
  >(null);

  const { userId } = useAuth();

  const router = useRouter();

  // after getting the signed url upload to supabase
  const uploadToSupabaseAndProcess = async (url: string, path: string) => {
    try {
      setStatus("uploading");
      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        setError("Upload to storage not success");
        setStatus(null);
        return;
      }

      setStatus("processing");
      // start processing pdf
      const embedRes = await fetch("/api/process-pdf", {
        method: "POST",
        // send here user id also to include in the chat table
        body: JSON.stringify({ path, userId }),
      });

      const embedResParseData = await embedRes.json();
      if (!embedRes.ok) {
        setError(embedResParseData.error || "Processing pdf fail");
        setStatus(null);
        return;
      }
      router.push(`/chat/${embedResParseData.chatId}`);
      setStatus("done");
    } catch {
      setStatus(null);
      setError("Error processing PDF");
    }
  };

  // after file drop handle submit to get the signed url
  const handleFileSubmit = async (e: React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!selectedFile) return;
    try {
      setError(null);
      setStatus("preparing-upload");
      const res = await fetch("/api/get-upload-url", {
        method: "POST",
        body: JSON.stringify({ fileName: selectedFile.name }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Upload failed.");
      } else {
        const { url, path } = await res.json();
        uploadToSupabaseAndProcess(url, path);
      }
    } catch (err) {
      setStatus(null);
      setError(
        (err instanceof Error && err.message) || "Error getting signed url"
      );
    }
  };

  // handle drop event
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setPageCount(null);
    setselectedFile(null);
    setStatus(null);

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Check file type
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    setselectedFile(file);
  }, []);

  // on drop any error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDropRejected = useCallback((fileRejections: any[]) => {
    if (
      fileRejections.length > 0 &&
      fileRejections[0].errors.some(
        (e: { code: string; message: string }) => e.code === "file-too-large"
      )
    ) {
      setError("File size exceeds 5 MB.");
    } else if (
      fileRejections.length > 0 &&
      fileRejections[0].errors.some(
        (e: { code: string; message: string }) => e.code === "file-invalid-type"
      )
    ) {
      setError("Only PDF files are allowed.");
    } else {
      setError("File could not be accepted.");
    }
    setselectedFile(null);
    setPageCount(null);
    setStatus(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    disabled: !!status && status !== "done",
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="w-full p-4 flex justify-between items-center border-gray-200 border-1">
        <SidebarTrigger className="border-1 cursor-pointer p-4" />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-gray-100"
            } p-8 text-center cursor-pointer transition-colors ${
              status && status !== "done"
                ? "opacity-50 pointer-events-none"
                : ""
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-gray-700">
              Drag &amp; drop a PDF file here, or click to select a file.
              <br />
              <span className="font-semibold">Only PDF files</span> are allowed.
              <br />
              <span className="font-semibold">Max size:</span> 5 MB.
            </p>
          </div>

          {error && (
            <div className="text-red-600 mt-4 text-center">{error}</div>
          )}
          {selectedFile && (
            <div className="mt-4 text-center">
              <div>
                <span className="font-semibold">File name:</span>{" "}
                {selectedFile.name}
              </div>
              <div>
                <span className="font-semibold">File size:</span>{" "}
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          )}
          {pageCount !== null && (
            <div className="text-green-600 mt-4 text-center">
              PDF loaded successfully. Page count: {pageCount}
            </div>
          )}

          {/* Status UI */}
          {status && (
            <div className="flex items-center justify-center mt-6 mb-2">
              {status !== "done" && <Spinner />}
              <span
                className={`text-center ${
                  status === "done" ? "text-green-600" : "text-blue-600"
                }`}
              >
                {status}
              </span>
            </div>
          )}

          {selectedFile && (!status || status === "done") && (
            <Button
              type="button"
              className="w-full mt-6 cursor-pointer"
              onClick={handleFileSubmit}
              disabled={!!status && status !== "done"}
            >
              Upload PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRootPage;
