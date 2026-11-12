import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ShoppingBag } from "lucide-react";
import { vendorService } from "../../../services/vendorService";
import { PageEmpty, PageError, PageLoader } from "../../components/shared/PageState";
import StatusBadge from "../../components/shared/StatusBadge";
import Button from "../../components/shared/Button";
import {
  ORDER_STATUS_FILTERS,
  formatCurrency,
  formatOrderDate,
  formatPaymentLabel,
  formatStatusLabel,
  groupOrderLineItems,
  parseOrdersListResponse,
} from "../Order/orderHelpers";
import "./ProductVariantOrders.css";

const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const CARD_PAGE_SIZE = 8;

function toLineItems(results = []) {
  if (!results.length) return [];
  const sample = results[0] || {};
  const nested = sample.items || sample.order_items;
  const isLineItem =
    sample.order_item_id ||
    sample.product_name ||
    sample.variant_title ||
    sample.sku_code ||
    sample.vendor_sku_code;

  if (isLineItem && !Array.isArray(nested)) return results;

  if (Array.isArray(nested) || results.some((row) => Array.isArray(row.items) || Array.isArray(row.order_items))) {
    return results.flatMap((order) => {
      const items = order.items || order.order_items || [];
      if (!items.length) {
        return [{
          ...order,
          order_id: order.order_id || order.id,
          status: order.status || order.order_status,
          date: order.date || order.created_at,
        }];
      }
      return items.map((item) => ({
        ...item,
        order_id: order.order_id || order.id || item.order_id,
        order_code: item.order_code || order.order_code,
        order_display_code: item.order_display_code || order.order_display_code,
        date: item.date || order.date || order.created_at,
        status: item.status || order.status || order.order_status,
        payment_type: item.payment_type || order.payment_type,
        payment_method: item.payment_method || order.payment_method,
        address: item.address || order.address,
        order_total_amount: order.order_total_amount ?? order.total_amount ?? item.order_total_amount,
      }));
    });
  }

  return results.map((order) => ({
    ...order,
    order_id: order.order_id || order.id,
    status: order.status || order.order_status,
    date: order.date || order.created_at,
  }));
}

async function loadScopedOrders(productId, variantId) {
  const collected = [];
  let reportedCount = 0;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await vendorService.getOrders({
      product_id: variantId ? undefined : productId,
      variant_id: variantId || undefined,
      page,
      page_size: PAGE_SIZE,
    });
    const parsed = parseOrdersListResponse(response);
    reportedCount = parsed.count || reportedCount;
    collected.push(...parsed.results);
    if (!parsed.results.length || (reportedCount > 0 && collected.length >= reportedCount)) break;
  }

  return {
    orders: groupOrderLineItems(toLineItems(collected)),
    truncated: reportedCount > collected.length,
  };
}

function itemAmount(item) {
  if (item?.total_amount != null && item.total_amount !== "") {
    const amount = Number(item.total_amount);
    if (!Number.isNaN(amount)) return amount;
  }
  const price = Number(item?.selling_price ?? item?.price ?? item?.unit_price);
  const qty = Number(item?.quantity) || 0;
  if (!Number.isNaN(price)) return price * qty;
  return 0;
}

function lineValue(order) {
  return (order.items || []).reduce((sum, item) => sum + itemAmount(item), 0);
}

function variantLabel(variant) {
  return variant?.title || variant?.vendor_sku_code || variant?.sku_code || "Variant";
}

export default function ProductVariantOrders({ productId, variants = [] }) {
  const navigate = useNavigate();
  const [variantId, setVariantId] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    setPage(1);

    loadScopedOrders(productId, variantId)
      .then((result) => {
        if (cancelled) return;
        setOrders(result.orders);
        setTruncated(result.truncated);
      })
      .catch((err) => {
        if (cancelled) return;
        setOrders([]);
        setError(err?.response?.data?.message || err.message || "Failed to load orders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, variantId, reloadKey]);

  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    ORDER_STATUS_FILTERS.forEach((filter) => {
      counts[filter.key] = 0;
    });
    orders.forEach((order) => {
      const key = String(order.status || "unknown").toLowerCase();
      if (counts[key] == null) counts[key] = 0;
      counts[key] += 1;
    });
    return counts;
  }, [orders]);

  const units = useMemo(
    () => orders.reduce((sum, order) => sum + (Number(order.quantity) || 0), 0),
    [orders]
  );
  const value = useMemo(
    () => orders.reduce((sum, order) => sum + lineValue(order), 0),
    [orders]
  );

  const filtered = useMemo(() => {
    if (status === "all") return orders;
    return orders.filter((order) => String(order.status || "unknown").toLowerCase() === status);
  }, [orders, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / CARD_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * CARD_PAGE_SIZE, safePage * CARD_PAGE_SIZE);
  const selectedVariant = variants.find((variant) => String(variant.id) === String(variantId));

  const knownKeys = new Set(ORDER_STATUS_FILTERS.map((filter) => filter.key));
  const statusTabs = [
    { key: "all", label: "All" },
    ...ORDER_STATUS_FILTERS.filter((filter) => statusCounts[filter.key] > 0),
    ...Object.keys(statusCounts)
      .filter((key) => key !== "all" && !knownKeys.has(key) && statusCounts[key] > 0)
      .map((key) => ({ key, label: formatStatusLabel(key) })),
  ];

  return (
    <div className="pvo">
      <div className="pvo-toolbar">
        <label className="pvo-filter" htmlFor="product-order-variant">
          <span>Variant</span>
          <select
            id="product-order-variant"
            value={variantId}
            onChange={(event) => {
              setVariantId(event.target.value);
              setStatus("all");
            }}
          >
            <option value="">All variants</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variantLabel(variant)}
              </option>
            ))}
          </select>
        </label>
        <p className="pvo-toolbar-note">
          {selectedVariant
            ? `Orders that include ${variantLabel(selectedVariant)}.`
            : "Orders that include any variant of this product."}
        </p>
      </div>

      {loading ? (
        <PageLoader message="Loading orders…" />
      ) : error ? (
        <PageError message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <>
          <div className="pvo-stats">
            <div className="pvo-stat">
              <span className="pvo-stat-label">Orders</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="pvo-stat">
              <span className="pvo-stat-label">Units sold</span>
              <strong>{units}</strong>
            </div>
            <div className="pvo-stat">
              <span className="pvo-stat-label">Item value</span>
              <strong>{formatCurrency(value)}</strong>
            </div>
          </div>

          {truncated ? (
            <p className="pvo-note">Showing the latest loaded orders. Older orders may not be included.</p>
          ) : null}

          <div className="pvo-tabs" role="tablist" aria-label="Filter by order status">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={status === tab.key}
                className={`pvo-tab pvo-tab--${tab.key} ${status === tab.key ? "pvo-tab--active" : ""}`}
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
              >
                {tab.label}
                <span>{statusCounts[tab.key] || 0}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <PageEmpty
              icon={orders.length === 0 ? ShoppingBag : Package}
              title={orders.length === 0 ? "No orders yet" : "No orders in this status"}
              description={
                orders.length === 0
                  ? selectedVariant
                    ? "This variant has no orders yet."
                    : "This product has no orders yet."
                  : "Choose another status to see those orders."
              }
            />
          ) : (
            <ul className="pvo-list">
              {visible.map((order) => {
                const when = formatOrderDate(order.date);
                const tone = String(order.status || "pending").toLowerCase();
                return (
                  <li key={order.order_id} className={`pvo-card pvo-card--${tone}`}>
                    <div className="pvo-card-top">
                      <div>
                        <p className="pvo-code">
                          {order.order_display_code || order.order_code || "Order"}
                        </p>
                        <p className="pvo-meta">
                          {when.date}
                          {when.time ? ` · ${when.time}` : ""}
                          {" · "}
                          {formatPaymentLabel(order.payment_type, order.payment_method)}
                        </p>
                      </div>
                      <StatusBadge status={tone} label={formatStatusLabel(order.status)} />
                    </div>
                    <ul className="pvo-lines">
                      {(order.items || []).map((item) => (
                        <li key={item.order_item_id || `${order.order_id}-${item.variant_title}-${item.sku_code}`}>
                          <span>
                            {item.variant_title || item.product_name || "Item"}
                            {item.sku_code ? ` · ${item.sku_code}` : ""}
                          </span>
                          <span>
                            ×{Number(item.quantity) || 0}
                            {" · "}
                            {formatCurrency(itemAmount(item))}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="pvo-card-foot">
                      <span>
                        {order.quantity} unit{order.quantity === 1 ? "" : "s"}
                        {" · "}
                        {formatCurrency(lineValue(order))}
                      </span>
                      <Button
                        variant="secondary"
                        className="!px-3 !py-1.5 !text-xs"
                        onClick={() => navigate(`/vendor/orders/${order.order_id}`)}
                      >
                        Open order
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {pageCount > 1 ? (
            <div className="pvo-pager">
              <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                Previous
              </Button>
              <span>
                {safePage} of {pageCount}
              </span>
              <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
