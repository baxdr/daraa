/**
 * DocumentRepository interface — abstraction for document persistence.
 *
 * Documents are generated compliance artifacts (policies, DPO letters, etc.)
 * tied to a specific scan or project. The interface supports versioning
 * and per-project queries.
 */

import type { GeneratedDocument } from '@/agents/document-agent';

export interface StoredDocument extends GeneratedDocument {
  id: string;
  scanId: string;
  createdAt: number;
}

export interface DocumentRepository {
  /**
   * Create and persist a new document.
   */
  create(input: { scanId: string; document: GeneratedDocument }): Promise<StoredDocument>;

  /**
   * Retrieve a document by ID.
   */
  findById(id: string): Promise<StoredDocument | null>;

  /**
   * List all documents generated for a specific company/project.
   * Used for the documents tab to show all artifacts.
   */
  findByCompany(companyId: string): Promise<readonly StoredDocument[]>;

  /**
   * List all versions of a document (for versioning support in Phase 1+).
   * For now, returns a single entry if found.
   */
  listVersions(documentId: string): Promise<readonly StoredDocument[]>;
}
