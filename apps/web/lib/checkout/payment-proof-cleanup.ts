// =============================================================================
// Payment Proof Cleanup — Skeleton Stub
// =============================================================================
// TODO: This module is a placeholder for the scheduled cleanup of expired
//       payment proof files (uploads older than 48 hours).
//
// Integration Points (not yet wired):
//   - Supabase Storage bucket `payment-proofs` – file deletion via admin API
//   - Cron / pg_cron or Vercel Cron Jobs – periodic trigger every 24h
//   - Notification to admin on cleanup summary
//
// Current behaviour: metadata-only. No files are deleted, no emails sent.
// =============================================================================

export interface ExpiredProof {
  orderId: string;
  orderNumber: string;
  proofFileUrl: string;
  proofFileName: string;
  uploadedAt: Date;
}

/**
 * Scans for payment proofs older than `expiryHours` (default 48) and
 * performs cleanup.
 *
 * @returns A summary of expired proofs that were found (NOT actually deleted).
 */
export async function cleanupExpiredPaymentProofs(
  expiryHours: number = 48,
): Promise<{ cleaned: ExpiredProof[]; errors: string[] }> {
  // TODO: Implement actual query to find orders with proof_file_url IS NOT NULL
  //       AND proof_uploaded_at < NOW() - INTERVAL '$1 hours'
  //
  // TODO: For each expired proof, delete the file from Supabase Storage bucket
  //       using storage admin API.
  //
  // TODO: Update orders table to clear proof_file_url, proof_file_name after
  //       successful deletion.
  //
  // TODO: Send notification/summary to admin (email or in-app).
  //
  // SKELETON: Return empty result — no real cleanup performed.
  console.warn(
    "[payment-proof-cleanup] Skeleton stub invoked — no files were actually deleted.",
  );

  return { cleaned: [], errors: [] };
}
