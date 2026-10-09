import {
    canUpdateVariantQuantity,
    getVariantCoverImageUrl,
    isVariantApproved,
} from "../../../utils/unicommerceHelpers";

/**
 * Backend stock-management intent (verified from inventory + vendors apps):
 * - PATCH /inventory/{id}/ does not validate approval_status (API accepts pending variants).
 * - update_vendor_inventory_quantity saves locally; Unicommerce sync runs only when
 *   variant.approval_status === "approved" (inventory/services/unicommerce_sync.py).
 * - Sellable/catalog flows (cart, orders, customer browse) require approved variants.
 * - Admin approval triggers Unicommerce inventory sync (vendors/views AdminVariantReview).
 * - Variant cannot be set lifecycle-active until approved (AdminVariantLifecycleStatusUpdateSerializer).
 *
 * Operational stock management is therefore intended only for approved variants.
 * Pending/rejected variants may hold a quantity from product creation but should not
 * be updated via Stock Management until admin approval.
 */

export const LOW_STOCK_THRESHOLD = 10;

export const STOCK_FILTERS = [
    { key: "all", label: "All records" },
    { key: "instock", label: "In stock" },
    { key: "low-stock", label: "Low stock" },
    { key: "out-of-stock", label: "Out of stock" },
    { key: "pending", label: "Pending approval" },
];

export const KPI_FILTER_MAP = {
    records: "all",
    low: "low-stock",
    out: "out-of-stock",
    pending: "pending",
};

export function normalizeVariantId(value) {
    if (value == null || value === "") return "";
    return String(value).trim().toLowerCase();
}

/** Same rule used across Products, Inventory, and Stock Management UI. */
export function canManageStock(item) {
    return canUpdateVariantQuantity(item);
}

export function buildVariantApprovalMap(products = []) {
    const map = {};
    products.forEach((product) => {
        (product.variants || []).forEach((variant) => {
            const key = normalizeVariantId(variant?.id);
            if (key) {
                map[key] = variant.approval_status || "pending";
            }
        });
    });
    return map;
}

/** Map variant_id → cover image URL from product list. */
export function buildVariantCoverImageMap(products = []) {
    const map = {};
    products.forEach((product) => {
        (product.variants || []).forEach((variant) => {
            const key = normalizeVariantId(variant?.id);
            const url = getVariantCoverImageUrl(variant);
            if (key && url) {
                map[key] = url;
            }
        });
    });
    return map;
}

export function registerVariantApproval(map, variant) {
    const key = normalizeVariantId(variant?.id);
    if (!key) return map;
    return { ...map, [key]: variant.approval_status || "pending" };
}

export function enrichInventoryRows(results = [], approvalByVariantId = {}, coverByVariantId = {}) {
    return results.map((item) => {
        const key = normalizeVariantId(item.variant_id);
        const coverUrl =
            coverByVariantId[key] ||
            getVariantCoverImageUrl(item) ||
            item.cover_image?.media_url ||
            null;
        return {
            ...item,
            approval_status: approvalByVariantId[key] || item.approval_status || "pending",
            cover_image_url: coverUrl,
        };
    });
}

/**
 * Resolve approval_status from backend for inventory rows missing from the product list map.
 * Uses GET /vendors/product/?id=&variant_id= (returns VariantReadSerializer).
 */
export async function enrichInventoryWithApproval(
    inventoryRows,
    productList,
    vendorService,
    { verifyLive = false } = {}
) {
    let approvalMap = buildVariantApprovalMap(productList);
    let coverMap = buildVariantCoverImageMap(productList);
    const resolved = await resolveMissingVariantDetails(inventoryRows, approvalMap, coverMap, vendorService);
    approvalMap = resolved.approvalMap;
    coverMap = resolved.coverMap;
    let rows = enrichInventoryRows(inventoryRows, approvalMap, coverMap);
    if (verifyLive) {
        rows = await verifyInventoryRowApprovals(rows, vendorService);
    }
    return rows;
}

/**
 * Fetch variant detail once for rows missing approval and/or cover image.
 * Uses GET /vendors/product/?id=&variant_id=
 */
export async function resolveMissingVariantDetails(
    inventoryRows,
    approvalMap,
    coverMap,
    vendorService
) {
    let nextApproval = { ...approvalMap };
    let nextCover = { ...coverMap };

    const missing = inventoryRows.filter((row) => {
        const key = normalizeVariantId(row.variant_id);
        if (!key) return false;
        const needsApproval = nextApproval[key] == null;
        const needsCover = !nextCover[key] && !getVariantCoverImageUrl(row) && !row.cover_image?.media_url;
        return needsApproval || needsCover;
    });

    if (!missing.length) {
        return { approvalMap: nextApproval, coverMap: nextCover };
    }

    const seen = new Set();
    await Promise.all(
        missing.map(async (row) => {
            const variantKey = normalizeVariantId(row.variant_id);
            if (!variantKey || seen.has(variantKey)) return;
            seen.add(variantKey);

            try {
                const response = await vendorService.getSingleProduct(row.product_id, row.variant_id);
                const variant = response?.data?.data;
                if (variant?.id) {
                    nextApproval = registerVariantApproval(nextApproval, variant);
                    const url = getVariantCoverImageUrl(variant);
                    if (url) nextCover[variantKey] = url;
                } else if (nextApproval[variantKey] == null) {
                    nextApproval[variantKey] = "pending";
                }
            } catch {
                if (nextApproval[variantKey] == null) {
                    nextApproval[variantKey] = "pending";
                }
            }
        })
    );

    return { approvalMap: nextApproval, coverMap: nextCover };
}

export async function resolveMissingVariantApprovals(inventoryRows, approvalMap, vendorService) {
    const { approvalMap: next } = await resolveMissingVariantDetails(
        inventoryRows,
        approvalMap,
        {},
        vendorService
    );
    return next;
}

/** Authoritative pre-save check against backend variant record. */
export async function fetchVariantApprovalStatus(productId, variantId, vendorService) {
    const response = await vendorService.getSingleProduct(productId, variantId);
    const variant = response?.data?.data;
    return variant?.approval_status || "pending";
}

export function getStockHealthKey(quantity) {
    const qty = Number(quantity) || 0;
    if (qty <= 0) return "out-of-stock";
    if (qty <= LOW_STOCK_THRESHOLD) return "low-stock";
    return "instock";
}

/** Card outer-border accent — priority: approval/sync lock states, then stock health. */
export function getProductCardAccent(item) {
    if (!item) return "instock";

    const approval = String(item.approval_status || "pending").toLowerCase();
    const syncStatus = String(item.sync_status || "").toLowerCase().replace(/_/g, "-");

    if (!canManageStock(item)) {
        if (approval === "pending") return "pending-approval";
        return "locked";
    }

    if (syncStatus === "failed" || syncStatus === "sync-failed") return "sync-failed";
    if (syncStatus === "awaiting" || syncStatus === "awaiting-sync" || syncStatus === "pending-sync") {
        return "awaiting-sync";
    }

    return getStockHealthKey(item.quantity);
}

export const STOCK_HEALTH_LABELS = {
    instock: "In stock",
    "low-stock": "Low stock",
    "out-of-stock": "Out of stock",
    "pending-approval": "Pending approval",
    "awaiting-sync": "Awaiting sync",
    "sync-failed": "Sync failed",
    locked: "Locked",
};

export function computeInventorySummary(items = []) {
    return {
        totalRecords: items.length,
        totalUnits: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        lowStock: items.filter((item) => item.quantity > 0 && item.quantity <= LOW_STOCK_THRESHOLD).length,
        outOfStock: items.filter((item) => item.quantity <= 0).length,
        pendingApproval: items.filter((item) => !isVariantApproved(item)).length,
    };
}

export function computeFilterCounts(items = []) {
    const counts = { all: items.length, instock: 0, "low-stock": 0, "out-of-stock": 0, pending: 0 };
    items.forEach((item) => {
        const health = getStockHealthKey(item.quantity || 0);
        if (health === "instock") counts.instock += 1;
        if (health === "low-stock") counts["low-stock"] += 1;
        if (health === "out-of-stock") counts["out-of-stock"] += 1;
        if (!isVariantApproved(item)) counts.pending += 1;
    });
    return counts;
}

export function filterInventoryItems(items, stockFilter) {
    if (stockFilter === "all") return items;
    if (stockFilter === "pending") return items.filter((item) => !isVariantApproved(item));
    return items.filter((item) => getStockHealthKey(item.quantity || 0) === stockFilter);
}

export function formatDateTime(value) {
    if (!value) return { date: "—", time: "" };
    const parsed = new Date(value);
    return {
        date: parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
        time: parsed.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    };
}

export function parseInventoryListResponse(response) {
    const data = response?.data?.data;
    return {
        results: data?.results || [],
        count: data?.count || 0,
    };
}

export function parseProductListResponse(response) {
    const data = response?.data?.data;
    const list = data?.results || data || [];
    return Array.isArray(list) ? list : [];
}

/** Load the full vendor catalog so variant approval_status is complete (not just first page). */
export async function fetchAllVendorProducts(vendorService, pageSize = 100000) {
    let page = 1;
    let all = [];
    let total = Infinity;

    while (all.length < total) {
        const response = await vendorService.getProducts({ page, page_size: pageSize });
        const data = response?.data?.data;
        const results = parseProductListResponse(response);
        total = typeof data?.count === "number" ? data.count : results.length;
        if (!results.length) break;
        all = all.concat(results);
        if (results.length < pageSize || all.length >= total) break;
        page += 1;
    }

    return all;
}

/**
 * Authoritative approval_status for visible inventory rows (GET variant by id).
 * Used for action gating on the current page; inventory API does not return approval_status.
 */
export async function verifyInventoryRowApprovals(rows = [], vendorService) {
    if (!rows.length) return rows;

    return Promise.all(
        rows.map(async (row) => {
            if (!row?.product_id || !row?.variant_id) {
                return { ...row, approval_status: "pending" };
            }

            try {
                const approval_status = await fetchVariantApprovalStatus(
                    row.product_id,
                    row.variant_id,
                    vendorService
                );
                return { ...row, approval_status };
            } catch {
                return { ...row, approval_status: row.approval_status || "pending" };
            }
        })
    );
}
