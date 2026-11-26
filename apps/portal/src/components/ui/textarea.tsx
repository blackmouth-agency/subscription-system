import * as React from "react";
import { cn } from "cn";
import { controlClass } from "@/components/ui/input";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(controlClass, "field-sizing-content min-h-16", className)}
      {...props}
    />
  );
}

export { Textarea };
