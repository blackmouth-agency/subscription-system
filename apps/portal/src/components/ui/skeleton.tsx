import { cn } from "cn";

function Skeleton({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      data-slot="skeleton"
      className={cn(
        "block h-3.5 animate-brillo rounded-sm bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
