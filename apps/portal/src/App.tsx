import { useEffect, useState, type FormEvent } from "react";
import { createClient, type Session } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function signInWith(form: FormData): Promise<string> {
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error?.code === "email_not_confirmed") return "Primero debes confirmar tu correo.";
  if (error) return "Correo o contraseña incorrectos.";
  return "";
}

async function signUpWith(form: FormData): Promise<string> {
  const { error } = await supabase.auth.signUp({
    email: String(form.get("email")),
    password: String(form.get("password")),
    options: { data: { accepted_legal_documents: form.has("accepted_legal_documents") } },
  });
  if (error?.code === "weak_password") return "La contraseña debe tener al menos 8 caracteres.";
  if (error) return "No se pudo crear la cuenta. Intenta de nuevo.";
  return "Revisa tu correo para confirmar tu cuenta.";
}

function CredentialFields({ passwordAutoComplete }: { passwordAutoComplete: "current-password" | "new-password" }) {
  return (
    <>
      <label htmlFor="email">Correo</label>
      <input id="email" name="email" type="email" autoComplete="username" spellCheck={false} required />
      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete={passwordAutoComplete}
        enterKeyHint="done"
        required
      />
    </>
  );
}

export default function App() {
  // undefined mientras se averigua si el dispositivo tiene una sesión guardada.
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Sigue la sesión del dispositivo: al cargar (la guardada o la del enlace de confirmación), al entrar y al salir.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>, send: (form: FormData) => Promise<string>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      setMessage(await send(form));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Portal de BlackMouth</h1>
      {session === null && mode === "signin" && (
        <>
          <form method="post" onSubmit={(event) => submit(event, signInWith)}>
            <CredentialFields passwordAutoComplete="current-password" />
            <button type="submit" disabled={submitting}>
              Iniciar sesión
            </button>
          </form>
          <button type="button" onClick={() => setMode("signup")}>
            Crear una cuenta
          </button>
        </>
      )}
      {session === null && mode === "signup" && (
        <>
          <form method="post" onSubmit={(event) => submit(event, signUpWith)}>
            <CredentialFields passwordAutoComplete="new-password" />
            <input id="accept-documents" name="accepted_legal_documents" type="checkbox" required />
            <label htmlFor="accept-documents">
              Acepto los{" "}
              <a href="https://blackmouth.agency/terminos" target="_blank" rel="noreferrer">
                términos
              </a>{" "}
              y la{" "}
              <a href="https://blackmouth.agency/politica-de-datos" target="_blank" rel="noreferrer">
                política de datos
              </a>
            </label>
            <button type="submit" disabled={submitting}>
              Crear cuenta
            </button>
          </form>
          <button type="button" onClick={() => setMode("signin")}>
            Ya tengo cuenta
          </button>
        </>
      )}
      <p role="status">{session ? `Entraste como ${session.user.email}` : message}</p>
      {session && (
        <button type="button" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      )}
    </main>
  );
}
