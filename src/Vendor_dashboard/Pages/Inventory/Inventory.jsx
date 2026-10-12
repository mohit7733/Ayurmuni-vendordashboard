import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Inventory.css";
import Ayurvedaimage from "../../../Assests/Ayurvedaimage.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEdit, FaEye } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { vendorService } from "../../../services/vendorService";
import UnicommerceNotice from "../../components/shared/UnicommerceNotice";
import DashboardPageShell from "../../components/shared/DashboardPageShell";
import Button from "../../components/shared/Button";
import { PageEmpty, PageError, PaginationBar } from "../../components/shared/PageState";
import { ProductListSkeleton } from "../../components/shared/Skeleton";
import StatusBadge from "../../components/shared/StatusBadge";
import SearchToolbar, { SelectFilter } from "../../components/shared/SearchToolbar";
import StatCard from "../../components/shared/StatCard";
import usePersistedState from "../../hooks/usePersistedState";
import {
  getVariantCoverImageUrl,
  getVariantQuantity,
  mapVariantFromApi,
  UNICOMMERCE_NOTICES,
} from "../../../utils/unicommerceHelpers";
import "../../components/shared/vendor-shared.css";

const LOW_STOCK_THRESHOLD = 10;
const PRODUCT_PAGE_SIZE_MAX = 100;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const FILTER_LABELS = {
  all: "All products",
  in_stock: "In stock",
  out_of_stock: "Out of stock",
  low_stock: "Low stock",
  pending_approval: "Pending approval",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  active: "Active",
  inactive: "Inactive",
  draft: "Draft",
};

const FILTER_ORDER = [
  "in_stock",
  "low_stock",
  "out_of_stock",
  "pending_approval",
  "pending",
  "approved",
  "rejected",
  "active",
  "inactive",
  "draft",
];

function labelForKey(key) {
  if (FILTER_LABELS[key]) return FILTER_LABELS[key];
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isCountValue(value) {
  return value != null && typeof value !== "object" && Number.isFinite(Number(value));
}

function clampPageSize(pageSize) {
  const size = Number(pageSize) || 10;
  return Math.min(Math.max(1, size), PRODUCT_PAGE_SIZE_MAX);
}

function parseProductListResponse(response) {
  const data = response?.data?.data || {};
  const results = Array.isArray(data.results) ? data.results : [];
  const summary = data.summary && typeof data.summary === "object" && !Array.isArray(data.summary) ? data.summary : {};
  const filters = data.filters && typeof data.filters === "object" && !Array.isArray(data.filters) ? data.filters : {};
  return {
    results,
    count: Number(data.count) || 0,
    summary,
    filters,
  };
}

function buildFilterTabs(apiFilters = {}) {
  const extras = Object.keys(apiFilters).filter(
    (key) => key !== "in_stock" && isCountValue(apiFilters[key])
  );
  extras.sort((a, b) => {
    const ai = FILTER_ORDER.indexOf(a);
    const bi = FILTER_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return ["all", "in_stock", ...extras].map((key) => ({
    key,
    label: labelForKey(key),
  }));
}

function getSummaryCards(summary = {}) {
  return Object.entries(summary)
    .filter(([, value]) => isCountValue(value))
    .map(([key, value]) => {
      const numeric = Number(value);
      const money = /value|amount|revenue|price/i.test(key);
      if (money) {
        return {
          key,
          label: labelForKey(key),
          value: `₹${numeric.toLocaleString("en-IN")}`,
        };
      }
      return {
        key,
        label: labelForKey(key),
        numericValue: numeric,
      };
    });
}

function normalizeBrand(brand) {
  if (!brand || typeof brand !== "object") return null;
  const id = brand.id ?? brand.brand_id ?? brand.brand_name_id;
  if (id == null || id === "") return null;
  return {
    id: String(id),
    name: brand.name || brand.brand_name || "Untitled brand",
  };
}

const getVariantStatus = (stock) => {
  if (stock == null || stock <= 0) return "out-of-stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "instock";
};

const getTagClass = (product) => {
  const name = (product.name || "").toLowerCase();
  if (name.includes("ashwagandha") || name.includes("herb")) return "iv-tag-ayurveda";
  if (name.includes("tea") || name.includes("beverage")) return "iv-tag-beverage";
  if (product.is_nutrition) return "iv-tag-nutrition";
  return "iv-tag-ayurveda";
};

const getTagLabel = (product) => {
  const name = (product.name || "").toLowerCase();
  if (name.includes("ashwagandha") || name.includes("herb")) return "Ayurveda Herbs";
  if (name.includes("tea") || name.includes("beverage")) return "Beverage";
  if (product.is_nutrition) return "Nutrition";
  return "Ayurveda Herbs";
};

function VariantRow({ product, variant, onToggleStatus }) {
  const qty = getVariantQuantity(variant);
  const stockStatus = getVariantStatus(qty);
  const avatarUrl = getVariantCoverImageUrl(variant) || Ayurvedaimage;

  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-lg border bg-white shadow-sm">
            <img
              src={avatarUrl}
              alt={variant.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = Ayurvedaimage;
              }}
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800">{variant.title}</h4>
            <StatusBadge status={variant.approval_status} className="mt-1" />
          </div>
        </div>
      </td>
      <td>
        <div className="flex flex-col gap-1">
          <code className="rounded-md bg-gray-100 px-2 py-1 text-sm">{variant.vendor_sku_code || "—"}</code>
          {variant.sku_code && (
            <code className="text-sm text-gray-500" title="Unicommerce system SKU">
              {variant.sku_code}
            </code>
          )}
        </div>
      </td>
      <td>₹{Number(variant.mrp || 0).toLocaleString()}</td>
      <td className="font-semibold text-[#0D614E]">₹{Number(variant.selling_price || 0).toLocaleString()}</td>
      <td>{qty} units</td>
      <td><StatusBadge status={stockStatus} /></td>
      <td className=" items-center gap-2">
        <StatusBadge status={variant.status || "draft"} />
        <button type="button" className="ml-4 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 transition hover:bg-[#0D614E] hover:text-white" onClick={() => onToggleStatus(product.id, variant.id, variant.status === "active" ? "inactive" : "active")}>
          {variant.status === "active" ? "Inactive" : "Active"}
        </button>
      </td>
    </tr>
  );
}

function ProductBlock({ product, expanded, onToggle, onToggleStatus, onDelete }) {
  const firstVariantWithImage =
    (product.variants || []).find((v) => getVariantCoverImageUrl(v)) || product.variants?.[0];
  const avatarUrl = getVariantCoverImageUrl(firstVariantWithImage) || Ayurvedaimage;
  const isExpanded = expanded === product.id;

  return (
    <div className="iv-product-block ds-card ds-card-interactive ds-animate-in">
      <div className="iv-product-header">
        <div className="iv-product-avatar shadow-md">
          <img
            src={avatarUrl}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = Ayurvedaimage;
            }}
          />
        </div>
        <div className="iv-product-info">
          <div className="iv-product-name">
            {product.name}
            {/* <span className={`iv-product-tag ${getTagClass(product)}`}>{getTagLabel(product)}</span> */}
          </div>
          <div className="iv-product-meta">
            <span className="iv-meta-label">Brand:</span>
            <span className="iv-meta-value">{product.brand_name || "—"}</span>
            <span className="iv-meta-dot">•</span>
            <span className="iv-meta-label">Variants:</span>
            <span className="iv-meta-value">{product.variants?.length || 0}</span>
            {product.product_subcategory_name && (
              <>
                <span className="iv-meta-dot">•</span>
                <span className="iv-meta-value">{product.product_subcategory_name}</span>
              </>
            )}
          </div>
        </div>
        <button type="button" className="iv-btn-view-all ds-focus active:scale-[0.98] transition-transform duration-200" onClick={() => onToggle(product.id)}>
          {isExpanded ? "Hide Variants" : "View Variants"}
        </button>
        <div className="flex items-center gap-2">
          <Link
            to={`/vendor/products/${product.id}`}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50"
          >
            View
          </Link>
          <Link
            to={`/vendor/edit-product/${product.id}`}
            className="rounded-lg border border-green-200 p-2 !text-green-600 transition hover:bg-green-50"
            aria-label="Edit product"
          >
            <FaEdit size={16} />
          </Link>
          {/* <button
            type="button"
            className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
            onClick={() => onDelete(product)}
            aria-label="Delete product"
          >
            <FiTrash2 size={16} />
          </button> */}
        </div>
      </div>

      {isExpanded && (
        <div className="vendor-table-wrap mt-3 border-0 shadow-none ds-animate-in overflow-x-auto ds-scroll">
          <table className="vendor-table iv-variants-table">
            <thead>
              <tr>
                <th>Variant</th>
                <th>SKU (Vendor / System)</th>
                <th>MRP</th>
                <th>Selling Price</th>
                <th>Quantity</th>
                <th>Stock</th>
                <th>Lifecycle</th>
              </tr>
            </thead>
            <tbody>
              {(product.variants || []).map((variant) => (
                <VariantRow key={variant.id} product={product} variant={variant} onToggleStatus={onToggleStatus} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function InventoryVault() {
  const navigate = useNavigate();
  const location = useLocation();
  const listRequestRef = useRef(0);
  const metaRequestRef = useRef(0);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [catalogCount, setCatalogCount] = useState(0);
  const [summary, setSummary] = useState({});
  const [apiFilters, setApiFilters] = useState({});
  const [searchInput, setSearchInput] = useState(location.state?.search || "");
  const [search, setSearch] = useState(location.state?.search || "");
  const [brandId, setBrandId] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [pageSize, setPageSize] = usePersistedState("vendor:inventory:pageSize", 10);
  const safePageSize = clampPageSize(pageSize);

  const listQuery = useMemo(
    () => ({
      search: search || undefined,
      brand_id: brandId || undefined,
      filter: stockFilter === "all" ? undefined : stockFilter,
    }),
    [search, brandId, stockFilter]
  );

  const fetchFilterMeta = useCallback(async () => {
    const requestId = ++metaRequestRef.current;
    try {
      const response = await vendorService.getProducts({
        page: 1,
        page_size: 1,
        search: search || undefined,
        brand_id: brandId || undefined,
      });
      if (requestId !== metaRequestRef.current) return;
      if (response.data?.success === false) return;
      const parsed = parseProductListResponse(response);
      setSummary(parsed.summary);
      setApiFilters(parsed.filters);
      setCatalogCount(parsed.count);
    } catch {
      if (requestId !== metaRequestRef.current) return;
    }
  }, [search, brandId]);

  const fetchProducts = useCallback(async () => {
    const requestId = ++listRequestRef.current;
    try {
      setLoading(true);
      setError("");
      const response = await vendorService.getProducts({
        page: currentPage,
        page_size: safePageSize,
        ...listQuery,
      });
      if (requestId !== listRequestRef.current) return;

      if (response.data?.success) {
        const parsed = parseProductListResponse(response);
        setProducts(
          parsed.results.map((product) => ({
            ...product,
            variants: (product.variants || []).map(mapVariantFromApi),
          }))
        );
        setTotalCount(parsed.count);
        if (!listQuery.filter) {
          setSummary(parsed.summary);
          setApiFilters(parsed.filters);
          setCatalogCount(parsed.count);
        }
      } else {
        setProducts([]);
        setTotalCount(0);
        setError(response.data?.message || "Failed to load products");
      }
    } catch (err) {
      if (requestId !== listRequestRef.current) return;
      setProducts([]);
      setTotalCount(0);
      setError(err?.response?.data?.message || err.message || "Failed to load products");
    } finally {
      if (requestId === listRequestRef.current) {
        setLoading(false);
      }
    }
  }, [currentPage, safePageSize, listQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!listQuery.filter) return undefined;
    fetchFilterMeta();
    return undefined;
  }, [fetchFilterMeta, listQuery.filter]);

  useEffect(() => {
    if (loading || totalCount <= 0) return;
    const maxPage = Math.max(1, Math.ceil(totalCount / safePageSize));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [loading, totalCount, safePageSize, currentPage]);

  useEffect(() => {
    let cancelled = false;
    vendorService
      .getFieldInfo("brand-name")
      .then((response) => {
        if (cancelled) return;
        const list = Array.isArray(response.data?.data) ? response.data.data : [];
        setBrands(list.map(normalizeBrand).filter(Boolean));
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const brandOptions = useMemo(
    () => brands.map((brand) => ({ value: brand.id, label: brand.name })),
    [brands]
  );

  const filterTabs = useMemo(() => buildFilterTabs(apiFilters), [apiFilters]);
  const summaryCards = useMemo(() => getSummaryCards(summary), [summary]);

  const pageSizeOptions = useMemo(() => {
    if (PAGE_SIZE_OPTIONS.includes(safePageSize)) return PAGE_SIZE_OPTIONS;
    return [...PAGE_SIZE_OPTIONS, safePageSize].sort((a, b) => a - b);
  }, [safePageSize]);

  const hasActiveFilters = Boolean(search || brandId || stockFilter !== "all");
  const lowStockCount = Number(summary.low_stock ?? apiFilters.low_stock) || 0;
  const canFilterLowStock = isCountValue(apiFilters.low_stock);

  const applyFilter = (key) => {
    setStockFilter(key);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setBrandId("");
    setStockFilter("all");
    setCurrentPage(1);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}" and all its variants?`)) return;
    try {
      await vendorService.deleteProduct(product.id);
      toast.success("Product deleted");
      fetchProducts();
      fetchFilterMeta();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete product");
    }
  };

  const handleToggleStatus = async (productId, variantId, status) => {
    try {
      await vendorService.updateVariants(productId, variantId, { status });
      toast.success(`Variant status updated to ${status}`);
      fetchProducts();
      fetchFilterMeta();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update variant status");
    }
  };

  return (
    <DashboardPageShell
      title="Product"
      accent="Catalog"
      subtitle="Manage your product catalog, variants, and approval status. Stock quantities are updated via Stock Management."
      breadcrumbs={[{ label: "Dashboard" }, { label: "Products" }]}
      actions={
        <>
          {lowStockCount > 0 && (
            <Button
              variant="pill"
              onClick={canFilterLowStock ? () => applyFilter("low_stock") : undefined}
            >
              {lowStockCount} low stock variant{lowStockCount > 1 ? "s" : ""}
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate("/vendor/bulk-upload-products")}>
            Bulk Upload
          </Button>
          <Button onClick={() => navigate("/vendor/new-product")}>+ Add Product</Button>
        </>
      }
    >
      <UnicommerceNotice>
        {UNICOMMERCE_NOTICES.pendingVariant} Use Stock Management to update quantities for approved variants — changes sync to Unicommerce.
      </UnicommerceNotice>
      {/* 
      {summaryCards.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <StatCard
              key={card.key}
              title={card.label}
              value={card.value}
              numericValue={card.numericValue}
            />
          ))}
        </div>
      )} */}

      <SearchToolbar
        className="!mb-4"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onSubmit={(e) => {
          e.preventDefault();
          setCurrentPage(1);
          setSearch(searchInput.trim());
        }}
        onClear={searchInput ? () => {
          setSearch("");
          setSearchInput("");
          setCurrentPage(1);
        } : undefined}
        placeholder="Search by product name"
      >
        <SelectFilter
          value={brandId}
          onChange={(e) => {
            setBrandId(e.target.value);
            setCurrentPage(1);
          }}
          options={brandOptions}
          placeholder="All brands"
          aria-label="Filter by brand"
          className="w-full sm:w-52"
        />
      </SearchToolbar>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Product filters">
          {filterTabs.map((tab) => {
            const active = stockFilter === tab.key;
            const count = tab.key === "all" ? catalogCount : Number(apiFilters[tab.key]) || 0;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition ${active
                  ? "border-[#0D614E] bg-[#0D614E] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                onClick={() => applyFilter(tab.key)}
              >
                {tab.label}
                <span
                  className={`inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${active ? "bg-white/20" : "bg-black/[0.06]"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto text-xs font-medium text-[#0D614E] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <ProductListSkeleton count={safePageSize > 5 ? 5 : safePageSize} />
      ) : error ? (
        <PageError message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <PageEmpty
          title={hasActiveFilters ? "No matching products" : "No products yet"}
          description={
            hasActiveFilters
              ? "Try a different product name, brand, or stock filter."
              : "Start building your catalog by adding your first product."
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="secondary" onClick={() => navigate("/vendor/bulk-upload-products")}>
                  Bulk Upload
                </Button>
                <Button onClick={() => navigate("/vendor/new-product")}>+ Add Product</Button>
              </div>
            )
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">
            <strong className="font-semibold text-gray-800">{totalCount.toLocaleString()}</strong>{" "}
            {stockFilter === "all" ? "products" : labelForKey(stockFilter).toLowerCase()}
          </p>
          <div className="ds-stagger space-y-4">
            {products.map((product) => (
              <ProductBlock
                key={product.id}
                product={product}
                expanded={expanded}
                onToggle={(id) => setExpanded((prev) => (prev === id ? "" : id))}
                onDelete={handleDeleteProduct}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
          <PaginationBar
            page={currentPage}
            pageSize={safePageSize}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => setPageSize(clampPageSize(size))}
            pageSizeOptions={pageSizeOptions}
            storageKey="vendor:inventory"
            itemLabel="products"
          />
        </>
      )}
    </DashboardPageShell>
  );
}
