import { useId, type ComponentProps } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";

export default function CheckboxField({
  label,
  ...props
}: { label: string } & Omit<ComponentProps<typeof Checkbox>, "id">) {
  const id = useId();
  return (
    <Field orientation="horizontal" className="gap-2.5">
      <Checkbox id={id} {...props} />
      <FieldLabel htmlFor={id} className="text-sm font-normal">
        {label}
      </FieldLabel>
    </Field>
  );
}
