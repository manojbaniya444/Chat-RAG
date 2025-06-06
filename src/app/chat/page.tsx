"use client";

import { Button } from "@/components/ui/button";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@clerk/nextjs";

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
    <div
      style={{
        maxWidth: 400,
        margin: "2rem auto",
        padding: 24,
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #888",
          padding: "2rem",
          textAlign: "center",
          background: isDragActive ? "#f0f8ff" : "#fafafa",
          cursor: "pointer",
        }}
      >
        <input {...getInputProps()} />
        <p>
          Drag & drop a PDF file here, or click to select a file.
          <br />
          <strong>Only PDF files</strong> are allowed.
          <br />
          <strong>Max size:</strong> 5 MB.
        </p>
      </div>

      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      {selectedFile && (
        <div style={{ marginTop: 16 }}>
          <div>
            <strong>File name:</strong> {selectedFile.name}
          </div>
          <div>
            <strong>File size:</strong>{" "}
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </div>
        </div>
      )}
      {pageCount !== null && (
        <div style={{ color: "green", marginTop: 16 }}>
          PDF loaded successfully. Page count: {pageCount}
        </div>
      )}

      {selectedFile && (
        <Button
          type="button"
          style={{ marginTop: 16 }}
          onClick={handleFileSubmit}
        >
          Upload PDF
        </Button>
      )}
    </div>
  );
};

export default ChatRootPage;
