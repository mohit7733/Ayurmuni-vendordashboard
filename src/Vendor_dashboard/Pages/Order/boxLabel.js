import brandLogo from "../../../Assests/logo/logo.svg";
import { formatCurrency, formatOrderDate, formatPaymentLabel, formatStatusLabel } from "./orderHelpers";

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function logoSrc() {
    const src = String(brandLogo || "");
    if (!src) return "";
    if (src.startsWith("data:") || src.startsWith("http")) return src;
    return new URL(src, window.location.href).href;
}

function formatWhen(value) {
    const stamp = formatOrderDate(value);
    if (stamp.date === "—") return "—";
    return stamp.time ? `${stamp.date}, ${stamp.time}` : stamp.date;
}

function money(amount, effect) {
    const formatted = formatCurrency(amount);
    return effect === "subtract" ? `−${formatted}` : formatted;
}

function addressBlock(address) {
    if (!address) return `<p class="muted">Address not available</p>`;
    const type = address.address_type ? formatStatusLabel(address.address_type) : "";
    const street = [address.address_line_1, address.address_line_2].filter(Boolean);
    const locality = [address.city, address.state].filter(Boolean).join(", ");
    const pin = address.zipcode ? `PIN ${address.zipcode}` : "";
    const parts = [
        type ? `<p class="addr-type">${escapeHtml(type)}</p>` : "",
        ...street.map((line) => `<p>${escapeHtml(line)}</p>`),
        locality ? `<p>${escapeHtml(locality)}</p>` : "",
        pin ? `<p class="pin">${escapeHtml(pin)}</p>` : "",
        address.country ? `<p>${escapeHtml(address.country)}</p>` : "",
    ].filter(Boolean);
    return parts.join("") || `<p class="muted">Address not available</p>`;
}

function paymentBlock(order) {
    const type = String(order?.payment_type || "").toLowerCase();
    const status = String(order?.payment?.status || "").toLowerCase();
    const amount =
        order?.amount_breakup?.total_amount ??
        order?.payment?.amount ??
        order?.total_amount;
    const formatted = formatCurrency(amount);
    const collected = ["paid", "cod_collected", "captured", "success"].includes(status);
    const method = formatPaymentLabel(order?.payment_type, order?.payment_method);

    let headline = "Amount";
    let value = formatted;
    if (type === "cod" && !collected) {
        headline = "Collect on delivery";
        value = formatted;
    } else if (collected) {
        headline = "Amount paid";
        value = formatted;
    }

    const statusLabel = order?.payment?.status_label || (status ? formatStatusLabel(status) : "");
    const paidOn = formatWhen(order?.payment?.paid_at);

    return {
        headline,
        value,
        method,
        statusLabel,
        paidOn: paidOn === "—" ? "" : paidOn,
    };
}

function breakupRows(order) {
    const lines = order?.amount_breakup?.lines;
    if (!Array.isArray(lines)) return [];
    return lines
        .filter((line) => Number.isFinite(Number(line?.amount)) && Number(line.amount) >= 0)
        .map((line) => ({
            key: line.key || line.label,
            label: line.label || formatStatusLabel(line.key),
            amount: Number(line.amount),
            effect: line.effect === "subtract" ? "subtract" : "add",
        }));
}

function itemRows(order) {
    const items = Array.isArray(order?.items) ? order.items : [];
    if (!items.length) {
        return `<tr><td colspan="5" class="muted">No items on this order.</td></tr>`;
    }

    return items
        .map((item) => {
            const variant = item.variant || {};
            const title = variant.variant_title || "Product";
            const meta = [variant.brand_name, variant.size].filter(Boolean).join(" · ");
            const mrp = Number(variant.mrp);
            const selling = Number(item.selling_price ?? variant.selling_price);
            const showMrp = Number.isFinite(mrp) && Number.isFinite(selling) && mrp > selling;
            const gift = item.gift_wrap ? `<em class="gift">Gift wrap</em>` : "";
            return `<tr>
                <td>
                  <strong>${escapeHtml(title)}</strong>
                  ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
                  ${gift}
                </td>
                <td class="mono">${escapeHtml(item.sku_code || "—")}</td>
                <td class="num">${escapeHtml(item.quantity ?? "—")}</td>
                <td class="num">
                  ${escapeHtml(formatCurrency(item.selling_price))}
                  ${showMrp ? `<span class="mrp">MRP ${escapeHtml(formatCurrency(mrp))}</span>` : ""}
                </td>
                <td class="num amount">${escapeHtml(formatCurrency(item.total_price))}</td>
              </tr>`;
        })
        .join("");
}

export function canDownloadBoxLabel(order) {
    if (!order) return false;
    const status = String(order.order_status || "").toLowerCase();
    const readyStatuses = ["packed", "dispatched", "shipped", "delivered", "out_for_delivery"];
    return Boolean(
        order.invoice_download_available ||
            order.unicommerce_invoice_display_code ||
            readyStatuses.includes(status)
    );
}

function buildBoxLabelHtml(order) {
    const displayCode = order.order_display_code || order.order_code || "Order";
    const invoiceCode = order.unicommerce_invoice_display_code || "—";
    const payment = paymentBlock(order);
    const rows = breakupRows(order);
    const total =
        order?.amount_breakup?.total_amount ?? order?.total_amount ?? order?.payment?.amount;
    const qty = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const breakupHtml = rows
        .map(
            (row) => `<div class="sum-row">
                <span>${escapeHtml(row.label)}</span>
                <span>${escapeHtml(money(row.amount, row.effect))}</span>
              </div>`
        )
        .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(displayCode)}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #f3f4f6;
      color: #1f2937;
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
    }
    .page {
      width: 210mm;
      margin: 16px auto;
      background: #fff;
      box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
    }
    .sheet {
      width: 210mm;
      padding: 8mm 10mm 7mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 4mm;
      border-bottom: 2px solid #0D614E;
    }
    .logo {
      height: 42px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
      display: block;
    }
    .brand-fallback {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #0D614E;
    }
    .doc-kicker {
      margin: 0;
      text-align: right;
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #0D614E;
      font-weight: 700;
    }
    .invoice-no {
      margin: 2px 0 0;
      text-align: right;
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }
    .meta {
      margin: 4px 0 0;
      text-align: right;
      font-size: 11px;
      line-height: 1.45;
      color: #4b5563;
    }
    .meta strong { color: #111827; font-weight: 600; }
    .grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 8mm;
      padding: 4mm 0;
    }
    h2 {
      margin: 0 0 6px;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6b7280;
    }
    .addr p { margin: 0; font-size: 13px; line-height: 1.4; color: #111827; }
    .addr-type {
      display: inline-block;
      margin-bottom: 3px !important;
      padding: 1px 7px;
      border-radius: 999px;
      background: #e8f5f1;
      color: #0D614E;
      font-size: 10px !important;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .pin { font-weight: 700; }
    .pay-card {
      background: #f7fbf9;
      border: 1px solid #d7ebe4;
      border-radius: 8px;
      padding: 8px 10px;
    }
    .pay-label { margin: 0; font-size: 11px; color: #6b7280; }
    .pay-value { margin: 2px 0 6px; font-size: 20px; font-weight: 700; color: #0D614E; }
    .pay-line { margin: 0; font-size: 12px; color: #374151; line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 700;
      padding: 0 0 4px;
      border-bottom: 1px solid #e5e7eb;
    }
    th.num, td.num { text-align: right; }
    td {
      padding: 5px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
      vertical-align: top;
    }
    td strong { display: block; color: #111827; font-size: 12.5px; }
    td span, .mrp {
      display: block;
      margin-top: 1px;
      color: #6b7280;
      font-size: 10px;
    }
    .mrp { text-decoration: line-through; }
    .gift {
      display: inline-block;
      margin-top: 3px;
      font-style: normal;
      font-size: 10px;
      font-weight: 700;
      color: #0D614E;
    }
    .mono { font-family: Consolas, "Courier New", monospace; font-size: 10px; color: #374151; }
    td.amount { font-weight: 700; color: #111827; }
    .muted { color: #6b7280; }
    .bottom {
      margin-top: auto;
      display: grid;
      grid-template-columns: 1fr 72mm;
      gap: 8mm;
      align-items: end;
      padding-top: 3mm;
    }
    .note {
      margin: 0;
      font-size: 11px;
      line-height: 1.45;
      color: #4b5563;
    }
    .sums { border-top: 1px solid #e5e7eb; padding-top: 4px; }
    .sum-row, .total-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 12px;
      padding: 2px 0;
      color: #374151;
    }
    .total-row {
      margin-top: 4px;
      padding-top: 5px;
      border-top: 1.5px solid #0D614E;
      font-size: 14px;
      font-weight: 700;
      color: #0D614E;
    }
    @media print {
      html, body { background: #fff; }
      .page {
        margin: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="sheet">
      <header class="head">
        <img class="logo" src="${escapeHtml(logoSrc())}" alt="AyurMuni" />
        <div>
          <p class="doc-kicker">Invoice</p>
          <p class="invoice-no">${escapeHtml(invoiceCode)}</p>
          <p class="meta">
            <strong>${escapeHtml(displayCode)}</strong><br />
            ${escapeHtml(order.order_code || "")}<br />
            Placed ${escapeHtml(formatWhen(order.created_at))}<br />
            Issued ${escapeHtml(formatWhen(order.unicommerce_invoice_available_at || order.packed_at))}
          </p>
        </div>
      </header>

      <div class="grid">
        <div class="addr">
          <h2>Deliver to</h2>
          ${addressBlock(order.delivery_address)}
        </div>
        <div class="pay-card">
          <p class="pay-label">${escapeHtml(payment.headline)}</p>
          <p class="pay-value">${escapeHtml(payment.value)}</p>
          <p class="pay-line">Method: ${escapeHtml(payment.method)}</p>
          ${payment.statusLabel ? `<p class="pay-line">Status: ${escapeHtml(payment.statusLabel)}</p>` : ""}
          ${payment.paidOn ? `<p class="pay-line">Paid on ${escapeHtml(payment.paidOn)}</p>` : ""}
          <p class="pay-line">${qty} unit${qty === 1 ? "" : "s"} · ${(order.items || []).length} item${(order.items || []).length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th class="num">Qty</th>
            <th class="num">Price</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows(order)}</tbody>
      </table>

      <div class="bottom">
        <p class="note">Place this invoice on top of the product box before handover.</p>
        <div class="sums">
          ${breakupHtml}
          <div class="total-row">
            <span>Total</span>
            <span>${escapeHtml(formatCurrency(total))}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
  <script>
    window.addEventListener("load", function () {
      window.print();
    });
  </script>
</body>
</html>`;
}

export function downloadBoxLabel(order) {
    const html = buildBoxLabelHtml(order);
    const labelWindow = window.open("", "_blank", "width=900,height=1100");
    if (!labelWindow) {
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const code = order.order_display_code || order.order_code || "order";
        link.href = url;
        link.download = `invoice-${String(code).replace(/[^\w.-]+/g, "")}.html`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        return "downloaded";
    }

    labelWindow.document.open();
    labelWindow.document.write(html);
    labelWindow.document.close();
    return "printed";
}
