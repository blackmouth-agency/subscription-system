import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { NativeSelect } from "@/components/ui/native-select";
import CoverageList from "../molecules/CoverageList";
import DataList from "../molecules/DataList";
import FormField from "../molecules/FormField";
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
  const [key] = useState(() => crypto.randomUUID());
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
      className="grid gap-4 bg-transparent! p-0!"
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
      <DataList
        items={[
          {
            term: "Importe recibido",
            value: <output className="num">{formatCop(amount)}</output>,
          },
        ]}
      />
      <p className="text-pequeno text-tenue">
        El registro no es constancia de transferencia.
      </p>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      <footer className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onClose}>
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
    <Modal open={open} title="Registrar pago manual" onClose={onClose}>
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
