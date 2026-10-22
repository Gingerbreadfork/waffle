export interface Toast {
  id: number;
  text: string;
  leaving: boolean;
}

class Toasts {
  items = $state<Toast[]>([]);
  private counter = 0;

  show(text: string, ms = 1800): void {
    const id = ++this.counter;
    this.items.push({ id, text, leaving: false });
    setTimeout(() => {
      const t = this.items.find((i) => i.id === id);
      if (t) t.leaving = true;
      setTimeout(() => {
        this.items = this.items.filter((i) => i.id !== id);
      }, 220);
    }, ms);
  }
}

export const toasts = new Toasts();
