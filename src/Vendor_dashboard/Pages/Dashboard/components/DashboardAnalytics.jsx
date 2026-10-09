import React from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { formatCurrency } from "../../Order/orderHelpers";

const BRAND = "#0D614E";

function ChartShell({ title, subtitle, children, emptyMessage, hasData, className = "", tall = false }) {
    return (
        <div className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}>
            <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {hasData ? (
                <div className={tall ? "h-[220px]" : "h-[200px]"}>{children}</div>
            ) : (
                <div className={`${tall ? "h-[220px]" : "h-[200px]"} flex flex-col items-center justify-center text-center px-4`}>
                    <p className="text-sm text-gray-400">{emptyMessage}</p>
                </div>
            )}
        </div>
    );
}

function PremiumTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload;
    return (
        <div className="rounded-lg border border-gray-100 bg-white/95 backdrop-blur px-3 py-2 shadow-lg text-sm">
            <p className="font-semibold text-gray-800 text-xs">{item?.fullName || label || item?.name || item?.month}</p>
            {payload.map((entry) => (
                <p key={entry.name} className="text-[#0D614E] font-medium mt-0.5 text-xs">
                    {entry.name}:{" "}
                    {entry.name === "Revenue"
                        ? formatCurrency(entry.value)
                        : entry.value?.toLocaleString?.() ?? entry.value}
                </p>
            ))}
        </div>
    );
}

function TopSellersPanel({ items = [], note, onOpenProduct }) {
    return (
        <div className="col-span-12 xl:col-span-8 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Top Selling Products</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{note || "Units sold from your orders"}</p>
            </div>
            {items.length > 0 ? (
                <ul className="divide-y divide-gray-50">
                    {items.map((item, index) => {
                        const openable = Boolean(item.productId && onOpenProduct);
                        return (
                            <li key={item.key || `${item.name}-${index}`}>
                                <button
                                    type="button"
                                    disabled={!openable}
                                    onClick={() => openable && onOpenProduct(item.productId)}
                                    className="flex w-full items-center gap-3 py-2 text-left rounded-lg hover:bg-[#0D614E]/[0.03] disabled:hover:bg-transparent disabled:cursor-default ds-focus"
                                >
                                    <span className="w-5 text-xs font-semibold text-gray-400 tabular-nums">{index + 1}</span>
                                    <div className="h-9 w-9 rounded-md border border-gray-100 overflow-hidden bg-gray-50 flex-shrink-0">
                                        {item.image ? (
                                            <img src={item.image} alt="" className="h-full w-full object-cover" />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                        <p className="text-[11px] text-gray-400 truncate">
                                            {[item.variant, item.sku].filter(Boolean).join(" · ") || "All variants"}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-semibold text-gray-900 tabular-nums">{item.units.toLocaleString()} sold</p>
                                        <p className="text-[11px] text-[#0D614E] font-medium tabular-nums">{formatCurrency(item.revenue)}</p>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="h-[200px] flex items-center justify-center text-center px-4">
                    <p className="text-sm text-gray-400">Your best sellers will show here after customers place orders.</p>
                </div>
            )}
        </div>
    );
}

export default function DashboardAnalytics({
    stockChartData = [],
    categoryChartData = [],
    approvalChartData = [],
    revenueTrendData = [],
    topSellingProducts = [],
    salesSampleNote,
    onOpenProduct,
}) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3">
                <TopSellersPanel
                    items={topSellingProducts}
                    note={salesSampleNote}
                    onOpenProduct={onOpenProduct}
                />

                <ChartShell
                    className="col-span-12 xl:col-span-4"
                    title="Inventory Health"
                    subtitle="Approval breakdown"
                    hasData={approvalChartData.length > 0}
                    emptyMessage="Add variants to see health."
                    tall
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={approvalChartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="45%"
                                innerRadius={44}
                                outerRadius={68}
                                paddingAngle={3}
                                animationDuration={600}
                            >
                                {approvalChartData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #f3f4f6", fontSize: 11 }} />
                            <Legend verticalAlign="bottom" iconType="circle" formatter={(v) => <span className="text-[11px] text-gray-600">{v}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartShell>
            </div>

            <div className="grid grid-cols-12 gap-3">
                <ChartShell
                    className="col-span-12 lg:col-span-5"
                    title="Revenue Trend"
                    subtitle="Monthly delivered revenue"
                    hasData={revenueTrendData.some((item) => item.revenue > 0)}
                    emptyMessage="Revenue appears here once orders are delivered."
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                            <defs>
                                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip content={<PremiumTooltip />} />
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke={BRAND} strokeWidth={2} fill="url(#salesGrad)" animationDuration={600} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartShell>

                <ChartShell
                    className="col-span-12 lg:col-span-4"
                    title="By Category"
                    subtitle="Catalog mix"
                    hasData={categoryChartData.length > 0}
                    emptyMessage="Add products to see categories."
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryChartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <Tooltip content={<PremiumTooltip />} />
                            <Bar dataKey="count" name="Products" fill="#10B981" radius={[0, 4, 4, 0]} maxBarSize={18} animationDuration={500} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartShell>

                <ChartShell
                    className="col-span-12 lg:col-span-3"
                    title="Stock Levels"
                    subtitle="Highest quantity"
                    hasData={stockChartData.length > 0}
                    emptyMessage="Add inventory to see stock."
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stockChartData.slice(0, 6)} margin={{ top: 4, right: 4, left: -16, bottom: 28 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9ca3af" }} interval={0} angle={-25} textAnchor="end" height={40} />
                            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip content={<PremiumTooltip />} />
                            <Bar dataKey="quantity" name="Units" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={500} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartShell>
            </div>
        </div>
    );
}
