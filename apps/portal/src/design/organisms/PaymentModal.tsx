import { uuid } from "../lib/uuid";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { NativeSelect } from "@/components/ui/native-select";
import CoverageList from "../molecules/CoverageList";
import FormField from "../molecules/FormField";
import { cx } from "../lib/cx";
import { formatCop } from "../lib/format";
import type { InstallmentStatus } from "../types";
import Modal from "./Modal";

export type Debt = {
  // Mensualidades por pagar, de la más antigua a la más nueva.
  id: string;
  label: string;
  status: Exclude<InstallmentStatus, "none">;
  amount: number;
};

export type DebtorSubscription = {
  id: string;
  label: string;
  installments: Debt[];
};

export type PaymentSubmit = {
  subscriptionId: string;
  amount: number;
  paidAt: string;
  method: string;
  reference: string;
  // Repetir el envío con la misma clave no duplica el pago.
  idempotencyKey: string;
};

const methods = [
  ["transfer", "Transferencia"],
  ["cash", "Efectivo"],
  ["other", "Otro"],
];

// `YYYY-MM-DD` de hoy en hora local.
const today = () => new Date().toLocaleDateString("sv");

type Values = {
  subscriptionId: string;
  paidAt: string;
  method: string;
  reference: string;
};

function PaymentForm({
  subscriptions,
  subscriptionId,
  fixed,
  count: initialCount,
  onSubmit,
  onClose,
}: {
  subscriptions: DebtorSubscription[];
  subscriptionId?: string;
  fixed: boolean;
  count: number;
  onSubmit: (payment: PaymentSubmit) => Promise<string | undefined>;
  onClose: () => void;
}) {
  const [key] = useState(() => uuid());
  const [count, setCount] = useState(initialCount);
  const [countError, setCountError] = useState("");
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      subscriptionId: subscriptionId ?? "",
      paidAt: today(),
      method: "transfer",
      reference: "",
    },
  });

  const chosen = fixed ? subscriptionId! : watch("subscriptionId");
  const selected = subscriptions.find((s) => s.id === chosen);
  const items = selected?.installments ?? [];
  const covered = Math.min(count, items.length);
  const amount = items
    .slice(0, covered)
    .reduce((total, item) => total + item.amount, 0);

  return (
    <form
      noValidate
      className={cx(
        "grid grid-cols-2 gap-x-8 gap-y-7 bg-transparent! p-0!",
        "movil:grid-cols-1",
      )}
      onSubmit={handleSubmit(async (v) => {
        if (!covered) return setCountError("Elige al menos una mensualidad.");
        setServerError("");
        const error = await onSubmit({
          subscriptionId: chosen,
          amount,
          paidAt: v.paidAt,
          method: v.method,
          reference: v.reference.trim(),
          idempotencyKey: key,
        });
        if (error) setServerError(error);
      })}
    >
      <div className="grid content-start gap-5">
        <FormField label="Suscripción" error={errors.subscriptionId?.message}>
          {(p) =>
            fixed ? (
              <NativeSelect {...p} disabled value={chosen}>
                <option value={chosen}>{selected?.label}</option>
              </NativeSelect>
            ) : (
              <NativeSelect
                {...p}
                {...register("subscriptionId", {
                  required: "Elige la suscripción.",
                  onChange: () => {
                    setCount(1);
                    setCountError("");
                  },
                })}
              >
                <option value="">Elige una suscripción</option>
                {subscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            )
          }
        </FormField>
        <div className="grid grid-cols-2 gap-4 @max-movil/app:grid-cols-1">
          <FormField label="Fecha del pago" error={errors.paidAt?.message}>
            {(p) => (
              <Input
                {...p}
                type="date"
                max={today()}
                {...register("paidAt", {
                  required: "Elige la fecha.",
                  validate: (d) =>
                    d <= today() || "La fecha no puede ser futura.",
                })}
              />
            )}
          </FormField>
          <FormField label="Medio">
            {(p) => (
              <NativeSelect {...p} {...register("method")}>
                {methods.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
        </div>
        <FormField
          label="Referencia (opcional)"
          error={errors.reference?.message}
        >
          {(p) => (
            <Input
              {...p}
              {...register("reference", {
                maxLength: { value: 200, message: "Máximo 200 caracteres." },
              })}
            />
          )}
        </FormField>
        <p className="text-pequeno text-tenue movil:hidden">
          El registro no es constancia de transferencia.
        </p>
      </div>
      <div className={cx("grid gap-5", selected && "content-start")}>
        {selected ? (
          <>
            {items.length > 0 && (
              <div className="grid gap-1.5">
                <CoverageList
                  items={items}
                  count={covered}
                  onChange={(n) => {
                    setCount(n);
                    setCountError("");
                  }}
                />
                {countError && (
                  <span role="alert" className="text-pequeno text-oxido">
                    {countError}
                  </span>
                )}
              </div>
            )}
            <div
              className={cx(
                "grid gap-1 rounded-control bg-azul-tinte p-4",
                "movil:flex movil:items-center movil:justify-between",
                "movil:bg-transparent movil:p-0",
              )}
            >
              <span className="text-tenue">
                Importe recibido
                {items.length > 0 && (
                  <small className="block text-minimo movil:hidden">
                    {covered} de {items.length} seleccionadas
                  </small>
                )}
              </span>
              <output
                className={cx(
                  "num text-3xl font-semibold whitespace-nowrap text-azul",
                  "movil:text-2xl movil:text-tinta",
                )}
              >
                {formatCop(amount)}
              </output>
            </div>
          </>
        ) : (
          <div
            className={cx(
              "grid min-h-40 place-content-center gap-1 rounded-control",
              "border border-dashed border-borde p-6 text-center",
            )}
          >
            <strong className="font-medium">Elige una suscripción</strong>
            <span className="text-tenue">
              Selecciónala primero para ver sus mensualidades y el importe.
            </span>
          </div>
        )}
        <p className="hidden text-pequeno text-tenue movil:block">
          El registro no es constancia de transferencia.
        </p>
      </div>
      {serverError && (
        <Alert variant="destructive" className="col-span-2 movil:col-span-1">
          {serverError}
        </Alert>
      )}
      <footer className="col-span-2 grid grid-cols-2 gap-3 movil:col-span-1">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" busy={isSubmitting}>
          Registrar pago
        </Button>
      </footer>
    </form>
  );
}

// «Registrar pago manual». La suscripción es fija si se abrió desde una
// fila o un nodo del mapa; si no, se elige entre las que tienen deuda.
// `onSubmit` devuelve el error para mostrarlo, o nada si guardó.
export default function PaymentModal({
  open,
  subscriptions,
  subscriptionId,
  count = 1,
  onSubmit,
  onClose,
}: {
  open: boolean;
  subscriptions: DebtorSubscription[];
  subscriptionId?: string;
  count?: number;
  onSubmit: (payment: PaymentSubmit) => Promise<string | undefined>;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Registrar pago manual"
      description="Anota un pago recibido fuera de la plataforma."
      icon={Wallet}
      className="w-190 gap-7"
      onClose={onClose}
    >
      <PaymentForm
        subscriptions={subscriptions}
        subscriptionId={subscriptionId}
        fixed={subscriptionId !== undefined}
        count={count}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Modal>
  );
}
