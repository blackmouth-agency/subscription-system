import type { LucideIcon } from "lucide-react";
import { Check, ChevronDown } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { cx } from "../lib/cx";
import { controlClass } from "@/components/ui/input";

type Option = { value: string; label: string; icon: LucideIcon };

// Desplegable de un solo valor: el valor activo se ve como el chip (icono +
// texto) y cada opción conserva icono, esquinas y hover de los chips.
export default function ViewSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={label}
        className={cx(
          controlClass,
          "flex w-36 items-center gap-2 text-left",
          "focus-visible:border-azul data-[state=open]:border-azul",
        )}
      >
        <current.icon
          aria-hidden="true"
          strokeWidth={1.6}
          className="size-4 flex-none text-tenue"
        />
        <span className="flex-1">{current.label}</span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.6}
          className="size-4 flex-none text-tenue"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          data-design
          align="end"
          sideOffset={4}
          className={cx(
            "z-50 min-w-(--radix-dropdown-menu-trigger-width) rounded-tarjeta",
            "border border-linea bg-superficie p-1 shadow-lg",
          )}
        >
          <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
            {options.map((o) => (
              <DropdownMenu.RadioItem
                key={o.value}
                value={o.value}
                className={cx(
                  "flex min-h-8.5 cursor-pointer items-center gap-1.5",
                  "rounded-chip px-3 text-tenue outline-none",
                  "data-highlighted:bg-activo data-highlighted:text-tinta",
                  "data-[state=checked]:bg-activo",
                  "data-[state=checked]:font-medium",
                  "data-[state=checked]:text-tinta",
                )}
              >
                <o.icon
                  aria-hidden="true"
                  strokeWidth={1.6}
                  className="size-4 flex-none"
                />
                <span className="flex-1">{o.label}</span>
                <DropdownMenu.ItemIndicator>
                  <Check
                    aria-hidden="true"
                    strokeWidth={1.6}
                    className="size-4"
                  />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
