import * as React from "react"

export function TableSkeleton({ columns = 4, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="w-full">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 bg-gray-50 border-b border-gray-200 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`head-${i}`} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${100 / columns}%` }} />
        ))}
      </div>

      {/* Rows Skeleton */}
      <div className="flex flex-col divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-${i}`} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={`cell-${i}-${j}`} className="flex items-center" style={{ width: `${100 / columns}%` }}>
                <div 
                  className={`h-4 bg-gray-100 rounded animate-pulse w-full max-w-[${80 - (j * 10)}%]`} 
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
