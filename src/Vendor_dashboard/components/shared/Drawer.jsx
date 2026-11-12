import React, { useEffect } from "react";
import { X } from "lucide-react";
import "./Drawer.css";

export default function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = "right",
  width = "24rem",
  className = "",
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ds-drawer-root" role="presentation">
      <button type="button" className="ds-drawer-backdrop" aria-label="Close" onClick={onClose} />
      <aside
        className={`ds-drawer ds-drawer--${side} ${className}`.trim()}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Drawer"}
      >
        <div className="ds-drawer__header">
          <h2 className="ds-drawer__title">{title}</h2>
          <button type="button" className="ds-drawer__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="ds-drawer__body">{children}</div>
        {footer ? <div className="ds-drawer__footer">{footer}</div> : null}
      </aside>
    </div>
  );
}
