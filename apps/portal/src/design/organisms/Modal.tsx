import { cx } from "../lib/cx";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Dialog de Radix: trampa de foco, Escape, clic en el fondo y retorno del
// foco. El contenido solo existe mientras está abierto, así cada apertura
// empieza limpia.
export default function Modal({
  open,
  title,
  description,
  icon: Icon,
  className,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className={className}>
        <DialogHeader className="items-start">
          <div className="flex items-center gap-4">
            {Icon && (
              <span
                className={cx(
                  "grid size-11 flex-none place-items-center",
                  "rounded-control bg-realce",
                )}
              >
                <Icon aria-hidden="true" strokeWidth={1.6} className="size-6" />
              </span>
            )}
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && <p className="text-tenue">{description}</p>}
            </div>
          </div>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
