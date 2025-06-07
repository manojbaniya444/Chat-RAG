"use client";

import { Button } from "@/components/ui/button";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@clerk/nextjs";

import { SidebarTrigger } from "@/components/ui/sidebar";

type Props = {};

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ChatRootPage = (props: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [selectedFile, setselectedFile] = useState<File | null>(null);

  const { userId } = useAuth();

  // after getting the signed url upload to supabase
  const uploadToSupabase = async (url: string, path: string) => {
    try {
      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        setError("Upload to storage not success");
        return;
      }

      // start processing pdf
      const embedRes = await fetch("/api/process-pdf", {
        method: "POST",
        // send here user id also to include in the chat table
        body: JSON.stringify({ path, userId }),
      });

      const embedResParseData = await embedRes.json();
      if (!embedRes.ok) {
        setError(embedResParseData.error || "Processing pdf fail");
        return;
      }
      console.log("Successfully now you can chat", embedResParseData);

      // update the database
    } catch (error) {
      console.log(error);
      setError("Error uploading to supabase");
    }
  };

  // after file drop handle submit to get the signed url
  const handleFileSubmit = async (e: React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!selectedFile) return;
    // get the signed url to upload to storage
    try {
      setError(null);
      const res = await fetch("/api/get-upload-url", {
        method: "POST",
        body: JSON.stringify({ fileName: selectedFile.name }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Upload failed.");
      } else {
        const { url, path } = await res.json();
        console.log(`Got url ${url} and path ${path} to upload.`);
        uploadToSupabase(url, path);

        console.log("Success.");
      }
    } catch (err: any) {
      console.log(err);
      setError(err.message || "Error getting signed url");
    }
  };

  // handle drop event
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setPageCount(null);
    setselectedFile(null);

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Check file type
    if (file.type !== "application/pdf") {
      console.log(file);
      setError("Only PDF files are allowed.");
      return;
    }

    setselectedFile(file);
  }, []);

  // on drop any error
  const onDropRejected = useCallback((fileRejections: any[]) => {
    if (
      fileRejections.length > 0 &&
      fileRejections[0].errors.some((e: any) => e.code === "file-too-large")
    ) {
      setError("File size exceeds 5 MB.");
    } else if (
      fileRejections.length > 0 &&
      fileRejections[0].errors.some((e: any) => e.code === "file-invalid-type")
    ) {
      setError("Only PDF files are allowed.");
    } else {
      setError("File could not be accepted.");
    }
    setselectedFile(null);
    setPageCount(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
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
            } p-8 text-center cursor-pointer transition-colors`}
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

          {selectedFile && (
            <Button
              type="button"
              className="w-full mt-6"
              onClick={handleFileSubmit}
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
