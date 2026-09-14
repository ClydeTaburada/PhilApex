import * as React from "react"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "neutral" | "role-purple" | "role-indigo" | "role-teal"
}

export function StatusBadge({ className = "", variant = "neutral", children, ...props }: StatusBadgeProps) {
  let classes = "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border shadow-sm "

  if (variant === "success") {
    classes += "bg-emerald-100/80 text-emerald-800 border-emerald-200 "
  } else if (variant === "warning") {
    classes += "bg-amber-100/80 text-amber-800 border-amber-300 "
  } else if (variant === "danger") {
    classes += "bg-rose-100/80 text-rose-800 border-rose-200 "
  } else if (variant === "neutral") {
    classes += "bg-slate-100 text-slate-700 border-slate-200 "
  } else if (variant === "role-purple") {
    classes += "bg-purple-100/80 text-purple-800 border-purple-200 "
  } else if (variant === "role-indigo") {
    classes += "bg-indigo-100/80 text-indigo-800 border-indigo-200 "
  } else if (variant === "role-teal") {
    classes += "bg-teal-100/80 text-teal-800 border-teal-200 "
  }

  return (
    <span className={classes + className} {...props}>
      {children}
    </span>
  )
}
