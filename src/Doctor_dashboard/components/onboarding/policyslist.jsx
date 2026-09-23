import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Shield,
  X,
} from "lucide-react";
import { getRequiredLegalPolicies } from "../../../services/policyService";

function PolicyContentBlock({ block, index }) {
  if (!block || typeof block !== "object") return null;

  if (block.type === "title") {
    return (
      <h2 className="text-xl font-semibold text-[#0D614E] leading-snug">
        {block.text}
      </h2>
    );
  }

  if (block.type === "heading") {
    return (
      <h3 className="pt-2 text-base font-semibold text-[#0D614E] leading-snug">
        {block.number ? `${block.number} ` : ""}
        {block.text}
      </h3>
    );
  }

  if (block.type === "list") {
    const items = Array.isArray(block.items) ? block.items : [];
    return (
      <ul className="space-y-2 pl-1">
        {items.map((item, itemIndex) => (
          <li
            key={`${index}-${itemIndex}`}
            className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-700"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D614E]" />
            <span>
              {item?.marker ? `${item.marker} ` : ""}
              {item?.text}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "note") {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900">
        {block.text}
      </p>
    );
  }

  if (block.type === "text" || block.type === "paragraph" || block.text) {
    return (
      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
        {block.text}
      </p>
    );
  }

  return null;
}

function PolicyDetail({ policy, onBack }) {
  const content = Array.isArray(policy?.content) ? policy.content : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="mt-0.5 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label="Back to policy list"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[#0D614E]/70">
            {policy?.is_mandatory ? "Mandatory policy" : "Policy"}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold text-gray-900 leading-snug">
            {policy?.title || policy?.name}
          </h3>
          {policy?.subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{policy.subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {content.length === 0 ? (
          <p className="text-sm text-gray-500">No content available for this policy.</p>
        ) : (
          content.map((block, index) => (
            <PolicyContentBlock
              key={`${block?.type || "block"}-${index}`}
              block={block}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Policies popup: list names first; click a name to read full policy.
 * Includes Accept All for mandatory/all shown policies.
 */
export default function PoliciesListPopup({
  open,
  onClose,
  accepted = false,
  onAcceptChange,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [policies, setPolicies] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [acceptAll, setAcceptAll] = useState(accepted);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getRequiredLegalPolicies();
      const list = Array.isArray(data?.policies) ? data.policies : [];
      setPolicies(list);
      setMeta({
        policies_accepted: Boolean(data?.policies_accepted),
        all_mandatory_accepted: Boolean(data?.all_mandatory_accepted),
        pending_mandatory_count: data?.pending_mandatory_count ?? 0,
        pending_count: data?.pending_count ?? 0,
      });

      const alreadyAccepted =
        Boolean(data?.policies_accepted) ||
        (list.length > 0 && list.every((item) => item?.is_accepted));
      if (alreadyAccepted) {
        setAcceptAll(true);
        // onAcceptChange?.(true, list);
      }
    } catch (err) {
      setError(err?.message || "Failed to load policies.");
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [onAcceptChange]);

  useEffect(() => {
    if (!open) {
      setSelectedPolicy(null);
      return undefined;
    }
    setAcceptAll(accepted);
    loadPolicies();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, loadPolicies]);

  useEffect(() => {
    if (open) setAcceptAll(accepted);
  }, [accepted, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (selectedPolicy) setSelectedPolicy(null);
      else onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, selectedPolicy, onClose]);

  const handleAcceptAllChange = (checked) => {
    setAcceptAll(checked);
    if (onClose) {
      onAcceptChange?.(checked, policies);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex w-full max-w-2xl max-h-[min(88dvh,720px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="policies-popup-title"
      >
        {selectedPolicy ? (
          <PolicyDetail
            policy={selectedPolicy}
            onBack={() => setSelectedPolicy(null)}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-[#0D614E]/10 p-2 text-[#0D614E]">
                  <Shield size={18} />
                </div>
                <div>
                  <h2
                    id="policies-popup-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Legal Policies
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Review each policy, then accept all to continue
                  </p>
                </div>
              </div>
              {
                onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                )
              }
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
                  <Loader2 className="h-7 w-7 animate-spin text-[#0D614E]" />
                  <p className="text-sm">Loading policies...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-10 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    type="button"
                    onClick={loadPolicies}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0D614E] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a4f3f]"
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                </div>
              ) : policies.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500">
                  No policies available.
                </p>
              ) : (
                <ul className="space-y-2">
                  {policies.map((item) => {
                    const policy = item?.policy || item;
                    const id = policy?.id || policy?.code || policy?.policy_type;
                    const name =
                      policy?.name || policy?.title || "Untitled policy";

                    return (
                      <li
                        key={id}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3"
                      >
                        <FileText
                          size={16}
                          className="shrink-0 text-[#0D614E]/70"
                        />
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => setSelectedPolicy(policy)}
                            className="text-left text-sm font-medium text-[#0D614E] hover:underline"
                          >
                            {name}
                          </button>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            {policy?.is_mandatory ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                                Mandatory
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-200/80 px-2 py-0.5 text-gray-600">
                                Optional
                              </span>
                            )}
                            {item?.is_accepted ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 size={12} />
                                Accepted
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-4">
              {meta?.pending_mandatory_count > 0 && !acceptAll ? (
                <p className="mb-3 text-xs text-amber-700">
                  {meta.pending_mandatory_count} mandatory polic
                  {meta.pending_mandatory_count === 1 ? "y" : "ies"} pending
                  acceptance
                </p>
              ) : null}

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptAll}
                  disabled={loading || !!error || policies.length === 0}
                  onChange={(event) =>
                    handleAcceptAllChange(event.target.checked)
                  }
                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-[#0D614E] focus:ring-[#0D614E]"
                />
                <span className="text-sm text-gray-700">
                  I have read and accept all the policies listed above
                </span>
              </label>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={onClose ? onClose : () => onAcceptChange(acceptAll, policies)}
                  disabled={!acceptAll}
                  className="rounded-lg bg-[#0D614E] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a4f3f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
