import { describe, it, expect } from "vitest";
import { splitFullName, joinFullName } from "./fullName";

/**
 * Simula el ciclo REAL del input controlado: en cada pulsacion el navegador
 * parte de lo que el input muestra ahora (joinFullName del estado) y le añade
 * la letra tecleada; el onChange vuelve a partirlo. Si el corte y la
 * reconstruccion no son inversos, el caracter se pierde aqui, igual que en la
 * caja de texto del cliente.
 */
function teclear(texto: string) {
  let estado = { firstName: "", lastName: "" };
  for (const caracter of texto) {
    estado = splitFullName(joinFullName(estado.firstName, estado.lastName) + caracter);
  }
  return estado;
}

describe("splitFullName / joinFullName", () => {
  it("conserva el espacio mientras se teclea un nombre con apellido", () => {
    // El bug de produccion: esto devolvia "RichardSilverthorne" + apellido vacio.
    const estado = teclear("Richard Silverthorne");
    expect(estado).toEqual({ firstName: "Richard", lastName: "Silverthorne" });
  });

  it("reconstruye exactamente lo tecleado, con uno o varios apellidos", () => {
    for (const texto of ["Ruth Fayos Montero", "Jordi Gonzalez Sandalinas", "Ana Gil"]) {
      const { firstName, lastName } = teclear(texto);
      expect(joinFullName(firstName, lastName)).toBe(texto);
    }
  });

  it("acepta un nombre de una sola palabra, sin apellido", () => {
    expect(teclear("Vlady")).toEqual({ firstName: "Vlady", lastName: "" });
  });

  it("mantiene el espacio recien tecleado antes de escribir el apellido", () => {
    // Estado intermedio: sin esto React borraba el espacio y pegaba las letras.
    expect(joinFullName(...Object.values(teclear("Richard ")) as [string, string])).toBe("Richard ");
  });

  it("ignora los espacios por delante", () => {
    expect(splitFullName("   Marina Mazzocchini")).toEqual({
      firstName: "Marina",
      lastName: "Mazzocchini",
    });
  });
});
