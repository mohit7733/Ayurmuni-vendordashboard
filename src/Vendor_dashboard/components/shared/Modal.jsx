import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import useFocusTrap from "../../hooks/useFocusTrap";

const SIZE_CLASS = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-3xl",
};

export default function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }) {
    const panelRef = useRef(null);
    const bodyRef = useRef(null);
    useFocusTrap(panelRef, open);

    useEffect(() => {
        if (!open) return undefined;
        const prevBody = document.body.style.overflow;
        const prevHtml = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prevBody;
            document.documentElement.style.overflow = prevHtml;
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    // Number inputs steal wheel events (spin value). Redirect those to modal body scroll.
    useEffect(() => {
        if (!open) return undefined;
        const body = bodyRef.current;
        if (!body) return undefined;

        const onWheel = (e) => {
            const el = e.target;
            if (!(el instanceof HTMLInputElement) || el.type !== "number") return;
            e.preventDefault();
            body.scrollTop += e.deltaY;
        };

        body.addEventListener("wheel", onWheel, { passive: false });
        return () => body.removeEventListener("wheel", onWheel);
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div
            className="ds-modal-root overflow-y-auto ds-modal-backdrop"
            onClick={onClose}
            role="presentation"
        >
            <div className="ds-modal-root__center">
                <div
                    ref={panelRef}
                    className={`ds-modal-panel bg-white rounded-2xl w-full ${SIZE_CLASS[size] || SIZE_CLASS.md} max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden shadow-2xl`}
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div className="shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-start gap-4">
                        <div>
                            <h3 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h3>
                            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 flex-shrink-0 ds-focus"
                            aria-label="Close dialog"
                        >
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>
                    <div
                        ref={bodyRef}
                        className="p-4 sm:p-6 overflow-y-auto overscroll-contain min-h-0 flex-1 ds-scroll"
                        style={{ WebkitOverflowScrolling: "touch" }}
                    >
                        {children}
                    </div>
                    {footer && (
                        <div className="shrink-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-wrap justify-end gap-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
