import { useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabase = createClient(supabaseUrl, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export default function App() {
  const [message, setMessage] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { data } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/verify-access?project=conoce-mas`, {
      headers: { Authorization: `Bearer ${data.session!.access_token}` },
    });
    const body = await response.json();
    setMessage(body.content ?? body.error);
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
          <button type="submit">Iniciar sesión</button>
        </form>
      )}
      <p role="status">{message}</p>
    </main>
  );
}
