import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger"
  size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    let classes =
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 "

    // Variants
    if (variant === "default") {
      classes += "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20 border border-primary/20 "
    } else if (variant === "secondary") {
      classes += "bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm "
    } else if (variant === "outline") {
      classes += "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm "
    } else if (variant === "ghost") {
      classes += "hover:bg-slate-100 text-slate-700 "
    } else if (variant === "danger") {
      classes += "bg-gradient-to-b from-rose-500 to-rose-600 text-white hover:brightness-110 shadow-md shadow-rose-500/20 border border-rose-600/20 "
    }

    // Sizes
    if (size === "default") {
      classes += "h-10 px-4 py-2 "
    } else if (size === "sm") {
      classes += "h-9 px-3 text-xs "
    } else if (size === "lg") {
      classes += "h-11 px-8 "
    } else if (size === "icon") {
      classes += "h-9 w-9 "
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
