import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 border",
    "border-transparent font-medium whitespace-nowrap transition-colors",
    "disabled:cursor-not-allowed disabled:bg-secondary",
    "disabled:text-muted-foreground",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/86",
        secondary: "bg-secondary hover:bg-accent",
        ghost: "hover:bg-accent",
        destructive:
          "border-destructive/60 text-destructive hover:bg-oxido-tinte",
      },
      size: {
        default: "min-h-9.5 rounded-control px-3.5 movil:min-h-11",
        sm: "min-h-8 rounded-chico px-2.5",
        icon: cn(
          "min-h-9.5 min-w-9.5 rounded-control px-2.5",
          "movil:min-h-11 movil:min-w-11",
        ),
        "icon-sm": "size-8 rounded-chico",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    // Cuadrado que gira; deshabilita el botón.
    busy?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  busy,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {busy && (
        <span
          aria-hidden="true"
          className="size-2.25 animate-giro rounded-nodo border-2"
        />
      )}
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
