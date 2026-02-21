/**
 * Test Email Sender Script
 * 
 * Sends test notification emails directly using the Resend API
 * to verify the notification system is working.
 * 
 * Usage: node scripts/test-emails.mjs
 */

const RESEND_API_KEY = "re_d4tmjU1x_9b3bSmCb5EmQyr7SC7desERd";
const FROM_EMAIL = "Dramac <noreply@app.dramacagency.com>";
const RECIPIENTS = ["info@dramacagency.com", "drakemacchiko@gmail.com"];

const TEST_EMAILS = [
  {
    type: "order_confirmation_customer",
    label: "Order Confirmation (Customer)",
    subject: "Order Confirmed — #TEST-ORD-001",
    html: buildOrderConfirmationHtml(),
  },
  {
    type: "order_shipped_customer",
    label: "Order Shipped (Customer)",
    subject: "Your Order #TEST-ORD-001 Has Been Shipped! 📦",
    html: buildOrderShippedHtml(),
  },
  {
    type: "order_delivered_customer",
    label: "Order Delivered (Customer)",
    subject: "Your Order #TEST-ORD-001 Has Been Delivered! ✅",
    html: buildOrderDeliveredHtml(),
  },
  {
    type: "order_cancelled_customer",
    label: "Order Cancelled (Customer)",
    subject: "Order #TEST-ORD-001 Has Been Cancelled",
    html: buildOrderCancelledHtml(),
  },
  {
    type: "payment_received_customer",
    label: "Payment Received (Customer)",
    subject: "Payment Confirmed for Order #TEST-ORD-001 💳",
    html: buildPaymentReceivedHtml(),
  },
  {
    type: "refund_issued_customer",
    label: "Refund Issued (Customer)",
    subject: "Refund Issued for Order #TEST-ORD-001",
    html: buildRefundIssuedHtml(),
  },
  {
    type: "low_stock_admin",
    label: "Low Stock Alert (Admin)",
    subject: "⚠️ Low Stock Alert: Premium T-Shirt (Black, L)",
    html: buildLowStockHtml(),
  },
  {
    type: "abandoned_cart_customer",
    label: "Abandoned Cart (Customer)",
    subject: "You left items in your cart! 🛒",
    html: buildAbandonedCartHtml(),
  },
];

// ============================================================================
// HTML Templates (simplified branded versions for testing)
// ============================================================================

function wrapTemplate(title, body) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:#18181b;color:white;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="margin:0;font-size:24px;font-weight:700;">Dramac Agency</h1>
      <p style="margin:4px 0 0;font-size:12px;opacity:0.7;">TEST NOTIFICATION — ${new Date().toLocaleString()}</p>
    </div>
    <!-- Body -->
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e4e4e7;border-top:none;">
      ${body}
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:20px;color:#71717a;font-size:12px;">
      <p>This is a <strong>test email</strong> from the DRAMAC CMS Notification System.</p>
      <p>Sent via Resend API • ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>`;
}

function buildOrderConfirmationHtml() {
  return wrapTemplate("Order Confirmation", `
    <h2 style="margin:0 0 8px;color:#18181b;">Order Confirmed! 🎉</h2>
    <p style="color:#52525b;">Thank you, Drake! Your order has been received and is being processed.</p>
    
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:600;color:#166534;">Order #TEST-ORD-001</p>
      <p style="margin:4px 0 0;color:#15803d;font-size:14px;">Placed on ${new Date().toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="border-bottom:1px solid #e4e4e7;">
        <td style="padding:12px 0;font-weight:600;">Item</td>
        <td style="padding:12px 0;text-align:center;">Qty</td>
        <td style="padding:12px 0;text-align:right;font-weight:600;">Price</td>
      </tr>
      <tr style="border-bottom:1px solid #f4f4f5;">
        <td style="padding:10px 0;">Premium T-Shirt (Black, L)</td>
        <td style="padding:10px 0;text-align:center;">2</td>
        <td style="padding:10px 0;text-align:right;">K 500.00</td>
      </tr>
      <tr style="border-bottom:1px solid #f4f4f5;">
        <td style="padding:10px 0;">Custom Mug — Dramac Logo</td>
        <td style="padding:10px 0;text-align:center;">1</td>
        <td style="padding:10px 0;text-align:right;">K 85.00</td>
      </tr>
    </table>

    <div style="text-align:right;margin:12px 0;padding-top:12px;border-top:2px solid #18181b;">
      <p style="margin:0;font-size:14px;color:#52525b;">Subtotal: K 585.00</p>
      <p style="margin:4px 0;font-size:14px;color:#52525b;">Shipping: K 50.00</p>
      <p style="margin:4px 0;font-size:14px;color:#52525b;">Tax (16% VAT): K 93.60</p>
      <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#18181b;">Total: K 728.60</p>
    </div>

    <p style="color:#52525b;font-size:14px;margin:20px 0 0;">📍 Shipping to: 123 Cairo Road, Lusaka, Zambia</p>
    <p style="color:#52525b;font-size:14px;margin:4px 0;">🚚 Estimated delivery: 3-5 business days</p>
  `);
}

function buildOrderShippedHtml() {
  return wrapTemplate("Order Shipped", `
    <h2 style="margin:0 0 8px;color:#18181b;">Your Order Has Shipped! 📦</h2>
    <p style="color:#52525b;">Great news, Drake! Your order is on its way.</p>
    
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:600;color:#1e40af;">Order #TEST-ORD-001</p>
      <p style="margin:8px 0 0;color:#1d4ed8;font-size:14px;">
        <strong>Carrier:</strong> Zambia Post<br>
        <strong>Tracking:</strong> ZM-TRACK-2026-0221-XYZ
      </p>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="https://track.zampost.co.zm/ZM-TRACK-2026-0221-XYZ" style="background:#2563eb;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Track Your Order</a>
    </div>

    <p style="color:#52525b;font-size:14px;">📅 Estimated delivery: <strong>February 25, 2026</strong></p>
    
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="border-bottom:1px solid #e4e4e7;">
        <td style="padding:8px 0;font-weight:600;">Items Shipped</td>
        <td style="padding:8px 0;text-align:right;">Qty</td>
      </tr>
      <tr style="border-bottom:1px solid #f4f4f5;">
        <td style="padding:8px 0;">Premium T-Shirt (Black, L)</td>
        <td style="padding:8px 0;text-align:right;">2</td>
      </tr>
      <tr>
        <td style="padding:8px 0;">Custom Mug — Dramac Logo</td>
        <td style="padding:8px 0;text-align:right;">1</td>
      </tr>
    </table>
  `);
}

function buildOrderDeliveredHtml() {
  return wrapTemplate("Order Delivered", `
    <h2 style="margin:0 0 8px;color:#18181b;">Your Order Has Been Delivered! ✅</h2>
    <p style="color:#52525b;">Hi Drake, your order has been delivered successfully.</p>
    
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:600;color:#166534;">Order #TEST-ORD-001</p>
      <p style="margin:4px 0 0;color:#15803d;font-size:14px;">Delivered on ${new Date().toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>

    <p style="color:#52525b;">We hope you love your purchase! If you have any questions or concerns, don't hesitate to reach out.</p>
    
    <p style="color:#52525b;font-size:14px;">Thank you for shopping with us! 🙏</p>
  `);
}

function buildOrderCancelledHtml() {
  return wrapTemplate("Order Cancelled", `
    <h2 style="margin:0 0 8px;color:#18181b;">Order Cancelled</h2>
    <p style="color:#52525b;">Hi Drake, your order has been cancelled as requested.</p>
    
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:600;color:#991b1b;">Order #TEST-ORD-001 — Cancelled</p>
      <p style="margin:8px 0 0;color:#b91c1c;font-size:14px;">
        <strong>Reason:</strong> Customer requested cancellation — item no longer needed
      </p>
    </div>

    <p style="color:#52525b;"><strong>Refund:</strong> K 728.60 will be returned to your original payment method within 5-10 business days.</p>
  `);
}

function buildPaymentReceivedHtml() {
  return wrapTemplate("Payment Received", `
    <h2 style="margin:0 0 8px;color:#18181b;">Payment Confirmed! 💳</h2>
    <p style="color:#52525b;">Hi Drake, we've received your payment successfully.</p>
    
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:14px;color:#166534;">Amount Paid</p>
      <p style="margin:8px 0 0;font-size:32px;font-weight:700;color:#15803d;">K 728.60</p>
      <p style="margin:8px 0 0;font-size:13px;color:#166534;">via Flutterwave (Mobile Money)</p>
    </div>

    <p style="color:#52525b;font-size:14px;"><strong>Order:</strong> #TEST-ORD-001</p>
    <p style="color:#52525b;font-size:14px;"><strong>Date:</strong> ${new Date().toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" })}</p>
    
    <p style="color:#52525b;">Your order is now being processed and you'll receive a shipping notification soon.</p>
  `);
}

function buildRefundIssuedHtml() {
  return wrapTemplate("Refund Issued", `
    <h2 style="margin:0 0 8px;color:#18181b;">Refund Processed</h2>
    <p style="color:#52525b;">Hi Drake, your refund has been processed.</p>
    
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:14px;color:#1e40af;">Refund Amount</p>
      <p style="margin:8px 0 0;font-size:32px;font-weight:700;color:#2563eb;">K 728.60</p>
    </div>

    <p style="color:#52525b;font-size:14px;"><strong>Order:</strong> #TEST-ORD-001</p>
    <p style="color:#52525b;font-size:14px;"><strong>Reason:</strong> Order cancelled per customer request</p>
    <p style="color:#52525b;font-size:14px;">💰 The refund will appear on your original payment method within <strong>5-10 business days</strong>.</p>
  `);
}

function buildLowStockHtml() {
  return wrapTemplate("Low Stock Alert", `
    <h2 style="margin:0 0 8px;color:#18181b;">⚠️ Low Stock Alert</h2>
    <p style="color:#52525b;">A product in your store is running low on stock.</p>
    
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:600;color:#92400e;">Premium T-Shirt (Black, L)</p>
      <p style="margin:8px 0 0;color:#a16207;font-size:14px;">
        <strong>SKU:</strong> TSH-BLK-L-001<br>
        <strong>Current Stock:</strong> 3 units<br>
        <strong>Alert Threshold:</strong> 5 units
      </p>
    </div>

    <p style="color:#52525b;">Consider restocking this item soon to avoid missed sales.</p>
    
    <div style="text-align:center;margin:24px 0;">
      <a href="https://app.dramacagency.com/dashboard" style="background:#d97706;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Manage Inventory</a>
    </div>
  `);
}

function buildAbandonedCartHtml() {
  return wrapTemplate("Abandoned Cart", `
    <h2 style="margin:0 0 8px;color:#18181b;">You Left Items in Your Cart! 🛒</h2>
    <p style="color:#52525b;">Hi Drake, you have items waiting in your shopping cart.</p>
    
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr style="border-bottom:1px solid #e4e4e7;">
        <td style="padding:10px 0;font-weight:600;">Item</td>
        <td style="padding:10px 0;text-align:center;">Qty</td>
        <td style="padding:10px 0;text-align:right;font-weight:600;">Price</td>
      </tr>
      <tr style="border-bottom:1px solid #f4f4f5;">
        <td style="padding:10px 0;">Premium T-Shirt (Black, L)</td>
        <td style="padding:10px 0;text-align:center;">1</td>
        <td style="padding:10px 0;text-align:right;">K 250.00</td>
      </tr>
      <tr style="border-bottom:1px solid #f4f4f5;">
        <td style="padding:10px 0;">Dramac Cap</td>
        <td style="padding:10px 0;text-align:center;">1</td>
        <td style="padding:10px 0;text-align:right;">K 120.00</td>
      </tr>
    </table>

    <div style="text-align:right;margin:12px 0;padding-top:8px;border-top:2px solid #18181b;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#18181b;">Total: K 370.00</p>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="https://store.dramacagency.com/checkout" style="background:#18181b;color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;font-size:16px;">Complete Your Purchase →</a>
    </div>

    <p style="color:#71717a;font-size:13px;text-align:center;">Items in your cart are not reserved and may sell out.</p>
  `);
}

// ============================================================================
// Main: Send all test emails
// ============================================================================

async function sendTestEmail(config) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: RECIPIENTS,
      subject: `[TEST] ${config.subject}`,
      html: config.html,
    }),
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  DRAMAC CMS — Test Notification Emails");
  console.log(`  Sending ${TEST_EMAILS.length} test emails to:`);
  RECIPIENTS.forEach((r) => console.log(`    📧 ${r}`));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  let successCount = 0;
  let failCount = 0;

  for (const config of TEST_EMAILS) {
    try {
      const result = await sendTestEmail(config);
      if (result.status === 200) {
        successCount++;
        console.log(`  ✅ ${config.label} — ID: ${result.data.id}`);
      } else {
        failCount++;
        console.log(`  ❌ ${config.label} — Error: ${JSON.stringify(result.data)}`);
      }
    } catch (error) {
      failCount++;
      console.log(`  ❌ ${config.label} — Error: ${error.message}`);
    }

    // Rate limit spacing
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Results: ${successCount} ✅ succeeded, ${failCount} ❌ failed`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch(console.error);
