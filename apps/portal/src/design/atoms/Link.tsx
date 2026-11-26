import type { ComponentProps } from "react";

export default function Link({
  className = "",
  ...props
}: ComponentProps<"a">) {
  return (
    <a
      className={[
        "font-medium underline decoration-borde underline-offset-4",
        "hover:decoration-current",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
