import * as React from "react";
import { cn } from "cn";

// Input, select y textarea comparten aspecto.
export const controlClass = cn(
  "min-h-10 w-full min-w-0 rounded-control border border-input",
  "bg-card px-3 py-2 text-foreground transition-colors",
  "placeholder:text-muted-foreground aria-invalid:border-destructive",
  "aria-invalid:shadow-error disabled:cursor-not-allowed",
  "disabled:border-transparent disabled:bg-secondary",
  "disabled:text-muted-foreground movil:min-h-11.5 movil:text-base",
);

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(controlClass, className)}
      {...props}
    />
  );
}

export { Input };
