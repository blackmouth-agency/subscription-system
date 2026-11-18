import { useState, type FormEvent } from "react";
import { createClient, FunctionsHttpError } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function verifyAccess(form: FormData): Promise<string> {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (signInError) return "Correo o contraseña incorrectos.";

  const { data, error } = await supabase.functions.invoke("verify-access?project=conoce-mas", {
    method: "GET",
  });
  if (data) return data.content;
  if (error instanceof FunctionsHttpError && error.context.status === 403) {
    return (await error.context.json()).error;
  }
  return "No se pudo verificar tu acceso. Intenta de nuevo.";
}

export default function App() {
  const [message, setMessage] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerifying(true);
    try {
      setMessage(await verifyAccess(new FormData(event.currentTarget)));
    } finally {
      setVerifying(false);
    }
  }

  async function tryAnotherAccount() {
    await supabase.auth.signOut();
    setMessage("");
  }

  return (
    <main>
      <h1>conoce-mas</h1>
      {!message && (
        <form method="post" onSubmit={signIn}>
          <label htmlFor="email">Correo</label>
          <input id="email" name="email" type="email" autoComplete="username" spellCheck={false} required />
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            enterKeyHint="done"
            required
          />
          <button type="submit" disabled={verifying}>
            Iniciar sesión
          </button>
        </form>
      )}
      <p role="status">{message}</p>
      {message && (
        <button type="button" onClick={tryAnotherAccount}>
          Probar con otra cuenta
        </button>
      )}
    </main>
  );
}
