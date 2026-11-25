import { beforeEach, describe, expect, it, vi } from "vitest";
import { initSwAutoUpdate } from "./swAutoUpdate";

type Listener = (e?: unknown) => void;

/** `registered`: a worker registration already existed when the page started (false = very first visit). */
async function setup({ registered = true, busy = false } = {}) {
  const swListeners: Record<string, Listener[]> = {};
  const docListeners: Record<string, Listener[]> = {};
  const winListeners: Record<string, Listener[]> = {};
  const add = (store: Record<string, Listener[]>) => (type: string, fn: Listener) =>
    (store[type] ||= []).push(fn);
  const reload = vi.fn();
  const update = vi.fn();
  const store = new Map<string, string>();
  const state = { busy };
  const doc = {
    addEventListener: add(docListeners),
    querySelector: vi.fn(() => (state.busy ? {} : null)),
    activeElement: { tagName: "BODY" },
    visibilityState: "visible",
  };
  vi.stubGlobal("window", { location: { reload }, addEventListener: add(winListeners) });
  vi.stubGlobal("document", doc);
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  vi.stubGlobal("navigator", {
    serviceWorker: {
      controller: null,
      addEventListener: add(swListeners),
      getRegistration: () => Promise.resolve(registered ? { update } : undefined),
    },
  });
  initSwAutoUpdate();
  await Promise.resolve();
  await Promise.resolve();
  const fire = (s: Record<string, Listener[]>, type: string, e?: unknown) =>
    (s[type] ?? []).forEach(fn => fn(e));
  return {
    reload,
    update,
    state,
    newWorker: () => fire(swListeners, "controllerchange"),
    setVisibility: (v: "hidden" | "visible") => {
      doc.visibilityState = v;
      fire(docListeners, "visibilitychange");
    },
    preloadError: () => {
      const preventDefault = vi.fn();
      fire(winListeners, "vite:preloadError", { preventDefault });
      return preventDefault;
    },
  };
}

describe("swAutoUpdate", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("reloads when a new worker takes over", async () => {
    const t = await setup();
    t.newWorker();
    expect(t.reload).toHaveBeenCalledTimes(1);
  });

  it("ignores the first claim of the very first visit, then reloads on the next swap", async () => {
    const t = await setup({ registered: false });
    t.newWorker();
    expect(t.reload).not.toHaveBeenCalled();
    t.newWorker();
    expect(t.reload).toHaveBeenCalledTimes(1);
  });

  it("reloads at most once per minute", async () => {
    const t = await setup();
    t.newWorker();
    t.newWorker();
    expect(t.reload).toHaveBeenCalledTimes(1);
  });

  it("waits while the booking modal is open, even when the tab is hidden", async () => {
    const t = await setup({ busy: true });
    t.newWorker();
    t.setVisibility("hidden");
    expect(t.reload).not.toHaveBeenCalled();
  });

  it("reloads on hide once the modal is closed", async () => {
    const t = await setup({ busy: true });
    t.newWorker();
    t.state.busy = false;
    t.setVisibility("hidden");
    expect(t.reload).toHaveBeenCalledTimes(1);
  });

  it("checks for a new worker on return to the tab, at most every 5 minutes", async () => {
    const t = await setup();
    t.setVisibility("visible");
    t.setVisibility("visible");
    await Promise.resolve();
    await Promise.resolve();
    expect(t.update).toHaveBeenCalledTimes(1);
  });

  it("reloads when a lazy chunk fails to load", async () => {
    const t = await setup();
    const prevented = t.preloadError();
    expect(t.reload).toHaveBeenCalledTimes(1);
    expect(prevented).toHaveBeenCalled();
  });

  it("lets the chunk error through when the reload guard holds it back", async () => {
    const t = await setup();
    t.preloadError();
    const prevented = t.preloadError();
    expect(t.reload).toHaveBeenCalledTimes(1);
    expect(prevented).not.toHaveBeenCalled();
  });
});
