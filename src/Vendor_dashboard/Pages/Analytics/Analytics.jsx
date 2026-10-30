import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  RefreshCw,
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  Ban,
  Undo2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import { vendorService } from "../../../services/vendorService";
import { formatCurrency, parseOrdersListResponse } from "../Order/orderHelpers";
import { exportToCsv } from "../../utils/exportHelpers";
import DashboardPageShell from "../../components/shared/DashboardPageShell";
import Button from "../../components/shared/Button";
import { PageError } from "../../components/shared/PageState";
import {
  CHART_COLORS,
  ORDER_STATUS_ROWS,
  PERIODS,
  buildCatalogSplit,
  buildCategoryPerformance,
  buildInsights,
  buildPaymentMix,
  buildPeriodSeries,
  buildSalesRows,
  buildStatusCounts,
  buildUnsoldProducts,
  filterItemsByRange,
  formatPercent,
  formatRangeLabel,
  getPeriodRange,
  getPreviousRange,
  periodChange,
  salesTotal,
  shortLabel,
} from "./analyticsHelpers";

const LIST_PAGE_SIZE = 1000000;

function ChartCard({ title, subtitle, children, empty, emptyMessage, action }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {empty ? (
        <div className="flex h-56 items-center justify-center px-6 text-center">
          <p className="text-sm text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="text-xs font-semibold text-gray-800">{row?.fullName || row?.label || label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-0.5 text-xs font-medium text-[#0D614E]">
          {entry.name}:{" "}
          {entry.dataKey === "revenue" || entry.dataKey === "amount"
            ? formatCurrency(entry.value)
            : Number(entry.value || 0).toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

function Kpi({ label, value, hint, icon: Icon, hero }) {
  if (hero) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-[#0D614E] to-[#0a4d3e] p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-emerald-100">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {hint && <p className="mt-2 text-xs text-emerald-100">{hint}</p>}
          </div>
          <Icon size={26} className="opacity-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {hint && <p className="mt-2 text-xs text-gray-400">{hint}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D614E]/10 text-[#0D614E]">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [orderItems, setOrderItems] = useState([]);
  const [ordersLoaded, setOrdersLoaded] = useState(0);
  const [period, setPeriod] = useState("month");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const [productsRes, ordersRes] = await Promise.all([
        vendorService.getProducts({ page: 1, page_size: LIST_PAGE_SIZE }).catch(() => null),
        vendorService.getOrders({ page: 1, page_size: LIST_PAGE_SIZE }).catch(() => null),
      ]);

      if (!productsRes && !ordersRes) {
        throw new Error("Failed to load analytics");
      }

      const productPayload = productsRes?.data?.data || {};
      const productResults = Array.isArray(productPayload.results) ? productPayload.results : [];
      const parsedOrders = parseOrdersListResponse(ordersRes);

      setProducts(productResults);
      setProductCount(Number(productPayload.count) || productResults.length);
      setOrderItems(parsedOrders.results);
      setOrdersLoaded(parsedOrders.count);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const previousRange = useMemo(() => getPreviousRange(range), [range]);
  const periodItems = useMemo(() => filterItemsByRange(orderItems, range), [orderItems, range]);
  const previousItems = useMemo(
    () => filterItemsByRange(orderItems, previousRange),
    [orderItems, previousRange]
  );
  const salesRows = useMemo(() => buildSalesRows(periodItems), [periodItems]);
  const previousSales = useMemo(() => salesTotal(buildSalesRows(previousItems)), [previousItems]);
  const topProducts = useMemo(() => salesRows.slice(0, 8), [salesRows]);
  const categories = useMemo(
    () => buildCategoryPerformance(products, salesRows),
    [products, salesRows]
  );
  const catalogSplit = useMemo(() => buildCatalogSplit(products), [products]);
  const unsold = useMemo(() => buildUnsoldProducts(products, salesRows), [products, salesRows]);
  const paymentMix = useMemo(() => buildPaymentMix(periodItems), [periodItems]);
  const series = useMemo(() => buildPeriodSeries(periodItems, range), [periodItems, range]);
  const status = useMemo(() => buildStatusCounts(periodItems), [periodItems]);

  const revenueValue = salesTotal(salesRows);
  const cancelledCount = Number(status.counts.cancelled) || 0;
  const returnedCount = Number(status.counts.returned) || 0;
  const orderCount = Math.max(status.total - cancelledCount - returnedCount, 0);
  const delivered = Number(status.counts.delivered) || 0;
  const deliveryRate = orderCount > 0 ? (delivered / orderCount) * 100 : null;
  const statusMax = Math.max(...ORDER_STATUS_ROWS.map((row) => Number(status.counts[row.key]) || 0), 1);
  const change = periodChange(revenueValue, previousSales);
  const periodMeta = PERIODS.find((item) => item.id === period);
  const averageOrderValue = orderCount > 0 ? revenueValue / orderCount : 0;
  const sampleNote =
    salesRows.length > topProducts.length
      ? `Top ${topProducts.length} products are listed. The total row is every product in this period and matches the sales card.`
      : ordersLoaded > orderItems.length
        ? `Showing the latest ${orderItems.length.toLocaleString("en-IN")} order lines. The total matches the sales card.`
        : "The total row matches the sales card. Cancelled and returned lines are not included.";

  const insights = useMemo(
    () =>
      buildInsights({
        comparison: { change, label: periodMeta?.label?.toLowerCase() || "period" },
        topProduct: topProducts[0],
        topCategory: categories[0],
        deliveryRate,
        unsoldCount: unsold.length,
        orderCount,
      }),
    [change, periodMeta, topProducts, categories, deliveryRate, unsold.length, orderCount]
  );

  const handleExport = () => {
    const rows = [
      { section: "Summary", name: "Period", value: periodMeta?.label || period, extra: formatRangeLabel(range) },
      { section: "Summary", name: "Sales", value: revenueValue, extra: "INR" },
      { section: "Summary", name: "Orders", value: orderCount, extra: "" },
      { section: "Summary", name: "Cancelled orders", value: cancelledCount, extra: "count" },
      { section: "Summary", name: "Returned orders", value: returnedCount, extra: "count" },
      { section: "Summary", name: "Products", value: productCount, extra: "" },
      { section: "Summary", name: "Delivered rate", value: deliveryRate == null ? "" : Math.round(deliveryRate), extra: "%" },
      ...series.map((item) => ({
        section: "Revenue trend",
        name: item.fullName || item.label,
        value: item.revenue,
        extra: "INR",
      })),
      ...ORDER_STATUS_ROWS.map((row) => ({
        section: "Order status",
        name: row.label,
        value: Number(status.counts[row.key]) || 0,
        extra: "orders",
      })),
      ...topProducts.map((item) => ({
        section: "Top products",
        name: item.name,
        value: item.units,
        extra: item.revenue,
      })),
      ...categories.map((item) => ({
        section: "Category revenue",
        name: item.name,
        value: item.revenue,
        extra: item.units,
      })),
      ...catalogSplit.map((item) => ({
        section: "Catalog mix",
        name: item.name,
        value: item.products,
        extra: "products",
      })),
    ];

    exportToCsv("vendor-analytics.csv", rows, [
      { key: "section", label: "Section" },
      { key: "name", label: "Name" },
      { key: "value", label: "Value" },
      { key: "extra", label: "Detail" },
    ]);
    toast.success("Analytics exported");
  };

  const momHint =
    change == null
      ? "Sum of product sales in this period"
      : `${formatPercent(change, { signed: true })} vs previous ${periodMeta?.label?.toLowerCase()}`;

  return (
    <DashboardPageShell
      compact
      hidePageHeader
      contentClassName="vendor-page-content bg-gray-50 min-h-full"
      actions={
        <>
          <Button variant="secondary" onClick={fetchData} loading={isLoading} disabled={isLoading}>
            {!isLoading && <RefreshCw size={16} />}
            Refresh
          </Button>
          <Button onClick={handleExport} disabled={isLoading || Boolean(error)}>
            <Download size={16} />
            Export CSV
          </Button>
        </>
      }
    >
      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sales Analytics</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {formatRangeLabel(range)}. Every total on this page uses this period.
            </p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm border border-gray-200" role="tablist" aria-label="Time period">
            {PERIODS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={period === option.id}
                onClick={() => setPeriod(option.id)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  period === option.id
                    ? "bg-[#0D614E] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#0D614E]/20 border-t-[#0D614E]" />
              <p className="mt-4 text-sm text-gray-500">Loading analytics...</p>
            </div>
          </div>
        ) : error ? (
          <PageError message={error} onRetry={fetchData} />
        ) : (
          <>
            {insights.length > 0 && (
              <div className="rounded-xl border border-[#0D614E]/15 bg-[#0D614E]/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0D614E]">What the numbers say</p>
                <ul className="mt-3 space-y-2">
                  {insights.map((item) => (
                    <li key={item.text} className="flex gap-2 text-sm text-gray-700">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          item.tone === "watch" ? "bg-amber-500" : item.tone === "good" ? "bg-emerald-500" : "bg-[#0D614E]"
                        }`}
                      />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Kpi hero label="Sales" value={formatCurrency(revenueValue)} hint={momHint} icon={IndianRupee} />
              <Kpi
                label="Orders"
                value={orderCount.toLocaleString("en-IN")}
                hint={deliveryRate == null ? "Cancelled and returned orders are left out" : `${formatPercent(deliveryRate)} delivered. Cancelled and returned orders are left out.`}
                icon={ShoppingCart}
              />
              <Kpi
                label="Avg order value"
                value={formatCurrency(averageOrderValue)}
                hint="Sales divided by orders. Cancelled and returned orders are left out."
                icon={Package}
              />
              <Kpi
                label="Vs previous period"
                value={change == null ? "—" : formatPercent(change, { signed: true })}
                hint={previousSales > 0 ? `Previous sales ${formatCurrency(previousSales)}` : "No sales in the previous period"}
                icon={TrendingUp}
              />
              <Kpi
                label="Cancelled orders"
                value={cancelledCount.toLocaleString("en-IN")}
                hint="Not included in the sales total."
                icon={Ban}
              />
              <Kpi
                label="Returned orders"
                value={returnedCount.toLocaleString("en-IN")}
                hint="Not included in the sales total."
                icon={Undo2}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <ChartCard
                  title="Sales trend"
                  subtitle={formatRangeLabel(range)}
                  empty={!series.some((item) => item.revenue > 0)}
                  emptyMessage="No sales in this period."
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={series}>
                      <defs>
                        <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0D614E" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#0D614E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => (value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`)}
                      />
                      <Tooltip content={<MoneyTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0D614E" strokeWidth={2} fill="url(#analyticsRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="xl:col-span-2">
                <ChartCard
                  title="Order progress"
                  subtitle="Counts only. Cancelled and returned amounts are not added to sales."
                  empty={ORDER_STATUS_ROWS.every((row) => !Number(status.counts[row.key]))}
                  emptyMessage="No orders in this period."
                >
                  <ul className="space-y-3">
                    {ORDER_STATUS_ROWS.map((row) => {
                      const count = Number(status.counts[row.key]) || 0;
                      return (
                        <li key={row.key}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-700">{row.label}</span>
                            <span className="tabular-nums text-gray-500">
                              {count.toLocaleString("en-IN")}
                              {status.total > 0 ? ` · ${formatPercent((count / status.total) * 100)}` : ""}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(count / statusMax) * 100}%`, backgroundColor: row.color }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </ChartCard>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Orders in this period"
                subtitle={formatRangeLabel(range)}
                empty={!series.some((item) => item.orders > 0)}
                emptyMessage="No dated orders in this period."
              >
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<MoneyTooltip />} />
                    <Bar dataKey="orders" name="Orders" fill="#0D614E" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Payment mix"
                subtitle="How customers paid"
                empty={paymentMix.length === 0}
                emptyMessage="Payment mix appears after paid orders."
              >
                <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={paymentMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72}>
                        {paymentMix.map((item, index) => (
                          <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<MoneyTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="space-y-2">
                    {paymentMix.map((item, index) => (
                      <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 capitalize text-gray-700">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          {item.name}
                        </span>
                        <span className="text-right text-gray-900">
                          <span className="block font-medium tabular-nums">{item.value.toLocaleString("en-IN")} orders</span>
                          {item.amount > 0 && (
                            <span className="block text-xs text-gray-500">{formatCurrency(item.amount)}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ChartCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-5">
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-3">
                <h3 className="text-base font-semibold text-gray-900">Top products</h3>
                <p className="mt-0.5 text-xs text-gray-500">{sampleNote}</p>
                {topProducts.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-sm text-gray-400">
                    Best sellers show up after customers place orders.
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                          <th className="py-2 pr-3 font-medium">Product</th>
                          <th className="py-2 pr-3 font-medium">Units</th>
                          <th className="py-2 pr-3 font-medium">Sales</th>
                          <th className="py-2 font-medium">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((product, index) => (
                          <tr key={product.key} className="border-b border-gray-50 last:border-0">
                            <td className="py-3 pr-3">
                              <p className="font-medium text-gray-800">
                                <span className="mr-2 text-xs text-gray-400">{index + 1}</span>
                                {product.name}
                              </p>
                            </td>
                            <td className="py-3 pr-3 tabular-nums text-gray-700">{product.units.toLocaleString("en-IN")}</td>
                            <td className="py-3 pr-3 tabular-nums text-gray-700">{formatCurrency(product.revenue)}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                                  <div className="h-full rounded-full bg-[#0D614E]" style={{ width: `${Math.min(product.share, 100)}%` }} />
                                </div>
                                <span className="text-xs tabular-nums text-gray-500">{formatPercent(product.share)}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-900">
                          <td className="py-3 pr-3">Total</td>
                          <td className="py-3 pr-3 tabular-nums">
                            {salesRows.reduce((sum, row) => sum + row.units, 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 pr-3 tabular-nums">{formatCurrency(revenueValue)}</td>
                          <td className="py-3 text-xs font-medium text-gray-500">Same as the sales card</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="xl:col-span-2">
                <ChartCard
                  title="Category revenue"
                  subtitle="Sales grouped by catalog category"
                  empty={categories.length === 0}
                  emptyMessage="Category revenue appears when sold products match your catalog."
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={categories.slice(0, 6).map((item) => ({
                        ...item,
                        fullName: item.name,
                        name: shortLabel(item.name, 12),
                      }))}
                      layout="vertical"
                      margin={{ left: 8, right: 12 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={84} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<MoneyTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[0, 4, 4, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>

            {unsold.length > 0 && (
              <section className="rounded-xl border border-amber-100 bg-amber-50/60 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-0.5 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-amber-900">Products with no sales in these orders</h3>
                    <p className="mt-1 text-xs text-amber-800">
                      {unsold.length.toLocaleString("en-IN")} of {productCount.toLocaleString("en-IN")} products had no sales in {formatRangeLabel(range)}.
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {unsold.slice(0, 8).map((product) => (
                        <li key={product.id || product.name} className="rounded-full bg-white px-3 py-1 text-xs text-gray-700">
                          {product.name}
                        </li>
                      ))}
                      {unsold.length > 8 && (
                        <li className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                          +{unsold.length - 8} more
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </DashboardPageShell>
  );
}
