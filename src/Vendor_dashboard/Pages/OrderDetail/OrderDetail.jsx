import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardCopy,
    Cloud,
    CloudOff,
    CreditCard,
    Download,
    ExternalLink,
    MapPin,
    Package,
    RefreshCw,
    Truck,
} from "lucide-react";
import toast from "react-hot-toast";
import { vendorService } from "../../../services/vendorService";
import Ayurvedaimage from "../../../Assests/Ayurvedaimage.png";
import DashboardPageShell from "../../components/shared/DashboardPageShell";
import { PageEmpty, PageError, PageLoader } from "../../components/shared/PageState";
import StatusBadge from "../../components/shared/StatusBadge";
import Button from "../../components/shared/Button";
import {
    formatCurrency,
    formatOrderDate,
    formatPaymentLabel,
    formatStatusLabel,
} from "../Order/orderHelpers";
import { canDownloadBoxLabel, downloadBoxLabel } from "../Order/boxLabel";
import "../../components/shared/vendor-shared.css";
import "../Order/Order.css";

const FULFILLMENT_STEPS = [
    { key: "created_at", label: "Order placed", field: "created_at" },
    { key: "packed_at", label: "Packed", field: "packed_at" },
    { key: "dispatched_at", label: "Dispatched", field: "dispatched_at" },
    { key: "shipped_at", label: "Shipped", field: "shipped_at" },
    { key: "delivered_at", label: "Delivered", field: "delivered_at" },
];

const TERMINAL_STATUSES = new Set(["cancelled", "returned", "refunded"]);

const SOURCE_LABELS = {
    system: "System",
    unicommerce: "Unicommerce",
    admin: "Admin",
};

const SHIPPING_LABELS = {
    STD: "Standard",
    EXP: "Express",
    OVN: "Overnight",
};

function DetailRow({ label, children }) {
    return (
        <div className="order-detail-row">
            <dt>{label}</dt>
            <dd>{children}</dd>
        </div>
    );
}

function formatAddress(address) {
    if (!address) return "—";
    const parts = [
        address.address_line_1,
        address.address_line_2,
        address.city,
        address.state,
        address.zipcode,
        address.country,
    ].filter(Boolean);
    return parts.join(", ") || "—";
}

function formatShippingMethod(method) {
    if (!method) return "—";
    const key = String(method).toUpperCase();
    return SHIPPING_LABELS[key] || formatStatusLabel(method);
}

function statusStepLabel(status) {
    const key = String(status || "").toLowerCase();
    if (key === "created" || key === "placed" || key === "order_placed") return "Order placed";
    return formatStatusLabel(key);
}

function sourceLabel(source) {
    if (!source) return "";
    const key = String(source).toLowerCase();
    return SOURCE_LABELS[key] || formatStatusLabel(source);
}

function buildStepsFromHistory(order) {
    const history = Array.isArray(order?.status_history) ? order.status_history : [];
    const entries = history
        .filter((entry) => entry?.status)
        .slice()
        .sort((a, b) => {
            const aTime = new Date(a.created_at || 0).getTime();
            const bTime = new Date(b.created_at || 0).getTime();
            return aTime - bTime;
        });

    if (!entries.length) return null;

    const currentStatus = String(
        order.order_status || entries[entries.length - 1].status || ""
    ).toLowerCase();
    const lastHistoryStatus = String(entries[entries.length - 1].status || "").toLowerCase();

    const steps = entries.map((entry, index) => {
        const status = String(entry.status || "").toLowerCase();
        return {
            key: entry.id || `${status}-${entry.created_at || index}`,
            label: statusStepLabel(status),
            timestamp: entry.created_at,
            note: entry.note || "",
            source: sourceLabel(entry.source),
            done: true,
            isCurrent: index === entries.length - 1 && status === currentStatus,
            alert: TERMINAL_STATUSES.has(status),
        };
    });

    if (currentStatus && currentStatus !== lastHistoryStatus) {
        const previous = steps[steps.length - 1];
        if (previous) previous.isCurrent = false;
        steps.push({
            key: `current-${currentStatus}`,
            label: statusStepLabel(currentStatus),
            timestamp: null,
            note: "",
            source: "",
            done: false,
            isCurrent: true,
            alert: TERMINAL_STATUSES.has(currentStatus),
        });
    }

    return steps;
}

const AMOUNT_KEY_LABELS = {
    items_total: "Items total",
    items_subtotal: "Items subtotal",
    subtotal: "Subtotal",
    discount: "Coupon discount",
    delivery_charges: "Delivery charges",
    shipping_charges: "Delivery charges",
    cod_charges: "COD charges",
    tax_amount: "Tax",
    gst_amount: "GST",
    product_gst: "Product GST",
    platform_fee: "Platform fee",
    other_charges: "Other charges",
    additional_charges: "Additional charges",
    prepaid_amount: "Prepaid amount",
    total_amount: "Order total",
};

const AMOUNT_KEY_ALIASES = {
    items_subtotal: ["items_total", "subtotal"],
    items_total: ["items_subtotal", "subtotal"],
    subtotal: ["items_subtotal", "items_total"],
    product_gst: ["gst_amount"],
    gst_amount: ["product_gst"],
    delivery_charges: ["shipping_charges"],
    shipping_charges: ["delivery_charges"],
};

function amountLabel(key, fallback) {
    if (fallback) return fallback;
    return AMOUNT_KEY_LABELS[key] || formatStatusLabel(key);
}

function isRenderableAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0;
}

function getAmountBreakup(order) {
    const breakup = order?.amount_breakup;
    if (!breakup || typeof breakup !== "object") {
        return { rows: [], total: order?.total_amount };
    }

    const lines = Array.isArray(breakup.lines) ? breakup.lines : [];
    const covered = new Set(["currency", "lines", "total_amount"]);
    const rows = [];

    const markCovered = (key) => {
        if (!key) return;
        covered.add(key);
        (AMOUNT_KEY_ALIASES[key] || []).forEach((alias) => covered.add(alias));
    };

    lines.forEach((line, index) => {
        if(line?.key === "coupon_discount"){
            return;
        }
        if (!isRenderableAmount(line?.amount)) return;
        const key = String(line.key || `line-${index}`);
        markCovered(key);
        rows.push({
            key,
            label: amountLabel(key, line.label),
            amount: Number(line.amount),
            effect: line.effect === "subtract" ? "subtract" : "add",
        });
    });

    Object.entries(breakup).forEach(([key, value]) => {
        if (covered.has(key) || !isRenderableAmount(value)) return;
        markCovered(key);
        rows.push({
            key,
            label: amountLabel(key),
            amount: Number(value),
            effect: key === "discount" ? "subtract" : "add",
        });
    });

    return {
        rows,
        total: isRenderableAmount(breakup.total_amount)
            ? Number(breakup.total_amount)
            : order?.total_amount,
    };
}

function formatBreakupAmount(amount, effect) {
    const formatted = formatCurrency(amount);
    return effect === "subtract" ? `−${formatted}` : formatted;
}

function syncBadgeProps(syncStatus) {
    const status = String(syncStatus || "").toLowerCase();
    if (status === "failed") {
        return { status: "sync-failed", label: "Sync failed" };
    }
    if (status === "success" || status === "synced") {
        return { status: "success", label: "Synced" };
    }
    if (status === "pending" || status === "awaiting") {
        return { status: "awaiting-sync", label: "Awaiting sync" };
    }
    return {
        status: status || "inactive",
        label: formatStatusLabel(syncStatus) || "—",
    };
}

function CopyButton({ value, label = "Copy" }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            /* ignore */
        }
    };

    return (
        <button
            type="button"
            className="order-copy-btn"
            onClick={handleCopy}
            title={label}
            aria-label={label}
        >
            {copied ? <CheckCircle2 size={14} /> : <ClipboardCopy size={14} />}
            <span>{copied ? "Copied" : label}</span>
        </button>
    );
}

function MetaStat({ icon: Icon, label, value, hint }) {
    return (
        <div className="order-meta-stat">
            <div className="order-meta-stat-icon">
                <Icon size={16} />
            </div>
            <div className="min-w-0">
                <p className="order-meta-stat-label">{label}</p>
                <p className="order-meta-stat-value truncate">{value}</p>
                {hint ? <p className="order-meta-stat-hint">{hint}</p> : null}
            </div>
        </div>
    );
}

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadOrder = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError("");
        try {
            const response = await vendorService.getOrder(id);
            setOrder(response?.data?.data || null);
        } catch (err) {
            setOrder(null);
            setError(err?.response?.data?.message || err.message || "Failed to load order");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    const { date, time } = formatOrderDate(order?.created_at);
    const items = order?.items || [];
    const itemCount = items.length;
    const totalQty = useMemo(
        () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
        [items]
    );

    const fulfillmentSteps = useMemo(() => {
        if (!order) return [];

        const fromHistory = buildStepsFromHistory(order);
        if (fromHistory) return fromHistory;

        const status = String(order.order_status || "").toLowerCase();
        const cancelled = status === "cancelled" || status === "returned";
        const lastDoneIndex = FULFILLMENT_STEPS.reduce(
            (acc, step, index) => (order[step.field] ? index : acc),
            -1
        );

        return FULFILLMENT_STEPS.map((step, index) => {
            const timestamp = order[step.field];
            const done = Boolean(timestamp);
            const isCurrent = !cancelled && !done && index === lastDoneIndex + 1;

            return {
                ...step,
                timestamp,
                note: "",
                source: "",
                done,
                isCurrent,
                alert: false,
            };
        });
    }, [order]);

    const paymentPaidAt = formatOrderDate(order?.payment?.paid_at);
    const amountBreakup = useMemo(() => getAmountBreakup(order), [order]);
    const syncProps = syncBadgeProps(order?.unicommerce_sync_status);
    const syncFailed =
        String(order?.unicommerce_sync_status || "").toLowerCase() === "failed";
    const SyncIcon = syncFailed ? CloudOff : Cloud;
    const labelReady = canDownloadBoxLabel(order);

    const handleDownloadLabel = () => {
        if (!order || !labelReady) return;
        const result = downloadBoxLabel(order);
        if (result === "downloaded") {
            toast.success("Box label downloaded. Open it and print it for the package.");
        }
    };

    return (
        <DashboardPageShell
            title="Order"
            accent="Detail"
            subtitle={order?.order_display_code || order?.order_code || "Vendor order details"}
            breadcrumbs={[
                { label: "Orders", href: "/vendor/orders" },
                { label: order?.order_display_code || order?.order_code || "Detail" },
            ]}
            contentClassName="vendor-page-content order-page-content"
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => navigate("/vendor/orders")}
                        className="!text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={loadOrder}
                        disabled={loading}
                        className="!text-sm"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : undefined} />
                        Refresh
                    </Button>
                    {order ? (
                        <Button
                            onClick={handleDownloadLabel}
                            disabled={!labelReady}
                            className="!text-sm"
                            title="Print this invoice and stick it on top of the product box at delivery"
                        >
                            <Download size={16} />
                            Download invoice
                        </Button>
                    ) : null}
                </div>
            }
        >
            {loading ? (
                <PageLoader message="Loading order…" />
            ) : error ? (
                <PageError message={error} onRetry={loadOrder} />
            ) : !order ? (
                <PageEmpty
                    icon={Package}
                    title="Order not found"
                    description="This order may not include any of your products."
                    action={
                        <Button onClick={() => navigate("/vendor/orders")}>Back to Orders</Button>
                    }
                />
            ) : (
                <div className="order-detail-layout ds-stagger">
                    <section className="ds-card order-detail-hero">
                        <div className="order-detail-hero-top">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        {order.order_display_code || order.order_code}
                                    </h2>
                                    <StatusBadge
                                        status={order.order_status}
                                        label={formatStatusLabel(order.order_status)}
                                    />
                                    {order.payment?.status ? (
                                        <StatusBadge
                                            status={order.payment.status}
                                            label={`Payment ${formatStatusLabel(order.payment.status)}`}
                                        />
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                    <span className="font-mono text-gray-600">{order.order_code}</span>
                                    <CopyButton value={order.order_code} label="Copy code" />
                                    {date !== "—" ? (
                                        <span>
                                            · Placed {date}
                                            {time ? ` at ${time}` : ""}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="order-detail-hero-amount">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Your subtotal
                                </p>
                                <p className="text-2xl font-bold text-[#0D614E] mt-0.5">
                                    {formatCurrency(order.vendor_items_subtotal)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Order total {formatCurrency(order.total_amount)}
                                </p>
                            </div>
                        </div>

                        <div className="order-meta-grid">
                            <MetaStat
                                icon={Package}
                                label="Your items"
                                value={`${itemCount} item${itemCount === 1 ? "" : "s"}`}
                                hint={`${totalQty} unit${totalQty === 1 ? "" : "s"}`}
                            />
                            <MetaStat
                                icon={CreditCard}
                                label="Payment"
                                value={formatPaymentLabel(order.payment_type, order.payment_method)}
                                hint={
                                    order.payment?.status
                                        ? formatStatusLabel(order.payment.status)
                                        : undefined
                                }
                            />
                            <MetaStat
                                icon={Truck}
                                label="Shipping"
                                value={formatShippingMethod(order.shipping_method)}
                                hint={
                                    order.tracking_number
                                        ? `Tracking ${order.tracking_number}`
                                        : "Awaiting dispatch"
                                }
                            />
                            <MetaStat
                                icon={SyncIcon}
                                label="Unicommerce"
                                value={syncProps.label}
                                hint={
                                    order.unicommerce_sale_order_code ||
                                    (syncFailed ? "Needs attention" : undefined)
                                }
                            />
                        </div>
                    </section>

                    {syncFailed ? (
                        <div className="order-sync-alert" role="status">
                            <CloudOff size={16} />
                            <div>
                                <p className="font-semibold">Unicommerce sync failed</p>
                                <p>
                                    This order has not been pushed to Unicommerce yet. Fulfillment
                                    may be delayed until sync succeeds.
                                </p>
                            </div>
                            <StatusBadge {...syncProps} />
                        </div>
                    ) : null}

                    <div className="order-detail-grid">
                        <div className="space-y-4">
                            <div className="ds-card order-detail-section">
                                <div className="flex items-center justify-between gap-3 mb-1">
                                    <h3>Your items</h3>
                                    <span className="text-xs text-gray-400">
                                        {itemCount} line{itemCount === 1 ? "" : "s"}
                                    </span>
                                </div>

                                {items.length === 0 ? (
                                    <p className="text-sm text-gray-500">No items for this vendor.</p>
                                ) : (
                                    <div className="order-item-list">
                                        {items.map((item) => {
                                            const variant = item.variant || {};
                                            const mrp = Number(variant.mrp);
                                            const selling = Number(
                                                item.selling_price ?? variant.selling_price
                                            );
                                            const showMrp =
                                                !Number.isNaN(mrp) &&
                                                !Number.isNaN(selling) &&
                                                mrp > selling;

                                            return (
                                                <div key={item.id} className="order-item-card">
                                                    <img
                                                        src={variant.image_url || Ayurvedaimage}
                                                        alt=""
                                                        className="order-item-thumb"
                                                        onError={(e) => {
                                                            e.currentTarget.src = Ayurvedaimage;
                                                        }}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-800">
                                                                    {variant.variant_title ||
                                                                        "Variant"}
                                                                </p>
                                                                <p className="text-sm text-gray-500 mt-0.5">
                                                                    {[
                                                                        variant.brand_name,
                                                                        variant.size,
                                                                        item.sku_code,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(" · ") || "—"}
                                                                </p>
                                                            </div>
                                                            <p className="font-semibold text-[#0D614E] whitespace-nowrap">
                                                                {formatCurrency(item.total_price)}
                                                            </p>
                                                        </div>

                                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                                            <span>Qty {item.quantity}</span>
                                                            <span>
                                                                {formatCurrency(item.selling_price)}{" "}
                                                                each
                                                            </span>
                                                            {showMrp ? (
                                                                <span className="text-gray-400 line-through">
                                                                    MRP {formatCurrency(mrp)}
                                                                </span>
                                                            ) : null}
                                                            {item.gift_wrap ? (
                                                                <span className="text-[#0D614E] font-medium">
                                                                    Gift wrap
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="ds-card order-detail-section">
                                <h3>Fulfillment timeline</h3>
                                <ol className="order-fulfillment-timeline">
                                    {fulfillmentSteps.map((step) => {
                                        const stamp = formatOrderDate(step.timestamp);
                                        const stateClass = step.alert
                                            ? "is-alert"
                                            : step.isCurrent
                                                ? "is-current"
                                                : step.done
                                                    ? "is-done"
                                                    : "is-pending";
                                        const when = step.timestamp
                                            ? `${stamp.date}${stamp.time ? ` · ${stamp.time}` : ""}`
                                            : step.isCurrent
                                                ? "In progress"
                                                : "Pending";
                                        const meta = [when, step.source].filter(Boolean).join(" · ");
                                        return (
                                            <li
                                                key={step.key}
                                                className={`order-fulfillment-step ${stateClass}`}
                                            >
                                                <span className="order-fulfillment-dot" aria-hidden />
                                                <div className="min-w-0">
                                                    <p className="order-fulfillment-title">
                                                        {step.label}
                                                        {step.isCurrent ? (
                                                            <span className="order-fulfillment-current">
                                                                Current
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                    <p className="order-fulfillment-time">{meta}</p>
                                                    {step.note ? (
                                                        <p className="order-fulfillment-note">{step.note}</p>
                                                    ) : null}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                                {String(order.order_status || "").toLowerCase() === "cancelled" &&
                                !fulfillmentSteps.some((step) => step.alert) ? (
                                    <p className="mt-3 text-sm text-red-600">
                                        This order was cancelled.
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="ds-card order-detail-section">
                                <h3>Order summary</h3>
                                <DetailRow label="Status">
                                    <StatusBadge
                                        status={order.order_status}
                                        label={formatStatusLabel(order.order_status)}
                                    />
                                </DetailRow>
                                {amountBreakup.rows.map((row) => {
                                    if (row?.amount > 0)
                                        return (
                                            <DetailRow key={row.key} label={row.label}>
                                                <span
                                                    className={
                                                        row.key === "items_subtotal" ||
                                                            row.key === "items_total"
                                                            ? "text-[#0D614E] font-semibold"
                                                            : undefined
                                                    }
                                                >
                                                    {formatBreakupAmount(row.amount, row.effect)}
                                                </span>
                                            </DetailRow>
                                        );
                                })}
                                <DetailRow label="Order total">
                                    <span className="font-semibold">
                                        {formatCurrency(amountBreakup.total)}
                                    </span>
                                </DetailRow>
                            </div>

                            <div className="ds-card order-detail-section">
                                <h3 className="inline-flex items-center gap-2">
                                    <CreditCard size={14} />
                                    Payment
                                </h3>
                                <DetailRow label="Method">
                                    {formatPaymentLabel(order.payment_type, order.payment_method)}
                                </DetailRow>
                                {order.payment?.status ? (
                                    <DetailRow label="Status">
                                        <StatusBadge
                                            status={order.payment.status}
                                            label={formatStatusLabel(order.payment.status)}
                                        />
                                    </DetailRow>
                                ) : null}
                                {order.payment?.amount != null ? (
                                    <DetailRow label="Amount paid">
                                        {formatCurrency(order.payment.amount)}
                                    </DetailRow>
                                ) : null}
                                {paymentPaidAt.date !== "—" ? (
                                    <DetailRow label="Paid on">
                                        {paymentPaidAt.date}
                                        {paymentPaidAt.time ? ` · ${paymentPaidAt.time}` : ""}
                                    </DetailRow>
                                ) : null}
                                {order.payment?.razorpay_payment_id ? (
                                    <DetailRow label="Payment ID">
                                        <span className="order-mono-value">
                                            {order.payment.razorpay_payment_id}
                                        </span>
                                    </DetailRow>
                                ) : null}
                                {order.payment?.failure_reason ? (
                                    <DetailRow label="Failure">
                                        <span className="text-red-600">
                                            {order.payment.failure_reason}
                                        </span>
                                    </DetailRow>
                                ) : null}
                            </div>

                            <div className="ds-card order-detail-section">
                                <h3 className="inline-flex items-center gap-2">
                                    <Truck size={14} />
                                    Shipping
                                </h3>
                                <DetailRow label="Method">
                                    {formatShippingMethod(order.shipping_method)}
                                </DetailRow>
                                <DetailRow label="Courier">
                                    {order.courier_name || "—"}
                                </DetailRow>
                                <DetailRow label="Invoice">
                                    {order.unicommerce_invoice_display_code || "Not issued yet"}
                                </DetailRow>
                                <DetailRow label="Tracking">
                                    {order.tracking_number ? (
                                        <span className="inline-flex items-center gap-2">
                                            <span className="order-mono-value">
                                                {order.tracking_number}
                                            </span>
                                            <CopyButton
                                                value={order.tracking_number}
                                                label="Copy"
                                            />
                                        </span>
                                    ) : (
                                        "Not assigned yet"
                                    )}
                                </DetailRow>
                                {order.tracking_url ? (
                                    <a
                                        href={order.tracking_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="order-tracking-link"
                                    >
                                        Track shipment
                                        <ExternalLink size={14} />
                                    </a>
                                ) : null}
                                <div className="mt-4 rounded-lg border border-[#0D614E]/15 bg-[#0D614E]/5 p-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                        Box top label
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Download the invoice and stick it on top of the product
                                        box before delivery.
                                    </p>
                                    <Button
                                        onClick={handleDownloadLabel}
                                        disabled={!labelReady}
                                        className="mt-3 !text-sm"
                                    >
                                        <Download size={16} />
                                        Download invoice
                                    </Button>
                                    {!labelReady ? (
                                        <p className="text-xs text-gray-400 mt-2">
                                            Available after the order is packed and the invoice is
                                            issued.
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="ds-card order-detail-section">
                                <h3 className="inline-flex items-center gap-2">
                                    <MapPin size={14} />
                                    Delivery address
                                </h3>
                                {order.delivery_address ? (
                                    <div className="order-address-block">
                                        {order.delivery_address.address_type ? (
                                            <span className="order-address-type">
                                                {order.delivery_address.address_type}
                                            </span>
                                        ) : null}
                                        <p className="text-sm text-gray-800 leading-relaxed mt-2">
                                            {formatAddress(order.delivery_address)}
                                        </p>
                                        <div className="order-address-grid">
                                            {order.delivery_address.city ? (
                                                <span>
                                                    <em>City</em>
                                                    {order.delivery_address.city}
                                                </span>
                                            ) : null}
                                            {order.delivery_address.state ? (
                                                <span>
                                                    <em>State</em>
                                                    {order.delivery_address.state}
                                                </span>
                                            ) : null}
                                            {order.delivery_address.zipcode ? (
                                                <span>
                                                    <em>PIN</em>
                                                    {order.delivery_address.zipcode}
                                                </span>
                                            ) : null}
                                            {order.delivery_address.country ? (
                                                <span>
                                                    <em>Country</em>
                                                    {order.delivery_address.country}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No delivery address.</p>
                                )}
                            </div>

                            <div className="ds-card order-detail-section">
                                <h3>Channel sync</h3>
                                <DetailRow label="Unicommerce">
                                    <StatusBadge {...syncProps} />
                                </DetailRow>
                                <DetailRow label="Sale order">
                                    {order.unicommerce_sale_order_code || "—"}
                                </DetailRow>
                            </div>

                            <Link
                                to="/vendor/orders"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0D614E] hover:text-[#094c3d]"
                            >
                                <ArrowLeft size={14} />
                                Back to all orders
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </DashboardPageShell>
    );
}
