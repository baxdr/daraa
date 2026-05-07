// @ts-nocheck
// TODO(phase-4): rewrite with proper Supabase TS strict types. Filesystem driver
// remains the default; this file compiles only when PERSISTENCE_DRIVER=supabase.
/**
 * Supabase-backed DocumentRepository implementation.
 *
 * Persists documents + versions to documents and document_versions tables.
 */

import { nanoid } from 'nanoid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentRepository, StoredDocument } from '@/core/repositories/document-repository';
import type { GeneratedDocument } from '@/agents/document-agent';
import type { Database } from '@/types/supabase';

export class SupabaseDocumentRepository implements DocumentRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async create(input: { scanId: string; document: GeneratedDocument }): Promise<StoredDocument> {
    const id = nanoid();
    const now = Date.now();

    // TODO: Map scanId to companyId via scan table lookup
    const companyId = input.scanId; // Placeholder; real impl joins scans table

    const { data: doc, error } = await this.supabase
      .from('documents')
      .insert([
        {
          id,
          company_id: companyId,
          title_ar: input.document.titleAr,
          type: input.document.type,
          content: input.document.content,
          created_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Create version 1
    const { error: versionError } = await this.supabase.from('document_versions').insert([
      {
        document_id: id,
        version: 1,
        content: input.document.content,
        created_at: new Date(now).toISOString(),
      },
    ]);

    if (versionError) throw versionError;

    return {
      id,
      scanId: input.scanId,
      titleAr: input.document.titleAr,
      type: input.document.type,
      content: input.document.content,
      createdAt: now,
    };
  }

  async findById(id: string): Promise<StoredDocument | null> {
    const { data: doc, error } = await this.supabase
      .from('documents')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const createdAt = doc.created_at ? new Date(doc.created_at).getTime() : Date.now();

    return {
      id: doc.id,
      scanId: doc.company_id, // Placeholder
      titleAr: doc.title_ar,
      type: doc.type,
      content: doc.content,
      createdAt,
    };
  }

  async findByCompany(companyId: string): Promise<readonly StoredDocument[]> {
    const { data: docs, error } = await this.supabase
      .from('documents')
      .select()
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (docs || []).map((doc) => ({
      id: doc.id,
      scanId: doc.company_id,
      titleAr: doc.title_ar,
      type: doc.type,
      content: doc.content,
      createdAt: doc.created_at ? new Date(doc.created_at).getTime() : Date.now(),
    }));
  }

  async listVersions(documentId: string): Promise<readonly StoredDocument[]> {
    const { data: versions, error } = await this.supabase
      .from('document_versions')
      .select('*, documents(*)')
      .eq('document_id', documentId)
      .order('version', { ascending: false });

    if (error) throw error;

    return (versions || []).map((v) => {
      const doc = Array.isArray(v.documents) ? v.documents[0] : v.documents;
      return {
        id: documentId,
        scanId: doc.company_id,
        titleAr: doc.title_ar,
        type: doc.type,
        content: v.content,
        createdAt: v.created_at ? new Date(v.created_at).getTime() : Date.now(),
      };
    });
  }
}
