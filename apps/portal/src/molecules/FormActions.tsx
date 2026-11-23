// Botón de envío, "Cancelar" (solo al editar) y el error del servidor.
export default function FormActions({
  submitLabel,
  isSubmitting,
  onCancel,
  error,
}: {
  submitLabel: string;
  isSubmitting: boolean;
  onCancel?: () => void;
  error: string;
}) {
  return (
    <>
      <button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      )}
      <p role="alert">{error}</p>
    </>
  );
}
