import * as React from "react"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "neutral" | "role-purple" | "role-indigo" | "role-teal"
}

export function StatusBadge({ className = "", variant = "neutral", children, ...props }: StatusBadgeProps) {
  let classes = "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border "

  if (variant === "success") {
    classes += "bg-emerald-50 text-emerald-700 border-emerald-200 "
  } else if (variant === "warning") {
    classes += "bg-amber-50 text-amber-700 border-amber-200 "
  } else if (variant === "danger") {
    classes += "bg-rose-50 text-rose-700 border-rose-200 "
  } else if (variant === "neutral") {
    classes += "bg-gray-100 text-gray-600 border-gray-200 "
  } else if (variant === "role-purple") {
    classes += "bg-purple-50 text-purple-700 border-purple-200 "
  } else if (variant === "role-indigo") {
    classes += "bg-indigo-50 text-indigo-700 border-indigo-200 "
  } else if (variant === "role-teal") {
    classes += "bg-teal-50 text-teal-700 border-teal-200 "
  }

  return (
    <span className={classes + className} {...props}>
      {children}
    </span>
  )
}
