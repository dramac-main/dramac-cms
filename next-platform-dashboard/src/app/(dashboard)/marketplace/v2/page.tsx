import { redirect } from "next/navigation";

/**
 * Redirect /marketplace/v2 to /marketplace
 * V2 has been merged into the main marketplace route.
 */
export default function MarketplaceV2Page() {
  redirect("/marketplace");
}
