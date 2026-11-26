import * as React from "react";
import {
  Circle,
  CircleCheck,
  CirclePause,
  CircleX,
  Clock,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

type Variant =
  | "active"
  | "pending"
  | "overdue"
  | "paid"
  | "paused"
  | "cancelled"
  | "inactive";

const badgeVariants = cva(
  [
    "inline-flex min-h-6 w-fit flex-none items-center gap-1.75",
    "rounded-insignia px-2.25 text-xs font-medium whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        active: "bg-azul-tinte text-azul",
        pending: "bg-azul-tinte text-azul",
        overdue: "bg-oxido-tinte text-oxido",
        paid: "bg-secondary",
        paused: "bg-secondary",
        cancelled: "bg-secondary text-muted-foreground",
        inactive: "bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: { variant: "paid" },
  },
);

// Cada estado cambia color, ícono y texto (nunca solo color).
const icons = {
  active: CircleCheck,
  pending: Clock,
  overdue: TriangleAlert,
  paid: CircleCheck,
  paused: CirclePause,
  cancelled: CircleX,
  inactive: Circle,
} satisfies Record<Variant, LucideIcon>;

function Badge({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  const v = variant ?? "paid";
  const Icon = icons[v];
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant: v }), className)}
      {...props}
    >
      <Icon aria-hidden="true" strokeWidth={1.8} className="size-3.5" />
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
