/**
 * Test Email Notification Endpoint
 * 
 * POST /api/test/send-test-emails
 * 
 * Sends test emails for all e-commerce notification types to verify
 * the notification system is working end-to-end.
 * 
 * ⚠️ This endpoint should be removed or protected in production.
 */

import { NextResponse } from "next/server";
import { sendBrandedEmail } from "@/lib/email/send-branded-email";
import type { EmailType } from "@/lib/email/email-types";

interface TestEmailConfig {
  emailType: EmailType;
  label: string;
  data: Record<string, unknown>;
}

// Test data for all e-commerce notification types
const TEST_EMAILS: TestEmailConfig[] = [
  {
    emailType: "order_confirmation_customer",
    label: "Order Confirmation (Customer)",
    data: {
      customerName: "Drake Macchiko",
      orderNumber: "TEST-ORD-001",
      orderDate: new Date().toLocaleDateString("en-ZM", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      items: [
        { name: "Premium T-Shirt (Black, L)", quantity: 2, price: "K 250.00" },
        { name: "Custom Mug - Dramac Logo", quantity: 1, price: "K 85.00" },
      ],
      subtotal: "K 585.00",
      shipping: "K 50.00",
      tax: "K 101.60",
      total: "K 736.60",
      shippingAddress: "123 Cairo Road, Lusaka, Zambia",
      estimatedDelivery: "3-5 business days",
    },
  },
  {
    emailType: "order_confirmation_owner",
    label: "Order Confirmation (Store Owner)",
    data: {
      customerName: "Drake Macchiko",
      customerEmail: "drakemacchiko@gmail.com",
      orderNumber: "TEST-ORD-001",
      orderDate: new Date().toLocaleDateString("en-ZM", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      items: [
        { name: "Premium T-Shirt (Black, L)", quantity: 2, price: "K 250.00" },
        { name: "Custom Mug - Dramac Logo", quantity: 1, price: "K 85.00" },
      ],
      total: "K 736.60",
      paymentMethod: "Flutterwave (Mobile Money)",
    },
  },
  {
    emailType: "order_shipped_customer",
    label: "Order Shipped (Customer)",
    data: {
      customerName: "Drake Macchiko",
      orderNumber: "TEST-ORD-001",
      trackingNumber: "ZM-TRACK-2026-0221-XYZ",
      carrier: "Zambia Post",
      trackingUrl: "https://track.zampost.co.zm/ZM-TRACK-2026-0221-XYZ",
      estimatedDelivery: "February 25, 2026",
      items: [
        { name: "Premium T-Shirt (Black, L)", quantity: 2 },
        { name: "Custom Mug - Dramac Logo", quantity: 1 },
      ],
    },
  },
  {
    emailType: "order_delivered_customer",
    label: "Order Delivered (Customer)",
    data: {
      customerName: "Drake Macchiko",
      orderNumber: "TEST-ORD-001",
      deliveredDate: new Date().toLocaleDateString("en-ZM", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  },
  {
    emailType: "order_cancelled_customer",
    label: "Order Cancelled (Customer)",
    data: {
      customerName: "Drake Macchiko",
      orderNumber: "TEST-ORD-001",
      reason: "Customer requested cancellation — item no longer needed",
      refundAmount: "K 736.60",
    },
  },
  {
    emailType: "order_cancelled_owner",
    label: "Order Cancelled (Store Owner)",
    data: {
      orderNumber: "TEST-ORD-001",
      customerName: "Drake Macchiko",
      customerEmail: "drakemacchiko@gmail.com",
      reason: "Customer requested cancellation",
      total: "K 736.60",
    },
  },
  {
    emailType: "payment_received_customer",
    label: "Payment Received (Customer)",
    data: {
      customerName: "Drake Macchiko",
      orderNumber: "TEST-ORD-001",
      amount: "K 736.60",
      paymentMethod: "Flutterwave (Mobile Money)",
      paymentDate: new Date().toLocaleDateString("en-ZM", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  },
  {
    emailType: "refund_issued_customer",
    label: "Refund Issued (Customer)",
    data: {
      customerName: "Drake Macchiko",
      orderNumber: "TEST-ORD-001",
      refundAmount: "K 736.60",
      reason: "Order cancelled per customer request",
      estimatedDays: "5-10 business days",
    },
  },
  {
    emailType: "low_stock_admin",
    label: "Low Stock Alert (Admin)",
    data: {
      productName: "Premium T-Shirt (Black, L)",
      currentStock: 3,
      threshold: 5,
      sku: "TSH-BLK-L-001",
    },
  },
  {
    emailType: "back_in_stock_customer",
    label: "Back in Stock (Customer)",
    data: {
      customerName: "Drake Macchiko",
      productName: "Limited Edition Hoodie",
      productUrl: "https://store.dramacagency.com/products/limited-hoodie",
      productImage: "",
    },
  },
  {
    emailType: "abandoned_cart_customer",
    label: "Abandoned Cart (Customer)",
    data: {
      customerName: "Drake Macchiko",
      items: [
        { name: "Premium T-Shirt (Black, L)", quantity: 1, price: "K 250.00" },
        { name: "Dramac Cap", quantity: 1, price: "K 120.00" },
      ],
      total: "K 370.00",
      checkoutUrl: "https://store.dramacagency.com/checkout?cart=test123",
    },
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const recipients: string[] = body.recipients || [
      "info@dramacagency.com",
      "drakemacchiko@gmail.com",
    ];
    
    // Allow selecting specific types or sending all
    const selectedTypes: string[] | undefined = body.types;

    const results: Array<{
      emailType: string;
      label: string;
      recipients: string[];
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    const emailsToSend = selectedTypes
      ? TEST_EMAILS.filter((e) => selectedTypes.includes(e.emailType))
      : TEST_EMAILS;

    console.log(
      `[Test Email] Sending ${emailsToSend.length} test emails to ${recipients.join(", ")}`
    );

    for (const testEmail of emailsToSend) {
      try {
        const result = await sendBrandedEmail(null, {
          to: recipients.map((email) => ({ email, name: "Drake Macchiko" })),
          emailType: testEmail.emailType,
          data: testEmail.data,
        });

        results.push({
          emailType: testEmail.emailType,
          label: testEmail.label,
          recipients,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        });

        console.log(
          `[Test Email] ${testEmail.label}: ${result.success ? "✅" : "❌"} ${result.messageId || result.error || ""}`
        );

        // Small delay between sends to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        results.push({
          emailType: testEmail.emailType,
          label: testEmail.label,
          recipients,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(`[Test Email] ${testEmail.label}: ❌`, error);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Test emails sent: ${successCount} succeeded, ${failCount} failed`,
      totalSent: emailsToSend.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("[Test Email] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
