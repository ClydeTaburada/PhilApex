import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger"
  size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    let classes =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 "

    // Variants
    if (variant === "default") {
      classes += "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent "
    } else if (variant === "secondary") {
      classes += "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-transparent "
    } else if (variant === "outline") {
      classes += "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 "
    } else if (variant === "ghost") {
      classes += "hover:bg-gray-100 text-gray-700 "
    } else if (variant === "danger") {
      classes += "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 "
    }

    // Sizes
    if (size === "default") {
      classes += "h-9 px-4 py-2 "
    } else if (size === "sm") {
      classes += "h-8 px-3 "
    } else if (size === "lg") {
      classes += "h-10 px-8 "
    } else if (size === "icon") {
      classes += "h-8 w-8 "
    }

    return (
      <button
        className={classes + className}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
