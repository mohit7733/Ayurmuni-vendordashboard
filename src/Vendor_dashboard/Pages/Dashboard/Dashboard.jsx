import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    Box,
    Clock,
    IndianRupee,
    Layers,
    Package,
    ShoppingBag,
} from "lucide-react";
import { vendorService } from "../../../services/vendorService";
import { notificationService } from "../../../services/notificationService";
import { reviewService } from "../../../services/reviewService";
import { parseReviewsListResponse } from "../Ratings/ratingHelpers";
import { parseFinanceMetricsResponse } from "../Finance/financeHelpers";
import {
    EMPTY_ORDER_SUMMARY,
    formatCurrency,
    parseOrdersListResponse,
    parseOrdersSummaryResponse,
} from "../Order/orderHelpers";
import { getVariantCoverImageUrl } from "../../../utils/unicommerceHelpers";
import { PageError } from "../../components/shared/PageState";
import { MetricSkeleton } from "../../components/shared/Skeleton";
import image from "../../../Assests/image 4.png";
import DashboardWelcome from "./components/DashboardWelcome";
import PremiumKPICard from "./components/PremiumKPICard";
import DashboardAnalytics from "./components/DashboardAnalytics";
import DashboardRightPanel from "./components/DashboardRightPanel";
import DashboardProductsTable from "./components/DashboardProductsTable";

const LOW_STOCK_THRESHOLD = 10;
const EXCLUDED_SALE_STATUSES = new Set(["cancelled", "canceled", "returned", "refunded"]);

function lineRevenue(item) {
    const total = Number(item.total_amount ?? item.total_price);
    if (!Number.isNaN(total) && total > 0) return total;
    const qty = Number(item.quantity) || 0;
    const price = Number(item.selling_price ?? item.price) || 0;
    return qty * price;
}

function buildSalesByProduct(orderItems = []) {
    const map = new Map();
    orderItems.forEach((item) => {
        const status = String(item.status || "").toLowerCase();
        if (EXCLUDED_SALE_STATUSES.has(status)) return;

        const name = item.product_name || item.name || "Product";
        const variant = item.variant_title || "";
        const key = String(item.product_id || item.sku_code || `${name}::${variant}`);
        const units = Number(item.quantity) || 0;
        const revenue = lineRevenue(item);
        if (units <= 0 && revenue <= 0) return;
        const existing = map.get(key);

        if (existing) {
            existing.units += units;
            existing.revenue += revenue;
            return;
        }

        map.set(key, {
            key,
            name,
            variant,
            sku: item.sku_code || "",
            image: item.product_image || "",
            units,
            revenue,
        });
    });

    return Array.from(map.values()).sort(
        (a, b) => b.units - a.units || b.revenue - a.revenue
    );
}

function timeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function buildSparkline(values) {
    return values.map((v, i) => ({ v, i }));
}

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [profile, setProfile] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [ordersLoadedCount, setOrdersLoadedCount] = useState(0);
    const [orderSummary, setOrderSummary] = useState(EMPTY_ORDER_SUMMARY);
    const [recentReviews, setRecentReviews] = useState([]);
    const [financeMetrics, setFinanceMetrics] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const notifParams = new URLSearchParams({ view: "list", page: 1, page_size: 5 });
            const [productsRes, inventoryRes, profileRes, notificationsRes, notifListRes, ordersRes, summaryRes, reviewsRes, financeRes] =
                await Promise.all([
                    vendorService.getProducts({ page: 1, page_size: 1000000 }),
                    vendorService.getInventory({ page: 1, page_size: 1000000 }),
                    vendorService.getProfile(),
                    notificationService.get({ view: "unread_count" }),
                    notificationService.get(notifParams),
                    vendorService.getOrders({ page: 1, page_size: 1000000 }).catch(() => null),
                    vendorService.getOrdersSummary().catch(() => null),
                    reviewService.getVendorReviews({ page: 1, page_size: 5, sort: "newest" }).catch(() => null),
                    vendorService.getFinanceMetrics({ details_limit: 5 }).catch(() => null),
                ]);

            setProducts(productsRes.data?.data?.results || []);
            setInventory(inventoryRes.data?.data?.results || []);
            setProfile(profileRes.data?.data || null);
            setUnreadCount(notificationsRes.data?.data?.unread_count || 0);
            const notifResults = notifListRes.data?.data?.results || [];
            setRecentNotifications(
                notifResults.map((n) => ({
                    ...n,
                    timeAgo: n.created_at ? timeAgo(n.created_at) : "",
                }))
            );
            const parsedOrders = parseOrdersListResponse(ordersRes);
            setOrderItems(parsedOrders.results);
            setOrdersLoadedCount(parsedOrders.count);
            setRecentOrders(parsedOrders.results.slice(0, 5));
            setOrderSummary(
                summaryRes ? parseOrdersSummaryResponse(summaryRes) : EMPTY_ORDER_SUMMARY
            );
            const parsedReviews = parseReviewsListResponse(reviewsRes);
            setRecentReviews(parsedReviews.results.slice(0, 5));
            setFinanceMetrics(parseFinanceMetricsResponse(financeRes));
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const stats = useMemo(() => {
        const allVariants = products.flatMap((p) => p.variants || []);
        const pendingVariants = allVariants.filter((v) => v.approval_status === "pending");
        const approvedVariants = allVariants.filter((v) => v.approval_status === "approved").length;
        const lowStockItems = inventory.filter((item) => item.quantity <= LOW_STOCK_THRESHOLD);
        const totalStockUnits = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

        return {
            totalProducts: products.length,
            totalVariants: allVariants.length,
            pendingVariants,
            pendingCount: pendingVariants.length,
            approvedVariants,
            lowStockItems,
            lowStockCount: lowStockItems.length,
            totalStockUnits,
            unreadCount,
            businessName: profile?.vendor?.business_name || "Vendor",
            approvalStatus: profile?.vendor?.approval_status || "pending",
            logoUrl: profile?.vendor?.documents?.company_logo || profile?.documents?.company_logo,
        };
    }, [products, inventory, unreadCount, profile]);

    const lastSync = useMemo(() => {
        const dates = inventory.map((i) => i.updated_at).filter(Boolean);
        if (!dates.length) return null;
        const latest = new Date(Math.max(...dates.map((d) => new Date(d).getTime())));
        return latest.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    }, [inventory]);

    const stockChartData = useMemo(() => {
        return [...inventory]
            .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
            .slice(0, 8)
            .map((item) => {
                const label = item.product_name || "Product";
                return {
                    name: label.length > 14 ? `${label.slice(0, 12)}…` : label,
                    fullName: label,
                    quantity: item.quantity || 0,
                };
            });
    }, [inventory]);

    const categoryChartData = useMemo(() => {
        const map = {};
        products.forEach((product) => {
            const key = product.product_subcategory_name || product.brand_name || "Uncategorized";
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map)
            .map(([name, count]) => ({
                name: name.length > 14 ? `${name.slice(0, 12)}…` : name,
                fullName: name,
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [products]);

    const approvalChartData = useMemo(() => {
        const allVariants = products.flatMap((p) => p.variants || []);
        const counts = { approved: 0, pending: 0, rejected: 0 };
        allVariants.forEach((v) => {
            const status = v.approval_status || "pending";
            if (status in counts) counts[status] += 1;
            else counts.pending += 1;
        });
        return [
            { name: "Approved", value: counts.approved, color: "#10B981" },
            { name: "Pending", value: counts.pending, color: "#8B5CF6" },
            { name: "Rejected", value: counts.rejected, color: "#F43F5E" },
        ].filter((d) => d.value > 0);
    }, [products]);

    const stockActivityData = useMemo(() => {
        const monthMap = {};
        inventory.forEach((item) => {
            if (!item.updated_at) return;
            const date = new Date(item.updated_at);
            const key = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
            monthMap[key] = (monthMap[key] || 0) + 1;
        });
        return Object.entries(monthMap)
            .map(([month, updates]) => ({ month, updates }))
            .sort((a, b) => {
                const parse = (m) => {
                    const [mon, yr] = m.split(" ");
                    return new Date(`${mon} 1, 20${yr}`).getTime();
                };
                return parse(a.month) - parse(b.month);
            });
    }, [inventory]);

    const salesByProduct = useMemo(() => {
        const rows = buildSalesByProduct(orderItems);
        const catalogByName = new Map();
        products.forEach((product) => {
            if (product.name) catalogByName.set(product.name.trim().toLowerCase(), product);
        });

        return rows.map((row) => {
            const match = catalogByName.get(row.name.trim().toLowerCase());
            const variantWithImage = match
                ? (match.variants || []).find((v) => getVariantCoverImageUrl(v)) || match.variants?.[0]
                : null;
            return {
                ...row,
                productId: match?.id || null,
                image: row.image || getVariantCoverImageUrl(variantWithImage) || image,
            };
        });
    }, [orderItems, products]);

    const topSellingProducts = useMemo(() => salesByProduct.slice(0, 6), [salesByProduct]);

    const salesLookup = useMemo(() => {
        const lookup = new Map();
        salesByProduct.forEach((row) => {
            const nameKey = row.name.trim().toLowerCase();
            const current = lookup.get(nameKey) || { units: 0, revenue: 0 };
            lookup.set(nameKey, {
                units: current.units + row.units,
                revenue: current.revenue + row.revenue,
            });
        });
        return lookup;
    }, [salesByProduct]);

    const revenueTrendData = useMemo(() => {
        return (financeMetrics?.monthly_revenue || []).map((item) => ({
            month: item.label || `${item.month || ""} ${String(item.year || "").slice(-2)}`.trim(),
            fullName: item.label || `${item.month || ""} ${item.year || ""}`.trim(),
            revenue: Number(item.value ?? item.revenue) || 0,
        }));
    }, [financeMetrics]);

    const sparklines = useMemo(() => {
        const stockTrend = stockActivityData.map((d) => d.updates);
        const productTrend = categoryChartData.map((d) => d.count);
        const revenueTrend = revenueTrendData.map((d) => d.revenue);
        return {
            products: buildSparkline(productTrend.length ? productTrend : [stats.totalProducts]),
            inventory: buildSparkline(stockTrend.length ? stockTrend : [stats.totalStockUnits]),
            pending: buildSparkline([stats.pendingCount, stats.approvedVariants, stats.pendingCount]),
            notifications: buildSparkline([stats.unreadCount, stats.unreadCount]),
            revenue: buildSparkline(revenueTrend.length ? revenueTrend : [financeMetrics?.total_revenue?.value || 0]),
            orders: buildSparkline([
                orderSummary.pending,
                orderSummary.processing,
                orderSummary.shipped,
                orderSummary.delivered,
            ]),
        };
    }, [stockActivityData, categoryChartData, revenueTrendData, stats, financeMetrics, orderSummary]);

    const recentProducts = useMemo(() => {
        return products
            .map((product) => {
                const variantWithImage =
                    (product.variants || []).find((v) => getVariantCoverImageUrl(v)) || product.variants?.[0];
                const stock = variantWithImage?.quantity ?? variantWithImage?.stock ?? 0;
                const sold = salesLookup.get((product.name || "").trim().toLowerCase());
                return {
                    id: product.id,
                    name: product.name,
                    price: variantWithImage?.selling_price || variantWithImage?.mrp || 0,
                    stock,
                    sold: sold?.units || 0,
                    revenue: sold?.revenue || 0,
                    status: variantWithImage?.approval_status || "pending",
                    image: getVariantCoverImageUrl(variantWithImage) || image,
                };
            })
            .sort((a, b) => b.sold - a.sold || b.revenue - a.revenue)
            .slice(0, 12);
    }, [products, salesLookup]);

    const lowStockPanelItems = useMemo(() => {
        return stats.lowStockItems.slice(0, 5).map((item) => ({
            id: item.id,
            sku: item.sku_code,
            name: item.product_name || "Unknown",
            qty: item.quantity,
        }));
    }, [stats.lowStockItems]);

    const pendingPanelVariants = useMemo(() => {
        return stats.pendingVariants.slice(0, 5).map((v) => ({
            id: v.id,
            title: v.title || "Variant",
        }));
    }, [stats.pendingVariants]);

    const inProgressOrders =
        orderSummary.pending +
        orderSummary.confirmed +
        orderSummary.processing +
        orderSummary.shipped;
    const monthRevenue = financeMetrics?.this_month_revenue?.value;
    const salesSampleNote =
        ordersLoadedCount > orderItems.length
            ? `Based on your latest ${orderItems.length} order lines`
            : "Units sold from your orders";

    const todaySummary = [
        `${orderSummary.total.toLocaleString()} orders`,
        `${stats.totalProducts} products`,
        `${stats.totalStockUnits.toLocaleString()} units in stock`,
    ].join(" · ");

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] p-3 sm:p-4 lg:p-5 space-y-3">
                <div className="h-16 ds-skeleton rounded-xl" />
                <MetricSkeleton count={7} />
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 xl:col-span-8 h-64 ds-skeleton rounded-xl" />
                    <div className="col-span-12 xl:col-span-4 h-64 ds-skeleton rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] p-3 sm:p-4 lg:p-5">
                <PageError message={error} onRetry={fetchDashboardData} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5]">
            <div className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-5 py-3 sm:py-4 space-y-3">
                <DashboardWelcome
                    businessName={stats.businessName}
                    approvalStatus={stats.approvalStatus}
                    logoUrl={stats.logoUrl}
                    summary={todaySummary}
                    lastSync={lastSync}
                    onAddProduct={() => navigate("/vendor/new-product")}
                    onManageStock={() => navigate("/vendor/stock")}
                    onViewProducts={() => navigate("/vendor/products")}
                />

                {/* Unified KPI strip */}
                <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-7">
                    <PremiumKPICard
                        variant="hero"
                        compact
                        icon={Package}
                        label="Products"
                        value={stats.totalProducts}
                        subtitle={`${stats.totalVariants} variants`}
                        trend={`+${stats.approvedVariants} approved`}
                        sparkData={sparklines.products}
                        onAction={() => navigate("/vendor/products")}
                        actionLabel="Catalog"
                    />
                    <PremiumKPICard
                        variant="accent"
                        compact
                        icon={Layers}
                        label="Inventory"
                        value={stats.totalStockUnits}
                        subtitle="Units on hand"
                        trend={stats.lowStockCount > 0 ? `${stats.lowStockCount} low` : "Healthy"}
                        trendDirection={stats.lowStockCount > 0 ? "down" : "up"}
                        sparkData={sparklines.inventory}
                        onAction={() => navigate("/vendor/stock")}
                        actionLabel="Stock"
                    />
                    <PremiumKPICard
                        variant="muted"
                        compact
                        icon={ShoppingBag}
                        label="Orders"
                        value={orderSummary.total}
                        subtitle={inProgressOrders > 0 ? `${inProgressOrders} to fulfill` : "All caught up"}
                        trend={orderSummary.delivered > 0 ? `${orderSummary.delivered} delivered` : undefined}
                        sparkData={sparklines.orders}
                        onAction={() => navigate("/vendor/orders")}
                        actionLabel="Orders"
                    />
                    <PremiumKPICard
                        variant="soft"
                        compact
                        icon={IndianRupee}
                        label="Revenue"
                        value={formatCurrency(financeMetrics?.total_revenue?.value ?? 0)}
                        subtitle={
                            monthRevenue != null
                                ? `This month ${formatCurrency(monthRevenue)}`
                                : "Delivered"
                        }
                        trend={
                            financeMetrics?.total_revenue?.trend_percent != null
                                ? `${financeMetrics.total_revenue.trend_percent > 0 ? "+" : ""}${financeMetrics.total_revenue.trend_percent}%`
                                : undefined
                        }
                        sparkData={sparklines.revenue}
                        onAction={() => navigate("/vendor/finance")}
                        actionLabel="Finance"
                    />
                    <PremiumKPICard
                        variant="alert"
                        compact
                        icon={Clock}
                        label="Pending"
                        value={stats.pendingCount}
                        subtitle="Awaiting review"
                        trend={stats.pendingCount > 0 ? "Action needed" : "All clear"}
                        trendDirection={stats.pendingCount > 0 ? "down" : "up"}
                        sparkData={sparklines.pending}
                        onAction={() => navigate("/vendor/products")}
                    />
                    <PremiumKPICard
                        variant="soft"
                        compact
                        icon={Bell}
                        label="Alerts"
                        value={stats.unreadCount}
                        subtitle="Unread"
                        trend={stats.unreadCount > 0 ? "New" : "Clear"}
                        sparkData={sparklines.notifications}
                        onAction={() => navigate("/vendor/notifications")}
                    />
                    <PremiumKPICard
                        variant="accent"
                        compact
                        icon={Box}
                        label="Low Stock"
                        value={stats.lowStockCount}
                        subtitle={`≤ ${LOW_STOCK_THRESHOLD} units`}
                        trend={stats.lowStockCount > 0 ? "Restock" : "OK"}
                        trendDirection={stats.lowStockCount > 0 ? "down" : "up"}
                        onAction={() => navigate("/vendor/stock")}
                        className="col-span-2 sm:col-span-1"
                    />
                </section>

                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 xl:col-span-8 space-y-3">
                        <DashboardAnalytics
                            stockChartData={stockChartData}
                            categoryChartData={categoryChartData}
                            approvalChartData={approvalChartData}
                            revenueTrendData={revenueTrendData}
                            topSellingProducts={topSellingProducts}
                            salesSampleNote={salesSampleNote}
                            onOpenProduct={(id) => navigate(`/vendor/edit-product/${id}`)}
                        />
                        <DashboardProductsTable
                            products={recentProducts}
                            onEdit={(id) => navigate(`/vendor/edit-product/${id}`)}
                        />
                    </div>

                    <div className="col-span-12 xl:col-span-4">
                        <div className="xl:sticky xl:top-20">
                            <DashboardRightPanel
                                notifications={recentNotifications}
                                recentOrders={recentOrders}
                                recentReviews={recentReviews}
                                lowStockItems={lowStockPanelItems}
                                pendingVariants={pendingPanelVariants}
                                approvalStatus={stats.approvalStatus}
                                onNavigate={navigate}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
