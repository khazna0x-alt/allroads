"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AdminButton } from "@/components/admin/ui";

export type ConfirmTone = "default" | "danger";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: ConfirmTone;
};

type ConfirmFn = (request: ConfirmRequest) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useConfirmDialog() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirmDialog must be used within ConfirmProvider");
  }
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setRequest(next);
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setRequest(null);
  }, []);

  useEffect(() => {
    return () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    };
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request ? (
        <ConfirmDialog
          title={request.title}
          message={request.message}
          confirmLabel={request.confirmLabel}
          cancelLabel={request.cancelLabel}
          tone={request.tone ?? "default"}
          onCancel={() => settle(false)}
          onConfirm={() => settle(true)}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmTone;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const messageId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget = tone === "danger" ? cancelRef.current : confirmRef.current;
    focusTarget?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true",
      );
      if (nodes.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [onCancel, tone]);

  return (
    <div className="admin-desk admin-dialog-root">
      <div className="admin-dialog-overlay" onClick={onCancel} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        className={`admin-dialog ${tone === "danger" ? "admin-dialog-danger" : ""}`}
      >
        <h2 id={titleId} className="admin-title font-display text-2xl text-pretty">
          {title}
        </h2>
        <p id={messageId} className="mt-3 text-sm text-[var(--ivory-dim)] text-pretty">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <AdminButton ref={cancelRef} onClick={onCancel}>
            {cancelLabel}
          </AdminButton>
          <AdminButton
            ref={confirmRef}
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
