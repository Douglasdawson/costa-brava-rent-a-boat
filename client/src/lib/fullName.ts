// El wizard captura el nombre en UN solo input y lo guarda partido en dos
// columnas (first_name / last_name). Como el input es CONTROLADO y su valor se
// reconstruye desde ambas partes, el corte y la reconstruccion tienen que ser
// inversos exactos: si no, el texto que el usuario teclea no sobrevive al
// re-render.
//
// Bug real (detectado 2026-08-05, roto desde antes de junio): al teclear el
// espacio de "Richard Silverthorne" el corte dejaba lastName="" y joinFullName
// devolvia "Richard" SIN el espacio, asi que React lo borraba de la caja y la
// siguiente letra se pegaba. 249 de 581 peticiones (43%) se guardaron con el
// nombre concatenado ("RichardSilverthorne") y el apellido vacio, y ninguna se
// podia convertir en reserva porque el CRM exigia apellido.

export interface SplitName {
  firstName: string;
  lastName: string;
}

/**
 * Parte "nombre completo" en nombre + apellidos por el PRIMER espacio.
 *
 * Mientras no haya nada escrito despues del espacio, el texto se queda entero
 * en firstName (espacio final incluido). Eso es lo que mantiene el espacio vivo
 * en el input controlado mientras se teclea.
 */
export function splitFullName(value: string): SplitName {
  const trimmed = value.trimStart();
  const firstSpace = trimmed.search(/\s/);
  const rest = firstSpace === -1 ? "" : trimmed.slice(firstSpace + 1);
  if (firstSpace === -1 || rest === "") {
    return { firstName: trimmed, lastName: "" };
  }
  return { firstName: trimmed.slice(0, firstSpace), lastName: rest };
}

/** Reconstruye el valor del input. Inversa exacta de {@link splitFullName}. */
export function joinFullName(firstName: string, lastName: string): string {
  return firstName + (lastName ? ` ${lastName}` : "");
}
