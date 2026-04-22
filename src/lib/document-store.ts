import { nanoid } from 'nanoid';
import type { GeneratedDocument } from '@/agents/document-agent';

export type StoredDocument = GeneratedDocument & {
  id: string;
  scanId: string;
  createdAt: number;
};

const globalForDocs = globalThis as unknown as { __daraaDocs?: Map<string, StoredDocument> };
const DOCS: Map<string, StoredDocument> =
  globalForDocs.__daraaDocs ?? (globalForDocs.__daraaDocs = new Map());
const DOC_TTL_MS = 60 * 60 * 1000;

function prune() {
  const cutoff = Date.now() - DOC_TTL_MS;
  for (const [id, d] of DOCS) if (d.createdAt < cutoff) DOCS.delete(id);
}

export function saveDocument(scanId: string, doc: GeneratedDocument): StoredDocument {
  prune();
  const stored: StoredDocument = {
    ...doc,
    id: nanoid(),
    scanId,
    createdAt: Date.now(),
  };
  DOCS.set(stored.id, stored);
  return stored;
}

export function getDocument(id: string): StoredDocument | null {
  return DOCS.get(id) ?? null;
}
