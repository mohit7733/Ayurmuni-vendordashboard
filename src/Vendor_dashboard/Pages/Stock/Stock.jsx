import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
    AlertTriangle,
    Cloud,
    CloudOff,
    IndianRupee,
    Lock,
    Package,
    Pencil,
    RefreshCw,
    TrendingDown,
    Warehouse,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { vendorService } from "../../../services/vendorService";
import usePersistedState from "../../hooks/usePersistedState";
import DashboardPageShell from "../../components/shared/DashboardPageShell";
import { PageEmpty, PageError, PaginationBar, TableCard } from "../../components/shared/PageState";
import { MetricSkeleton, TableSkeleton } from "../../components/shared/Skeleton";
import StatusBadge from "../../components/shared/StatusBadge";
import SearchToolbar, { SelectFilter } from "../../components/shared/SearchToolbar";
import Modal from "../../components/shared/Modal";
import Button from "../../components/shared/Button";
import DataTable, { TableRow, TableCell } from "../../components/shared/DataTable";
import PremiumKPICard from "../Dashboard/components/PremiumKPICard";
import { formatCurrency } from "../Order/orderHelpers";
import Ayurvedaimage from "../../../Assests/Ayurvedaimage.png";
import {
    extractApiErrorMessage,
    getVariantCoverImageUrl,
    isUnicommerceSyncError,
    isApprovalRelatedStockError,
    isVariantApproved,
    STOCK_APPROVAL_BLOCKED,
} from "../../../utils/unicommerceHelpers";
import {
    LOW_STOCK_THRESHOLD,
    STOCK_FILTERS,
    KPI_FILTER_MAP,
    EMPTY_INVENTORY_SUMMARY,
    EMPTY_INVENTORY_FILTERS,
    buildApiFilterCounts,
    toApiStockFilter,
    clampInventoryPageSize,
    formatDateTime,
    getStockHealthKey,
    STOCK_HEALTH_LABELS,
    parseInventoryListResponse,
    canManageStock,
    fetchAllVendorProducts,
    enrichInventoryWithApproval,
    fetchVariantApprovalStatus,
} from "./stockHelpers";
import "../../components/shared/vendor-shared.css";
import "./Stock.css";

const QTY_PRESETS = [10, 25, 50, 100];

const COLUMNS = [
    { key: "product", label: "Product" },
    { key: "status", label: "Status" },
    { key: "qty", label: "Quantity" },
    { key: "approval", label: "Approval" },
    { key: "sync", label: "Sync" },
    { key: "sku", label: "Vendor SKU" },
    { key: "actions", label: "Actions" },
];

function SyncBadge({ item }) {
    const approved = isVariantApproved(item);
    return approved ? (
        <span className="stock-sync-badge stock-sync-badge--live" title="Updates sync to Unicommerce">
            <Cloud size={12} aria-hidden />
            Unicommerce
        </span>
    ) : (
        <span className="stock-sync-badge stock-sync-badge--pending" title="Awaiting admin approval before sync">
            <CloudOff size={12} aria-hidden />
            Awaiting approval
        </span>
    );
}

function QuantityUnavailableModal({ item, open, onClose, onViewProduct }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={STOCK_APPROVAL_BLOCKED.title}
            subtitle={
                item ? `${item.product_name} · ${item.variant_title || "Default variant"}` : undefined
            }
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onViewProduct}>
                        View Product Status
                    </Button>
                    <Button onClick={onClose}>Got it</Button>
                </>
            }
        >
            <p className="text-sm text-gray-600 leading-relaxed">{STOCK_APPROVAL_BLOCKED.description}</p>
        </Modal>
    );
}

function StockKpiSection({ summary, recordCount, summaryLoading, hasActiveQuery, onFilterSelect }) {
    if (summaryLoading) {
        return <MetricSkeleton count={5} />;
    }

    const lowStock = Number(summary.low_stock) || 0;
    const outOfStock = Number(summary.out_of_stock) || 0;
    const pendingApproval = Number(summary.pending_approval) || 0;

    return (
        <div className="stock-kpi-grid ds-stagger">
            <PremiumKPICard
                variant="hero"
                icon={Warehouse}
                label={hasActiveQuery ? "Matching records" : "Inventory records"}
                value={recordCount}
                subtitle={hasActiveQuery ? "Current search / product" : "Total in your catalog"}
                className="stock-kpi-clickable"
                onAction={() => onFilterSelect("all")}
                actionLabel="View all"
            />
            <PremiumKPICard
                variant="soft"
                icon={IndianRupee}
                label="Inventory value"
                value={formatCurrency(summary.total_value)}
                subtitle="From inventory summary"
            />
            <PremiumKPICard
                variant={lowStock > 0 ? "alert" : "soft"}
                icon={TrendingDown}
                label="Low stock"
                value={lowStock}
                subtitle={`≤ ${LOW_STOCK_THRESHOLD} units`}
                trend={lowStock > 0 ? "Needs attention" : "Healthy levels"}
                trendDirection={lowStock > 0 ? "down" : "up"}
                className="stock-kpi-clickable"
                onAction={lowStock > 0 ? () => onFilterSelect("low-stock") : undefined}
                actionLabel="Review"
            />
            <PremiumKPICard
                variant={outOfStock > 0 ? "alert" : "muted"}
                icon={AlertTriangle}
                label="Out of stock"
                value={outOfStock}
                subtitle="Zero units on hand"
                trend={outOfStock > 0 ? "Restock needed" : "None flagged"}
                trendDirection={outOfStock > 0 ? "down" : "up"}
                className="stock-kpi-clickable"
                onAction={outOfStock > 0 ? () => onFilterSelect("out-of-stock") : undefined}
                actionLabel="Review"
            />
            <PremiumKPICard
                variant="accent"
                icon={Package}
                label="Pending approval"
                value={pendingApproval}
                subtitle="Updates locked until approved"
                className="stock-kpi-clickable"
                onAction={pendingApproval > 0 ? () => onFilterSelect("pending") : undefined}
                actionLabel="Review"
            />
        </div>
    );
}

function StockTableRow({ item, onEdit, onDelete, onBlocked }) {
    const health = getStockHealthKey(item.quantity);
    const { date, time } = formatDateTime(item.updated_at);
    const canEdit = canManageStock(item);
    const coverUrl =
        item.cover_image_url ||
        getVariantCoverImageUrl(item) ||
        item.cover_image?.media_url ||
        Ayurvedaimage;

    return (
        <TableRow>
            <TableCell>
                <div className="stock-product-cell">
                    <img
                        src={coverUrl}
                        alt=""
                        className="stock-product-thumb"
                        onError={(e) => {
                            e.currentTarget.src = Ayurvedaimage;
                        }}
                    />
                    <div className="stock-product-meta">
                        <div className="stock-product-name">{item.product_name}</div>
                        <div className="stock-product-variant">
                            {item.variant_title || "Default variant"}
                        </div>
                        <div className="stock-product-updated">
                            Updated {date}
                            {time ? ` · ${time}` : ""}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <StatusBadge status={health} label={STOCK_HEALTH_LABELS[health]} />
            </TableCell>
            <TableCell className="font-semibold tabular-nums">{item.quantity ?? 0}</TableCell>
            <TableCell>
                <StatusBadge status={item.approval_status || "pending"} />
            </TableCell>
            <TableCell>
                <SyncBadge item={item} />
            </TableCell>
            <TableCell>
                <code className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                    {item.vendor_sku_code || "—"}
                </code>
            </TableCell>
            <TableCell>
                <div className="stock-row-actions" onClick={(e) => e.stopPropagation()}>
                    {item?.status === "inactive" ? (
                            <Button
                                variant="ghost"
                                className="!px-2.5 !py-1.5 !text-xs !text-gray-500 !border-gray-300 hover:!bg-gray-50"
                                onClick={() => onBlocked(item)}
                                aria-label="Product inactive"
                            >
                                <Lock size={14} />
                                Inactive
                            </Button>) : canEdit ? (
                                <Button
                                    variant="ghost"
                                    className="!px-2.5 !py-1.5 !text-xs !text-[#0D614E] !border-[#0D614E]/20 hover:!bg-[#0D614E]/5"
                                    onClick={() => onEdit(item)}
                                    aria-label="Update quantity"
                                >
                                    <Pencil size={14} />
                                    Update
                                </Button>
                            ) : (
                            <Button
                                variant="ghost"
                                className="!px-2.5 !py-1.5 !text-xs !text-amber-700 !border-amber-200 hover:!bg-amber-50"
                                onClick={() => onBlocked(item)}
                                aria-label="Quantity update locked"
                            >
                                <Lock size={14} />
                                Locked
                            </Button>
                        )}
                    {/* <Button
                        variant="ghost"
                        className="!px-2.5 !py-1.5 !text-xs !text-red-600 !border-red-200 hover:!bg-red-50"
                        onClick={() => onDelete(item)}
                        aria-label="Delete inventory record"
                    >
                        <Trash2 size={14} />
                        Delete
                    </Button> */}
                </div>
            </TableCell>
        </TableRow>
    );
}

export default function StockManagement() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [apiSummary, setApiSummary] = useState(EMPTY_INVENTORY_SUMMARY);
    const [apiFilters, setApiFilters] = useState(EMPTY_INVENTORY_FILTERS);
    const [catalogCount, setCatalogCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [productFilter, setProductFilter] = useState("");
    const [stockFilter, setStockFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = usePersistedState("vendor:stock:pageSize", 10);
    const [editingItem, setEditingItem] = useState(null);
    const [editQuantity, setEditQuantity] = useState("");
    const [deletingItem, setDeletingItem] = useState(null);
    const [blockedItem, setBlockedItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [productsLoaded, setProductsLoaded] = useState(false);

    const productsCache = useRef(null);
    const productsPromiseRef = useRef(null);
    const fetchTimeoutRef = useRef(null);
    const inventoryRequestRef = useRef(0);
    const countsRequestRef = useRef(0);

    const hasActiveQuery = Boolean(search || productFilter);

    const productOptions = useMemo(
        () => products.map((product) => ({ value: product.id, label: product.name })),
        [products]
    );

    const fetchProducts = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && productsCache.current) {
            return productsCache.current;
        }

        if (productsPromiseRef.current && !forceRefresh) {
            return productsPromiseRef.current;
        }

        productsPromiseRef.current = (async () => {
            try {
                const normalized = await fetchAllVendorProducts(vendorService);
                productsCache.current = normalized;
                setProducts(normalized);
                setProductsLoaded(true);
                return normalized;
            } catch (error) {
                console.error("Failed to fetch products:", error);
                throw error;
            } finally {
                productsPromiseRef.current = null;
            }
        })();

        return productsPromiseRef.current;
    }, []);

    const enrichRows = useCallback(async (results, productList, options = {}) => {
        return enrichInventoryWithApproval(results, productList, vendorService, options);
    }, []);

    const listQuery = useMemo(
        () => ({
            search: search || undefined,
            product_id: productFilter || undefined,
        }),
        [search, productFilter]
    );

    const fetchCounts = useCallback(async () => {
        const requestId = ++countsRequestRef.current;
        setSummaryLoading(true);
        try {
            const response = await vendorService.getInventory({
                page: 1,
                page_size: 1,
                ...listQuery,
            });
            if (requestId !== countsRequestRef.current) return;
            const parsed = parseInventoryListResponse(response);
            setApiSummary(parsed.summary);
            setApiFilters(parsed.filters);
            setCatalogCount(parsed.count);
        } catch (err) {
            if (requestId !== countsRequestRef.current) return;
            console.error("Failed to fetch inventory counts:", err);
        } finally {
            if (requestId === countsRequestRef.current) {
                setSummaryLoading(false);
            }
        }
    }, [listQuery]);

    const fetchInventory = useCallback(async () => {
        const requestId = ++inventoryRequestRef.current;
        setLoading(true);
        setError("");
        try {
            const productList = await fetchProducts();
            const inventoryRes = await vendorService.getInventory({
                page,
                page_size: clampInventoryPageSize(pageSize),
                ...listQuery,
                filter: toApiStockFilter(stockFilter),
            });
            if (requestId !== inventoryRequestRef.current) return;
            const { results, count } = parseInventoryListResponse(inventoryRes);
            const enrichedItems = await enrichRows(results, productList, { verifyLive: true });
            if (requestId !== inventoryRequestRef.current) return;
            setItems(enrichedItems);
            setTotalCount(count);
        } catch (err) {
            if (requestId !== inventoryRequestRef.current) return;
            const status = err?.response?.status;
            const message = err?.response?.data?.message || err.message || "Failed to load stock";
            setError(
                status === 403
                    ? message || "Your vendor account must be approved before managing inventory."
                    : message
            );
            setItems([]);
            setTotalCount(0);
        } finally {
            if (requestId === inventoryRequestRef.current) {
                setLoading(false);
            }
        }
    }, [page, pageSize, listQuery, stockFilter, fetchProducts, enrichRows]);

    const reloadAll = useCallback(
        async (forceRefresh = false) => {
            setRefreshing(true);
            setError("");
            try {
                await fetchProducts(forceRefresh);
                await Promise.all([fetchInventory(), fetchCounts()]);
            } catch (err) {
                console.error("Failed to reload stock:", err);
            } finally {
                setRefreshing(false);
            }
        },
        [fetchProducts, fetchInventory, fetchCounts]
    );

    useEffect(() => {
        let mounted = true;

        const initialLoad = async () => {
            try {
                await fetchProducts();
            } catch (error) {
                console.error("Initial load failed:", error);
                if (mounted) {
                    setError("Failed to load initial data");
                    setLoading(false);
                    setSummaryLoading(false);
                }
            }
        };

        initialLoad();

        return () => {
            mounted = false;
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, [fetchProducts]);

    useEffect(() => {
        if (!productsLoaded) return undefined;
        fetchCounts();
        return undefined;
    }, [productsLoaded, fetchCounts]);

    useEffect(() => {
        if (!productsLoaded) return undefined;

        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }

        fetchTimeoutRef.current = setTimeout(() => {
            fetchInventory();
        }, 300);

        return () => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, [page, pageSize, listQuery, stockFilter, productsLoaded, fetchInventory]);

    useEffect(() => {
        if (editingItem && !canManageStock(editingItem)) {
            setEditingItem(null);
            setBlockedItem(editingItem);
        }
    }, [editingItem]);

    const handleRefresh = async () => {
        await reloadAll(true);
    };

    const filterCounts = useMemo(
        () => buildApiFilterCounts(apiFilters, catalogCount),
        [apiFilters, catalogCount]
    );

    const applyStockFilter = (key) => {
        const mapped = KPI_FILTER_MAP[key] || key;
        setStockFilter(mapped);
        setPage(1);
    };

    const showApprovalBlocked = useCallback((item) => {
        setBlockedItem(item);
    }, []);

    const closeApprovalBlocked = useCallback(() => {
        setBlockedItem(null);
    }, []);

    const openEdit = (item) => {
        if (!canManageStock(item)) {
            showApprovalBlocked(item);
            return;
        }
        setEditingItem(item);
        setEditQuantity(String(item.quantity ?? 0));
    };

    const viewBlockedProductStatus = () => {
        if (!blockedItem?.product_id) {
            closeApprovalBlocked();
            navigate("/vendor/products");
            return;
        }
        closeApprovalBlocked();
        navigate(`/vendor/edit-product/${blockedItem.product_id}`);
    };

    const clearFilters = () => {
        setSearch("");
        setSearchInput("");
        setProductFilter("");
        setStockFilter("all");
        setPage(1);
    };

    const adjustQuantity = (delta) => {
        setEditQuantity((prev) => String(Math.max(0, (Number(prev) || 0) + delta)));
    };

    const setPresetQuantity = (value) => {
        setEditQuantity(String(Math.max(0, value)));
    };

    const saveQuantity = async () => {
        if (!editingItem) return;

        setSaving(true);
        try {
            let liveApproval;
            try {
                liveApproval = await fetchVariantApprovalStatus(
                    editingItem.product_id,
                    editingItem.variant_id,
                    vendorService
                );
            } catch {
                toast.error("Could not verify variant approval status. Please try again.");
                setSaving(false);
                return;
            }

            if (liveApproval !== "approved") {
                setEditingItem(null);
                showApprovalBlocked({ ...editingItem, approval_status: liveApproval });
                await reloadAll(true);
                setSaving(false);
                return;
            }

            const quantity = Number(editQuantity);
            if (Number.isNaN(quantity) || quantity < 0) {
                toast.error("Enter a valid quantity (0 or greater)");
                setSaving(false);
                return;
            }
            if (quantity === (editingItem.quantity ?? 0)) {
                toast.error("Quantity is unchanged");
                setSaving(false);
                return;
            }

            const optimisticItems = items.map((item) =>
                item.id === editingItem.id ? { ...item, quantity } : item
            );
            setItems(optimisticItems);

            await vendorService.updateInventory(editingItem.id, {
                action: "set",
                quantity,
            });
            toast.success("Stock updated successfully");
            setEditingItem(null);

            await reloadAll(true);
        } catch (err) {
            await reloadAll(true);

            if (isApprovalRelatedStockError(err)) {
                setEditingItem(null);
                showApprovalBlocked(editingItem);
            } else {
                const message = extractApiErrorMessage(err, "Failed to update stock");
                toast.error(isUnicommerceSyncError(err) ? `Unicommerce sync: ${message}` : message);
            }
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deletingItem) return;
        try {
            setDeleting(true);

            const optimisticItems = items.filter((item) => item.id !== deletingItem.id);
            setItems(optimisticItems);

            await vendorService.deleteInventory(deletingItem.id);
            toast.success("Inventory record deleted");
            setDeletingItem(null);

            await reloadAll(true);
        } catch (err) {
            await reloadAll(true);
            toast.error(err?.response?.data?.message || "Failed to delete inventory");
        } finally {
            setDeleting(false);
        }
    };

    const editDelta = editingItem ? (Number(editQuantity) || 0) - (editingItem.quantity || 0) : 0;
    const editQuantityUnchanged =
        editingItem && (Number(editQuantity) || 0) === (editingItem.quantity ?? 0);
    const editBlocked = editingItem && !canManageStock(editingItem);

    return (
        <DashboardPageShell
            compact
            hidePageHeader
            contentClassName="vendor-page-content stock-page-content"
            actions={
                <Button
                    variant="secondary"
                    onClick={handleRefresh}
                    loading={refreshing}
                    disabled={loading}
                    className="!text-sm"
                >
                    {!refreshing && <RefreshCw size={16} />}
                    Refresh
                </Button>
            }
        >
            <StockKpiSection
                summary={apiSummary}
                recordCount={catalogCount}
                summaryLoading={summaryLoading}
                hasActiveQuery={hasActiveQuery}
                onFilterSelect={applyStockFilter}
            />

            <SearchToolbar
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onSubmit={() => {
                    setPage(1);
                    setSearch(searchInput.trim());
                }}
                onClear={
                    search || searchInput || productFilter || stockFilter !== "all"
                        ? clearFilters
                        : undefined
                }
                placeholder="Search system SKU, vendor SKU, variant, or product name…"
            >
                <SelectFilter
                    value={productFilter}
                    onChange={(e) => {
                        setProductFilter(e.target.value);
                        setPage(1);
                    }}
                    options={productOptions}
                    placeholder="All products"
                    aria-label="Filter by product"
                    className="w-[11rem] min-w-[9rem] shrink-0"
                />
            </SearchToolbar>

            <div className="stock-filter-tabs" role="tablist" aria-label="Stock health filters">
                {STOCK_FILTERS.map((filter) => (
                    <button
                        key={filter.key}
                        type="button"
                        role="tab"
                        aria-selected={stockFilter === filter.key}
                        className={`stock-filter-tab ${stockFilter === filter.key ? "stock-filter-tab--active" : ""
                            }`}
                        onClick={() => applyStockFilter(filter.key)}
                    >
                        {filter.label}
                        <span className="stock-filter-count">{filterCounts[filter.key] ?? 0}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <TableSkeleton columns={COLUMNS.length} rows={Math.min(pageSize, 8)} />
            ) : error ? (
                <PageError message={error} onRetry={reloadAll} />
            ) : items.length === 0 ? (
                <PageEmpty
                    icon={Package}
                    title={
                        search || productFilter || stockFilter !== "all"
                            ? "No records match this filter"
                            : "No stock records found"
                    }
                    description={
                        search || productFilter || stockFilter !== "all"
                            ? "Try a different filter, or clear search and status filters."
                            : "Inventory records are created when you add products with variants. Manage quantities here after catalog setup."
                    }
                    action={
                        !search && !productFilter && stockFilter === "all" ? (
                            <Button onClick={() => navigate("/vendor/products")}>Go to Products</Button>
                        ) : (
                            <Button variant="secondary" onClick={clearFilters}>
                                Clear filters
                            </Button>
                        )
                    }
                />
            ) : (
                <TableCard>
                    <div className="px-4 pt-4 pb-2 text-sm text-gray-500">
                        <strong>{totalCount.toLocaleString()}</strong>{" "}
                        {stockFilter === "all"
                            ? "records"
                            : STOCK_FILTERS.find((f) => f.key === stockFilter)?.label?.toLowerCase()}
                    </div>

                    <DataTable columns={COLUMNS} stickyActions>
                        {items.map((item) => (
                            <StockTableRow
                                key={item.id}
                                item={item}
                                onEdit={openEdit}
                                onDelete={setDeletingItem}
                                onBlocked={showApprovalBlocked}
                            />
                        ))}
                    </DataTable>

                    <PaginationBar
                        page={page}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                        storageKey="vendor:stock"
                        itemLabel="records"
                    />
                </TableCard>
            )}

            <QuantityUnavailableModal
                item={blockedItem}
                open={Boolean(blockedItem)}
                onClose={closeApprovalBlocked}
                onViewProduct={viewBlockedProductStatus}
            />

            <Modal
                open={Boolean(editingItem)}
                onClose={() => !saving && setEditingItem(null)}
                title="Update Stock Quantity"
                subtitle={
                    editingItem
                        ? `${editingItem.product_name} · ${editingItem.variant_title || "Default variant"}`
                        : ""
                }
                size="md"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setEditingItem(null)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveQuantity}
                            loading={saving}
                            disabled={editQuantityUnchanged || saving || editBlocked}
                            variant="primary"
                        >
                            {saving ? "Saving..." : "Save Quantity"}
                        </Button>
                    </>
                }
            >
                {editingItem && (
                    <div className="space-y-5">
                        <div className="stock-sku-stack">
                            <div>
                                <p className="vendor-form-label !mb-1">Vendor SKU</p>
                                <code className="stock-sku-vendor">
                                    {editingItem.vendor_sku_code || "—"}
                                </code>
                            </div>
                            {editingItem.sku_code ? (
                                <div>
                                    <p className="vendor-form-label !mb-1">System SKU</p>
                                    <code className="stock-sku-system">{editingItem.sku_code}</code>
                                </div>
                            ) : null}
                        </div>

                        <div className="stock-update-preview">
                            <div className="stock-update-stat">
                                <p className="stock-update-stat-label">Current</p>
                                <p className="stock-update-stat-value">{editingItem.quantity ?? 0}</p>
                            </div>
                            <div className="stock-update-stat">
                                <p className="stock-update-stat-label">New</p>
                                <p className="stock-update-stat-value">{Number(editQuantity) || 0}</p>
                            </div>
                            <div className="stock-update-stat">
                                <p className="stock-update-stat-label">Change</p>
                                <p
                                    className={`stock-update-stat-value ${editDelta > 0
                                        ? "stock-update-stat-value--delta-positive"
                                        : editDelta < 0
                                            ? "stock-update-stat-value--delta-negative"
                                            : ""
                                        }`}
                                >
                                    {editDelta > 0 ? "+" : ""}
                                    {editDelta}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="stock-quantity" className="vendor-form-label">
                                Quantity on Hand
                            </label>
                            <div className="stock-qty-stepper">
                                <button
                                    type="button"
                                    className="stock-qty-stepper-btn"
                                    onClick={() => adjustQuantity(-1)}
                                    disabled={saving || (Number(editQuantity) || 0) <= 0}
                                    aria-label="Decrease quantity"
                                >
                                    −
                                </button>
                                <input
                                    id="stock-quantity"
                                    type="number"
                                    min="0"
                                    step="1"
                                    autoFocus
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !editQuantityUnchanged && !saving) {
                                            e.preventDefault();
                                            saveQuantity();
                                        }
                                    }}
                                    className="stock-qty-stepper-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="0"
                                />
                                <button
                                    type="button"
                                    className="stock-qty-stepper-btn"
                                    onClick={() => adjustQuantity(1)}
                                    disabled={saving}
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div>
                            <p className="stock-update-stat-label mb-2">Quick set</p>
                            <div className="stock-qty-presets">
                                {QTY_PRESETS.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        className="stock-qty-preset"
                                        disabled={saving}
                                        onClick={() => setPresetQuantity(preset)}
                                    >
                                        Set {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="stock-modal-notice stock-modal-notice--sync">
                            Saving updates inventory and syncs to Unicommerce. If sync fails, you will
                            see an error and the quantity will not be saved.
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                open={Boolean(deletingItem)}
                onClose={() => !deleting && setDeletingItem(null)}
                title="Delete inventory record"
                subtitle={deletingItem ? deletingItem.product_name : ""}
                size="sm"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setDeletingItem(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} loading={deleting}>
                            Delete record
                        </Button>
                    </>
                }
            >
                {deletingItem && (
                    <div className="stock-delete-warning">
                        <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" aria-hidden />
                        <div>
                            <p className="font-semibold">This action cannot be undone.</p>
                            <p className="mt-1">
                                Delete inventory for{" "}
                                <strong>{deletingItem.variant_title || "this variant"}</strong> (
                                {deletingItem.quantity ?? 0} units on hand)? The variant itself remains
                                in your catalog.
                            </p>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardPageShell>
    );
}
