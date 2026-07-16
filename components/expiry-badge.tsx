import type { ExpiryTier } from "@/lib/data/accreditations";

export function ExpiryBadge({ tier }: { tier: ExpiryTier }) {
  switch (tier) {
    case "ok":
      return <span className="badge badge-green">Valid</span>;
    case "warn_60":
      return <span className="badge badge-amber">Expires &lt; 60d</span>;
    case "warn_30":
      return <span className="badge badge-red">Expires &lt; 30d</span>;
    case "expired":
      return <span className="badge badge-gray">Expired</span>;
    default:
      return null;
  }
}
