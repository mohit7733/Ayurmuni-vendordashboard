import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Edit,
  Package,
  Tag,
  Factory,
  MapPin,
  Hash,
  Leaf,
  Star,
  Truck,
  RotateCcw,
  CreditCard,
  FileText,
  AlertTriangle,
  Pill,
  Shield,
  Beaker,
  Info,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { vendorService } from "../../../../services/vendorService";
import {
  getVariantCoverImageUrl,
  getVariantQuantity,
} from "../../../../utils/unicommerceHelpers";
import Ayurvedaimage from "../../../../Assests/Ayurvedaimage.png";
import DashboardPageShell from "../../../components/shared/DashboardPageShell";
import Button from "../../../components/shared/Button";
import StatusBadge from "../../../components/shared/StatusBadge";
import { PageEmpty, PageLoader } from "../../../components/shared/PageState";
import "../../../components/shared/vendor-shared.css";
import "../../../components/shared/design-system.css";
import "./ProductDetail.css";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "clinical", label: "Clinical Info" },
  { id: "variants", label: "Variants" },
  { id: "inventory", label: "Inventory" },
  { id: "images", label: "Images" },
  { id: "approval", label: "Approval" },
];

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const getSubcategoryName = (product) =>
  product?.product_subcategory_name || product?.product_subcategory || "—";

const getStockStatus = (variant) => {
  if (variant?.out_of_stock || getVariantQuantity(variant) <= 0) return "out-of-stock";
  if (getVariantQuantity(variant) <= 10) return "low-stock";
  return "instock";
};

const collectVariantImages = (variants = []) => {
  const items = [];
  const seen = new Set();
  variants.forEach((v) => {
    const cover = getVariantCoverImageUrl(v);
    const mediaList = v.media || [];
    const urls = [
      cover,
      ...mediaList.map((m) => m?.media_url || m?.url).filter(Boolean),
    ].filter(Boolean);
    urls.forEach((url) => {
      if (seen.has(url)) return;
      seen.add(url);
      items.push({
        url,
        variantId: v.id,
        variantTitle: v.title || v.sku_code || v.vendor_sku_code,
        isCover: Boolean(
          (v.cover_image && (v.cover_image.media_url === url || v.cover_image === url)) ||
            mediaList.find((m) => (m.media_url || m.url) === url && m.is_cover)
        ),
      });
    });
  });
  return items;
};

function InfoRow({ label, value, mono = false }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="pd-info-row">
      <dt>{label}</dt>
      <dd className={mono ? "font-mono text-[13px]" : ""}>{value}</dd>
    </div>
  );
}

function FlagChip({ active, label, icon: Icon }) {
  return (
    <span className={`pd-flag-chip ${active ? "pd-flag-chip--on" : "pd-flag-chip--off"}`}>
      {Icon && <Icon size={12} />}
      {label}
    </span>
  );
}

function DetailBlock({ icon: Icon, title, children }) {
  if (!children) return null;
  return (
    <div className="ds-card p-5 sm:p-6">
      <h3 className="pd-section-title">
        {Icon && (
          <span className="pd-section-icon">
            <Icon size={16} />
          </span>
        )}
        {title}
      </h3>
      <div className="mt-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{children}</div>
    </div>
  );
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  const fetchProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      const [productRes, inventoryRes] = await Promise.all([
        vendorService.getSingleProduct(id),
        vendorService.getInventory({ page: 1, page_size: 100 }).catch(() => null),
      ]);
      const data = productRes.data?.data || null;
      setProduct(data);

      const allInv = inventoryRes?.data?.data?.results || [];
      setInventory(allInv.filter((i) => String(i.product_id) === String(id)));

      const variants = data?.variants || [];
      const defaultVariant =
        variants.find((v) => v.is_default) ||
        variants.find((v) => getVariantCoverImageUrl(v)) ||
        variants[0];
      setSelectedVariantId(defaultVariant?.id || null);
      setSelectedImage(getVariantCoverImageUrl(defaultVariant) || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load product");
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const variants = product?.variants || [];
  const gallery = useMemo(() => collectVariantImages(variants), [variants]);
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) || variants[0] || null;

  const primaryImage =
    selectedImage ||
    getVariantCoverImageUrl(selectedVariant) ||
    gallery[0]?.url ||
    Ayurvedaimage;

  const priceRange = useMemo(() => {
    if (!variants.length) return null;
    const prices = variants
      .map((v) => Number(v.selling_price))
      .filter((n) => !Number.isNaN(n));
    if (!prices.length) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`;
  }, [variants]);

  const approvalSummary = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    variants.forEach((v) => {
      const s = (v.approval_status || "pending").toLowerCase();
      if (counts[s] !== undefined) counts[s] += 1;
      else counts.pending += 1;
    });
    return counts;
  }, [variants]);

  const headerActions = useMemo(
    () =>
      product ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/vendor/new-product?duplicate=${id}`)}
          >
            <Copy size={15} />
            Duplicate
          </Button>
          <Button onClick={() => navigate(`/vendor/edit-product/${id}`)}>
            <Edit size={15} />
            Edit
          </Button>
        </div>
      ) : null,
    [product, id, navigate]
  );

  if (isLoading) {
    return (
      <DashboardPageShell title="Product Detail">
        <PageLoader message="Loading product…" />
      </DashboardPageShell>
    );
  }

  if (!product) {
    return (
      <DashboardPageShell title="Product Detail">
        <PageEmpty
          title="Product not found"
          description="This product may have been removed or the link is invalid."
          action={
            <Button onClick={() => navigate("/vendor/products")}>Back to Products</Button>
          }
        />
      </DashboardPageShell>
    );
  }

  const subcategory = getSubcategoryName(product);

  return (
    <DashboardPageShell title="Product Detail" actions={headerActions}>
      <div className="pd-page ds-animate-in">
        {/* Top nav */}
        <div className="pd-topbar">
          <button
            type="button"
            className="pd-back"
            onClick={() => navigate("/vendor/products")}
          >
            <ArrowLeft size={16} />
            Products
          </button>
          <nav className="pd-crumb" aria-label="Breadcrumb">
            <Link to="/vendor/products">Products</Link>
            <span>/</span>
            <span className="pd-crumb-current">{product.name}</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="pd-hero ds-card">
          <div className="pd-gallery">
            <div className="pd-gallery-main">
              <img
                src={primaryImage}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = Ayurvedaimage;
                }}
              />
            </div>
            {gallery.length > 1 && (
              <div className="pd-gallery-thumbs">
                {gallery.map((item) => (
                  <button
                    key={item.url}
                    type="button"
                    className={`pd-thumb ${primaryImage === item.url ? "pd-thumb--active" : ""}`}
                    onClick={() => {
                      setSelectedImage(item.url);
                      if (item.variantId) setSelectedVariantId(item.variantId);
                    }}
                    title={item.variantTitle}
                  >
                    <img
                      src={item.url}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = Ayurvedaimage;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pd-hero-body">
            <div className="pd-hero-badges">
              {product.is_active && <StatusBadge status="active" />}
              {!product.is_active && <StatusBadge status="inactive" />}
              {product.is_featured && (
                <span className="pd-pill pd-pill--featured">
                  <Star size={12} /> Featured
                </span>
              )}
              {product.is_nutrition && (
                <span className="pd-pill pd-pill--nutrition">
                  <Leaf size={12} /> Nutrition
                </span>
              )}
            </div>

            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-brand-row">
              {product.brand_name_logo && (
                <img
                  src={product.brand_name_logo}
                  alt=""
                  className="pd-brand-logo"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div>
                <p className="pd-brand-name">{product.brand_name || "—"}</p>
                <p className="pd-category-line">
                  {[product.service_category_name, product.product_category_name, subcategory]
                    .filter(Boolean)
                    .join(" › ")}
                </p>
              </div>
            </div>

            {product.short_description && (
              <p className="pd-short-desc">{product.short_description}</p>
            )}

            <div className="pd-stat-grid">
              <div className="pd-stat">
                <span className="pd-stat-label">Price range</span>
                <span className="pd-stat-value pd-stat-value--price">{priceRange || "—"}</span>
              </div>
              <div className="pd-stat">
                <span className="pd-stat-label">Variants</span>
                <span className="pd-stat-value">{variants.length}</span>
              </div>
              <div className="pd-stat">
                <span className="pd-stat-label">Approval</span>
                <span className="pd-stat-value text-sm">
                  {approvalSummary.approved} approved · {approvalSummary.pending} pending
                </span>
              </div>
              <div className="pd-stat">
                <span className="pd-stat-label">Model</span>
                <span className="pd-stat-value text-sm font-mono">
                  {product.model_number || "—"}
                </span>
              </div>
            </div>

            <div className="pd-meta-chips">
              {product.manufacturer && (
                <span className="pd-meta-chip">
                  <Factory size={13} /> {product.manufacturer}
                </span>
              )}
              {product.origin && (
                <span className="pd-meta-chip">
                  <MapPin size={13} /> {product.origin}
                </span>
              )}
              {product.treatment_type && (
                <span className="pd-meta-chip">
                  <Tag size={13} /> {product.treatment_type}
                </span>
              )}
            </div>

            <div className="pd-hero-actions">
              <Button onClick={() => navigate(`/vendor/edit-product/${id}`)}>
                <Edit size={15} /> Edit product
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(`/vendor/new-product?duplicate=${id}`)}
              >
                <Edit size={15} /> Add product
              </Button>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="pd-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`pd-tab ${activeTab === tab.id ? "pd-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === "variants" && (
                <span className="pd-tab-count">{variants.length}</span>
              )}
              {tab.id === "images" && gallery.length > 0 && (
                <span className="pd-tab-count">{gallery.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="pd-tab-panel ds-stagger">
            <div className="pd-two-col">
              <div className="ds-card p-5 sm:p-6">
                <h3 className="pd-section-title">
                  <span className="pd-section-icon">
                    <Package size={16} />
                  </span>
                  Basic information
                </h3>
                <dl className="pd-info-list mt-4">
                  <InfoRow label="Product name" value={product.name} />
                  <InfoRow label="Brand" value={product.brand_name} />
                  <InfoRow label="Category" value={product.product_category_name} />
                  <InfoRow label="Subcategory" value={subcategory} />
                  <InfoRow label="Service category" value={product.service_category_name} />
                  <InfoRow label="Manufacturer" value={product.manufacturer} />
                  <InfoRow label="Origin" value={product.origin} />
                  <InfoRow label="Model number" value={product.model_number} mono />
                  <InfoRow label="Treatment type" value={product.treatment_type} />
                  <InfoRow label="Created" value={formatDate(product.created_at)} />
                  <InfoRow label="Updated" value={formatDate(product.updated_at)} />
                </dl>
              </div>

              <div className="space-y-4">
                <DetailBlock icon={FileText} title="Short description">
                  {product.short_description}
                </DetailBlock>
                <DetailBlock icon={Info} title="Full description">
                  {product.full_description}
                </DetailBlock>
              </div>
            </div>
          </div>
        )}

        {/* Clinical */}
        {activeTab === "clinical" && (
          <div className="pd-tab-panel grid gap-4 md:grid-cols-2 ds-stagger">
            <DetailBlock icon={Beaker} title="Compositions">
              {product.compositions}
            </DetailBlock>
            <DetailBlock icon={Leaf} title="Benefits">
              {product.benifits || product.benefits}
            </DetailBlock>
            <DetailBlock icon={Pill} title="How to use">
              {product.how_to_use}
            </DetailBlock>
            <DetailBlock icon={Hash} title="Dosages">
              {product.dosages}
            </DetailBlock>
            <DetailBlock icon={AlertTriangle} title="Side effects">
              {product.side_effects}
            </DetailBlock>
            <DetailBlock icon={Shield} title="Safety information">
              {product.safety_information}
            </DetailBlock>
            {!product.compositions &&
              !(product.benifits || product.benefits) &&
              !product.how_to_use &&
              !product.dosages &&
              !product.side_effects &&
              !product.safety_information && (
                <div className="md:col-span-2">
                  <PageEmpty
                    title="No clinical details"
                    description="Add compositions, benefits, dosages and safety info when editing this product."
                    action={
                      <Button onClick={() => navigate(`/vendor/edit-product/${id}`)}>
                        Edit product
                      </Button>
                    }
                  />
                </div>
              )}
          </div>
        )}

        {/* Variants */}
        {activeTab === "variants" && (
          <div className="pd-tab-panel space-y-4 ds-stagger">
            {variants.length === 0 ? (
              <PageEmpty title="No variants" description="This product has no variants yet." />
            ) : (
              variants.map((v) => {
                const cover = getVariantCoverImageUrl(v) || Ayurvedaimage;
                const qty = getVariantQuantity(v);
                const taxes = (v.taxes || [])
                  .map((t) => `${t.name} ${t.rate}%`)
                  .join(", ");

                return (
                  <article key={v.id} className="ds-card pd-variant-card">
                    <div className="pd-variant-head">
                      <div className="pd-variant-identity">
                        <img
                          src={cover}
                          alt=""
                          className="pd-variant-img"
                          onError={(e) => {
                            e.currentTarget.src = Ayurvedaimage;
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {v.title || "Untitled variant"}
                            </h4>
                            {v.is_default && (
                              <span className="pd-pill pd-pill--default">Default</span>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            <StatusBadge status={v.approval_status || "pending"} />
                            <StatusBadge status={v.status || "draft"} />
                            <StatusBadge status={getStockStatus(v)} />
                          </div>
                        </div>
                      </div>
                      <div className="pd-variant-prices">
                        <div>
                          <span className="pd-stat-label">Selling</span>
                          <p className="text-lg font-bold text-[#0D614E]">
                            {formatMoney(v.selling_price)}
                          </p>
                        </div>
                        <div>
                          <span className="pd-stat-label">MRP</span>
                          <p className="text-sm font-semibold text-gray-700 line-through decoration-gray-400">
                            {formatMoney(v.mrp)}
                          </p>
                        </div>
                        {v.discount != null && Number(v.discount) > 0 && (
                          <div>
                            <span className="pd-stat-label">Discount</span>
                            <p className="text-sm font-semibold text-amber-700">
                              {Number(v.discount).toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pd-variant-grid">
                      <div>
                        <span className="pd-stat-label">Vendor SKU</span>
                        <code className="pd-sku">{v.vendor_sku_code || "—"}</code>
                      </div>
                      <div>
                        <span className="pd-stat-label">System SKU</span>
                        <code className="pd-sku pd-sku--muted">{v.sku_code || "—"}</code>
                      </div>
                      <div>
                        <span className="pd-stat-label">Size</span>
                        <p className="text-sm font-medium text-gray-800">{v.size || "—"}</p>
                      </div>
                      <div>
                        <span className="pd-stat-label">Physical state</span>
                        <p className="text-sm font-medium text-gray-800 capitalize">
                          {v.physical_state || "—"}
                          {v.weightage ? ` · ${v.weightage}` : ""}
                        </p>
                      </div>
                      <div>
                        <span className="pd-stat-label">Cost / item</span>
                        <p className="text-sm font-medium text-gray-800">
                          {formatMoney(v.cost_per_item)}
                        </p>
                      </div>
                      <div>
                        <span className="pd-stat-label">Quantity</span>
                        <p className="text-sm font-medium text-gray-800">{qty} units</p>
                      </div>
                      <div>
                        <span className="pd-stat-label">Taxes</span>
                        <p className="text-sm font-medium text-gray-800">{taxes || "—"}</p>
                      </div>
                      <div>
                        <span className="pd-stat-label">Pricing mode</span>
                        <p className="text-sm font-medium text-gray-800 capitalize">
                          {(v.calculation_mode || "—").replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>

                    <div className="pd-flag-row">
                      <FlagChip active={v.is_free_shipping} label="Free shipping" icon={Truck} />
                      <FlagChip active={v.pay_on_delivery} label="Pay on delivery" icon={CreditCard} />
                      <FlagChip
                        active={v.is_returnable}
                        label={
                          v.is_returnable
                            ? `Returnable (${v.returnable_days || 0}d)`
                            : "Not returnable"
                        }
                        icon={RotateCcw}
                      />
                      <FlagChip
                        active={v.prescription_required}
                        label="Prescription required"
                        icon={FileText}
                      />
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* Inventory */}
        {activeTab === "inventory" && (
          <div className="pd-tab-panel ds-stagger">
            <div className="ds-card overflow-hidden">
              <div className="overflow-x-auto ds-scroll">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Variant
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Vendor SKU
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        System SKU
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Inventory sync
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variants.map((v) => {
                      const inv =
                        inventory.find(
                          (i) =>
                            String(i.variant_id) === String(v.id) ||
                            i.variant_sku === v.sku_code ||
                            i.variant_sku === v.vendor_sku_code
                        ) || null;
                      const qty = inv?.quantity ?? getVariantQuantity(v);
                      return (
                        <tr key={v.id} className="ds-table-row">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={getVariantCoverImageUrl(v) || Ayurvedaimage}
                                alt=""
                                className="h-10 w-10 rounded-lg object-cover border border-gray-100"
                                onError={(e) => {
                                  e.currentTarget.src = Ayurvedaimage;
                                }}
                              />
                              <span className="text-sm font-medium text-gray-800">
                                {v.title || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {v.vendor_sku_code || "—"}
                            </code>
                          </td>
                          <td className="px-5 py-3">
                            <code className="text-xs text-gray-500">{v.sku_code || "—"}</code>
                          </td>
                          <td className="px-5 py-3 font-medium">{qty}</td>
                          <td className="px-5 py-3">
                            <StatusBadge status={getStockStatus({ ...v, quantity: qty })} />
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge
                              status={
                                inv?.sync_status ||
                                (v.approval_status === "approved" ? "active" : "pending")
                              }
                              label={
                                inv?.sync_status ||
                                (v.approval_status === "approved"
                                  ? "Ready"
                                  : "Awaiting approval")
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {variants.length === 0 && (
                <div className="p-8">
                  <PageEmpty
                    title="No inventory rows"
                    description="Variants will appear here once added."
                  />
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-500 flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-[#0D614E]" />
              Stock can only be updated for approved variants via Stock Management. Pending variants stay at quantity 0 until admin approval.
            </p>
          </div>
        )}

        {/* Images */}
        {activeTab === "images" && (
          <div className="pd-tab-panel ds-stagger">
            {gallery.length === 0 ? (
              <PageEmpty
                icon={ImageIcon}
                title="No images uploaded"
                description="Upload cover and gallery images on each variant when editing the product."
                action={
                  <Button onClick={() => navigate(`/vendor/edit-product/${id}`)}>
                    Edit product
                  </Button>
                }
              />
            ) : (
              <div className="pd-image-grid">
                {gallery.map((item, i) => (
                  <button
                    key={`${item.url}-${i}`}
                    type="button"
                    className="pd-image-card ds-card-interactive"
                    onClick={() => {
                      setSelectedImage(item.url);
                      setActiveTab("overview");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <img
                      src={item.url}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = Ayurvedaimage;
                      }}
                    />
                    <div className="pd-image-meta">
                      <span className="truncate">{item.variantTitle || "Variant"}</span>
                      {item.isCover && (
                        <span className="pd-pill pd-pill--default">Cover</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Approval */}
        {activeTab === "approval" && (
          <div className="pd-tab-panel space-y-4 ds-stagger">
            <div className="pd-approval-summary ds-card">
              <div className="pd-approval-stat">
                <CheckCircle2 size={18} className="text-green-600" />
                <div>
                  <p className="text-lg font-bold text-gray-900">{approvalSummary.approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
              </div>
              <div className="pd-approval-stat">
                <Clock size={18} className="text-violet-600" />
                <div>
                  <p className="text-lg font-bold text-gray-900">{approvalSummary.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
              <div className="pd-approval-stat">
                <XCircle size={18} className="text-red-500" />
                <div>
                  <p className="text-lg font-bold text-gray-900">{approvalSummary.rejected}</p>
                  <p className="text-xs text-gray-500">Rejected</p>
                </div>
              </div>
            </div>

            {variants.map((v) => (
              <div key={v.id} className="ds-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getVariantCoverImageUrl(v) || Ayurvedaimage}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover border border-gray-100"
                      onError={(e) => {
                        e.currentTarget.src = Ayurvedaimage;
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {v.title || v.vendor_sku_code || "Variant"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">
                        {v.sku_code || v.vendor_sku_code || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={v.approval_status || "pending"} />
                    <StatusBadge status={v.status || "draft"} />
                  </div>
                </div>
                <dl className="pd-info-list mt-4">
                  <InfoRow label="Approved at" value={formatDate(v.approved_at)} />
                  <InfoRow
                    label="Reason"
                    value={v.reason || (v.approval_status === "pending" ? "Awaiting admin review" : "—")}
                  />
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardPageShell>
  );
};

export default ProductDetail;
