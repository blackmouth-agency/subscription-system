import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function signInWith(form: FormData): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error?.code === "email_not_confirmed") return "Primero debes confirmar tu correo.";
  if (error) return "Correo o contraseña incorrectos.";
  return `Entraste como ${data.user.email}`;
}

async function signUpWith(form: FormData): Promise<string> {
  const { error } = await supabase.auth.signUp({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error?.code === "weak_password") return "La contraseña debe tener al menos 8 caracteres.";
  if (error) return "No se pudo crear la cuenta. Intenta de nuevo.";
  return "Revisa tu correo para confirmar tu cuenta.";
}

export default function App() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Al cargar, muestra la sesión que ya exista: la que trae el enlace de confirmación o una guardada.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setMessage(`Entraste como ${data.session.user.email}`);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const intent = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    setSubmitting(true);
    try {
      setMessage(await (intent === "signup" ? signUpWith(form) : signInWith(form)));
    } finally {
      setSubmitting(false);
    }
  }

  async function tryAnotherAccount() {
    await supabase.auth.signOut();
    setMessage("");
  }

  return (
    <main>
      <h1>Portal de BlackMouth</h1>
      {!message && (
        <form method="post" onSubmit={submit}>
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
          <button type="submit" value="signin" disabled={submitting}>
            Iniciar sesión
          </button>
          <button type="submit" value="signup" disabled={submitting}>
            Crear cuenta
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
