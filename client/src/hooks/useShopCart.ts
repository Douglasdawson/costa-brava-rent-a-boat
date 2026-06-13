import { useCallback, useEffect, useState } from "react";
import { getShopVariant, SHOP_MAX_QTY_PER_ITEM } from "@shared/shopData";

export interface CartItem {
  sku: string;
  quantity: number;
}

const STORAGE_KEY = "cbrb_shop_cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CartItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as CartItem).sku === "string" &&
          typeof (item as CartItem).quantity === "number",
      )
      .filter((item) => getShopVariant(item.sku) !== null && item.quantity >= 1)
      .map((item) => ({
        sku: item.sku,
        quantity: Math.min(Math.floor(item.quantity), SHOP_MAX_QTY_PER_ITEM),
      }));
  } catch {
    return [];
  }
}

/**
 * Local cart for the merch shop page. State lives in the component tree of
 * /tienda only (no global provider) and persists to localStorage so an
 * abandoned Stripe Checkout keeps the cart intact.
 */
export function useShopCart() {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Private mode / storage full: cart still works in memory
    }
  }, [items]);

  const addItem = useCallback((sku: string, quantity = 1) => {
    if (!getShopVariant(sku)) return;
    setItems((prev) => {
      const existing = prev.find((item) => item.sku === sku);
      if (existing) {
        return prev.map((item) =>
          item.sku === sku
            ? { ...item, quantity: Math.min(item.quantity + quantity, SHOP_MAX_QTY_PER_ITEM) }
            : item,
        );
      }
      return [...prev, { sku, quantity: Math.min(quantity, SHOP_MAX_QTY_PER_ITEM) }];
    });
  }, []);

  const setQuantity = useCallback((sku: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.sku !== sku)
        : prev.map((item) =>
            item.sku === sku
              ? { ...item, quantity: Math.min(quantity, SHOP_MAX_QTY_PER_ITEM) }
              : item,
          ),
    );
  }, []);

  const removeItem = useCallback((sku: string) => {
    setItems((prev) => prev.filter((item) => item.sku !== sku));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, addItem, setQuantity, removeItem, clear, count };
}
