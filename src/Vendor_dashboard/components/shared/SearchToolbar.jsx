import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import Button from "./Button";

const TOOLBAR_CONTROL =
    "box-border rounded-lg border border-gray-200 bg-white text-sm text-gray-900 leading-normal transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0D614E]/30 focus:border-[#0D614E]/40";

const TOOLBAR_INPUT = `${TOOLBAR_CONTROL} h-10`;
const TOOLBAR_SELECT = `${TOOLBAR_CONTROL} h-10 min-h-[2.5rem] py-2 pl-3 pr-8`;

export default function SearchToolbar({
    value,
    onChange,
    onSubmit,
    onClear,
    placeholder = "Search...",
    children,
    submitLabel = "Search",
    live = false,
    className = "",
}) {
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        if (!live || !onSubmit) return undefined;
        const timer = setTimeout(() => onSubmit(), 350);
        return () => clearTimeout(timer);
    }, [value, live, onSubmit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.(e);
    };

    return (
        <div
            className={`ds-card p-4 sm:p-5 mb-6 transition-shadow duration-200 ${focused ? "shadow-md ring-1 ring-[#0D614E]/10" : ""} ${className}`}
        >
            <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center" onSubmit={handleSubmit}>
                {children}
                <div className="relative min-w-0 flex-1 w-full">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                        aria-hidden
                    />
                    <input
                        type="search"
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        aria-label="Search"
                        className={`${TOOLBAR_INPUT} w-full pl-10 pr-4`}
                    />
                </div>
                {!live && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="submit" variant="primary" className="!h-10 !py-0 px-4 shrink-0">
                            {submitLabel}
                        </Button>
                        {onClear && value && (
                            <Button type="button" variant="secondary" className="!h-10 !py-0 px-4 shrink-0" onClick={onClear}>
                                Clear
                            </Button>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}

export function SelectFilter({ value, onChange, options, placeholder, className = "", "aria-label": ariaLabel }) {
    return (
        <select
            value={value}
            onChange={onChange}
            aria-label={ariaLabel || placeholder}
            className={`${TOOLBAR_SELECT} shrink-0 ds-focus ${className}`}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
                <option key={opt.value ?? opt} value={opt.value ?? opt}>
                    {opt.label ?? opt}
                </option>
            ))}
        </select>
    );
}
