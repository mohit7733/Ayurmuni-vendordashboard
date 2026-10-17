import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    ChevronDown,
    ChevronRight,
    FolderTree,
    Layers,
    Package,
    RefreshCw,
    SearchX,
    Tag,
} from "lucide-react";
import { vendorService } from "../../../services/vendorService";
import {
    fetchAllVendorProducts,
    normalizeBrand,
    productMatchesBrand,
} from "../Stock/stockHelpers";
import { getVariantCoverImageUrl, mapVariantFromApi } from "../../../utils/unicommerceHelpers";
import Ayurvedaimage from "../../../Assests/Ayurvedaimage.png";
import DashboardPageShell from "../../components/shared/DashboardPageShell";
import { PageEmpty, PageError } from "../../components/shared/PageState";
import { MetricSkeleton } from "../../components/shared/Skeleton";
import StatusBadge from "../../components/shared/StatusBadge";
import SearchToolbar, { SelectFilter } from "../../components/shared/SearchToolbar";
import Button from "../../components/shared/Button";
import PremiumKPICard from "../Dashboard/components/PremiumKPICard";
import "../../components/shared/vendor-shared.css";
import "./Catalog.css";

const CATALOG_VIEWS = [
    { id: "tree", label: "Catalog", icon: FolderTree },
    { id: "brands", label: "Brands", icon: Tag },
];

const APPROVAL_FILTERS = [
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "rejected", label: "Rejected" },
];

const ACTIVE_FILTERS = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
];

function getCategoryIdForSubcategory(sub) {
    return sub.product_category_id ?? sub.category_id ?? sub.product_category ?? null;
}

function getSubcategoryIdForProduct(product) {
    return product.product_subcategory_id ?? product.subcategory_id ?? null;
}

function getProductCategoryId(product) {
    return product.product_category_id ?? product.category_id ?? null;
}

function getProductCoverUrl(product) {
    const variant =
        (product.variants || []).find((v) => getVariantCoverImageUrl(v)) || product.variants?.[0];
    return getVariantCoverImageUrl(variant);
}

function getProductApprovalStatus(product) {
    const direct = (product.approval_status || "").toLowerCase();
    if (direct) return direct;
    const fromVariant = (product.variants || []).find((v) => v.approval_status)?.approval_status;
    return (fromVariant || "pending").toLowerCase();
}

function matchesActiveStatus(item, activeFilter) {
    if (!activeFilter) return true;
    const isActive = item.is_active !== false;
    return activeFilter === "active" ? isActive : !isActive;
}

function productMatchesApproval(product, approvalFilter) {
    if (!approvalFilter) return true;
    return getProductApprovalStatus(product) === approvalFilter;
}

function productMatchesCategory(product, categoryId, subcategoryLookup) {
    if (!categoryId) return true;
    const direct = getProductCategoryId(product);
    if (direct != null && String(direct) === String(categoryId)) return true;
    const subId = getSubcategoryIdForProduct(product);
    if (subId == null) return false;
    const sub = subcategoryLookup.get(String(subId));
    if (!sub) return false;
    return String(getCategoryIdForSubcategory(sub)) === String(categoryId);
}

function productMatchesSubcategory(product, subcategoryId) {
    if (!subcategoryId) return true;
    return String(getSubcategoryIdForProduct(product) ?? "") === String(subcategoryId);
}

function matchesSearch(item, search, type = "default") {
    if (!search) return true;
    const term = search.toLowerCase();
    if (type === "product") {
        return (
            (item.name || "").toLowerCase().includes(term) ||
            (item.brand_name || "").toLowerCase().includes(term) ||
            (item.product_subcategory_name || "").toLowerCase().includes(term)
        );
    }
    return (
        (item.name || item.title || "").toLowerCase().includes(term) ||
        (item.code || "").toLowerCase().includes(term) ||
        (item.hsn_code || "").toLowerCase().includes(term)
    );
}

function ProductCatalogCard({ product }) {
    const coverUrl = getProductCoverUrl(product) || Ayurvedaimage;
    const variantCount = product.variants?.length || 0;
    const approval = getProductApprovalStatus(product);

    return (
        <Link to={`/vendor/products/${product.id}`} className="catalog-product-card">
            <div className="catalog-product-card__image">
                <img
                    src={coverUrl}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.src = Ayurvedaimage;
                    }}
                />
            </div>
            <div className="catalog-product-card__body min-w-0">
                <p className="catalog-product-card__name">{product.name}</p>
                <p className="catalog-product-card__brand">{product.brand_name || "No brand"}</p>
                <div className="catalog-product-card__meta">
                    <span className="catalog-product-card__variants">
                        {variantCount} variant{variantCount === 1 ? "" : "s"}
                    </span>
                    <StatusBadge status={approval} />
                </div>
            </div>
            <span className="catalog-product-card__arrow" aria-hidden>
                <ChevronRight size={16} strokeWidth={2.25} />
            </span>
        </Link>
    );
}

function SubcategoryAccordionItem({
    subcategory,
    products,
    expanded,
    onToggle,
    search,
    hasProductFilters,
}) {
    const visibleProducts = useMemo(() => {
        if (!search) return products;
        return products.filter((p) => matchesSearch(p, search, "product"));
    }, [products, search]);

    const productCount = products.length;
    const matchCount = search ? visibleProducts.length : productCount;
    const showMatchLabel = (search || hasProductFilters) && matchCount !== productCount;

    return (
        <li className={`catalog-subcategory ${expanded ? "catalog-subcategory--open" : ""}`}>
            <button
                type="button"
                className="catalog-subcategory__trigger"
                onClick={onToggle}
                aria-expanded={expanded}
            >
                <span
                    className={`catalog-subcategory__chevron ${
                        expanded ? "catalog-subcategory__chevron--open" : ""
                    }`}
                >
                    <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
                </span>
                <div className="catalog-subcategory-item__main min-w-0">
                    <p className="catalog-subcategory-item__name">{subcategory.name}</p>
                    <div className="catalog-subcategory-item__meta">
                        {subcategory.code && (
                            <code className="catalog-subcategory-item__code">{subcategory.code}</code>
                        )}
                        {subcategory.hsn_code && (
                            <span className="catalog-subcategory-item__hsn">
                                HSN {subcategory.hsn_code}
                            </span>
                        )}
                        <span className="catalog-subcategory-item__products">
                            {showMatchLabel
                                ? `${matchCount} of ${productCount} products`
                                : `${productCount} product${productCount === 1 ? "" : "s"}`}
                        </span>
                    </div>
                </div>
                <StatusBadge status={subcategory.is_active === false ? "inactive" : "active"} />
            </button>

            <div
                className={`catalog-subcategory__panel ${
                    expanded ? "catalog-subcategory__panel--open" : ""
                }`}
            >
                <div className="catalog-subcategory__panel-inner">
                    {visibleProducts.length === 0 ? (
                        <p className="catalog-subcategory__empty">
                            {search || hasProductFilters
                                ? "No matching products"
                                : "No products in this subcategory yet"}
                        </p>
                    ) : (
                        <div className="catalog-product-grid">
                            {visibleProducts.map((product) => (
                                <ProductCatalogCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}

function CategoryAccordionItem({
    category,
    subcategories,
    productsBySubcategory,
    expanded,
    onToggle,
    expandedSubIds,
    onToggleSub,
    search,
    hasProductFilters,
}) {
    const visibleSubs = useMemo(() => {
        if (!search && !hasProductFilters) return subcategories;
        return subcategories.filter((sub) => {
            if (search && matchesSearch(sub, search)) return true;
            const prods = productsBySubcategory.get(String(sub.id)) || [];
            if (hasProductFilters && prods.length > 0) return true;
            return prods.some((p) => matchesSearch(p, search, "product"));
        });
    }, [subcategories, productsBySubcategory, search, hasProductFilters]);

    const subCount = subcategories.length;
    const productCount = subcategories.reduce(
        (sum, sub) => sum + (productsBySubcategory.get(String(sub.id))?.length || 0),
        0
    );

    return (
        <article className={`catalog-category ${expanded ? "catalog-category--open" : ""}`}>
            <button
                type="button"
                className="catalog-category__trigger"
                onClick={onToggle}
                aria-expanded={expanded}
            >
                <span
                    className={`catalog-category__chevron ${
                        expanded ? "catalog-category__chevron--open" : ""
                    }`}
                >
                    <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
                </span>
                <span className="catalog-category__icon">
                    <Layers size={16} aria-hidden />
                </span>
                <span className="catalog-category__main min-w-0">
                    <span className="catalog-category__name">{category.name}</span>
                    {category.code && <code className="catalog-category__code">{category.code}</code>}
                </span>
                <span className="catalog-category__count">
                    {subCount} sub · {productCount} prod
                </span>
                <StatusBadge status={category.is_active === false ? "inactive" : "active"} />
            </button>

            <div
                className={`catalog-category__panel ${expanded ? "catalog-category__panel--open" : ""}`}
            >
                <div className="catalog-category__panel-inner">
                    {visibleSubs.length === 0 ? (
                        <p className="catalog-category__empty">
                            {search || hasProductFilters
                                ? "No matching subcategories"
                                : "No subcategories under this category"}
                        </p>
                    ) : (
                        <ul className="catalog-subcategory-list">
                            {visibleSubs.map((sub) => (
                                <SubcategoryAccordionItem
                                    key={sub.id}
                                    subcategory={sub}
                                    products={productsBySubcategory.get(String(sub.id)) || []}
                                    expanded={expandedSubIds.has(String(sub.id))}
                                    onToggle={() => onToggleSub(sub.id)}
                                    search={search}
                                    hasProductFilters={hasProductFilters}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </article>
    );
}

function BrandCard({ brand, productCount, onClick }) {
    const initial = (brand.name || "?").charAt(0).toUpperCase();

    return (
        <article
            className="catalog-brand-card"
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="catalog-brand-card__avatar" aria-hidden>
                {initial}
            </div>
            <div className="catalog-brand-card__body min-w-0">
                <p className="catalog-brand-card__name">{brand.name}</p>
                <p className="catalog-brand-card__code">{productCount} products</p>
                {brand.code ? (
                    <code className="catalog-brand-card__code">{brand.code}</code>
                ) : (
                    <span className="catalog-brand-card__code catalog-brand-card__code--empty">—</span>
                )}
            </div>
            <StatusBadge status={brand.is_active === false ? "inactive" : "active"} />
        </article>
    );
}

function CatalogKpiSection({ summary, loading, onFocusBrands }) {
    if (loading) {
        return <MetricSkeleton count={4} />;
    }

    return (
        <div className="catalog-kpi-grid ds-stagger">
            <PremiumKPICard
                variant="hero"
                icon={Layers}
                label="Categories"
                value={summary.categories}
                subtitle="Top-level catalog groups"
            />
            <PremiumKPICard
                variant="soft"
                icon={FolderTree}
                label="Subcategories"
                value={summary.subcategories}
                subtitle="Under your categories"
            />
            <PremiumKPICard
                variant="accent"
                icon={Package}
                label="Products"
                value={summary.products}
                subtitle={
                    summary.unassigned > 0
                        ? `${summary.unassigned} without subcategory`
                        : "Mapped in your catalog"
                }
            />
            <PremiumKPICard
                variant="muted"
                icon={Tag}
                label="Brands"
                value={summary.brands}
                subtitle="Approved listing brands"
                className="catalog-kpi-clickable"
                onAction={onFocusBrands}
                actionLabel="View"
            />
        </div>
    );
}

export default function Catalog() {
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [brandId, setBrandId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [subcategoryId, setSubcategoryId] = useState("");
    const [approvalFilter, setApprovalFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [activeView, setActiveView] = useState("tree");
    const [expandedCategoryIds, setExpandedCategoryIds] = useState(() => new Set());
    const [expandedSubIds, setExpandedSubIds] = useState(() => new Set());

    const fetchAll = useCallback(async ({ soft = false } = {}) => {
        try {
            if (soft) setRefreshing(true);
            else setLoading(true);
            setError("");

            const [catRes, subRes, brandRes, productList] = await Promise.all([
                vendorService.getFieldInfo("product-category"),
                vendorService.getFieldInfo("product-subcategory", { is_product_sale: true }),
                vendorService.getFieldInfo("brand-name"),
                fetchAllVendorProducts(vendorService, 100000, brandId || null),
            ]);

            setCategories(catRes.data?.data || []);
            setSubcategories(subRes.data?.data || []);
            setBrands(brandRes.data?.data || []);
            setProducts(
                productList.map((product) => ({
                    ...product,
                    variants: (product.variants || []).map(mapVariantFromApi),
                }))
            );
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to load catalog data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [brandId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const applySearch = useCallback(() => {
        setSearch(searchInput.trim());
    }, [searchInput]);

    const clearFilters = useCallback(() => {
        setSearch("");
        setSearchInput("");
        setBrandId("");
        setCategoryId("");
        setSubcategoryId("");
        setApprovalFilter("");
        setActiveFilter("");
    }, []);

    const subcategoryById = useMemo(() => {
        const map = new Map();
        subcategories.forEach((sub) => map.set(String(sub.id), sub));
        return map;
    }, [subcategories]);

    const hasProductFilters = Boolean(brandId || categoryId || subcategoryId || approvalFilter);
    const hasActiveFilters = Boolean(
        search || brandId || categoryId || subcategoryId || approvalFilter || activeFilter
    );

    const filteredProducts = useMemo(
        () =>
            products.filter(
                (product) =>
                    productMatchesBrand(product, brandId) &&
                    productMatchesCategory(product, categoryId, subcategoryById) &&
                    productMatchesSubcategory(product, subcategoryId) &&
                    productMatchesApproval(product, approvalFilter)
            ),
        [products, brandId, categoryId, subcategoryId, approvalFilter, subcategoryById]
    );

    const brandOptions = useMemo(
        () =>
            brands
                .map(normalizeBrand)
                .filter(Boolean)
                .map((brand) => ({ value: brand.id, label: brand.name })),
        [brands]
    );

    const categoryOptions = useMemo(
        () =>
            categories
                .filter((cat) => matchesActiveStatus(cat, activeFilter))
                .map((cat) => ({ value: String(cat.id), label: cat.name || "Untitled" })),
        [categories, activeFilter]
    );

    const subcategoryOptions = useMemo(() => {
        const list = categoryId
            ? subcategories.filter(
                  (sub) => String(getCategoryIdForSubcategory(sub)) === String(categoryId)
              )
            : subcategories;
        return list
            .filter((sub) => matchesActiveStatus(sub, activeFilter))
            .map((sub) => ({ value: String(sub.id), label: sub.name || "Untitled" }));
    }, [subcategories, categoryId, activeFilter]);

    useEffect(() => {
        if (!subcategoryId) return;
        const stillValid = subcategoryOptions.some((opt) => opt.value === String(subcategoryId));
        if (!stillValid) setSubcategoryId("");
    }, [subcategoryId, subcategoryOptions]);

    const subcategoriesByCategory = useMemo(() => {
        const map = new Map();
        subcategories.forEach((sub) => {
            if (!matchesActiveStatus(sub, activeFilter)) return;
            if (subcategoryId && String(sub.id) !== String(subcategoryId)) return;
            const catId = getCategoryIdForSubcategory(sub);
            if (catId == null) return;
            const key = String(catId);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(sub);
        });
        return map;
    }, [subcategories, activeFilter, subcategoryId]);

    const productsBySubcategory = useMemo(() => {
        const map = new Map();
        filteredProducts.forEach((product) => {
            const subId = getSubcategoryIdForProduct(product);
            if (subId == null) return;
            const key = String(subId);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(product);
        });
        return map;
    }, [filteredProducts]);

    const unassignedProducts = useMemo(
        () => filteredProducts.filter((p) => getSubcategoryIdForProduct(p) == null),
        [filteredProducts]
    );

    const visibleCategories = useMemo(() => {
        return categories.filter((cat) => {
            if (categoryId && String(cat.id) !== String(categoryId)) return false;
            if (!matchesActiveStatus(cat, activeFilter)) return false;

            const subs = subcategoriesByCategory.get(String(cat.id)) || [];
            const hasMatchingProducts = subs.some(
                (sub) => (productsBySubcategory.get(String(sub.id)) || []).length > 0
            );
            const unassignedInCategory =
                !subcategoryId &&
                unassignedProducts.some((p) => productMatchesCategory(p, cat.id, subcategoryById));

            if (!search && !hasProductFilters) return true;
            if (search && matchesSearch(cat, search)) return true;
            if (
                subs.some((sub) => {
                    if (search && matchesSearch(sub, search)) return true;
                    const prods = productsBySubcategory.get(String(sub.id)) || [];
                    if (hasProductFilters && prods.length > 0) return true;
                    return prods.some((p) => matchesSearch(p, search, "product"));
                })
            ) {
                return true;
            }
            if (hasProductFilters && (hasMatchingProducts || unassignedInCategory)) return true;
            return false;
        });
    }, [
        categories,
        categoryId,
        activeFilter,
        search,
        hasProductFilters,
        subcategoriesByCategory,
        productsBySubcategory,
        unassignedProducts,
        subcategoryId,
        subcategoryById,
    ]);

    const filteredBrands = useMemo(() => {
        return brands.filter((brand) => {
            if (!matchesActiveStatus(brand, activeFilter)) return false;
            if (brandId && String(brand.id ?? brand.brand_id ?? brand.brand_name_id) !== String(brandId)) {
                return false;
            }
            if (search && !matchesSearch(brand, search)) return false;
            return true;
        });
    }, [brands, activeFilter, brandId, search]);

    const filteredUnassigned = useMemo(() => {
        if (!search) return unassignedProducts;
        return unassignedProducts.filter((p) => matchesSearch(p, search, "product"));
    }, [unassignedProducts, search]);

    const matchedProductCount = useMemo(() => {
        if (!search) return filteredProducts.length;
        return filteredProducts.filter((p) => matchesSearch(p, search, "product")).length;
    }, [filteredProducts, search]);

    const productCountByBrand = useMemo(() => {
        const map = new Map();
        products.forEach((product) => {
            const id = String(product.brand_name_id ?? product.brand_id ?? "");
            if (!id) return;
            map.set(id, (map.get(id) || 0) + 1);
        });
        return map;
    }, [products]);

    useEffect(() => {
        if (!hasActiveFilters) return;
        setExpandedCategoryIds((prev) => {
            const next = new Set(prev);
            visibleCategories.forEach((cat) => {
                const subs = subcategoriesByCategory.get(String(cat.id)) || [];
                const catMatch =
                    (search && matchesSearch(cat, search)) ||
                    hasProductFilters ||
                    categoryId ||
                    subs.some((sub) => {
                        if (search && matchesSearch(sub, search)) return true;
                        const prods = productsBySubcategory.get(String(sub.id)) || [];
                        return (
                            (hasProductFilters && prods.length > 0) ||
                            prods.some((p) => matchesSearch(p, search, "product"))
                        );
                    });
                if (catMatch) next.add(String(cat.id));
            });
            return next;
        });
        setExpandedSubIds((prev) => {
            const next = new Set(prev);
            subcategories.forEach((sub) => {
                if (subcategoryId && String(sub.id) !== String(subcategoryId)) return;
                if (search && matchesSearch(sub, search)) {
                    next.add(String(sub.id));
                    return;
                }
                const prods = productsBySubcategory.get(String(sub.id)) || [];
                if (
                    (hasProductFilters && prods.length > 0) ||
                    prods.some((p) => matchesSearch(p, search, "product"))
                ) {
                    next.add(String(sub.id));
                }
            });
            return next;
        });
    }, [
        hasActiveFilters,
        search,
        hasProductFilters,
        categoryId,
        subcategoryId,
        visibleCategories,
        subcategoriesByCategory,
        productsBySubcategory,
        subcategories,
    ]);

    const toggleCategory = (id) => {
        const key = String(id);
        setExpandedCategoryIds((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleSubcategory = (id) => {
        const key = String(id);
        setExpandedSubIds((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const expandAll = () => {
        setExpandedCategoryIds(new Set(visibleCategories.map((c) => String(c.id))));
        const subIds = new Set();
        visibleCategories.forEach((cat) => {
            const subs = subcategoriesByCategory.get(String(cat.id)) || [];
            subs.forEach((sub) => {
                if (!search && !hasProductFilters) {
                    subIds.add(String(sub.id));
                    return;
                }
                if (search && matchesSearch(sub, search)) {
                    subIds.add(String(sub.id));
                    return;
                }
                const prods = productsBySubcategory.get(String(sub.id)) || [];
                if (
                    (hasProductFilters && prods.length > 0) ||
                    prods.some((p) => matchesSearch(p, search, "product"))
                ) {
                    subIds.add(String(sub.id));
                }
            });
        });
        setExpandedSubIds(subIds);
    };

    const collapseAll = () => {
        setExpandedCategoryIds(new Set());
        setExpandedSubIds(new Set());
    };

    const selectBrandFromCard = (brand) => {
        const id = String(brand.id ?? brand.brand_id ?? brand.brand_name_id ?? "");
        if (!id) return;
        setBrandId(id);
        setActiveView("tree");
    };

    const summary = useMemo(
        () => ({
            categories: categories.length,
            subcategories: subcategories.length,
            products: products.length,
            brands: brands.length,
            unassigned: products.filter((p) => getSubcategoryIdForProduct(p) == null).length,
        }),
        [categories.length, subcategories.length, products.length, brands.length, products]
    );

    const hasExpanded = expandedCategoryIds.size > 0 || expandedSubIds.size > 0;
    const treeEmpty = visibleCategories.length === 0 && filteredUnassigned.length === 0;

    return (
        <div className="catalog-page">
            <DashboardPageShell
                compact
                hidePageHeader
                contentClassName="vendor-page-content catalog-page-content"
                actions={
                    <Button
                        variant="secondary"
                        onClick={() => fetchAll({ soft: true })}
                        loading={refreshing}
                        disabled={loading}
                        className="!text-sm"
                    >
                        {!refreshing && <RefreshCw size={16} />}
                        Refresh
                    </Button>
                }
            >
                <div className="catalog-premium">
                    <div className="catalog-view-tabs" role="tablist" aria-label="Catalog sections">
                        {CATALOG_VIEWS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={activeView === id}
                                className={`catalog-view-tab ${
                                    activeView === id ? "catalog-view-tab--active" : ""
                                }`}
                                onClick={() => setActiveView(id)}
                            >
                                <Icon size={16} aria-hidden />
                                {label}
                                <span className="catalog-view-tab__count">
                                    {id === "tree"
                                        ? loading
                                            ? "…"
                                            : summary.categories
                                        : loading
                                          ? "…"
                                          : summary.brands}
                                </span>
                            </button>
                        ))}
                    </div>

                    <CatalogKpiSection
                        summary={summary}
                        loading={loading}
                        onFocusBrands={() => setActiveView("brands")}
                    />

                    <SearchToolbar
                        className="catalog-toolbar-search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onSubmit={applySearch}
                        onClear={hasActiveFilters ? clearFilters : undefined}
                        live
                        placeholder="Search categories, subcategories, products, or brands…"
                    >
                        <SelectFilter
                            value={brandId}
                            onChange={(e) => setBrandId(e.target.value)}
                            options={brandOptions}
                            placeholder="All brands"
                            aria-label="Filter by brand"
                            className="w-full sm:w-40"
                        />
                        <SelectFilter
                            value={categoryId}
                            onChange={(e) => {
                                setCategoryId(e.target.value);
                                setSubcategoryId("");
                            }}
                            options={categoryOptions}
                            placeholder="All categories"
                            aria-label="Filter by category"
                            className="w-full sm:w-44"
                        />
                        <SelectFilter
                            value={subcategoryId}
                            onChange={(e) => setSubcategoryId(e.target.value)}
                            options={subcategoryOptions}
                            placeholder="All subcategories"
                            aria-label="Filter by subcategory"
                            className="w-full sm:w-44"
                        />
                        <SelectFilter
                            value={approvalFilter}
                            onChange={(e) => setApprovalFilter(e.target.value)}
                            options={APPROVAL_FILTERS}
                            placeholder="All approvals"
                            aria-label="Filter by approval status"
                            className="w-full sm:w-36"
                        />
                        <SelectFilter
                            value={activeFilter}
                            onChange={(e) => setActiveFilter(e.target.value)}
                            options={ACTIVE_FILTERS}
                            placeholder="All statuses"
                            aria-label="Filter by active status"
                            className="w-full sm:w-32"
                        />
                    </SearchToolbar>

                    {hasActiveFilters && !loading && !error && (
                        <div className="catalog-search-meta" role="status">
                            <span>
                                {search ? (
                                    <>
                                        Showing matches for <strong>“{search}”</strong>
                                        {" · "}
                                    </>
                                ) : (
                                    <>Filtered catalog · </>
                                )}
                                {visibleCategories.length} categor
                                {visibleCategories.length === 1 ? "y" : "ies"}
                                {" · "}
                                {matchedProductCount} product
                                {matchedProductCount === 1 ? "" : "s"}
                                {" · "}
                                {filteredBrands.length} brand
                                {filteredBrands.length === 1 ? "" : "s"}
                            </span>
                            <button
                                type="button"
                                className="catalog-search-meta__clear"
                                onClick={clearFilters}
                            >
                                Clear filters
                            </button>
                        </div>
                    )}

                    <div className="catalog-layout">
                        <section
                            className={`catalog-panel catalog-panel--tree ${
                                activeView === "tree"
                                    ? "catalog-panel--active"
                                    : "catalog-panel--hidden-mobile"
                            }`}
                        >
                            <header className="catalog-panel__header">
                                <div className="catalog-panel__heading">
                                    <Layers
                                        size={18}
                                        className="catalog-panel__heading-icon"
                                        aria-hidden
                                    />
                                    <div>
                                        <h2 className="catalog-panel__title">Catalog tree</h2>
                                        <p className="catalog-panel__subtitle">
                                            Category → Subcategory → Products
                                        </p>
                                    </div>
                                </div>
                                {!loading && !error && (
                                    <div className="catalog-panel__actions">
                                        <button
                                            type="button"
                                            className="catalog-panel__action"
                                            onClick={expandAll}
                                            disabled={treeEmpty}
                                        >
                                            <ChevronDown size={14} aria-hidden />
                                            Expand
                                        </button>
                                        <button
                                            type="button"
                                            className="catalog-panel__action"
                                            onClick={collapseAll}
                                            disabled={!hasExpanded}
                                        >
                                            Collapse
                                        </button>
                                        <span className="catalog-panel__badge">
                                            {visibleCategories.length} cat · {matchedProductCount}{" "}
                                            products
                                        </span>
                                    </div>
                                )}
                            </header>

                            <div className="catalog-panel__body">
                                {loading ? (
                                    <div className="catalog-skeleton-list">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="catalog-skeleton-row ds-skeleton"
                                            />
                                        ))}
                                    </div>
                                ) : error ? (
                                    <PageError message={error} onRetry={() => fetchAll()} />
                                ) : treeEmpty ? (
                                    <PageEmpty
                                        title={
                                            hasActiveFilters
                                                ? "No catalog matches"
                                                : "No catalog items yet"
                                        }
                                        description={
                                            hasActiveFilters
                                                ? "Try different filters, or clear them."
                                                : "Categories and products will appear here once available."
                                        }
                                        icon={hasActiveFilters ? SearchX : Package}
                                    />
                                ) : (
                                    <>
                                        <div className="catalog-category-list">
                                            {visibleCategories.map((category) => (
                                                <CategoryAccordionItem
                                                    key={category.id}
                                                    category={category}
                                                    subcategories={
                                                        subcategoriesByCategory.get(
                                                            String(category.id)
                                                        ) || []
                                                    }
                                                    productsBySubcategory={productsBySubcategory}
                                                    expanded={expandedCategoryIds.has(
                                                        String(category.id)
                                                    )}
                                                    onToggle={() => toggleCategory(category.id)}
                                                    expandedSubIds={expandedSubIds}
                                                    onToggleSub={toggleSubcategory}
                                                    search={search}
                                                    hasProductFilters={hasProductFilters}
                                                />
                                            ))}
                                        </div>

                                        {filteredUnassigned.length > 0 && !subcategoryId && (
                                            <div className="catalog-unassigned">
                                                <header className="catalog-unassigned__header">
                                                    <Package size={16} aria-hidden />
                                                    <span>Other products</span>
                                                    <span className="catalog-unassigned__hint">
                                                        No subcategory assigned
                                                    </span>
                                                    <span className="catalog-unassigned__count">
                                                        {filteredUnassigned.length}
                                                    </span>
                                                </header>
                                                <div className="catalog-product-grid catalog-product-grid--flat">
                                                    {filteredUnassigned.map((product) => (
                                                        <ProductCatalogCard
                                                            key={product.id}
                                                            product={product}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </section>

                        <section
                            className={`catalog-panel catalog-panel--brands ${
                                activeView === "brands"
                                    ? "catalog-panel--active"
                                    : "catalog-panel--hidden-mobile"
                            }`}
                        >
                            <header className="catalog-panel__header">
                                <div className="catalog-panel__heading">
                                    <Tag
                                        size={18}
                                        className="catalog-panel__heading-icon"
                                        aria-hidden
                                    />
                                    <div>
                                        <h2 className="catalog-panel__title">Brands</h2>
                                        <p className="catalog-panel__subtitle">
                                            Approved brand names for listings
                                        </p>
                                    </div>
                                </div>
                                {!loading && !error && (
                                    <span className="catalog-panel__badge">
                                        {filteredBrands.length} brands
                                    </span>
                                )}
                            </header>

                            <div className="catalog-panel__body">
                                {loading ? (
                                    <div className="catalog-brand-grid catalog-brand-grid--loading">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="catalog-brand-card ds-skeleton catalog-skeleton-brand"
                                            />
                                        ))}
                                    </div>
                                ) : error ? null : filteredBrands.length === 0 ? (
                                    <PageEmpty
                                        title={
                                            hasActiveFilters ? "No brands found" : "No brands yet"
                                        }
                                        description={
                                            hasActiveFilters
                                                ? "Try different filters, or clear them."
                                                : "Approved brands will show up here."
                                        }
                                        icon={Tag}
                                    />
                                ) : (
                                    <div className="catalog-brand-grid">
                                        {filteredBrands.map((brand) => {
                                            const id = String(
                                                brand.id ?? brand.brand_id ?? brand.brand_name_id ?? ""
                                            );
                                            const count =
                                                brand.product_count ??
                                                productCountByBrand.get(id) ??
                                                0;
                                            return (
                                                <BrandCard
                                                    key={id || brand.name}
                                                    brand={brand}
                                                    productCount={count}
                                                    onClick={() => selectBrandFromCard(brand)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </DashboardPageShell>
        </div>
    );
}
