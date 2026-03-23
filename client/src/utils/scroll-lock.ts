const activeLocks = new Set<string>();
let savedScrollY = 0;

export function lockScroll(id: string): void {
  if (activeLocks.size === 0) {
    savedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
  }
  activeLocks.add(id);
}

export function unlockScroll(id: string): void {
  activeLocks.delete(id);
  if (activeLocks.size === 0) {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.overflow = "";
    window.scrollTo(0, savedScrollY);
  }
}

export function isScrollLocked(): boolean {
  return activeLocks.size > 0;
}
