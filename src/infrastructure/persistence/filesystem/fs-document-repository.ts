/**
 * Filesystem-backed DocumentRepository implementation.
 *
 * Wraps the existing document-store.ts in-memory Map.
 * Documents are kept in memory with a 1-hour TTL (no disk persistence yet).
 */

import {
  saveDocument as storeSaveDocument,
  getDocument as storeGetDocument,
} from '@/lib/document-store';
import type { DocumentRepository, StoredDocument } from '@/core/repositories/document-repository';
import type { GeneratedDocument } from '@/agents/document-agent';

export class FilesystemDocumentRepository implements DocumentRepository {
  async create(input: { scanId: string; document: GeneratedDocument }): Promise<StoredDocument> {
    const stored = storeSaveDocument(input.scanId, input.document);
    return stored;
  }

  async findById(id: string): Promise<StoredDocument | null> {
    return storeGetDocument(id);
  }

  async findByCompany(_companyId: string): Promise<readonly StoredDocument[]> {
    // TODO: Phase 1 (Supabase) will add per-company queries.
    // For now, no traversal — documents are short-lived in memory.
    return [];
  }

  async listVersions(documentId: string): Promise<readonly StoredDocument[]> {
    const doc = storeGetDocument(documentId);
    return doc ? [doc] : [];
  }
}
