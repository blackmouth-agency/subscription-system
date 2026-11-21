import { useEffect, useState, type FormEvent } from "react";
import { createClient, type Session } from "@supabase/supabase-js";

// Un enlace de correo vencido o ya usado vuelve al portal con el error en la
// URL. Se lee antes de crear el cliente, que también procesa la URL al
// arrancar.
const linkExpired =
  new URLSearchParams(window.location.hash.slice(1)).get("error_code") ===
  "otp_expired";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

async function signInWith(form: FormData): Promise<string> {
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error?.code === "email_not_confirmed")
    return "Primero debes confirmar tu correo.";
  if (error) return "Correo o contraseña incorrectos.";
  return "";
}

async function signUpWith(form: FormData): Promise<string> {
  const { error } = await supabase.auth.signUp({
    email: String(form.get("email")),
    password: String(form.get("password")),
    options: {
      data: { accepted_legal_documents: form.has("accepted_legal_documents") },
    },
  });
  if (error?.code === "weak_password")
    return "La contraseña debe tener al menos 8 caracteres.";
  if (error) return "No se pudo crear la cuenta. Intenta de nuevo.";
  return "Revisa tu correo para confirmar tu cuenta.";
}

async function requestPasswordResetFor(form: FormData): Promise<string> {
  const email = String(form.get("email"));
  await supabase.auth.resetPasswordForEmail(email);
  return `Te llegará un enlace a ${email} para recuperar tu contraseña.`;
}

function CredentialFields({
  passwordAutoComplete,
}: {
  passwordAutoComplete: "current-password" | "new-password";
}) {
  return (
    <>
      <label htmlFor="email">Correo</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        spellCheck={false}
        required
      />
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

type Profile = { full_name: string; phone: string };

// El correo es solo de lectura. El perfil existe desde la primera vez que se
// guarda: antes, los campos van vacíos.
function MyProfile({ userId, email }: { userId: string; email: string }) {
  // undefined mientras se carga; null si todavía no lo ha guardado.
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase
      .from("profiles")
      .select("full_name, phone")
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        full_name: String(form.get("full_name")),
        phone: String(form.get("phone")),
      });
    // El servidor valida el perfil; el aviso sale de la regla que rechazó el
    // cambio.
    if (error?.message.includes("profiles_full_name_check"))
      return setMessage("Escribe tu nombre.");
    if (error?.message.includes("profiles_phone_check")) {
      return setMessage(
        "El teléfono debe ser un celular colombiano: " +
          "10 dígitos que empiezan por 3.",
      );
    }
    setMessage("Guardamos tu perfil.");
  }

  if (profile === undefined) return null;
  return (
    <form method="post" onSubmit={save}>
      <label htmlFor="profile-email">Correo</label>
      <input id="profile-email" type="email" value={email} readOnly />
      <label htmlFor="full-name">Nombre</label>
      <input
        id="full-name"
        name="full_name"
        autoComplete="name"
        defaultValue={profile?.full_name}
      />
      <label htmlFor="phone">Teléfono</label>
      <input
        id="phone"
        name="phone"
        type="tel"
        autoComplete="tel-national"
        inputMode="numeric"
        defaultValue={profile?.phone}
      />
      <button type="submit">Guardar perfil</button>
      <p role="status">{message}</p>
    </form>
  );
}

// El servidor exige la contraseña actual para aceptar la nueva
// (require_current_password).
function ChangePassword() {
  const [message, setMessage] = useState("");

  async function change(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.auth.updateUser({
      password: String(form.get("new_password")),
      current_password: String(form.get("current_password")),
    });
    if (error?.code === "current_password_invalid")
      return setMessage("Tu contraseña actual no es correcta.");
    if (error?.code === "weak_password")
      return setMessage("La contraseña debe tener al menos 8 caracteres.");
    setMessage("Cambiamos tu contraseña.");
  }

  return (
    <form method="post" onSubmit={change}>
      <label htmlFor="current-password">Contraseña actual</label>
      <input
        id="current-password"
        name="current_password"
        type="password"
        autoComplete="current-password"
      />
      <label htmlFor="next-password">Contraseña nueva</label>
      <input
        id="next-password"
        name="new_password"
        type="password"
        autoComplete="new-password"
      />
      <button type="submit">Cambiar contraseña</button>
      <p role="status">{message}</p>
    </form>
  );
}

// Pedir el correo evita borrar por accidente. Lo que impide borrar una cuenta
// ajena es la función, que solo borra la de la sesión.
function DeleteAccount({
  email,
  onDeleted,
}: {
  email: string;
  onDeleted: () => void;
}) {
  const [message, setMessage] = useState("");

  async function remove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("confirm_email") !== email)
      return setMessage("El correo no coincide con el tuyo.");
    await supabase.functions.invoke("delete-account");
    // Solo en este dispositivo: la sesión deja de servir en el servidor al
    // borrar la cuenta.
    await supabase.auth.signOut({ scope: "local" });
    onDeleted();
  }

  return (
    <form method="post" onSubmit={remove}>
      <p>Esto borra tu cuenta y tus datos, y no se puede deshacer.</p>
      <label htmlFor="confirm-email">Escribe tu email para confirmar</label>
      <input
        id="confirm-email"
        name="confirm_email"
        type="email"
        autoComplete="off"
        spellCheck={false}
      />
      <button type="submit">Eliminar mi cuenta</button>
      <p role="status">{message}</p>
    </form>
  );
}

export default function App() {
  // undefined mientras se averigua si el dispositivo tiene una sesión guardada.
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [message, setMessage] = useState(
    linkExpired ? "El enlace venció o ya se usó. Pide uno nuevo." : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  // true desde que se abre el enlace de recuperación hasta que se guarda la
  // contraseña nueva.
  const [recovering, setRecovering] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Sigue la sesión del dispositivo: al cargar (la guardada o la del enlace de
  // confirmación o de recuperación), al entrar y al salir.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(
    event: FormEvent<HTMLFormElement>,
    send: (form: FormData) => Promise<string>,
  ) {
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
          <button type="button" onClick={() => setMode("forgot")}>
            ¿Olvidaste tu contraseña?
          </button>
          <button type="button" onClick={() => setMode("signup")}>
            Crear una cuenta
          </button>
        </>
      )}
      {session === null && mode === "forgot" && (
        <form
          method="post"
          onSubmit={(event) => submit(event, requestPasswordResetFor)}
        >
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            required
          />
          <button type="submit" disabled={submitting}>
            Enviar enlace
          </button>
        </form>
      )}
      {session === null && mode === "signup" && (
        <>
          <form method="post" onSubmit={(event) => submit(event, signUpWith)}>
            <CredentialFields passwordAutoComplete="new-password" />
            <input
              id="accept-documents"
              name="accepted_legal_documents"
              type="checkbox"
              required
            />
            <label htmlFor="accept-documents">
              Acepto los{" "}
              <a
                href="https://blackmouth.agency/terminos"
                target="_blank"
                rel="noreferrer"
              >
                términos
              </a>{" "}
              y la{" "}
              <a
                href="https://blackmouth.agency/politica-de-datos"
                target="_blank"
                rel="noreferrer"
              >
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
      {session && recovering && (
        <form
          method="post"
          onSubmit={(event) =>
            submit(event, async (form) => {
              const { error } = await supabase.auth.updateUser({
                password: String(form.get("password")),
              });
              if (error?.code === "weak_password")
                return "La contraseña debe tener al menos 8 caracteres.";
              setRecovering(false);
              return "";
            })
          }
        >
          <label htmlFor="new-password">Contraseña nueva</label>
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            enterKeyHint="done"
            required
          />
          <button type="submit">Guardar contraseña</button>
        </form>
      )}
      <p role="status">
        {session && !recovering
          ? `Entraste como ${session.user.email}`
          : message}
      </p>
      {session && !recovering && (
        <>
          <button type="button" onClick={() => setShowProfile(true)}>
            Mi perfil
          </button>
          <button type="button" onClick={() => supabase.auth.signOut()}>
            Cerrar sesión
          </button>
        </>
      )}
      {session && !recovering && showProfile && (
        <>
          <MyProfile userId={session.user.id} email={session.user.email!} />
          <ChangePassword />
          <DeleteAccount
            email={session.user.email!}
            onDeleted={() => setMessage("Eliminamos tu cuenta.")}
          />
        </>
      )}
    </main>
  );
}
