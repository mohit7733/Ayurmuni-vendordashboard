import { groupOrderLineItems } from "../Order/orderHelpers";

export const CHART_COLORS = ["#0D614E", "#10B981", "#8B5CF6", "#F59E0B", "#F43F5E", "#3B82F6", "#14B8A6", "#64748B"];

export const ORDER_STATUS_ROWS = [
  { key: "pending", label: "Pending", color: "#F59E0B" },
  { key: "confirmed", label: "Confirmed", color: "#3B82F6" },
  { key: "processing", label: "Processing", color: "#8B5CF6" },
  { key: "shipped", label: "Shipped", color: "#0D614E" },
  { key: "delivered", label: "Delivered", color: "#10B981" },
  { key: "cancelled", label: "Cancelled", color: "#F43F5E" },
  { key: "returned", label: "Returned", color: "#64748B" },
];

const EXCLUDED_SALE_STATUSES = new Set(["cancelled", "canceled", "returned", "refunded", "refund"]);

function saleStatus(item) {
  return String(item?.order_status || item?.status || item?.item_status || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function isExcludedSale(item) {
  const status = saleStatus(item);
  if (!status) return false;
  if (EXCLUDED_SALE_STATUSES.has(status)) return true;
  return status.includes("cancel") || status.includes("return") || status.includes("refund");
}

export const PERIODS = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "3m", label: "3 months" },
  { id: "6m", label: "6 months" },
  { id: "year", label: "Year" },
];

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function getPeriodRange(periodId, now = new Date()) {
  const end = endOfDay(now);
  const start = startOfDay(now);
  if (periodId === "week") {
    start.setDate(start.getDate() - 6);
  } else if (periodId === "month") {
    start.setDate(1);
  } else if (periodId === "3m") {
    start.setMonth(start.getMonth() - 2, 1);
  } else if (periodId === "6m") {
    start.setMonth(start.getMonth() - 5, 1);
  } else {
    start.setMonth(start.getMonth() - 11, 1);
  }
  return { id: periodId, start, end };
}

export function getPreviousRange(range) {
  const span = range.end.getTime() - range.start.getTime();
  const end = new Date(range.start.getTime() - 1);
  const start = startOfDay(new Date(end.getTime() - span));
  return { id: range.id, start, end };
}

export function formatRangeLabel(range) {
  const fmt = (date) =>
    date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}

export function itemDate(item) {
  const raw = item?.date || item?.created_at || item?.order_date || item?.placed_at;
  if (!raw) return null;
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function filterItemsByRange(orderItems = [], range) {
  return orderItems.filter((item) => {
    const date = itemDate(item);
    return date && date >= range.start && date <= range.end;
  });
}

export function categoryName(product) {
  return (
    product?.product_subcategory_name ||
    product?.product_category_name ||
    product?.service_category_name ||
    "Other"
  );
}

export function shortLabel(value, max = 16) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function formatPercent(value, { signed = false } = {}) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const rounded = Math.round(Number(value));
  if (!signed) return `${rounded}%`;
  if (rounded > 0) return `+${rounded}%`;
  return `${rounded}%`;
}

function lineRevenue(item) {
  const qty = Number(item.quantity) || 0;
  const unit = Number(item.selling_price ?? item.unit_price ?? item.price);
  const linePrice = Number(item.total_price);
  const lineAmount = Number(item.total_amount);
  const orderAmount = Number(item.order_total_amount);

  if (!Number.isNaN(linePrice) && linePrice > 0) return linePrice;
  if (qty > 0 && !Number.isNaN(unit) && unit > 0) return qty * unit;
  if (!Number.isNaN(lineAmount) && lineAmount > 0) {
    const looksLikeWholeOrder =
      !Number.isNaN(orderAmount) && orderAmount > 0 && lineAmount === orderAmount && qty > 1;
    if (!looksLikeWholeOrder) return lineAmount;
  }
  return 0;
}

function productKey(name) {
  return String(name || "").trim().toLowerCase();
}

function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeMonthlyRevenue(list = []) {
  return list
    .map((item) => ({
      month: item.month,
      year: item.year,
      label: item.label || `${item.month || ""} ${String(item.year || "").slice(-2)}`.trim() || "—",
      fullName: item.label || `${item.month || ""} ${item.year || ""}`.trim(),
      revenue: Number(item.value ?? item.revenue) || 0,
    }))
    .filter((item) => item.label && item.label !== "—");
}

export function monthOverMonth(months = []) {
  if (months.length < 2) return null;
  const current = months[months.length - 1];
  const previous = months[months.length - 2];
  if (!previous.revenue) return { current, previous, change: null };
  return {
    current,
    previous,
    change: ((current.revenue - previous.revenue) / previous.revenue) * 100,
  };
}

export function buildSalesRows(orderItems = []) {
  const map = new Map();
  orderItems.forEach((item) => {
    if (isExcludedSale(item)) return;
    const name = item.product_name || item.name || "Product";
    const key = productKey(name);
    if (!key) return;
    const units = Number(item.quantity) || 0;
    const revenue = lineRevenue(item);
    if (units <= 0 && revenue <= 0) return;
    const existing = map.get(key);
    if (existing) {
      existing.units += units;
      existing.revenue += revenue;
      return;
    }
    map.set(key, { key, name, units, revenue });
  });
  const rows = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue || b.units - a.units);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  return rows.map((row) => ({
    ...row,
    share: totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0,
  }));
}

export function buildCategoryPerformance(products = [], salesRows = []) {
  const catalog = new Map();
  products.forEach((product) => {
    const key = productKey(product.name);
    if (!key) return;
    catalog.set(key, categoryName(product));
  });

  const map = new Map();
  salesRows.forEach((row) => {
    const name = catalog.get(row.key) || "Uncategorized";
    const existing = map.get(name) || { name, products: 0, units: 0, revenue: 0 };
    existing.products += 1;
    existing.units += row.units;
    existing.revenue += row.revenue;
    map.set(name, existing);
  });

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue || b.units - a.units);
}

export function buildCatalogSplit(products = []) {
  const map = new Map();
  products.forEach((product) => {
    const name = categoryName(product);
    map.set(name, (map.get(name) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, products]) => ({ name, products }))
    .sort((a, b) => b.products - a.products);
}

export function buildUnsoldProducts(products = [], salesRows = []) {
  const sold = new Set(salesRows.map((row) => row.key));
  return products.filter((product) => {
    const key = productKey(product.name);
    return key && !sold.has(key);
  });
}

export function buildPaymentMix(orderItems = []) {
  const orders = groupOrderLineItems(orderItems.filter((item) => !isExcludedSale(item)));
  const map = new Map();
  orders.forEach((order) => {
    const name = order.payment_type || order.payment_method || "Unknown";
    map.set(name, (map.get(name) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name: String(name).replace(/_/g, " "), value, amount: 0 }))
    .sort((a, b) => b.value - a.value);
}

export function buildStatusCounts(orderItems = []) {
  const counts = Object.fromEntries(ORDER_STATUS_ROWS.map((row) => [row.key, 0]));
  const seen = new Set();
  orderItems.forEach((item) => {
    const orderId = item.order_id || item.order_code;
    if (!orderId || seen.has(orderId)) return;
    seen.add(orderId);
    const status = saleStatus(item);
    if (status.includes("cancel")) counts.cancelled += 1;
    else if (status.includes("return") || status.includes("refund")) counts.returned += 1;
    else if (status in counts) counts[status] += 1;
  });
  return { counts, total: seen.size };
}

function grainForPeriod(periodId) {
  if (periodId === "week" || periodId === "month") return "day";
  if (periodId === "3m") return "week";
  return "month";
}

function bucketStart(date, grain) {
  const next = startOfDay(date);
  if (grain === "week") {
    const day = next.getDay();
    const diff = day === 0 ? 6 : day - 1;
    next.setDate(next.getDate() - diff);
  } else if (grain === "month") {
    next.setDate(1);
  }
  return next;
}

function addGrain(date, grain) {
  const next = new Date(date);
  if (grain === "month") next.setMonth(next.getMonth() + 1);
  else if (grain === "week") next.setDate(next.getDate() + 7);
  else next.setDate(next.getDate() + 1);
  return next;
}

function bucketLabel(date, grain) {
  if (grain === "month") {
    return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function buildPeriodSeries(orderItems = [], range) {
  const grain = grainForPeriod(range.id);
  const buckets = new Map();
  let cursor = bucketStart(range.start, grain);
  const last = bucketStart(range.end, grain);
  while (cursor <= last) {
    const key = dayKey(cursor);
    buckets.set(key, {
      date: key,
      label: bucketLabel(cursor, grain),
      fullName: bucketLabel(cursor, grain),
      orders: 0,
      revenue: 0,
      orderIds: new Set(),
    });
    cursor = addGrain(cursor, grain);
  }

  orderItems.forEach((item) => {
    const date = itemDate(item);
    if (!date) return;
    const key = dayKey(bucketStart(date, grain));
    const bucket = buckets.get(key);
    if (!bucket) return;
    if (isExcludedSale(item)) return;
    bucket.revenue += lineRevenue(item);
    const orderId = item.order_id || item.order_code;
    if (orderId && !bucket.orderIds.has(orderId)) {
      bucket.orderIds.add(orderId);
      bucket.orders += 1;
    }
  });

  return Array.from(buckets.values()).map(({ orderIds, ...row }) => row);
}

export function salesTotal(rows = []) {
  return rows.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0);
}

export function periodChange(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function buildInsights({
  comparison,
  topProduct,
  topCategory,
  deliveryRate,
  unsoldCount,
  orderCount,
}) {
  const lines = [];

  if (comparison?.change != null && comparison?.label) {
    const direction = comparison.change >= 0 ? "up" : "down";
    lines.push({
      tone: comparison.change >= 0 ? "good" : "watch",
      text: `Sales are ${direction} ${formatPercent(Math.abs(comparison.change))} from the previous ${comparison.label}.`,
    });
  } else if (comparison?.current && comparison.change != null) {
    const direction = comparison.change >= 0 ? "up" : "down";
    lines.push({
      tone: comparison.change >= 0 ? "good" : "watch",
      text: `${comparison.current.fullName || comparison.current.label} revenue is ${direction} ${formatPercent(Math.abs(comparison.change))} from ${comparison.previous.fullName || comparison.previous.label}.`,
    });
  } else if (comparison?.current?.revenue > 0) {
    lines.push({
      tone: "neutral",
      text: `Latest month on record is ${comparison.current.fullName || comparison.current.label}.`,
    });
  }

  if (topProduct) {
    lines.push({
      tone: "good",
      text: `${topProduct.name} is the top seller, with ${topProduct.units.toLocaleString("en-IN")} units and ${formatPercent(topProduct.share)} of sales in the loaded orders.`,
    });
  }

  if (topCategory?.revenue > 0) {
    lines.push({
      tone: "neutral",
      text: `${topCategory.name} brings in the most category revenue from those orders.`,
    });
  }

  if (orderCount > 0 && deliveryRate != null) {
    lines.push({
      tone: deliveryRate >= 70 ? "good" : "neutral",
      text: `${formatPercent(deliveryRate)} of orders are delivered.`,
    });
  }

  if (unsoldCount > 0) {
    lines.push({
      tone: "watch",
      text: `${unsoldCount.toLocaleString("en-IN")} catalog product${unsoldCount === 1 ? "" : "s"} have no sales in the orders loaded here.`,
    });
  }

  return lines.slice(0, 4);
}
