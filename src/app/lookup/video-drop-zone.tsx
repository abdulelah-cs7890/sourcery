"use client";

import { useRef, useState } from "react";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB — must match /api/lookup/upload

type Status = "idle" | "dragover" | "selected" | "error";

export default function VideoDropZone({
  onFile,
  disabled,
  hint = "Or drop a TikTok .mp4 here",
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [selectedName, setSelectedName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError("");
    if (!file.type.startsWith("video/")) {
      setStatus("error");
      setError(`File must be a video (got "${file.type || "unknown"}").`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setError(`File too large. Max ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`);
      return;
    }
    setStatus("selected");
    setSelectedName(file.name);
    onFile(file);
  }

  function onPick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled) return;
    setStatus("idle");
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled) return;
    setStatus("dragover");
  }

  function onDragLeave() {
    if (status === "dragover") setStatus("idle");
  }

  const borderColor =
    status === "dragover"
      ? "border-zinc-500"
      : status === "error"
        ? "border-red-400"
        : status === "selected"
          ? "border-emerald-500"
          : "border-zinc-300 dark:border-zinc-700";

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={onPick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`flex items-center justify-center gap-3 rounded-md border border-dashed ${borderColor} px-4 py-6 text-sm cursor-pointer transition select-none ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-zinc-400"
        }`}
      >
        {disabled ? (
          // Parent is processing (extracting frames, uploading, etc.) —
          // show its progress hint with a spinner. Hides the green
          // checkmark since "selected" alone is misleading when the
          // work is ongoing.
          <span className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
            {hint}
          </span>
        ) : status === "selected" ? (
          <span className="text-emerald-700 dark:text-emerald-300">
            ✓ {selectedName}
          </span>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-400"
              aria-hidden
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-zinc-500 dark:text-zinc-400">{hint}</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={onChange}
          disabled={disabled}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
