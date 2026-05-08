// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

export interface ValmarConfig {
  apiKey: string;
  organizationId: string;
  projectId: string;
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Context API
// ---------------------------------------------------------------------------

export interface ContextGatherParams {
  question: string;
  alreadyTried?: string;
  backgroundContext?: string;
  requestingApplication?: string;
}

export interface ContextRequestHandle {
  contextRequestId: string;
  status: string;
  resourceUri: string;
}

export interface ContextRequest {
  id: string;
  projectId: string;
  question: string;
  status: string;
  resultSummary: string | null;
  alreadyTried: string | null;
  backgroundContext: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContextSearchParams {
  query: string;
  limit?: number;
}

export interface ContextPart {
  id: string;
  type: string;
  title: string;
  contentMd: string;
  confidence: number;
  tags: string[];
  sourceUrl: string | null;
  createdAt: string;
}

export interface ContextSearchResult {
  items: ContextPart[];
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Knowledge API
// ---------------------------------------------------------------------------

export interface KnowledgeSearchParams {
  query: string;
  limit?: number;
}

export interface KnowledgeSearchResult {
  items: ContextPart[];
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Members (People) API
// ---------------------------------------------------------------------------

export interface Member {
  id: string;
  email: string;
  displayName: string;
  timezone: string | null;
  title: string | null;
}

export interface MemberImportBulkParams {
  members: MemberImportEntry[];
}

export interface MemberImportEntry {
  email: string;
  displayName: string;
  timezone?: string;
  title?: string;
}

export interface MemberImportBulkResult {
  imported: number;
  skipped: number;
}

// ---------------------------------------------------------------------------
// Usage / Stats
// ---------------------------------------------------------------------------

export interface ProjectUsageStats {
  contextRequestsTotal: number;
  contextRequestsPending: number;
  contextRequestsCompleted: number;
  contextRequestsFailed: number;
  membersTotal: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Generic JSON-compatible value (avoids `any`). */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = Record<string, JsonValue>;
