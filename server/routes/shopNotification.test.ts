import { describe, it, expect } from "vitest";
import { buildSaleNotification } from "./shop";

const base = {
  orderNumber: 7,
  totalCents: 3000,
  discountCents: 0,
  shippingCents: 0,
  deliveryMethod: "pickup_port",
  customerName: "Marta Puig",
  customerEmail: "marta@example.com",
  shippingAddress: null,
};

const tee = { sku: "tee-navy-M", quantity: 1, unitPriceCents: 2500 };
const tote = { sku: "tote-royal", quantity: 1, unitPriceCents: 1000 };

describe("buildSaleNotification", () => {
  it("leads with the reference and the amount actually charged", () => {
    const msg = buildSaleNotification(base, [tee], []);
    expect(msg.split("\n")[0]).toBe("Pedido CB-0007  30,00 EUR");
  });

  it("lists each line with its quantity and line total", () => {
    const msg = buildSaleNotification(base, [{ ...tee, quantity: 2 }], []);
    expect(msg).toContain("Camiseta Costa Brava Culture (azul marino, M) x2  50,00 EUR");
  });

  it("shows the pack discount only when one applied", () => {
    expect(buildSaleNotification(base, [tee, tote], [])).not.toContain("Descuento pack");
    const withPack = buildSaleNotification({ ...base, discountCents: 500 }, [tee, tote], []);
    expect(withPack).toContain("Descuento pack  -5,00 EUR");
  });

  it("names the delivery method so the owner knows what to do next", () => {
    expect(buildSaleNotification(base, [tee], [])).toContain("Entrega: Recogida en el puerto de Blanes");
    expect(
      buildSaleNotification({ ...base, deliveryMethod: "pickup_laura" }, [tee], []),
    ).toContain("Entrega: Recogida en Laura Cabanas (Lloret)");
  });

  it("includes the postal address when the order ships", () => {
    const msg = buildSaleNotification(
      {
        ...base,
        deliveryMethod: "shipping",
        shippingCents: 495,
        shippingAddress: {
          address: { line1: "Carrer del Mar 3", postal_code: "17300", city: "Blanes" },
        },
      },
      [tee],
      [],
    );
    expect(msg).toContain("Envio  4,95 EUR");
    expect(msg).toContain("Carrer del Mar 3, 17300, Blanes");
  });

  it("survives an order with no address payload", () => {
    expect(() => buildSaleNotification({ ...base, shippingAddress: undefined }, [tee], [])).not.toThrow();
  });

  it("shouts when stock went negative, because that order is already paid", () => {
    const msg = buildSaleNotification(base, [tee], ["tee-navy-M"]);
    expect(msg).toContain("ATENCION: stock insuficiente en tee-navy-M");
  });

  it("stays well inside Telegram's per-message limit for a realistic cart", () => {
    const msg = buildSaleNotification({ ...base, discountCents: 500 }, [tee, tote], []);
    expect(msg.length).toBeLessThan(1000);
  });
});
