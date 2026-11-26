import * as React from "react";
import { cn } from "cn";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(
  props: React.ComponentProps<typeof DialogPrimitive.Trigger>,
) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose(
  props: React.ComponentProps<typeof DialogPrimitive.Close>,
) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

// Fondo `fondo` al 74 %, cubre toda la app. Cierra con clic, X o Escape.
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-background/74",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

// 480 px; en móvil se pega cerca del borde superior. `data-design` aísla el
// contenido de las hojas globales del portal (ver `design.css`).
function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-design
        aria-describedby={undefined}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-120 max-w-[calc(100vw-2rem)]",
          "-translate-x-1/2 -translate-y-1/2 gap-4 rounded-tarjeta",
          "bg-popover p-6 text-popover-foreground shadow-modal",
          "movil:top-4 movil:translate-y-0 movil:p-5",
          "max-h-[calc(100dvh-2rem)] overflow-y-auto",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

// Título (verbo + sustantivo) y X arriba a la derecha.
function DialogHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="dialog-header"
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cerrar"
          className="-mr-2 movil:size-11"
        >
          <XIcon aria-hidden="true" strokeWidth={1.6} className="size-4" />
        </Button>
      </DialogPrimitive.Close>
    </header>
  );
}

// Secundaria a la izquierda, principal a la derecha.
function DialogFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="dialog-footer"
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-panel", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
};
