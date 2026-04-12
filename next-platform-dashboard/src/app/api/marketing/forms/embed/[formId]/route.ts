/**
 * Form Embed Route
 *
 * Phase MKT-06: Landing Pages & Opt-In Forms
 *
 * Serves an embeddable HTML form that can be loaded in an iframe.
 * Returns a self-contained HTML page with the form and submission script.
 *
 * Route: /api/marketing/forms/embed/[formId]
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const { formId } = await params;
    const supabase = createAdminClient() as any;

    const { data: form, error } = await supabase
      .from(MKT_TABLES.forms)
      .select("*")
      .eq("id", formId)
      .eq("status", "active")
      .single();

    if (error || !form) {
      return new NextResponse("Form not found", { status: 404 });
    }

    const fields = form.fields || [];
    const buttonText = form.button_text || "Submit";
    const buttonColor = form.button_color || "#2563eb";
    const origin = request.nextUrl.origin;

    // Build form fields HTML
    const fieldsHtml = fields
      .map((f: any) => {
        if (f.type === "hidden") {
          return `<input type="hidden" name="${escapeHtml(f.id || f.label)}" value="${escapeHtml(f.defaultValue || "")}" />`;
        }
        if (f.type === "checkbox") {
          return `<div class="field">
            <label class="checkbox-label">
              <input type="checkbox" name="${escapeHtml(f.id || f.label)}" ${f.required ? "required" : ""} />
              <span>${escapeHtml(f.label)}</span>
            </label>
          </div>`;
        }
        if (f.type === "select") {
          const options = (f.options || [])
            .map(
              (o: string) =>
                `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`,
            )
            .join("");
          return `<div class="field">
            <label>${escapeHtml(f.label)}${f.required ? " *" : ""}</label>
            <select name="${escapeHtml(f.id || f.label)}" ${f.required ? "required" : ""}>
              <option value="">${escapeHtml(f.placeholder || "Select...")}</option>
              ${options}
            </select>
          </div>`;
        }
        if (f.type === "textarea") {
          return `<div class="field">
            <label>${escapeHtml(f.label)}${f.required ? " *" : ""}</label>
            <textarea name="${escapeHtml(f.id || f.label)}" placeholder="${escapeHtml(f.placeholder || "")}" ${f.required ? "required" : ""} rows="3"></textarea>
          </div>`;
        }
        return `<div class="field">
          <label>${escapeHtml(f.label)}${f.required ? " *" : ""}</label>
          <input type="${f.type || "text"}" name="${escapeHtml(f.id || f.label)}" placeholder="${escapeHtml(f.placeholder || "")}" ${f.required ? "required" : ""} />
        </div>`;
      })
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 16px; }
  .field { margin-bottom: 12px; }
  label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px; color: #374151; }
  input, select, textarea { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  input:focus, select:focus, textarea:focus { outline: none; border-color: ${escapeHtml(buttonColor)}; box-shadow: 0 0 0 2px ${escapeHtml(buttonColor)}33; }
  .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .checkbox-label input { width: auto; }
  button { width: 100%; padding: 10px 16px; background: ${escapeHtml(buttonColor)}; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
  button:hover { opacity: 0.9; }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
  .success { text-align: center; padding: 24px; color: #059669; }
  .error { color: #dc2626; font-size: 13px; margin-bottom: 8px; }
</style>
</head>
<body>
<form id="dramac-form" novalidate>
${fieldsHtml}
<div id="form-error" class="error" style="display:none;"></div>
<button type="submit" id="submit-btn">${escapeHtml(buttonText)}</button>
</form>
<div id="success-msg" class="success" style="display:none;"></div>
<script>
(function() {
  var form = document.getElementById("dramac-form");
  var btn = document.getElementById("submit-btn");
  var errorEl = document.getElementById("form-error");
  var successEl = document.getElementById("success-msg");
  
  function resize() {
    window.parent.postMessage({
      formId: "${formId}",
      height: document.body.scrollHeight
    }, "*");
  }
  
  resize();
  new MutationObserver(resize).observe(document.body, { childList: true, subtree: true });
  
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    errorEl.style.display = "none";
    btn.disabled = true;
    btn.textContent = "Submitting...";
    
    var data = {};
    var formData = new FormData(form);
    formData.forEach(function(v, k) { data[k] = v; });
    
    fetch("${origin}/api/marketing/forms/submit/${formId}", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    .then(function(r) { return r.json(); })
    .then(function(result) {
      if (result.success) {
        var action = result.successAction || { type: "message", message: "Thank you!" };
        if (action.type === "redirect" && action.redirectUrl) {
          window.top.location.href = action.redirectUrl;
        } else {
          form.style.display = "none";
          successEl.textContent = action.message || "Thank you!";
          successEl.style.display = "block";
        }
      } else {
        errorEl.textContent = result.error || "Something went wrong.";
        errorEl.style.display = "block";
        btn.disabled = false;
        btn.textContent = "${escapeHtml(buttonText)}";
      }
      resize();
    })
    .catch(function() {
      errorEl.textContent = "Network error. Please try again.";
      errorEl.style.display = "block";
      btn.disabled = false;
      btn.textContent = "${escapeHtml(buttonText)}";
      resize();
    });
  });
})();
</script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "ALLOWALL",
      },
    });
  } catch (err) {
    console.error("[Form Embed] Error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
