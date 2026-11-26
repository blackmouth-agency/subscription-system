// Une clases; ignora los valores vacíos. Permite partir cadenas largas.
export const cx = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(" ");
