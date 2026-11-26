import * as React from "react";
import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import { controlClass } from "@/components/ui/input";

// `<select>` nativo con el aspecto del sistema: en móvil abre el selector
// del sistema operativo y funciona con `register` de React Hook Form.
function NativeSelect({
  className,
  ...props
}: Omit<React.ComponentProps<"select">, "size">) {
  return (
    <div
      data-slot="native-select-wrapper"
      className={cn("relative w-full", className)}
    >
      <select
        data-slot="native-select"
        className={cn(controlClass, "appearance-none pr-9")}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        data-slot="native-select-icon"
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 size-4",
          "-translate-y-1/2 text-muted-foreground",
        )}
      />
    </div>
  );
}

function NativeSelectOption(props: React.ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />;
}

export { NativeSelect, NativeSelectOption };
