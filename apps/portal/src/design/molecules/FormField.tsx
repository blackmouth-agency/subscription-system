import { useId, type ReactNode } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

type ControlProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

// Label arriba y fijo + control + ayuda o error. El control recibe el `id`
// y los `aria-*` por render prop: `{(p) => <Input {...p} />}`.
export default function FormField({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  children: (props: ControlProps) => ReactNode;
}) {
  const id = useId();
  const noteId = `${id}-nota`;
  return (
    <Field data-invalid={error ? true : undefined} className="min-w-0 gap-1.5">
      <FieldLabel htmlFor={id} className="text-sm leading-5">
        {label}
      </FieldLabel>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error || help ? noteId : undefined,
      })}
      {error ? (
        <FieldError id={noteId} className="text-[13px]/5">
          {error}
        </FieldError>
      ) : (
        help && (
          <FieldDescription id={noteId} className="text-[13px]/5">
            {help}
          </FieldDescription>
        )
      )}
    </Field>
  );
}
