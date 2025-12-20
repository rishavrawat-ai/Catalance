import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const alertVariants = cva("relative rounded-lg border", {
  variants: {
    variant: {
      default: "border-border bg-background",
      warning: "border-amber-500/50 text-amber-600",
      error: "border-red-500/50 text-red-600",
      success: "border-emerald-500/50",
      info: "border-blue-500/50 text-blue-600",
    },
    size: {
      sm: "px-4 py-3",
      lg: "p-4",
    },
    isNotification: {
      true: "z-[100] max-w-[400px] bg-background shadow-lg shadow-black/5",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "sm",
    isNotification: false,
  },
})

const Alert = React.forwardRef((
  {
    className,
    variant,
    size,
    isNotification,
    icon,
    action,
    layout = "row",
    children,
    ...props
  },
  ref,
) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant, size, isNotification }), className)}
    {...props}>
    {layout === "row" ? (
      // Однострочный вариант
      (<div className="flex items-center gap-2">
        <div className="grow flex items-center">
          {icon && <span className="me-3 inline-flex">{icon}</span>}
          {children}
        </div>
        {action && <div className="flex items-center shrink-0">{action}</div>}
      </div>)
    ) : (
      // Многострочный вариант
      (<div className="flex gap-2">
        {icon && children ? (
          <div className="flex grow gap-3">
            <span className="mt-0.5 shrink-0">{icon}</span>
            <div className="grow">{children}</div>
          </div>
        ) : (
          <div className="grow">
            {icon && <span className="me-3 inline-flex">{icon}</span>}
            {children}
          </div>
        )}
        {action && <div className="shrink-0">{action}</div>}
      </div>)
    )}
  </div>
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("text-sm font-medium", className)} {...props} />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
AlertDescription.displayName = "AlertDescription"

const AlertContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-1", className)} {...props} />
))
AlertContent.displayName = "AlertContent"

export { Alert, AlertTitle, AlertDescription, AlertContent }
