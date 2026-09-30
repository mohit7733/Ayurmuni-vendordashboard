import React from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";
import usePersistedState from "../../hooks/usePersistedState";

export function PageLoader({ message = "Loading..." }) {
    return (
        <div className="flex justify-center items-center py-16 ds-animate-in" role="status" aria-live="polite">
            <div className="text-center">
                <div className="w-11 h-11 mx-auto border-[3px] border-[#0D614E]/20 border-t-[#0D614E] rounded-full animate-spin" />
                <p className="text-gray-500 mt-4 text-sm">{message}</p>
            </div>
        </div>
    );
}

export function PageEmpty({ title, description, subtitle, action, icon: Icon = Inbox, className = "" }) {
    const body = subtitle ?? description;
    return (
        <div className={`ds-card text-center py-14 px-6 ds-animate-in ${className}`}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Icon size={32} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {body && <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm leading-relaxed">{body}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

/** Alias — icon + title + subtitle empty state */
export function EmptyState({ icon, title, subtitle, description, action, className }) {
    return (
        <PageEmpty
            icon={icon}
            title={title}
            subtitle={subtitle}
            description={description}
            action={action}
            className={className}
        />
    );
}

export function PageError({ message, onRetry }) {
    return (
        <div className="ds-card text-center py-14 px-6 ds-animate-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Something went wrong</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm">{message}</p>
            {onRetry && (
                <div className="mt-6">
                    <Button onClick={onRetry}>Try again</Button>
                </div>
            )}
        </div>
    );
}

export function PaginationBar({
    page,
    pageSize,
    totalCount,
    onPageChange,
    onPageSizeChange,
    itemLabel = "items",
    storageKey,
    pageSizeOptions = [5, 10, 25, 50],
}) {
    const persistKey = storageKey ? `${storageKey}:pageSize` : null;
    const [storedSize, setStoredSize] = usePersistedState(persistKey || "vendor:default:pageSize", pageSize);
    const effectiveSize = persistKey && onPageSizeChange ? storedSize : pageSize;
    const totalPages = Math.max(1, Math.ceil(totalCount / effectiveSize));
    const start = totalCount === 0 ? 0 : (page - 1) * effectiveSize + 1;
    const end = Math.min(page * effectiveSize, totalCount);

    const handleSizeChange = (e) => {
        const next = Number(e.target.value);
        if (persistKey) setStoredSize(next);
        onPageSizeChange?.(next);
        onPageChange(1);
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push("...");
            const startPage = Math.max(2, page - 1);
            const endPage = Math.min(totalPages - 1, page + 1);
            for (let i = startPage; i <= endPage; i++) pages.push(i);
            if (page < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex mt-8 flex-col sm:flex-row items-center justify-between gap-4 px-3 sm:px-6 py-4 border-t border-gray-200 bg-gray-50/80 rounded-b-xl">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>
                    Showing <span className="font-medium text-gray-800">{start}</span>–
                    <span className="font-medium text-gray-800">{end}</span> of{" "}
                    <span className="font-medium text-gray-800">{totalCount}</span> {itemLabel}
                </span>
                {onPageSizeChange && persistKey && (
                    <select
                        value={effectiveSize}
                        onChange={handleSizeChange}
                        aria-label="Items per page"
                        className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white ds-focus transition-colors duration-200"
                    >
                        {pageSizeOptions.map((n) => (
                            <option key={n} value={n}>{n} / page</option>
                        ))}
                    </select>
                )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    aria-label="Previous page"
                    className="p-2 rounded-lg hover:bg-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 bg-white ds-focus active:scale-95"
                >
                    <ChevronLeft size={18} />
                </button>
                {getPageNumbers().map((pageNum, index) => (
                    <button
                        key={`${pageNum}-${index}`}
                        type="button"
                        disabled={pageNum === "..."}
                        onClick={() => typeof pageNum === "number" && onPageChange(pageNum)}
                        aria-current={pageNum === page ? "page" : undefined}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 ds-focus active:scale-95 ${
                            pageNum === page
                                ? "bg-[#0D614E] text-white shadow-sm"
                                : pageNum === "..."
                                  ? "cursor-default text-gray-400"
                                  : "hover:bg-gray-100 text-gray-700 bg-white border border-gray-200"
                        }`}
                    >
                        {pageNum}
                    </button>
                ))}
                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    aria-label="Next page"
                    className="p-2 rounded-lg hover:bg-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 bg-white ds-focus active:scale-95"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

export function TableCard({ children, className = "" }) {
    return <div className={`ds-card overflow-hidden ${className}`}>{children}</div>;
}

export function FilterCard({ children, className = "" }) {
    return <div className={`ds-card p-4 sm:p-6 mb-6 ${className}`}>{children}</div>;
}
