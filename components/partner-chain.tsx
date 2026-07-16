import type { PartnerChainNode } from "@/lib/data/partners";

export function PartnerChain({ chain }: { chain: PartnerChainNode[] }) {
  if (!chain || chain.length === 0) return <span className="text-xs text-ink-muted">No hierarchy</span>;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {chain.map((node, i) => (
        <span key={node.id} className="flex items-center gap-1.5">
          <span className="font-medium" style={{ color: i === chain.length - 1 ? "var(--ink)" : "var(--ink-muted)" }}>
            {node.name}
          </span>
          {i < chain.length - 1 && (
            <span style={{ color: "var(--border)" }}>/</span>
          )}
        </span>
      ))}
    </div>
  );
}
