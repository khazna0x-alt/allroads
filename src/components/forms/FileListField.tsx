"use client";

import { useEffect, useRef, useState } from "react";
import { FieldLabel } from "@/components/forms/FieldLabel";

export type ListedFile = {
  id: string;
  file: File;
};

export function createListedFile(file: File): ListedFile {
  return { id: crypto.randomUUID(), file };
}

export function FileListField({
  label,
  accept,
  maxCount,
  files,
  onChange,
  addLabel,
  replaceLabel,
  removeLabel,
  countLabel,
}: {
  label: string;
  accept: string;
  maxCount: number;
  files: ListedFile[];
  onChange: (files: ListedFile[]) => void;
  addLabel: string;
  replaceLabel: string;
  removeLabel: string;
  countLabel: string;
}) {
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceId = useRef<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const remaining = Math.max(0, maxCount - files.length);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const item of files) {
      if (item.file.type.startsWith("image/")) {
        next[item.id] = URL.createObjectURL(item.file);
      }
    }
    setPreviews(next);
    return () => {
      for (const url of Object.values(next)) {
        URL.revokeObjectURL(url);
      }
    };
  }, [files]);

  function addFiles(list: FileList | null) {
    const incoming = Array.from(list ?? []);
    if (incoming.length === 0 || remaining === 0) {
      return;
    }
    onChange([...files, ...incoming.slice(0, remaining).map(createListedFile)]);
  }

  function replaceFile(list: FileList | null) {
    const nextFile = list?.[0];
    const id = replaceId.current;
    replaceId.current = null;
    if (!nextFile || !id) {
      return;
    }
    onChange(files.map((item) => (item.id === id ? { id: item.id, file: nextFile } : item)));
  }

  return (
    <div className="min-w-0 text-sm">
      <FieldLabel label={label} />
      <p className="mt-2 text-xs tracking-[0.16em] uppercase text-[var(--sand)]">
        {countLabel}
      </p>

      <input
        ref={addInput}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={replaceInput}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          replaceFile(event.target.files);
          event.target.value = "";
        }}
      />

      {files.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {files.map((item) => {
            const preview = previews[item.id];
            return (
              <li key={item.id} className="flex min-w-0 flex-col border border-[var(--line)] bg-[var(--ink)] p-2">
                <div className="flex aspect-square items-center justify-center overflow-hidden bg-[var(--ink-soft)]">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-2 text-center text-[11px] leading-5 text-[var(--ivory-dim)]">
                      {item.file.name}
                    </span>
                  )}
                </div>
                <p className="mt-2 truncate text-xs text-[var(--ivory-dim)]" title={item.file.name}>
                  {item.file.name}
                </p>
                <p className="text-[10px] text-gray-500">{formatBytes(item.file.size)}</p>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    className="min-h-11 border border-[var(--line)] px-2 text-xs text-[var(--ivory)] hover:border-[var(--sand)] hover:text-[var(--sand)]"
                    onClick={() => {
                      replaceId.current = item.id;
                      replaceInput.current?.click();
                    }}
                  >
                    {replaceLabel}
                  </button>
                  <button
                    type="button"
                    className="min-h-11 border border-[var(--line)] px-2 text-xs text-[var(--ivory)] hover:border-[var(--crimson)] hover:text-[var(--crimson)]"
                    onClick={() => onChange(files.filter((row) => row.id !== item.id))}
                  >
                    {removeLabel}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <button
        type="button"
        disabled={remaining === 0}
        className="btn-secondary mt-3 w-full disabled:opacity-50"
        onClick={() => addInput.current?.click()}
      >
        {addLabel}
      </button>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
