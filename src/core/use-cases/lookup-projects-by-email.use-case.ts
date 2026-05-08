/**
 * LookupProjectsByEmailUseCase — return-by-email project list.
 *
 * Used by the public lookup page and (later) by claim flows. The HTTP layer
 * applies rate-limiting because email enumeration is the threat; this
 * use-case stays pure.
 */

import { ValidationError } from '@/core/errors';
import type { ProjectRepository } from '@/core/repositories';
import type { ProjectRecord } from '@/core/domain/project.entity';

export interface LookupProjectsByEmailInput {
  readonly email: string;
}

export interface LookupProjectsByEmailDeps {
  readonly projects: ProjectRepository;
}

export interface ProjectSummary {
  readonly id: string;
  readonly createdAt: number;
  readonly mode: ProjectRecord['mode'];
  readonly status: ProjectRecord['status'];
  readonly companyName: string;
  readonly vertical: ProjectRecord['vertical'];
}

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function lookupProjectsByEmail(
  deps: LookupProjectsByEmailDeps,
  input: LookupProjectsByEmailInput,
): Promise<ReadonlyArray<ProjectSummary>> {
  const email = input.email.trim().toLowerCase();
  if (!email || !EMAIL_RX.test(email) || email.length > 200) {
    throw new ValidationError('Invalid email address', { email: input.email });
  }

  const projects = await deps.projects.findByEmail(email);
  // Only return projects that haven't been claimed yet. Owned projects
  // surface only through /account (auth-required) so an attacker can't
  // enumerate someone else's full project list by typing their email.
  return projects
    .filter((p) => !p.ownerUserId)
    .map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      mode: p.mode,
      status: p.status,
      companyName: p.companyName,
      vertical: p.vertical,
    }));
}
