export type Theme = 'light' | 'dark';

export const settings = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem('waffle:' + key);
      return v == null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem('waffle:' + key, JSON.stringify(value));
    } catch {
      /* storage may be unavailable */
    }
  },
};

export function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem('waffle:theme');
    if (t === 'light' || t === 'dark') return t;
  } catch {
    /* ignore */
  }
  return null;
}

export function systemTheme(): Theme {
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem('waffle:theme', theme);
  } catch {
    /* ignore */
  }
}
