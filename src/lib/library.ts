import { isTauri } from '@tauri-apps/api/core';
import type { WaffleDoc } from './types';

export interface Library {
  list(): Promise<WaffleDoc[]>;
  put(doc: WaffleDoc): Promise<void>;
  remove(id: string): Promise<void>;
}

// The desktop app keeps the library in a JSON store under the app data
// directory. In a plain browser (dev server) it falls back to IndexedDB.
export async function openLibrary(): Promise<Library> {
  if (isTauri()) {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load('library.json', { autoSave: false });
    return {
      async list() {
        const entries = await store.entries<WaffleDoc>();
        return entries.map(([, doc]) => doc);
      },
      async put(doc) {
        await store.set(doc.id, doc);
        await store.save();
      },
      async remove(id) {
        await store.delete(id);
        await store.save();
      },
    };
  }

  const { createStore, entries, set, del } = await import('idb-keyval');
  const store = createStore('waffle', 'documents');
  return {
    async list() {
      const all = await entries<string, WaffleDoc>(store);
      return all.map(([, doc]) => doc);
    },
    put: (doc) => set(doc.id, doc, store),
    remove: (id) => del(id, store),
  };
}
