import { useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cx } from "../lib/cx";

// Lupa a la izquierda (azul al enfocar) y X para borrar cuando hay texto.
// Quien filtra ignora acentos y mayúsculas con `normalizeText`.
export default function SearchBox({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="group relative w-full max-w-90 @max-movil/app:max-w-none">
      <Search
        aria-hidden="true"
        strokeWidth={1.6}
        className={cx(
          "pointer-events-none absolute top-1/2 left-3 size-4",
          "-translate-y-1/2 text-tenue group-focus-within:text-azul",
        )}
      />
      <Input
        ref={input}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          "pr-11 pl-9.5 focus:border-azul",
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Borrar búsqueda"
          onClick={() => {
            onChange("");
            input.current?.focus();
          }}
          className={cx(
            "absolute top-1/2 right-1 grid size-8 -translate-y-1/2",
            "place-items-center rounded-chico hover:bg-activo",
            "@max-movil/app:size-11",
          )}
        >
          <X aria-hidden="true" strokeWidth={1.6} className="size-3.5" />
        </button>
      )}
    </div>
  );
}
