import * as XLSX from "xlsx";

export function exportToCsv(filename, rows, columns) {
  if (!rows?.length) return;

  const headers = columns.map((c) => c.label || c.key);
  const keys = columns.map((c) => c.key);

  const escape = (val) => {
    const str = val == null ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => keys.map((k) => escape(typeof k === "function" ? k(row) : row[k])).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function extractApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong"
  );
}

function cellValue(value) {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

function taxRate(taxes, name) {
  if (!Array.isArray(taxes)) return "";
  const match = taxes.find(
    (tax) => String(tax?.name || "").toLowerCase() === String(name).toLowerCase()
  );
  return match?.rate ?? "";
}

function formatHealthDiseases(list) {
  if (!Array.isArray(list) || !list.length) return "";
  return list
    .map((item) => item?.name)
    .filter(Boolean)
    .join(", ");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN");
}

/** Flatten catalogue API variant rows into Excel-friendly columns. */
export function mapCatalogueToRows(results = []) {
  return results.map((item) => {
    const product = item?.product || {};
    const sizeLabel = [item?.size, item?.weightage].filter(Boolean).join(" ");
    return {
      "Product Name": product.name || "",
      "Variant Title": item?.title || "",
      "SKU Code": item?.sku_code || "",
      "Vendor SKU": item?.vendor_sku_code || "",
      Brand: product.brand_name || "",
      Category: product.product_category_name || "",
      Subcategory: product.product_subcategory || "",
      "Service Category": product.service_category_name || "",
      Manufacturer: product.manufacturer || "",
      Origin: product.origin || "",
      Size: sizeLabel || item?.size || "",
      "Physical State": item?.physical_state || "",
      HSN: item?.hsn_code || "",
      MRP: item?.mrp ?? "",
      "Selling Price": item?.selling_price ?? "",
      "Vendor Price": item?.vendor_price ?? "",
      "Cost Per Item": item?.cost_per_item ?? "",
      "Discount %": item?.discount ?? "",
      "GST %": taxRate(item?.taxes, "GST"),
      "Platform Fee %": taxRate(item?.taxes, "Platform Fee"),
      "Calculation Mode": item?.calculation_mode || "",
      Quantity: item?.quantity ?? "",
      "Out of Stock": cellValue(item?.out_of_stock),
      Status: item?.status || "",
      "Approval Status": item?.approval_status || "",
      Reason: item?.reason || "",
      "Prescription Required": cellValue(item?.prescription_required),
      Returnable: cellValue(item?.is_returnable),
      "Returnable Days": item?.returnable_days ?? "",
      "Free Shipping": cellValue(item?.is_free_shipping),
      "Shipping Amount": item?.shipping_amount ?? "",
      "Pay on Delivery": cellValue(item?.pay_on_delivery),
      "Is Default Variant": cellValue(item?.is_default),
      "Short Description": product.short_description || "",
      Benefits: product.benifits || "",
      Compositions: product.compositions || "",
      "How to Use": product.how_to_use || "",
      Dosages: product.dosages || "",
      "Side Effects": product.side_effects || "",
      "Safety Information": product.safety_information || "",
      "Health Concerns": formatHealthDiseases(product.health_diseases),
      "Cover Image URL": item?.cover_image?.media_url || "",
      "Vendor Business": product.vendor_business_name || "",
      "Created At": formatDate(item?.created_at),
      "Updated At": formatDate(item?.updated_at),
      "Approved At": formatDate(item?.approved_at),
    };
  });
}

export function exportRowsToExcel(filename, rows) {
  if (!rows?.length) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const columnKeys = Object.keys(rows[0] || {});
  worksheet["!cols"] = columnKeys.map((key) => {
    const maxLen = rows.reduce((max, row) => {
      const len = String(row[key] ?? "").length;
      return Math.max(max, len);
    }, key.length);
    return { wch: Math.min(Math.max(maxLen + 2, 12), 40) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Product Catalogue");
  XLSX.writeFile(workbook, filename);
}

export const BULK_UPDATE_PRODUCT_HEADERS = [
  "product_key",
  "name",
  "product_subcategory_id",
  "brand_name_id",
  "manufacturer",
  "origin",
  "short_description",
  "full_description",
  "how_to_use",
  "health_disease_ids",
  "benifits",
  "treatment_type",
  "compositions",
  "side_effects",
  "dosages",
  "safety_information",
  "model_number",
  "is_nutrition",
  "is_featured",
  "is_active",
];

export const BULK_UPDATE_VARIANT_HEADERS = [
  "product_key",
  "vendor_sku_code",
  "title",
  "is_default",
  "physical_state",
  "calculation_mode",
  "cost_per_item",
  "size",
  "weightage",
  "selling_price",
  "mrp",
  "discount",
  "is_free_shipping",
  "shipping_amount",
  "is_returnable",
  "returnable_days",
  "pay_on_delivery",
  "prescription_required",
  "expire_at",
  "tax_name",
  "tax_rate",
];

export const BULK_UPDATE_GALLERY_HEADERS = [
  "product_key",
  "vendor_sku_code",
  "media_url",
  "media_type",
  "is_cover",
];

const PHYSICAL_STATES = [
  "solid",
  "liquid",
  "gas",
  "tablet",
  "capsule",
  "powder",
  "syrup",
  "oil",
  "cream",
  "gel",
  "drops",
  "juice",
  "other",
];

const BULK_UPDATE_INSTRUCTIONS = [
  ["PRODUCT BULK UPDATE TEMPLATE - INSTRUCTIONS"],
  [null],
  ["HOW TO USE THIS FILE"],
  [null],
  ["1. Download Product Excel fills your current catalog in the update format."],
  ["2. Edit fields you want to change (mrp, selling_price, expire_at, descriptions, etc.)."],
  ["3. Keep sheet names and header columns exactly as they are."],
  ["4. Keep vendor_sku_code values unchanged so existing variants can be matched."],
  ["5. product_key links Products, Variants, and Gallery rows — keep it consistent across sheets."],
  ["6. health_disease_ids can be pipe-separated (id1|id2)."],
  ["7. expire_at is optional (YYYY-MM-DD or ISO datetime); leave blank if none."],
  ["8. Save as .xlsx and upload on the Bulk Update tab."],
];

function boolCell(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return Boolean(value);
}

function formatExpireAt(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toISOString().slice(0, 10);
}

function formatHealthDiseaseIds(product = {}) {
  if (typeof product.health_disease_ids === "string" && product.health_disease_ids.trim()) {
    return product.health_disease_ids.trim();
  }
  if (Array.isArray(product.health_disease_ids)) {
    return product.health_disease_ids.filter(Boolean).join("|");
  }
  if (Array.isArray(product.health_diseases)) {
    return product.health_diseases
      .map((item) => item?.id || item?.health_disease_id)
      .filter(Boolean)
      .join("|");
  }
  return "";
}

function pickTax(taxes = []) {
  if (!Array.isArray(taxes) || !taxes.length) {
    return { tax_name: "", tax_rate: "" };
  }
  const gst = taxes.find((tax) => String(tax?.name || "").toLowerCase() === "gst");
  const chosen = gst || taxes[0];
  return {
    tax_name: chosen?.name || "",
    tax_rate: chosen?.rate ?? "",
  };
}

function resolveByName(list = [], name) {
  if (!name) return "";
  const needle = String(name).trim().toLowerCase();
  const match = list.find((item) => {
    const label = item?.name || item?.brand_name || item?.title || "";
    return String(label).trim().toLowerCase() === needle;
  });
  return match?.id || match?.brand_name_id || match?.pk || "";
}

function collectVariantMedia(variant = {}) {
  const rows = [];
  const seen = new Set();
  const pushMedia = (url, mediaType = "image", isCover = false) => {
    const mediaUrl = String(url || "").trim();
    if (!mediaUrl || seen.has(mediaUrl)) return;
    seen.add(mediaUrl);
    rows.push({
      media_url: mediaUrl,
      media_type: mediaType || "image",
      is_cover: Boolean(isCover),
    });
  };

  const cover = variant.cover_image;
  if (typeof cover === "string") pushMedia(cover, "image", true);
  else if (cover?.media_url || cover?.url) {
    pushMedia(cover.media_url || cover.url, cover.media_type || "image", true);
  }

  const mediaList = Array.isArray(variant.media)
    ? variant.media
    : Array.isArray(variant.gallery)
      ? variant.gallery
      : Array.isArray(variant.galleryImages)
        ? variant.galleryImages
        : [];

  mediaList.forEach((item) => {
    if (!item) return;
    if (typeof item === "string") {
      pushMedia(item, "image", false);
      return;
    }
    pushMedia(
      item.media_url || item.url || item.preview,
      item.media_type || "image",
      Boolean(item.is_cover)
    );
  });

  if (!rows.some((row) => row.is_cover) && rows.length) {
    rows[0].is_cover = true;
  }

  return rows;
}

function autosizeSheet(worksheet, rows = [], headers = []) {
  worksheet["!cols"] = headers.map((header, index) => {
    const maxLen = rows.reduce((max, row) => {
      const value = Array.isArray(row) ? row[index] : row?.[header];
      return Math.max(max, String(value ?? "").length);
    }, String(header).length);
    return { wch: Math.min(Math.max(maxLen + 2, 12), 40) };
  });
}

function sheetFromObjects(headers, rows) {
  const aoa = [
    headers,
    ...rows.map((row) => headers.map((header) => (row[header] == null ? "" : row[header]))),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  autosizeSheet(worksheet, rows, headers);
  return worksheet;
}

/** Map vendor products (+ nested variants) into bulk-update template sheets. */
export function mapProductsToBulkUpdateSheets(products = [], references = {}) {
  const brands = Array.isArray(references.brands) ? references.brands : [];
  const subcategories = Array.isArray(references.subcategories) ? references.subcategories : [];

  const productRows = [];
  const variantRows = [];
  const galleryRows = [];

  products.forEach((product, index) => {
    if (!product || typeof product !== "object") return;
    const productKey = `P${String(index + 1).padStart(4, "0")}`;
    const subcategoryId =
      product.product_subcategory_id ||
      product.product_subcategory?.id ||
      resolveByName(
        subcategories,
        product.product_subcategory_name || product.product_subcategory
      );
    const brandId =
      product.brand_name_id ||
      product.brand_id ||
      product.brand?.id ||
      resolveByName(brands, product.brand_name || product.brand?.name);

    productRows.push({
      product_key: productKey,
      name: product.name || "",
      product_subcategory_id: subcategoryId || "",
      brand_name_id: brandId || "",
      manufacturer: product.manufacturer || "",
      origin: product.origin || "",
      short_description: product.short_description || "",
      full_description: product.full_description || "",
      how_to_use: product.how_to_use || "",
      health_disease_ids: formatHealthDiseaseIds(product),
      benifits: product.benifits || "",
      treatment_type: product.treatment_type || "",
      compositions: product.compositions || "",
      side_effects: product.side_effects || "",
      dosages: product.dosages || "",
      safety_information: product.safety_information || "",
      model_number: product.model_number || "",
      is_nutrition: boolCell(product.is_nutrition, true),
      is_featured: boolCell(product.is_featured, false),
      is_active: boolCell(product.is_active, true),
    });

    const variants = Array.isArray(product.variants) ? product.variants : [];
    variants.forEach((variant, variantIndex) => {
      if (!variant || typeof variant !== "object") return;
      const vendorSku =
        variant.vendor_sku_code || variant.sku_code || variant.sku || "";
      const { tax_name, tax_rate } = pickTax(variant.taxes);

      variantRows.push({
        product_key: productKey,
        vendor_sku_code: vendorSku,
        title: variant.title || "",
        is_default: boolCell(
          variant.is_default,
          variantIndex === 0 && variants.length > 0
        ),
        physical_state: variant.physical_state || "",
        calculation_mode: variant.calculation_mode || "selling_price",
        cost_per_item: variant.cost_per_item ?? "",
        size: variant.size ?? "",
        weightage: variant.weightage || "",
        selling_price: variant.selling_price ?? "",
        mrp: variant.mrp ?? "",
        discount: variant.discount ?? "",
        is_free_shipping: boolCell(variant.is_free_shipping, false),
        shipping_amount: variant.shipping_amount ?? "",
        is_returnable: boolCell(variant.is_returnable, false),
        returnable_days: variant.returnable_days ?? 0,
        pay_on_delivery: boolCell(variant.pay_on_delivery, false),
        prescription_required: boolCell(variant.prescription_required, false),
        expire_at: formatExpireAt(variant.expire_at),
        tax_name,
        tax_rate,
      });

      collectVariantMedia(variant).forEach((media) => {
        galleryRows.push({
          product_key: productKey,
          vendor_sku_code: vendorSku,
          media_url: media.media_url,
          media_type: media.media_type,
          is_cover: media.is_cover,
        });
      });
    });
  });

  return { productRows, variantRows, galleryRows };
}

function buildReferencesSheet(references = {}) {
  const subcategories = Array.isArray(references.subcategories)
    ? references.subcategories
    : [];
  const brands = Array.isArray(references.brands) ? references.brands : [];
  const diseases = Array.isArray(references.diseases) ? references.diseases : [];
  const physicalStates = Array.isArray(references.physicalStates)
    ? references.physicalStates
    : PHYSICAL_STATES;

  const maxRows = Math.max(
    subcategories.length,
    brands.length,
    diseases.length,
    physicalStates.length,
    1
  );

  const aoa = [
    [
      "product_subcategory_id",
      "product_subcategory_name",
      null,
      null,
      "brand_name_id",
      "brand_name",
      null,
      null,
      "health_disease_id",
      "health_disease_name",
      null,
      null,
      "physical_state",
    ],
  ];

  for (let i = 0; i < maxRows; i += 1) {
    const subcategory = subcategories[i];
    const brand = brands[i];
    const disease = diseases[i];
    aoa.push([
      subcategory?.id || subcategory?.pk || "",
      subcategory?.name || subcategory?.product_subcategory_name || "",
      null,
      null,
      brand?.id || brand?.brand_name_id || brand?.pk || "",
      brand?.name || brand?.brand_name || "",
      null,
      null,
      disease?.id || disease?.health_disease_id || disease?.pk || "",
      disease?.name || disease?.health_disease_name || "",
      null,
      null,
      physicalStates[i] || "",
    ]);
  }

  return XLSX.utils.aoa_to_sheet(aoa);
}

/** Export products in the same multi-sheet format as the bulk-update template. */
export function exportBulkUpdateWorkbook(filename, products = [], references = {}) {
  const { productRows, variantRows, galleryRows } = mapProductsToBulkUpdateSheets(
    products,
    references
  );

  if (!productRows.length) return false;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    sheetFromObjects(BULK_UPDATE_PRODUCT_HEADERS, productRows),
    "Products"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    sheetFromObjects(BULK_UPDATE_VARIANT_HEADERS, variantRows),
    "Variants"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    sheetFromObjects(BULK_UPDATE_GALLERY_HEADERS, galleryRows),
    "Gallery"
  );
  XLSX.utils.book_append_sheet(workbook, buildReferencesSheet(references), "References");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(BULK_UPDATE_INSTRUCTIONS),
    "Instructions"
  );
  XLSX.writeFile(workbook, filename);
  return true;
}
