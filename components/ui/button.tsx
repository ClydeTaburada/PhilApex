import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "danger" | "destructive";
  size?: "default" | "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", loading, disabled, children, ...props }, ref) => {
    let classes =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none ";

    // Variants
    if (variant === "default" || variant === "primary") {
      classes += "bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent ";
    } else if (variant === "secondary") {
      classes += "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 ";
    } else if (variant === "outline") {
      classes += "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 ";
    } else if (variant === "ghost") {
      classes += "hover:bg-gray-100 text-gray-700 border border-transparent ";
    } else if (variant === "danger" || variant === "destructive") {
      classes += "bg-red-600 text-white hover:bg-red-700 border border-transparent ";
    }

    // Sizes
    if (size === "default" || size === "md") {
      classes += "h-8 sm:h-9 px-3.5 py-2 ";
    } else if (size === "sm") {
      classes += "h-7 sm:h-8 px-2.5 py-1 text-xs ";
    } else if (size === "lg") {
      classes += "h-10 px-6 text-sm ";
    } else if (size === "icon") {
      classes += "h-8 w-8 ";
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes + className}
        {...props}
      >
        {loading && (
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
