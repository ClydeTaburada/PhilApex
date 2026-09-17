import type { PartnerChainNode } from "@/lib/data/partners";

export function PartnerChain({ chain }: { chain: PartnerChainNode[] }) {
  if (!chain || chain.length === 0) return <span className="text-xs text-gray-400">No hierarchy</span>;

  return (
    <div className="flex items-center gap-1.5 text-xs truncate max-w-full">
      {chain.map((node, i) => (
        <span key={node.id} className="inline-flex items-center gap-1.5 truncate">
          <span className={`truncate ${i === chain.length - 1 ? "font-semibold text-gray-900" : "text-gray-500"}`} title={node.name}>
            {node.name}
          </span>
          {i < chain.length - 1 && (
            <span className="text-gray-300 shrink-0">/</span>
          )}
        </span>
      ))}
    </div>
  );
}
