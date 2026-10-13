import React, { useMemo, useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import StatusBadge from "../../../components/shared/StatusBadge";

export default function DashboardProductsTable({ products = [], onEdit, onSearch }) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("sold");
    const [sortDir, setSortDir] = useState("desc");

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        let rows = term
            ? products.filter((p) => p.name?.toLowerCase().includes(term))
            : [...products];

        rows.sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (typeof av === "number" && typeof bv === "number") {
                return sortDir === "asc" ? av - bv : bv - av;
            }
            return sortDir === "asc"
                ? String(av || "").localeCompare(String(bv || ""))
                : String(bv || "").localeCompare(String(av || ""));
        });
        return rows;
    }, [products, search, sortKey, sortDir]);

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const SortHeader = ({ label, col }) => (
        <button
            type="button"
            onClick={() => toggleSort(col)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-800 transition-colors ds-focus rounded"
        >
            {label}
            {sortKey === col && <span className="text-[#0D614E]">{sortDir === "asc" ? "↑" : "↓"}</span>}
        </button>
    );

    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">Product Overview</h2>
                    <p className="text-[11px] text-gray-500">{filtered.length} products · sorted by sales</p>
                </div>
                <div className="relative max-w-xs w-full">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            onSearch?.(e.target.value);
                        }}
                        placeholder="Search products..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50/80 focus:bg-white focus:border-[#0D614E]/30 transition-all ds-focus"
                    />
                </div>
            </div>

            <div className="overflow-x-auto ds-scroll max-h-[420px]">
                <table className="w-full min-w-[560px]">
                    <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-2.5"><SortHeader label="Product" col="name" /></th>
                            <th className="text-left px-4 py-2.5"><SortHeader label="Price" col="price" /></th>
                            <th className="text-left px-4 py-2.5"><SortHeader label="Sold" col="sold" /></th>
                            <th className="text-left px-4 py-2.5">Approval</th>
                            <th className="text-left px-4 py-2.5"><SortHeader label="Stock" col="stock" /></th>
                            <th className="text-right px-4 py-2.5 w-12"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? (
                            filtered.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-gray-50 transition-colors hover:bg-[#0D614E]/[0.03] group"
                                >
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-md border border-gray-100 overflow-hidden bg-gray-50 flex-shrink-0">
                                                <img src={item.image} alt="" className="h-full w-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                                <p className="text-[11px] text-gray-400">{item.stock} in stock</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-700 tabular-nums">
                                        ₹{Number(item.price).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800 tabular-nums">
                                        {Number(item.sold || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800 tabular-nums">{item.stock}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(item.id)}
                                            className="p-1.5 rounded-md text-gray-400 hover:text-[#0D614E] hover:bg-[#0D614E]/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all ds-focus"
                                            aria-label={`Edit ${item.name}`}
                                        >
                                            <MoreHorizontal size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                                    No products match your search
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
