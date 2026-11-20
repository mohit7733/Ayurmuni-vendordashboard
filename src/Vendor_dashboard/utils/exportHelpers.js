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
