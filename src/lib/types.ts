export interface WaffleDoc {
  id: string;
  title: string;
  snippet: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  path?: string;
  fileName?: string;
  diskContent?: string;
  readTop?: number;
  cursor?: number;
}
