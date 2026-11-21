import axios from "axios";
import { useEffect, useState } from "react";
import HelloTemplate from "../templates/HelloTemplate";

// Walking skeleton: portal -> función api -> respuesta.
export default function HelloPage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get<{ message: string }>(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/hello`,
        {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        },
      )
      .then(({ data }) => setMessage(data.message))
      .catch(() => setMessage("No pudimos conectar con el servidor."));
  }, []);

  return <HelloTemplate message={message} />;
}
