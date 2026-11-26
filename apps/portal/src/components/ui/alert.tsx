import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const alertVariants = cva("w-full rounded-control px-3 py-2.5", {
  variants: {
    variant: {
      default: "bg-secondary text-foreground",
      destructive: "bg-oxido-tinte text-destructive",
    },
  },
  defaultVariants: { variant: "default" },
});

// Resultado de una acción (`status`) o error (`alert`).
function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Alert };
