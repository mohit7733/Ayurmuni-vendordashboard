import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Inventory.css";
import Ayurvedaimage from "../../../Assests/Ayurvedaimage.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEdit, FaEye } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { Download } from "lucide-react";
import JsBarcode from "jsbarcode";
import JSZip from "jszip";
import toast from "react-hot-toast";
import { vendorService } from "../../../services/vendorService";
import UnicommerceNotice from "../../components/shared/UnicommerceNotice";
import DashboardPageShell from "../../components/shared/DashboardPageShell";
import Button from "../../components/shared/Button";
import Modal from "../../components/shared/Modal";
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
import {
  extractApiErrorMessage,
  exportRowsToExcel,
  mapCatalogueToRows,
} from "../../utils/exportHelpers";
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
  approved: "Approved Variants",
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

const STOCK_FILTER_KEYS = new Set(["in_stock", "low_stock", "out_of_stock"]);
const APPROVAL_FILTER_KEYS = new Set([
  "pending",
  "approved",
  "rejected",
  "suspended",
  "pending_approval",
]);
const VARIANT_STATUS_KEYS = new Set(["draft", "active", "inactive"]);

const CATALOG_TYPE_OPTIONS = [
  { value: "all", label: "All catalogue" },
  { value: "products", label: "Products" },
  { value: "medicines", label: "Medicines" },
];

const APPROVAL_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const VARIANT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const STOCK_STATUS_OPTIONS = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

const BOOL_FILTER_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const DATE_INPUT_CLASS =
  "box-border h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0D614E]/30 focus:border-[#0D614E]/40";

const SELECT_FULL_CLASS = "w-full";

const DEFAULT_DOWNLOAD_FILTERS = {
  catalogType: "all",
  search: "",
  brandId: "",
  serviceCategoryId: "",
  approvalStatus: "",
  variantStatus: "",
  stockStatus: "",
  isActive: "",
  isFeatured: "",
  isNutrition: "",
  fromDate: "",
  toDate: "",
};

function mapTabFilterToCatalogueParams(stockFilter) {
  if (!stockFilter || stockFilter === "all") return {};
  if (STOCK_FILTER_KEYS.has(stockFilter)) return { stock: stockFilter };
  if (stockFilter === "pending_approval") return { approval_status: "pending" };
  if (APPROVAL_FILTER_KEYS.has(stockFilter)) return { approval_status: stockFilter };
  if (VARIANT_STATUS_KEYS.has(stockFilter)) return { variant_status: stockFilter };
  return {};
}

function buildCatalogueQuery(filters = {}) {
  return {
    catalog: filters.catalogType && filters.catalogType !== "all" ? filters.catalogType : undefined,
    search: filters.search || undefined,
    brand_id: filters.brandId || undefined,
    service_category_id: filters.serviceCategoryId || undefined,
    approval_status: filters.approvalStatus || undefined,
    variant_status: filters.variantStatus || undefined,
    stock: filters.stockStatus || undefined,
    is_active: filters.isActive || undefined,
    is_featured: filters.isFeatured || undefined,
    is_nutrition: filters.isNutrition || undefined,
    from_date: filters.fromDate || undefined,
    to_date: filters.toDate || undefined,
  };
}

function CatalogueFilterField({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      {children}
    </label>
  );
}

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

function sanitizeFilenamePart(value, fallback = "item") {
  return String(value || "")
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || fallback;
}

function createSkuBarcodeCanvas(sku) {
  const value = String(sku || "").trim();
  if (!value) {
    throw new Error("SKU is missing");
  }

  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, {
    format: "CODE128",
    displayValue: true,
    fontSize: 16,
    height: 80,
    margin: 16,
    background: "#ffffff",
    lineColor: "#000000",
  });
  return canvas;
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create barcode image"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

function triggerBlobDownload(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function downloadSkuBarcode(sku, productName = "") {
  const value = String(sku || "").trim();
  if (!value) {
    toast.error("SKU is missing for this variant");
    return;
  }

  try {
    const canvas = createSkuBarcodeCanvas(value);
    const namePart = sanitizeFilenamePart(productName, "product");
    const skuPart = sanitizeFilenamePart(value, "sku");
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${namePart}-${skuPart}-barcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Barcode downloaded");
  } catch (error) {
    toast.error(error?.message || "Failed to generate barcode");
  }
}

function buildBarcodeZipEntryName(productName, sku, usedNames) {
  const namePart = sanitizeFilenamePart(productName, "product");
  const skuPart = sanitizeFilenamePart(sku, "sku");
  let base = `${namePart}-${skuPart}-barcode.png`;
  let candidate = base;
  let index = 2;
  while (usedNames.has(candidate)) {
    candidate = `${namePart}-${skuPart}-barcode-${index}.png`;
    index += 1;
  }
  usedNames.add(candidate);
  return candidate;
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

function getServiceCategory(item) {
  const category = item?.service_category;
  const name = (
    item?.service_category_name ||
    (category && typeof category === "object" ? category.name : "") ||
    ""
  ).trim();
  if (!name) return null;
  const id =
    item?.service_category_id ??
    item?.service_categoryId ??
    (category && typeof category === "object"
      ? category.id ?? category.pk
      : category) ??
    item?.id;
  return {
    id: id == null || id === "" ? "" : String(id),
    name,
  };
}

function uniqueServiceCategories(items = []) {
  return Array.from(
    new Map(
      items
        .map(getServiceCategory)
        .filter(Boolean)
        .map((category) => [
          category.id || category.name.toLowerCase(),
          category,
        ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
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
  const barcodeSku = String(variant.sku_code || "").trim();

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
          <button
            type="button"
            className="iv-barcode-download"
            onClick={() => downloadSkuBarcode(barcodeSku, product.name || variant.title)}
            disabled={!barcodeSku}
            title={barcodeSku ? `Download barcode for ${barcodeSku}` : "SKU required to download barcode"}
            aria-label={barcodeSku ? `Download barcode for ${barcodeSku}` : "SKU required to download barcode"}
          >
            <Download size={14} aria-hidden="true" />
            Download barcode
          </button>
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
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const firstVariantWithImage =
    variants.find((variant) => getVariantCoverImageUrl(variant)) || variants[0];
  const avatarUrl = getVariantCoverImageUrl(firstVariantWithImage) || Ayurvedaimage;
  const isExpanded = expanded === product.id;
  const approvalCounts = variants.reduce((counts, variant) => {
    if (Object.prototype.hasOwnProperty.call(counts, variant.approval_status)) {
      counts[variant.approval_status] += 1;
    }
    return counts;
  }, { approved: 0, pending: 0, suspended: 0, rejected: 0 });

  return (
    <div className="iv-product-block ds-card ds-card-interactive ds-animate-in">
      <div className="iv-product-header">
        <div className="iv-product-avatar">
          <img
            src={avatarUrl}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = Ayurvedaimage;
            }}
          />
        </div>
        <div className="iv-product-info">
          <h3 className="iv-product-name">{product.name}</h3>
          <div className="iv-product-facts">
            <div className="iv-fact">
              <span className="iv-fact-label">Brand</span>
              <p className="iv-fact-value">{product.brand_name || "—"}</p>
            </div>
            {product.service_category_name && (
              <div className="iv-fact">
                <span className="iv-fact-label">Category</span>
                <p className="iv-fact-value">{product.service_category_name}</p>
              </div>
            )}
            {product.product_subcategory && (
              <div className="iv-fact">
                <span className="iv-fact-label">Subcategory</span>
                <p className="iv-fact-value">{product.product_subcategory}</p>
              </div>
            )}
            {Array.isArray(product.health_diseases) && product.health_diseases.length > 0 && (
              <div className="iv-fact">
                <span className="iv-fact-label">Health concerns</span>
                <p className="iv-fact-value">{product.health_diseases.length}</p>
              </div>
            )}
            {variants && (
              <div className="iv-fact">
                <span className="iv-fact-label">{variants.length === 1 ? "variant" : "variants"}</span>
                <p className="iv-fact-value">{variants.length} </p>
              </div>
            )}
          </div>
          <div className="iv-approval-summary" aria-label="Variant approval summary">
            {Object.entries(approvalCounts).map(([status, count]) => count > 0 && (
              <span key={status} className={`iv-approval-chip iv-approval-${status}`}>
                {count} {status}
              </span>
            ))}
          </div>
        </div>
        <div className="iv-product-actions">
          <button
            type="button"
            className="iv-action iv-action-primary ds-focus"
            onClick={() => onToggle(product.id)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Hide variants" : "View variants"}
          </button>
          <Link
            to={`/vendor/products/${product.id}`}
            className="iv-action"
          >
            <FaEye aria-hidden="true" />
            View
          </Link>
          <Link
            to={`/vendor/edit-product/${product.id}`}
            className="iv-action iv-action-edit"
          >
            <FaEdit aria-hidden="true" />
            Edit
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
                <VariantRow
                  key={variant.id}
                  product={product}
                  variant={variant}
                  onToggleStatus={onToggleStatus}
                />
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
  const [serviceCategories, setServiceCategories] = useState([]);
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
  const [serviceCategoryId, setServiceCategoryId] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [pageSize, setPageSize] = usePersistedState("vendor:inventory:pageSize", 10);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadFilters, setDownloadFilters] = useState(DEFAULT_DOWNLOAD_FILTERS);
  const [downloadingCatalogue, setDownloadingCatalogue] = useState(false);
  const [downloadingBarcodes, setDownloadingBarcodes] = useState(false);
  const isDownloadingExport = downloadingCatalogue || downloadingBarcodes;
  const safePageSize = clampPageSize(pageSize);

  const listQuery = useMemo(
    () => ({
      search: search || undefined,
      brand_id: brandId || undefined,
      service_category_id: serviceCategoryId || undefined,
      filter: stockFilter === "all" ? undefined : stockFilter,
    }),
    [search, brandId, serviceCategoryId, stockFilter]
  );

  const fetchFilterMeta = useCallback(async () => {
    const requestId = ++metaRequestRef.current;
    try {
      const response = await vendorService.getProducts({
        page: 1,
        page_size: 1,
        search: search || undefined,
        brand_id: brandId || undefined,
        service_category_id: serviceCategoryId || undefined,
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
  }, [search, brandId, serviceCategoryId]);

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
    Promise.all([
      vendorService.getFieldInfo("brand-name"),
      vendorService.getFieldInfo("product-subcategory", { is_product_sale: true }),
    ])
      .then(([brandResponse, categoryResponse]) => {
        if (cancelled) return;
        const brandList = Array.isArray(brandResponse.data?.data) ? brandResponse.data.data : [];
        const categoryList = Array.isArray(categoryResponse.data?.data)
          ? categoryResponse.data.data
          : [];
        setBrands(brandList.map(normalizeBrand).filter(Boolean));
        setServiceCategories(uniqueServiceCategories(categoryList));
      })
      .catch(() => {
        if (!cancelled) {
          setBrands([]);
          setServiceCategories([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const brandOptions = useMemo(
    () => brands.map((brand) => ({ value: brand.id, label: brand.name })),
    [brands]
  );

  const serviceCategoryOptions = useMemo(
    () =>
      serviceCategories.map((category) => ({
        value: category.id || category.name,
        label: category.name,
      })),
    [serviceCategories]
  );

  const filterTabs = useMemo(() => buildFilterTabs(apiFilters), [apiFilters]);
  const summaryCards = useMemo(() => getSummaryCards(summary), [summary]);

  const pageSizeOptions = useMemo(() => {
    if (PAGE_SIZE_OPTIONS.includes(safePageSize)) return PAGE_SIZE_OPTIONS;
    return [...PAGE_SIZE_OPTIONS, safePageSize].sort((a, b) => a - b);
  }, [safePageSize]);

  const hasActiveFilters = Boolean(
    search || brandId || serviceCategoryId || stockFilter !== "all"
  );
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
    setServiceCategoryId("");
    setStockFilter("all");
    setCurrentPage(1);
  };

  const updateDownloadFilter = (key, value) => {
    setDownloadFilters((prev) => ({ ...prev, [key]: value }));
  };

  const openDownloadModal = () => {
    const fromTab = mapTabFilterToCatalogueParams(stockFilter);
    setDownloadFilters({
      ...DEFAULT_DOWNLOAD_FILTERS,
      search: search || searchInput || "",
      brandId,
      serviceCategoryId,
      approvalStatus: fromTab.approval_status || "",
      variantStatus: fromTab.variant_status || "",
      stockStatus: fromTab.stock || "",
    });
    setDownloadModalOpen(true);
  };

  const closeDownloadModal = () => {
    if (isDownloadingExport) return;
    setDownloadModalOpen(false);
  };

  const resetDownloadFilters = () => {
    setDownloadFilters({ ...DEFAULT_DOWNLOAD_FILTERS });
  };

  const fetchCatalogueResults = async (catalogueQuery) => {
    const allResults = [];
    let page = 1;
    const cataloguePageSize = 100;
    const maxPages = 50;

    while (page <= maxPages) {
      const response = await vendorService.getProductCatalogue({
        ...catalogueQuery,
        page,
        page_size: cataloguePageSize,
      });
      const payload = response?.data?.data || {};
      const results = Array.isArray(payload.results) ? payload.results : [];
      allResults.push(...results);

      if (!results.length || !payload.next) break;
      page += 1;
    }

    return allResults;
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

  const handleDownloadCatalogue = async () => {
    if (isDownloadingExport) return;
    const catalogueQuery = buildCatalogueQuery(downloadFilters);
    try {
      setDownloadingCatalogue(true);
      const allResults = await fetchCatalogueResults(catalogueQuery);

      if (!allResults.length) {
        toast.error("No products found for the selected filters");
        return;
      }

      const rows = mapCatalogueToRows(allResults);
      const stamp = new Date().toISOString().slice(0, 10);
      const catalogLabel = catalogueQuery.catalog || "all";
      exportRowsToExcel(`product-catalogue-${catalogLabel}-${stamp}.xlsx`, rows);
      toast.success(`Downloaded ${rows.length} product variant${rows.length > 1 ? "s" : ""}`);
      setDownloadModalOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err) || "Failed to download product catalogue");
    } finally {
      setDownloadingCatalogue(false);
    }
  };

  const handleDownloadBarcodes = async () => {
    if (isDownloadingExport) return;
    const catalogueQuery = buildCatalogueQuery(downloadFilters);
    try {
      setDownloadingBarcodes(true);
      const allResults = await fetchCatalogueResults(catalogueQuery);

      if (!allResults.length) {
        toast.error("No products found for the selected filters");
        return;
      }

      const zip = new JSZip();
      const usedNames = new Set();
      let generatedCount = 0;
      let skippedCount = 0;

      for (const item of allResults) {
        const sku = String(item?.sku_code || "").trim();
        if (!sku) {
          skippedCount += 1;
          continue;
        }

        try {
          const productName = item?.product?.name || item?.title || "product";
          const canvas = createSkuBarcodeCanvas(sku);
          const blob = await canvasToPngBlob(canvas);
          const filename = buildBarcodeZipEntryName(productName, sku, usedNames);
          zip.file(filename, blob);
          generatedCount += 1;
        } catch {
          skippedCount += 1;
        }
      }

      if (!generatedCount) {
        toast.error("No SKU codes found to generate barcodes");
        return;
      }

      const stamp = new Date().toISOString().slice(0, 10);
      const catalogLabel = catalogueQuery.catalog || "all";
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerBlobDownload(zipBlob, `sku-barcodes-${catalogLabel}-${stamp}.zip`);

      const skipNote = skippedCount ? ` (${skippedCount} skipped)` : "";
      toast.success(`Downloaded ${generatedCount} barcode${generatedCount > 1 ? "s" : ""}${skipNote}`);
      setDownloadModalOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err) || "Failed to download barcodes");
    } finally {
      setDownloadingBarcodes(false);
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
          <Button variant="secondary" onClick={openDownloadModal}>
            <Download size={16} />
            Download Catalogue / Barcodes
          </Button>
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
        <SelectFilter
          value={serviceCategoryId}
          onChange={(e) => {
            setServiceCategoryId(e.target.value);
            setCurrentPage(1);
          }}
          options={serviceCategoryOptions}
          placeholder="All service categories"
          aria-label="Filter by service category"
          className="w-full sm:w-56"
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
              ? "Try a different product name, brand, service category, or stock filter."
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

      <Modal
        open={downloadModalOpen}
        onClose={closeDownloadModal}
        title="Download Catalogue / Barcodes"
        subtitle="Choose filters, then download matching variants as Excel or SKU barcode images (ZIP)."
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={resetDownloadFilters}
              disabled={isDownloadingExport}
            >
              Reset
            </Button>
            <Button
              variant="secondary"
              onClick={closeDownloadModal}
              disabled={isDownloadingExport}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownloadBarcodes}
              loading={downloadingBarcodes}
              disabled={isDownloadingExport}
            >
              {!downloadingBarcodes && <Download size={16} />}
              Download Barcodes
            </Button>
            <Button
              onClick={handleDownloadCatalogue}
              loading={downloadingCatalogue}
              disabled={isDownloadingExport}
            >
              {!downloadingCatalogue && <Download size={16} />}
              Download Excel
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CatalogueFilterField label="Catalogue type">
            <SelectFilter
              value={downloadFilters.catalogType}
              onChange={(e) => updateDownloadFilter("catalogType", e.target.value || "all")}
              options={CATALOG_TYPE_OPTIONS}
              aria-label="Catalogue type"
              className={SELECT_FULL_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="Search">
            <input
              type="search"
              value={downloadFilters.search}
              onChange={(e) => updateDownloadFilter("search", e.target.value)}
              placeholder="Product, brand, or SKU"
              className={DATE_INPUT_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="Brand">
            <SelectFilter
              value={downloadFilters.brandId}
              onChange={(e) => updateDownloadFilter("brandId", e.target.value)}
              options={brandOptions}
              placeholder="All brands"
              aria-label="Brand"
              className={SELECT_FULL_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="Service category">
            <SelectFilter
              value={downloadFilters.serviceCategoryId}
              onChange={(e) => updateDownloadFilter("serviceCategoryId", e.target.value)}
              options={serviceCategoryOptions}
              placeholder="All service categories"
              aria-label="Service category"
              className={SELECT_FULL_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="Approval status">
            <SelectFilter
              value={downloadFilters.approvalStatus}
              onChange={(e) => updateDownloadFilter("approvalStatus", e.target.value)}
              options={APPROVAL_STATUS_OPTIONS}
              placeholder="All approval statuses"
              aria-label="Approval status"
              className={SELECT_FULL_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="Variant status">
            <SelectFilter
              value={downloadFilters.variantStatus}
              onChange={(e) => updateDownloadFilter("variantStatus", e.target.value)}
              options={VARIANT_STATUS_OPTIONS}
              placeholder="All variant statuses"
              aria-label="Variant status"
              className={SELECT_FULL_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="Stock">
            <SelectFilter
              value={downloadFilters.stockStatus}
              onChange={(e) => updateDownloadFilter("stockStatus", e.target.value)}
              options={STOCK_STATUS_OPTIONS}
              placeholder="All stock levels"
              aria-label="Stock"
              className={SELECT_FULL_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="Active">
            <SelectFilter
              value={downloadFilters.isActive}
              onChange={(e) => updateDownloadFilter("isActive", e.target.value)}
              options={BOOL_FILTER_OPTIONS}
              placeholder="Any"
              aria-label="Active"
              className={SELECT_FULL_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="Featured">
            <SelectFilter
              value={downloadFilters.isFeatured}
              onChange={(e) => updateDownloadFilter("isFeatured", e.target.value)}
              options={BOOL_FILTER_OPTIONS}
              placeholder="Any"
              aria-label="Featured"
              className={SELECT_FULL_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="Nutrition">
            <SelectFilter
              value={downloadFilters.isNutrition}
              onChange={(e) => updateDownloadFilter("isNutrition", e.target.value)}
              options={BOOL_FILTER_OPTIONS}
              placeholder="Any"
              aria-label="Nutrition"
              className={SELECT_FULL_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="From date">
            <input
              type="date"
              value={downloadFilters.fromDate}
              onChange={(e) => updateDownloadFilter("fromDate", e.target.value)}
              className={DATE_INPUT_CLASS}
            />
          </CatalogueFilterField>

          <CatalogueFilterField label="To date">
            <input
              type="date"
              value={downloadFilters.toDate}
              onChange={(e) => updateDownloadFilter("toDate", e.target.value)}
              min={downloadFilters.fromDate || undefined}
              className={DATE_INPUT_CLASS}
            />
          </CatalogueFilterField>
        </div>
      </Modal>
    </DashboardPageShell>
  );
}
