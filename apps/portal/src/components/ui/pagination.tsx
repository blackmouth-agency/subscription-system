import * as React from "react";
import { cn } from "cn";
import { ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";

const item = cn(
  "grid size-8.5 place-items-center rounded-chip text-muted-foreground",
  "hover:bg-secondary hover:text-foreground",
  "disabled:text-muted-foreground disabled:hover:bg-transparent",
  "compacto:size-11",
);

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Paginación"
      data-slot="pagination"
      className={cn("flex", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("m-0 flex list-none items-center gap-1 p-0", className)}
      {...props}
    />
  );
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

// Página actual: borde de 1.5 px en tinta. En móvil solo se ve la actual.
function PaginationButton({
  className,
  isActive,
  ...props
}: React.ComponentProps<"button"> & { isActive?: boolean }) {
  return (
    <button
      type="button"
      data-slot="pagination-link"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        item,
        "num min-w-8.5 px-2",
        isActive
          ? "font-medium text-foreground shadow-actual"
          : "compacto:hidden",
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="Página anterior"
      className={item}
      {...props}
    >
      <ChevronsLeftIcon
        aria-hidden="true"
        strokeWidth={1.6}
        className="size-4.5"
      />
    </button>
  );
}

function PaginationNext(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="Página siguiente"
      className={item}
      {...props}
    >
      <ChevronsRightIcon
        aria-hidden="true"
        strokeWidth={1.6}
        className="size-4.5"
      />
    </button>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      data-slot="pagination-ellipsis"
      className={cn("px-1 text-muted-foreground compacto:hidden", className)}
      {...props}
    >
      …
    </span>
  );
}

export {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
};
