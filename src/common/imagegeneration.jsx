import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertCircle, Check, Copy, ImagePlus, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { vendorService } from "../services/vendorService";
import DashboardPageShell from "../Vendor_dashboard/components/shared/DashboardPageShell";
import Button from "../Vendor_dashboard/components/shared/Button";

const UPLOAD_DIR = "variants_images";
const MAX_FILE_SIZE_MB = 5;
const MAX_CONCURRENT = 3;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const createId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isFileDrag = (event) => Array.from(event.dataTransfer?.types || []).includes("Files");

export default function ImageGeneration() {
    const inputRef = useRef(null);
    const filesRef = useRef(new Map());
    const previewsRef = useRef(new Set());
    const queueRef = useRef([]);
    const activeRef = useRef(0);
    const pumpRef = useRef(() => {});
    const startedRef = useRef(new Set());
    const dragDepth = useRef(0);

    const [items, setItems] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [copiedKey, setCopiedKey] = useState("");

    useEffect(() => {
        const previews = previewsRef.current;
        const files = filesRef.current;
        return () => {
            previews.forEach((url) => URL.revokeObjectURL(url));
            files.clear();
        };
    }, []);

    const uploadItem = useCallback(async (id) => {
        const file = filesRef.current.get(id);
        if (!file) return;

        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: "uploading", error: "" } : item))
        );

        try {
            const response = await vendorService.uploadfiles(file, UPLOAD_DIR);
            const url = response?.data?.data?.url;
            if (!url) {
                throw new Error(response?.data?.message || "Upload did not return a link");
            }
            setItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status: "done", url, error: "" } : item))
            );
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                error?.message ||
                "Upload failed";
            setItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status: "error", error: message } : item))
            );
        }
    }, []);

    const pump = useCallback(() => {
        while (activeRef.current < MAX_CONCURRENT && queueRef.current.length) {
            const id = queueRef.current.shift();
            activeRef.current += 1;
            uploadItem(id).finally(() => {
                activeRef.current -= 1;
                pumpRef.current();
            });
        }
    }, [uploadItem]);

    useEffect(() => {
        pumpRef.current = pump;
    }, [pump]);

    const enqueue = useCallback((ids) => {
        const fresh = ids.filter((id) => !queueRef.current.includes(id));
        if (!fresh.length) return;
        queueRef.current.push(...fresh);
        pumpRef.current();
    }, []);

    useEffect(() => {
        const pending = items
            .filter((item) => item.status === "queued" && !startedRef.current.has(item.id))
            .map((item) => item.id);
        if (!pending.length) return;
        pending.forEach((id) => startedRef.current.add(id));
        enqueue(pending);
    }, [items, enqueue]);

    const addFiles = (fileList) => {
        const incoming = Array.from(fileList || []);
        if (!incoming.length) return;

        const accepted = [];
        const rejected = [];

        incoming.forEach((file) => {
            const typeOk = ACCEPTED_TYPES.includes(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
            if (!typeOk) {
                rejected.push(`${file.name} is not a supported image`);
                return;
            }
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                rejected.push(`${file.name} is larger than ${MAX_FILE_SIZE_MB} MB`);
                return;
            }
            accepted.push(file);
        });

        if (rejected.length) {
            toast.error(rejected.slice(0, 3).join(" · "));
        }
        if (!accepted.length) return;

        const nextItems = accepted.map((file) => {
            const id = createId();
            const preview = URL.createObjectURL(file);
            filesRef.current.set(id, file);
            previewsRef.current.add(preview);
            return {
                id,
                name: file.name,
                size: file.size,
                preview,
                status: "queued",
                url: "",
                error: "",
            };
        });

        setItems((prev) => [...prev, ...nextItems]);
    };

    const releaseItem = (item) => {
        filesRef.current.delete(item.id);
        if (item.preview) {
            URL.revokeObjectURL(item.preview);
            previewsRef.current.delete(item.preview);
        }
    };

    const removeItem = (id) => {
        startedRef.current.delete(id);
        setItems((prev) => {
            const target = prev.find((item) => item.id === id);
            if (target) releaseItem(target);
            return prev.filter((item) => item.id !== id);
        });
        queueRef.current = queueRef.current.filter((queuedId) => queuedId !== id);
    };

    const clearAll = () => {
        setItems((prev) => {
            prev.forEach(releaseItem);
            return [];
        });
        queueRef.current = [];
        startedRef.current.clear();
        if (inputRef.current) inputRef.current.value = "";
    };

    const retryItem = (id) => {
        startedRef.current.delete(id);
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: "queued", error: "" } : item))
        );
    };

    const readyItems = useMemo(
        () => items.filter((item) => item.status === "done" && item.url),
        [items]
    );

    const copyText = async (text, key, message) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            window.setTimeout(() => {
                setCopiedKey((current) => (current === key ? "" : current));
            }, 1600);
            if (message) toast.success(message);
        } catch {
            toast.error("Could not copy. Select the link and copy it manually.");
        }
    };

    const onFileDragEnter = (event) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
    };

    const onFileDragOver = (event) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
    };

    const onFileDragLeave = (event) => {
        if (!isFileDrag(event)) return;
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragging(false);
        }
    };

    const onFileDrop = (event) => {
        if (!event.dataTransfer?.files?.length) return;
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        addFiles(event.dataTransfer.files);
    };

    const uploadingCount = items.filter((item) => item.status === "uploading" || item.status === "queued").length;
    const failedCount = items.filter((item) => item.status === "error").length;

    return (
        <DashboardPageShell>
            <div
                className="max-w-3xl"
                onDragEnter={onFileDragEnter}
                onDragOver={onFileDragOver}
                onDragLeave={onFileDragLeave}
                onDrop={onFileDrop}
            >
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Image <span className="text-[#0D614E]">Links</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Drop images here. Each file uploads and gives you an AWS link to copy.
                    </p>
                </div>

                <div
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            inputRef.current?.click();
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                        items.length ? "px-6 py-6" : "px-6 py-14"
                    } ${
                        dragging
                            ? "border-[#0D614E] bg-[#0D614E]/5"
                            : "border-gray-200 bg-white hover:border-[#0D614E]/60 hover:bg-gray-50"
                    }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                            addFiles(event.target.files);
                            event.target.value = "";
                        }}
                    />
                    <Upload size={items.length ? 26 : 34} className={`mx-auto mb-2 ${dragging ? "text-[#0D614E]" : "text-gray-400"}`} />
                    <p className="text-sm font-medium text-gray-800">
                        {dragging ? "Drop images to upload" : "Drag images here, or click to browse"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, GIF · up to {MAX_FILE_SIZE_MB} MB each</p>
                </div>

                {items.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-white border border-gray-200 px-2.5 py-1 text-gray-600">
                                {readyItems.length} ready
                            </span>
                            {uploadingCount > 0 && (
                                <span className="rounded-full bg-white border border-blue-200 px-2.5 py-1 text-blue-700">
                                    {uploadingCount} uploading
                                </span>
                            )}
                            {failedCount > 0 && (
                                <span className="rounded-full bg-white border border-red-200 px-2.5 py-1 text-red-600">
                                    {failedCount} failed
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="secondary" onClick={() => copyText(readyItems.map((item) => item.url).join("\n"), "all-urls", `${readyItems.length} link${readyItems.length === 1 ? "" : "s"} copied`)} disabled={!readyItems.length}>
                                {copiedKey === "all-urls" ? <Check size={15} /> : <Copy size={15} />}
                                Copy all URLs
                            </Button>
                            <Button variant="secondary" onClick={clearAll}>
                                <Trash2 size={14} /> Clear
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mt-3 space-y-3">
                    {items.map((item) => (
                        <article key={item.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-3 sm:p-4">
                            <div className="flex gap-3">
                                <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                                    {item.preview ? (
                                        <img src={item.preview} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-300">
                                            <ImagePlus size={18} />
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-400">{formatBytes(item.size)}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <StatusPill status={item.status} />
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-2 flex flex-col sm:flex-row gap-2">
                                        <input
                                            readOnly
                                            value={item.url}
                                            placeholder={item.status === "error" ? "Upload failed" : "Link appears here after upload"}
                                            onFocus={(event) => event.target.select()}
                                            className={`flex-1 min-w-0 rounded-lg border px-2.5 py-2 font-mono text-[12px] outline-none ${
                                                item.url
                                                    ? "border-gray-200 bg-gray-50 text-gray-800"
                                                    : "border-gray-100 bg-gray-50 text-gray-400"
                                            }`}
                                        />
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                type="button"
                                                disabled={!item.url}
                                                onClick={() => copyText(item.url, `url-${item.id}`)}
                                                className="inline-flex items-center justify-center gap-1.5 min-w-[96px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                                            >
                                                {copiedKey === `url-${item.id}` ? <Check size={14} className="text-[#0D614E]" /> : <Copy size={14} />}
                                                {copiedKey === `url-${item.id}` ? "Copied" : "Copy URL"}
                                            </button>
                                            {item.status === "error" && (
                                                <button
                                                    type="button"
                                                    onClick={() => retryItem(item.id)}
                                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                                                >
                                                    <RefreshCw size={14} /> Retry
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {item.status === "error" && item.error && (
                                        <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                                            <AlertCircle size={13} className="mt-0.5 shrink-0" />
                                            {item.error}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </DashboardPageShell>
    );
}

function StatusPill({ status }) {
    if (status === "done") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700">
                <Check size={12} /> Ready
            </span>
        );
    }
    if (status === "error") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600">
                <AlertCircle size={12} /> Failed
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
            <Loader2 size={12} className="animate-spin" />
            {status === "uploading" ? "Uploading" : "Queued"}
        </span>
    );
}
