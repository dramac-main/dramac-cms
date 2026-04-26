"use server";

/**
 * Portal Payment Proofs — server actions.
 *
 * Portal-first surface: all writes flow through the portal DAL
 * (`dal.payments.*`) which enforces scope + permission + audit + events.
 */

import { revalidatePath } from "next/cache";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { createPortalDAL } from "@/lib/portal/data-access";
import type { PortalPaymentProof } from "@/lib/portal/commerce-data-access";

async function dal() {
  const user = await requirePortalAuth();
  const session = await getPortalSession();
  return createPortalDAL({
    user,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
  });
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function approvePaymentProofAction(
  siteId: string,
  proofId: string,
): Promise<ActionResult> {
  try {
    const d = await dal();
    await d.payments.approveProof(siteId, proofId);
    revalidatePath(`/portal/sites/${siteId}/payment-proofs`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Approval failed",
    };
  }
}

export async function rejectPaymentProofAction(
  siteId: string,
  proofId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    if (!reason || reason.trim().length < 3) {
      return {
        ok: false,
        error: "A reason of at least 3 characters is required.",
      };
    }
    const d = await dal();
    await d.payments.rejectProof(siteId, proofId, { reason: reason.trim() });
    revalidatePath(`/portal/sites/${siteId}/payment-proofs`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Rejection failed",
    };
  }
}

export async function bulkReviewPaymentProofsAction(
  siteId: string,
  proofIds: string[],
  decision: { status: "approved" } | { status: "rejected"; reason: string },
): Promise<
  | {
      ok: true;
      succeeded: number;
      failed: Array<{ id: string; reason: string }>;
    }
  | { ok: false; error: string }
> {
  try {
    if (proofIds.length === 0) {
      return { ok: false, error: "No proofs selected." };
    }
    if (decision.status === "rejected" && !decision.reason?.trim()) {
      return { ok: false, error: "Rejection requires a reason." };
    }
    const d = await dal();
    const result = await d.payments.bulkReview(siteId, {
      ids: proofIds,
      action: decision.status === "approved" ? "approve" : "reject",
      reason:
        decision.status === "rejected" ? decision.reason.trim() : undefined,
    });
    revalidatePath(`/portal/sites/${siteId}/payment-proofs`);
    return {
      ok: true,
      succeeded: result.succeeded.length,
      failed: result.failed,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bulk review failed",
    };
  }
}

export async function signPaymentProofUrlAction(
  siteId: string,
  proofId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const d = await dal();
    // Verify scope + permission by loading the proof from the DAL first.
    const proofs = await d.payments.listProofs(siteId, {
      status: "all",
      limit: 200,
    });
    const proof: PortalPaymentProof | undefined = proofs.find(
      (p) => p.id === proofId,
    );
    if (!proof) return { ok: false, error: "Proof not found" };

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("payment-proofs")
      .createSignedUrl(proof.storagePath, 60 * 5);
    if (error || !data?.signedUrl) {
      return { ok: false, error: "Unable to sign URL" };
    }
    return { ok: true, url: data.signedUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sign URL failed",
    };
  }
}
