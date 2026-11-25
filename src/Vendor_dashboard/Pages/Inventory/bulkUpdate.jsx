import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Upload,
    Download,
    FileSpreadsheet,
    X,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Info,
    Trash2,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Package,
    Pencil,
    ImageIcon,
} from "lucide-react";
import { vendorService } from "../../../services/vendorService";
import DashboardPageShell from "../../components/shared/DashboardPageShell";
import Button from "../../components/shared/Button";
import {
    exportBulkUpdateWorkbook,
    extractApiErrorMessage,
} from "../../utils/exportHelpers";
import "../../components/shared/vendor-shared.css";

const UPLOAD_TEMPLATE_URL = "/templates/products_bulk_upload_template.xlsx";
const UPLOAD_TEMPLATE_FILENAME = "products_bulk_upload_template.xlsx";
const UPDATE_TEMPLATE_URL = "/templates/products_bulk_update_template.xlsx";
const UPDATE_TEMPLATE_FILENAME = "products_bulk_update_template.xlsx";

const ACCEPTED_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
];
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"];
const MAX_FILE_SIZE_MB = 15;

const SHEET_GUIDE = [
    {
        name: "Products",
        columns:
            "product_key, name, product_subcategory_id, brand_name_id, manufacturer, origin, short_description, full_description, how_to_use, health_disease_ids, benifits, treatment_type, compositions, side_effects, dosages, safety_information, model_number, is_nutrition, is_featured, is_active",
        tip: "One row per product. Use a temporary product_key (e.g. P0001) to link variants and gallery. Pipe-separate multiple health_disease_ids (id1|id2). Use IDs from the References sheet.",
    },
    {
        name: "Variants",
        columns:
            "product_key, vendor_sku_code, title, is_default, physical_state, calculation_mode, cost_per_item, size, weightage, selling_price, mrp, discount, is_free_shipping, shipping_amount, is_returnable, returnable_days, pay_on_delivery, prescription_required, expire_at, tax_name, tax_rate",
        tip: "One row per SKU/size. Match product_key to Products. Set is_default=True for the main variant. expire_at is optional (YYYY-MM-DD). For updates, keep existing vendor_sku_code values so rows match current variants.",
    },
    {
        name: "Gallery",
        columns: "product_key, vendor_sku_code, media_url, media_type, is_cover",
        tip: "One row per image/video. Link with product_key + vendor_sku_code. Only one is_cover=True per variant. media_type is usually image. Use public HTTPS URLs.",
    },
    {
        name: "References",
        columns:
            "product_subcategory_id / name, brand_name_id / name, health_disease_id / name, physical_state",
        tip: "Lookup sheet only — do not invent IDs. Copy exact UUIDs into Products and Variants. Sample product rows in other sheets can be deleted before upload.",
    },
];

const MODE_CONFIG = {
    upload: {
        label: "New Upload",
        pageTitle: "Bulk Upload",
        accent: "Products",
        subtitle: "Upload multiple products, variants, and images from one Excel file.",
        heading: (
            <>
                Bulk Upload <span className="text-[#0D614E]">Products</span>
            </>
        ),
        description:
            "Download the template, fill Products → Variants → Gallery, then upload the .xlsx file.",
        dropTitle: "Upload Excel File",
        dropHint: `Use the official new-product template (.xlsx). Max ${MAX_FILE_SIZE_MB} MB.`,
        actionLabel: "Upload Products",
        howTitle: "How it works",
        howSubtitle: "Follow these steps for a successful upload.",
        templateUrl: UPLOAD_TEMPLATE_URL,
        templateFilename: UPLOAD_TEMPLATE_FILENAME,
        templateButtonLabel: "Download Excel Template",
        successEmpty: "Your products are ready to review in the catalog.",
        successList: "These products were uploaded successfully.",
        resultNoun: "Upload",
        api: (file) => vendorService.bulkUploadProducts(file),
        steps: [
            <>
                Download the template and keep sheet names:{" "}
                <strong>Products</strong>, <strong>Variants</strong>,{" "}
                <strong>Gallery</strong>, <strong>References</strong>.
            </>,
            <>
                Fill product rows first, then add variants and gallery rows using the same{" "}
                <strong>product_key</strong>.
            </>,
            <>
                Copy subcategory, brand, and disease IDs from the{" "}
                <strong>References</strong> sheet — do not invent UUIDs.
            </>,
            <>Save as .xlsx, upload here, and fix any row errors shown after upload.</>,
        ],
        tips: [
            "Keep example rows or replace them — do not rename sheet headers.",
            <>
                Boolean fields use <code className="text-xs bg-gray-100 px-1 rounded">True</code> /{" "}
                <code className="text-xs bg-gray-100 px-1 rounded">False</code>.
            </>,
            <>
                Every variant needs a unique <strong>vendor_sku_code</strong>.
            </>,
            "Gallery media URLs must be publicly reachable HTTPS links.",
            "Stock quantity is managed separately in Stock Management after approval.",
        ],
    },
    update: {
        label: "Update",
        pageTitle: "Bulk Update",
        accent: "Products",
        subtitle: "Download your products, edit MRP, expiry, and other fields, then upload the update Excel.",
        heading: (
            <>
                Bulk Update <span className="text-[#0D614E]">Products</span>
            </>
        ),
        description:
            "Download Product Excel in the update template format, edit MRP / expiry / etc., then upload the same file.",
        dropTitle: "Upload Update Excel",
        dropHint: `Upload the same multi-sheet Excel you downloaded (.xlsx). Max ${MAX_FILE_SIZE_MB} MB.`,
        actionLabel: "Update Products",
        howTitle: "How update works",
        howSubtitle: "Download → edit → upload the same Excel format.",
        templateUrl: UPDATE_TEMPLATE_URL,
        templateFilename: UPDATE_TEMPLATE_FILENAME,
        templateButtonLabel: "Download Blank Update Template",
        successEmpty: "Your product updates are ready to review in the catalog.",
        successList: "These products were updated successfully.",
        resultNoun: "Update",
        api: (file) => vendorService.bulkUpdateProducts(file),
        steps: [
            <>
                Click <strong>Download Product Excel</strong> — it uses the same sheets as the update
                template (<strong>Products</strong>, <strong>Variants</strong>, <strong>Gallery</strong>,{" "}
                <strong>References</strong>).
            </>,
            <>
                Edit fields you want to change (e.g. <strong>mrp</strong>, <strong>selling_price</strong>,{" "}
                <strong>expire_at</strong>, descriptions). Keep <strong>vendor_sku_code</strong> and
                headers unchanged.
            </>,
            <>
                Save the same .xlsx file and upload it here — products will update via bulk-update.
            </>,
            <>Fix any row errors shown after update, then re-upload if needed.</>,
        ],
        tips: [
            "Download Product Excel and re-upload that same file after edits.",
            "Match existing variants by vendor_sku_code — do not invent new SKUs for updates.",
            "expire_at accepts YYYY-MM-DD or ISO datetime; leave blank if unchanged/none.",
            <>
                Boolean fields use <code className="text-xs bg-gray-100 px-1 rounded">True</code> /{" "}
                <code className="text-xs bg-gray-100 px-1 rounded">False</code>.
            </>,
            "Do not rename sheet names or header columns.",
            "Stock quantity is still managed separately in Stock Management.",
        ],
    },
};

const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const Badge = ({ children, tone = "gray" }) => {
    const tones = {
        gray: "bg-gray-100 text-gray-600",
        green: "bg-green-50 text-green-700",
        amber: "bg-amber-50 text-amber-700",
        blue: "bg-blue-50 text-blue-700",
        red: "bg-red-50 text-red-600",
    };
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tones[tone] || tones.gray}`}
        >
            {children}
        </span>
    );
};

const StatChip = ({ label, value, tone = "gray" }) => {
    const tones = {
        gray: "bg-white text-gray-700 border-gray-200",
        green: "bg-white text-green-700 border-green-200",
        blue: "bg-white text-blue-700 border-blue-200",
        amber: "bg-white text-amber-700 border-amber-200",
        red: "bg-white text-red-600 border-red-200",
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tones[tone] || tones.gray}`}
        >
            <span className="text-gray-400 font-normal">{label}</span>
            {value}
        </span>
    );
};

const pushErrorItem = (collected, item, fallbackIndex) => {
    if (item == null) return;
    if (typeof item === "string") {
        collected.push({
            row: null,
            sheet: null,
            field: null,
            product_key: null,
            vendor_sku_code: null,
            message: item,
        });
        return;
    }
    if (typeof item === "object") {
        collected.push({
            row: item.row ?? item.row_number ?? item.line ?? fallbackIndex ?? null,
            sheet: item.sheet ?? item.sheet_name ?? item.tab ?? null,
            field: item.field ?? item.column ?? item.key ?? null,
            product_key: item.product_key ?? item.productKey ?? null,
            vendor_sku_code: item.vendor_sku_code ?? item.sku ?? item.vendor_sku ?? null,
            message:
                item.message ||
                item.error ||
                item.detail ||
                (Array.isArray(item.errors) ? item.errors.join(", ") : null) ||
                JSON.stringify(item),
        });
    }
};

const normalizeErrors = (data) => {
    if (!data) return [];
    const collected = [];

    if (Array.isArray(data.errors)) {
        data.errors.forEach((e, i) => pushErrorItem(collected, e, i + 1));
    } else if (data.errors && typeof data.errors === "object") {
        Object.entries(data.errors).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((v) =>
                    pushErrorItem(
                        collected,
                        typeof v === "string"
                            ? { field: key, message: v }
                            : { ...v, field: v.field || key },
                        null
                    )
                );
            } else {
                pushErrorItem(
                    collected,
                    typeof value === "string"
                        ? { field: key, message: value }
                        : { ...value, field: value?.field || key },
                    null
                );
            }
        });
    }

    ["failed_rows", "validation_errors", "row_errors", "failed"].forEach((key) => {
        if (Array.isArray(data[key])) {
            data[key].forEach((e, i) => pushErrorItem(collected, e, i + 1));
        }
    });

    if (typeof data.detail === "string" && collected.length === 0) {
        pushErrorItem(collected, data.detail);
    }
    if (
        typeof data.message === "string" &&
        collected.length === 0 &&
        data.success === false
    ) {
        pushErrorItem(collected, data.message);
    }

    return collected;
};

const normalizeUploadedProducts = (data) => {
    if (!data) return [];

    const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.created_products)
            ? data.created_products
            : Array.isArray(data?.updated_products)
              ? data.updated_products
              : Array.isArray(data?.products)
                ? data.products
                : [];

    return rows
        .map((item) => {
            if (!item) return null;
            const product = item.product || item;
            if (!product || typeof product !== "object") return null;

            const variants = product.variants || item.variants || [];
            return {
                excel_product_key: item.product_key || product.product_key || null,
                id: product.id || item.id || null,
                name: product.name || item.name || "Untitled product",
                brand_name: product.brand_name || item.brand_name || "—",
                subcategory:
                    product.product_subcategory_name ||
                    item.product_subcategory_name ||
                    "—",
                variant_count: Array.isArray(variants) ? variants.length : item.variant_count ?? null,
                is_active: product.is_active ?? true,
                status:
                    item.status ||
                    (product.is_active === false ? "Inactive" : "Updated"),
                cover_url:
                    item.cover_url ||
                    product.cover_url ||
                    variants?.[0]?.gallery?.[0]?.media_url ||
                    variants?.[0]?.images?.[0]?.url ||
                    null,
            };
        })
        .filter(Boolean);
};

const extractSummary = (data, uploadedProducts = []) => {
    if (!data || typeof data !== "object") {
        return {
            created: null,
            updated: null,
            failed: null,
            total: null,
            skipped: null,
            variants: null,
        };
    }

    const createdFromList = uploadedProducts.length > 0 ? uploadedProducts.length : null;

    return {
        created:
            data.created ??
            data.created_count ??
            data.success_count ??
            data.products_created ??
            null,
        updated:
            data.updated ??
            data.updated_count ??
            data.products_updated ??
            (createdFromList && data.created == null ? createdFromList : null),
        failed: data.failed ?? data.failed_count ?? data.error_count ?? null,
        total: data.total ?? data.total_count ?? createdFromList,
        skipped: data.skipped ?? data.skipped_count ?? null,
        variants:
            data.variants_updated ??
            data.variants_created ??
            data.variant_count ??
            data.variants ??
            null,
    };
};

const getErrorPayload = (err) =>
    err?.response?.data || err?.data || err?.originalError?.response?.data || null;

const resolveMode = (value) => (value === "update" ? "update" : "upload");

async function fetchAllVendorProducts() {
    const allResults = [];
    let page = 1;
    const pageSize = 100;
    const maxPages = 50;

    while (page <= maxPages) {
        const response = await vendorService.getProducts({
            page,
            page_size: pageSize,
        });
        const payload = response?.data?.data || {};
        const results = Array.isArray(payload.results) ? payload.results : [];
        allResults.push(...results);
        const total = Number(payload.count);
        if (!results.length) break;
        if (Number.isFinite(total) && allResults.length >= total) break;
        if (!payload.next && results.length < pageSize) break;
        page += 1;
    }

    return allResults;
}

async function mapWithConcurrency(items, limit, mapper) {
    const results = new Array(items.length);
    let nextIndex = 0;

    const workers = Array.from({ length: Math.min(limit, items.length) || 0 }, async () => {
        while (nextIndex < items.length) {
            const current = nextIndex;
            nextIndex += 1;
            results[current] = await mapper(items[current], current);
        }
    });

    await Promise.all(workers);
    return results;
}

async function fetchProductsForBulkUpdateExport() {
    const listed = await fetchAllVendorProducts();
    if (!listed.length) return [];

    const detailed = await mapWithConcurrency(listed, 5, async (item) => {
        const productId = item?.id;
        if (!productId) return item;
        try {
            const response = await vendorService.getSingleProduct(productId);
            const full = response?.data?.data;
            return full && typeof full === "object" ? full : item;
        } catch {
            return item;
        }
    });

    return detailed.filter(Boolean);
}

async function fetchBulkUpdateReferences() {
    const [brandResponse, subcategoryResponse, diseaseResponse] = await Promise.all([
        vendorService.getFieldInfo("brand-name").catch(() => null),
        vendorService
            .getFieldInfo("product-subcategory", { is_product_sale: true })
            .catch(() => null),
        vendorService.getFieldInfo("health-diseases").catch(() => null),
    ]);

    return {
        brands: Array.isArray(brandResponse?.data?.data) ? brandResponse.data.data : [],
        subcategories: Array.isArray(subcategoryResponse?.data?.data)
            ? subcategoryResponse.data.data
            : [],
        diseases: Array.isArray(diseaseResponse?.data?.data) ? diseaseResponse.data.data : [],
    };
}

export default function BulkUploadProducts() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const mode = resolveMode(searchParams.get("tab"));
    const config = MODE_CONFIG[mode];

    const inputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [downloadingProducts, setDownloadingProducts] = useState(false);
    const [clientError, setClientError] = useState("");
    const [result, setResult] = useState(null);
    const [showGuide, setShowGuide] = useState(true);

    const resetResult = () => setResult(null);

    const setMode = (nextMode) => {
        const resolved = resolveMode(nextMode);
        setSearchParams(resolved === "upload" ? {} : { tab: "update" }, { replace: true });
        setFile(null);
        setClientError("");
        setDragging(false);
        setResult(null);
    };

    useEffect(() => {
        setFile(null);
        setClientError("");
        setDragging(false);
        setResult(null);
    }, [mode]);

    const validateFile = (selected) => {
        if (!selected) return "Please select an Excel file.";

        const name = selected.name?.toLowerCase() || "";
        const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
        const hasValidType = !selected.type || ACCEPTED_TYPES.includes(selected.type);

        if (!hasValidExt && !hasValidType) {
            return "Only .xlsx or .xls Excel files are allowed.";
        }
        if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
        }
        return "";
    };

    const assignFile = useCallback((selected) => {
        setResult(null);
        const error = validateFile(selected);
        if (error) {
            setClientError(error);
            setFile(null);
            toast.error(error);
            return;
        }
        setClientError("");
        setFile(selected);
    }, []);

    const onFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (selected) assignFile(selected);
        e.target.value = "";
    };

    const onDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
            const selected = e.dataTransfer.files?.[0];
            if (selected) assignFile(selected);
        },
        [assignFile]
    );

    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };

    const clearFile = () => {
        setFile(null);
        setClientError("");
        resetResult();
    };

    const handleDownloadTemplate = () => {
        try {
            const link = document.createElement("a");
            link.href = config.templateUrl;
            link.download = config.templateFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Template download started");
        } catch {
            toast.error("Could not download template. Please try again.");
        }
    };

    const handleDownloadProductsExcel = async () => {
        if (downloadingProducts) return;
        try {
            setDownloadingProducts(true);
            toast.loading("Preparing product Excel in update format…", {
                id: "bulk-update-export",
            });

            const [products, references] = await Promise.all([
                fetchProductsForBulkUpdateExport(),
                fetchBulkUpdateReferences(),
            ]);

            if (!products.length) {
                toast.error("No products found to download", { id: "bulk-update-export" });
                return;
            }

            const stamp = new Date().toISOString().slice(0, 10);
            const exported = exportBulkUpdateWorkbook(
                `products-bulk-update-${stamp}.xlsx`,
                products,
                references
            );

            if (!exported) {
                toast.error("Could not build update Excel from products", {
                    id: "bulk-update-export",
                });
                return;
            }

            const variantCount = products.reduce(
                (sum, product) =>
                    sum + (Array.isArray(product?.variants) ? product.variants.length : 0),
                0
            );
            toast.success(
                `Downloaded ${products.length} product${products.length > 1 ? "s" : ""} (${variantCount} variant${variantCount === 1 ? "" : "s"}) in update template format`,
                { id: "bulk-update-export" }
            );
        } catch (err) {
            toast.error(extractApiErrorMessage(err) || "Failed to download product Excel", {
                id: "bulk-update-export",
            });
        } finally {
            setDownloadingProducts(false);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            const msg = "Please select an Excel file first.";
            setClientError(msg);
            toast.error(msg);
            return;
        }

        const validation = validateFile(file);
        if (validation) {
            setClientError(validation);
            toast.error(validation);
            return;
        }

        setUploading(true);
        setClientError("");
        resetResult();

        try {
            const response = await config.api(file);
            const payload = response?.data ?? response;
            const uploadedProducts = normalizeUploadedProducts(payload);
            const errors = normalizeErrors(payload);
            const summary = extractSummary(payload, uploadedProducts);
            const httpOk = response?.status >= 200 && response?.status < 300;

            const success =
                httpOk &&
                payload?.success !== false &&
                (payload?.success === true ||
                    uploadedProducts.length > 0 ||
                    (summary.created != null && Number(summary.created) > 0) ||
                    (summary.updated != null && Number(summary.updated) > 0) ||
                    (errors.length === 0 && httpOk));

            setResult({
                success,
                message:
                    payload?.message ||
                    payload?.detail ||
                    (success
                        ? mode === "update"
                            ? "Products updated successfully."
                            : "Products uploaded successfully."
                        : `${config.resultNoun} completed with issues. Review the errors below.`),
                summary,
                errors,
                uploadedProducts,
                raw: payload,
            });

            if (success && errors.length === 0) {
                toast.success(
                    payload?.message ||
                        (mode === "update"
                            ? "Bulk update completed successfully"
                            : "Bulk upload completed successfully")
                );
            } else if (success && errors.length > 0) {
                toast.success(
                    payload?.message ||
                        `${config.resultNoun} finished with some row issues`
                );
            } else {
                toast.error(
                    payload?.message ||
                        payload?.detail ||
                        (mode === "update" ? "Bulk update failed" : "Bulk upload failed")
                );
            }
        } catch (err) {
            const data = getErrorPayload(err);
            const uploadedProducts = normalizeUploadedProducts(data);
            const errors = normalizeErrors(data);
            const summary = extractSummary(data, uploadedProducts);
            const message =
                err?.message ||
                data?.message ||
                data?.detail ||
                (mode === "update"
                    ? "Failed to update products. Please check your file and try again."
                    : "Failed to upload products. Please check your file and try again.");

            setResult({
                success: false,
                message,
                summary,
                errors: errors.length
                    ? errors
                    : [
                          {
                              row: null,
                              sheet: null,
                              field: null,
                              product_key: null,
                              vendor_sku_code: null,
                              message,
                          },
                      ],
                uploadedProducts,
                raw: data,
            });
            // API interceptor already toasts most HTTP errors
        } finally {
            setUploading(false);
        }
    };

    const tabs = useMemo(
        () => [
            { key: "upload", label: MODE_CONFIG.upload.label },
            { key: "update", label: MODE_CONFIG.update.label },
        ],
        []
    );

    return (
        <DashboardPageShell
            title={config.pageTitle}
            accent={config.accent}
            subtitle={config.subtitle}
            breadcrumbs={[
                { label: "Dashboard", href: "/vendor/dashboard" },
                { label: "Products", href: "/vendor/products" },
                { label: "Bulk Upload / Update" },
            ]}
            actions={
                <>
                    {mode === "update" && (
                        <Button
                            variant="secondary"
                            onClick={handleDownloadProductsExcel}
                            loading={downloadingProducts}
                            disabled={uploading}
                        >
                            {!downloadingProducts && <Download size={15} />} Download Product Excel
                        </Button>
                    )}
                    <Button variant="secondary" onClick={handleDownloadTemplate}>
                        <Download size={15} />{" "}
                        {mode === "update" ? "Download Update Template" : "Download Template"}
                    </Button>
                    <Button onClick={() => navigate("/vendor/new-product")}>
                        + Add Single Product
                    </Button>
                </>
            }
        >
            <div className="max-w-8xl mx-auto">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                        <Link
                            to="/vendor/products"
                            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0D614E] mb-2"
                        >
                            <ArrowLeft size={14} /> Back to Products
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">{config.heading}</h1>
                        <p className="text-gray-500 text-sm mt-1">{config.description}</p>
                    </div>
                </div>

                <div
                    className="mb-5 inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm"
                    role="tablist"
                    aria-label="Bulk upload or update"
                >
                    {tabs.map((tab) => {
                        const active = mode === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setMode(tab.key)}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    active
                                        ? "bg-[#0D614E] text-white"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                    <div className="xl:col-span-3 space-y-4">
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 ds-card">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-[#0D614E]/10 flex items-center justify-center shrink-0">
                                    <FileSpreadsheet size={20} className="text-[#0D614E]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        {config.dropTitle}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">{config.dropHint}</p>
                                </div>
                            </div>

                            <div
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onClick={() => !uploading && inputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if ((e.key === "Enter" || e.key === " ") && !uploading) {
                                        e.preventDefault();
                                        inputRef.current?.click();
                                    }
                                }}
                                className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                                    dragging
                                        ? "border-[#0D614E] bg-[#0D614E]/5"
                                        : clientError
                                          ? "border-red-300 bg-red-50/40"
                                          : "border-gray-200 hover:border-[#0D614E]/60 hover:bg-gray-50/80"
                                } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    className="hidden"
                                    onChange={onFileChange}
                                    disabled={uploading}
                                />
                                <Upload
                                    size={36}
                                    className={`mx-auto mb-3 ${dragging ? "text-[#0D614E]" : "text-gray-400"}`}
                                />
                                <p className="text-sm font-medium text-gray-800">
                                    Drag & drop your Excel file here
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    or click to browse from your computer
                                </p>
                                <p className="text-[11px] text-gray-400 mt-3">Accepted: .xlsx, .xls</p>
                            </div>

                            {clientError && (
                                <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{clientError}</span>
                                </div>
                            )}

                            {file && (
                                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                            <FileSpreadsheet size={18} className="text-[#0D614E]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatBytes(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearFile();
                                        }}
                                        disabled={uploading}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                        title="Remove file"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            )}

                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!file || uploading}
                                    loading={uploading}
                                >
                                    <Upload size={15} /> {config.actionLabel}
                                </Button>
                                {(file || result) && (
                                    <Button
                                        variant="secondary"
                                        onClick={clearFile}
                                        disabled={uploading}
                                    >
                                        <RefreshCw size={14} /> Reset
                                    </Button>
                                )}
                            </div>
                        </div>

                        {result && (
                            <div
                                className={`bg-white border rounded-xl shadow-sm overflow-hidden ${
                                    result.success ? "border-green-100" : "border-red-100"
                                }`}
                            >
                                <div
                                    className={`px-5 py-4 flex items-start gap-3 ${
                                        result.success ? "bg-green-50/70" : "bg-red-50/70"
                                    }`}
                                >
                                    {result.success ? (
                                        <CheckCircle2
                                            size={22}
                                            className="text-green-600 shrink-0 mt-0.5"
                                        />
                                    ) : (
                                        <AlertTriangle
                                            size={22}
                                            className="text-red-500 shrink-0 mt-0.5"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3
                                                    className={`text-base font-semibold ${
                                                        result.success
                                                            ? "text-green-800"
                                                            : "text-red-700"
                                                    }`}
                                                >
                                                    {result.success
                                                        ? result.errors?.length
                                                            ? `${config.resultNoun} completed with warnings`
                                                            : `${config.resultNoun} completed`
                                                        : `${config.resultNoun} failed`}
                                                </h3>
                                                <p
                                                    className={`text-sm mt-0.5 ${
                                                        result.success
                                                            ? "text-green-700"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {result.message}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={resetResult}
                                                className="p-1 rounded-md hover:bg-white/70 text-gray-400"
                                                aria-label="Dismiss result"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        {(result.summary.created != null ||
                                            result.summary.updated != null ||
                                            result.summary.failed != null ||
                                            result.summary.total != null ||
                                            result.summary.skipped != null ||
                                            result.summary.variants != null ||
                                            result.uploadedProducts?.length > 0) && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {(result.summary.total != null ||
                                                    result.uploadedProducts?.length > 0) && (
                                                    <StatChip
                                                        label="Total"
                                                        value={
                                                            result.summary.total ??
                                                            result.uploadedProducts.length
                                                        }
                                                    />
                                                )}
                                                {result.summary.created != null && (
                                                    <StatChip
                                                        label="Created"
                                                        value={result.summary.created}
                                                        tone="green"
                                                    />
                                                )}
                                                {(result.summary.updated != null ||
                                                    (mode === "update" &&
                                                        result.uploadedProducts?.length > 0)) && (
                                                    <StatChip
                                                        label="Updated"
                                                        value={
                                                            result.summary.updated ??
                                                            result.uploadedProducts.length
                                                        }
                                                        tone="blue"
                                                    />
                                                )}
                                                {mode === "upload" &&
                                                    result.summary.created == null &&
                                                    result.uploadedProducts?.length > 0 && (
                                                        <StatChip
                                                            label="Created"
                                                            value={result.uploadedProducts.length}
                                                            tone="green"
                                                        />
                                                    )}
                                                {result.summary.variants != null && (
                                                    <StatChip
                                                        label="Variants"
                                                        value={result.summary.variants}
                                                        tone="blue"
                                                    />
                                                )}
                                                {result.summary.skipped != null && (
                                                    <StatChip
                                                        label="Skipped"
                                                        value={result.summary.skipped}
                                                        tone="amber"
                                                    />
                                                )}
                                                {result.summary.failed != null && (
                                                    <StatChip
                                                        label="Failed"
                                                        value={result.summary.failed}
                                                        tone="red"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {result.uploadedProducts?.length > 0 && (
                                    <div className="p-5 border-t border-gray-100">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                            <h4 className="text-sm font-semibold text-gray-800">
                                                {mode === "update" ? "Updated" : "Uploaded"} products (
                                                {result.uploadedProducts.length})
                                            </h4>
                                            <Link
                                                to="/vendor/products"
                                                className="text-sm font-medium text-[#0D614E] hover:underline"
                                            >
                                                View all products
                                            </Link>
                                        </div>
                                        <div className="overflow-x-auto border border-gray-100 rounded-lg">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 bg-gray-50">
                                                        <th className="px-3 py-2.5">Product</th>
                                                        <th className="px-3 py-2.5">Excel Key</th>
                                                        <th className="px-3 py-2.5">Brand</th>
                                                        <th className="px-3 py-2.5">Variants</th>
                                                        <th className="px-3 py-2.5">Status</th>
                                                        <th className="px-3 py-2.5 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.uploadedProducts.map((product) => (
                                                        <tr
                                                            key={
                                                                product.id ||
                                                                product.excel_product_key ||
                                                                product.name
                                                            }
                                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                                                        >
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200 flex items-center justify-center">
                                                                        {product.cover_url ? (
                                                                            <img
                                                                                src={product.cover_url}
                                                                                alt={product.name}
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display =
                                                                                        "none";
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <Package
                                                                                size={16}
                                                                                className="text-gray-300"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium text-gray-900 truncate max-w-[220px]">
                                                                            {product.name}
                                                                        </p>
                                                                        <p className="text-xs text-gray-400 truncate max-w-[220px]">
                                                                            {product.subcategory}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-gray-600 font-mono text-xs">
                                                                {product.excel_product_key || "—"}
                                                            </td>
                                                            <td className="px-3 py-3 text-gray-600">
                                                                {product.brand_name}
                                                            </td>
                                                            <td className="px-3 py-3 text-gray-600">
                                                                {product.variant_count != null
                                                                    ? product.variant_count
                                                                    : "—"}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <Badge
                                                                    tone={
                                                                        product.is_active
                                                                            ? "green"
                                                                            : "gray"
                                                                    }
                                                                >
                                                                    <CheckCircle2 size={11} />
                                                                    {product.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-3 py-3 text-right">
                                                                {product.id ? (
                                                                    <Link
                                                                        to={`/vendor/edit-product/${product.id}`}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0D614E] hover:bg-[#0D614E]/5 rounded-md"
                                                                    >
                                                                        <Pencil size={13} /> Edit
                                                                    </Link>
                                                                ) : (
                                                                    <span className="text-gray-300">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {result.errors?.length > 0 && (
                                    <div className="p-5 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold text-gray-800">
                                                Issues ({result.errors.length})
                                            </h4>
                                            <p className="text-xs text-gray-400">
                                                Fix these rows in Excel and try again
                                            </p>
                                        </div>
                                        <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-80">
                                            <table className="w-full text-sm">
                                                <thead className="sticky top-0 bg-gray-50">
                                                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                        <th className="px-3 py-2.5">Sheet</th>
                                                        <th className="px-3 py-2.5">Row</th>
                                                        <th className="px-3 py-2.5">Product Key</th>
                                                        <th className="px-3 py-2.5">SKU</th>
                                                        <th className="px-3 py-2.5">Field</th>
                                                        <th className="px-3 py-2.5">Message</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.errors.map((err, idx) => (
                                                        <tr
                                                            key={`${err.sheet}-${err.row}-${idx}`}
                                                            className="border-b border-gray-50 last:border-0"
                                                        >
                                                            <td className="px-3 py-2.5 text-gray-600">
                                                                {err.sheet || "—"}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-600">
                                                                {err.row ?? "—"}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-600 font-mono text-xs">
                                                                {err.product_key || "—"}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-600 font-mono text-xs">
                                                                {err.vendor_sku_code || "—"}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-600">
                                                                {err.field || "—"}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-red-600">
                                                                {err.message}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {result.success && (
                                    <div className="px-5 py-4 border-t border-green-100 flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm text-gray-500">
                                            {result.uploadedProducts?.length
                                                ? config.successList
                                                : config.successEmpty}
                                        </p>
                                        <Link
                                            to="/vendor/products"
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-[#0D614E] rounded-lg hover:bg-[#0A4D3D]"
                                        >
                                            Go to Products
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="xl:col-span-2 space-y-4">
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                    <Info size={20} className="text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        {config.howTitle}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {config.howSubtitle}
                                    </p>
                                </div>
                            </div>
                            <ol className="space-y-3 text-sm text-gray-600">
                                {config.steps.map((step, index) => (
                                    <li key={index} className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-[#0D614E] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                                            {index + 1}
                                        </span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>

                            <div className="mt-5 space-y-2">
                                {mode === "update" && (
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={handleDownloadProductsExcel}
                                        loading={downloadingProducts}
                                        disabled={uploading}
                                    >
                                        {!downloadingProducts && <Download size={15} />} Download
                                        Product Excel
                                    </Button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0D614E] border border-[#0D614E]/25 rounded-lg hover:bg-[#0D614E]/5 transition-colors"
                                >
                                    <Download size={15} /> {config.templateButtonLabel}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowGuide((v) => !v)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/80"
                            >
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Sheet format guide
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Required columns for each sheet
                                    </p>
                                </div>
                                {showGuide ? (
                                    <ChevronUp size={18} className="text-gray-400" />
                                ) : (
                                    <ChevronDown size={18} className="text-gray-400" />
                                )}
                            </button>
                            {showGuide && (
                                <div className="px-5 pb-5 space-y-3">
                                    {SHEET_GUIDE.map((sheet) => (
                                        <div
                                            key={sheet.name}
                                            className="rounded-lg border border-gray-100 bg-gray-50/70 p-3.5"
                                        >
                                            <p className="text-sm font-semibold text-gray-900">
                                                {sheet.name}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-1 font-mono leading-relaxed break-all">
                                                {sheet.columns}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-2">{sheet.tip}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <ImageIcon size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Quick tips
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Avoid common {mode === "update" ? "update" : "upload"} failures
                                    </p>
                                </div>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
                                {config.tips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardPageShell>
    );
}
