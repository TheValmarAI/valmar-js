export interface ValmarConfig {
  apiKey: string;
  organizationId: string;
  projectId: string;
  baseUrl?: string;
}

export type KnowledgeRequestStatus =
  | "pending"
  | "deferred"
  | "waiting_for_reply"
  | "completed"
  | "timed_out"
  | "failed";

export type KnowledgeRequestResolutionStatus =
  | "resolved"
  | "partial_resolution"
  | "not_resolved";

export type KnowledgeItemType = "text";

export type ReviewStatus = "auto_accepted" | "needs_review";

export interface KnowledgeItemProvenance {
  sourceThreadId: string | null;
  sourceMemberId: string | null;
  sourceAgentRunId: string | null;
  sourceKnowledgeRequestId: string | null;
  sourceMessageId: string | null;
}

export interface KnowledgeItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  projectId: string;
  knowledgeRequestId: string | null;
  type: KnowledgeItemType;
  title: string;
  contentMd: string;
  provenance: KnowledgeItemProvenance;
  confidence: number;
  reviewStatus: ReviewStatus;
  relatedMemberIds: string[];
  relatedTwinNodeIds: string[];
  tags: string[];
}

export interface KnowledgeSearchParams {
  query?: string;
  limit?: number;
  types?: KnowledgeItemType[];
  relatedMemberIds?: string[];
}

export interface KnowledgeSearchResult {
  items: KnowledgeItem[];
  totalCount: number;
}

export interface KnowledgeRequestCreateParams {
  question: string;
  alreadyTried?: string;
  backgroundContext?: string;
  requestingApplication?: string;
  sourceAgentConfigId?: string;
}

export interface KnowledgeRequestHandle {
  knowledgeRequestId: string;
  status: KnowledgeRequestStatus;
  resourceUri: string;
  message: string;
}

export interface KnowledgeRequestAnswer {
  status: KnowledgeRequestResolutionStatus;
  answerText: string;
  answerKnowledgeItems: string[];
}

export interface KnowledgeRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  projectId: string;
  requestingApplication: string;
  question: string;
  alreadyTried: string | null;
  backgroundContext: string | null;
  candidateMemberIds: string[];
  status: KnowledgeRequestStatus;
  sourceAgentConfigId: string | null;
  responseDeadlineAt: string | null;
  resultSummary: string | null;
  answer: KnowledgeRequestAnswer | null;
  resolvedThreadId: string | null;
  createdByActorId: string | null;
}

export interface KnowledgeRequestListItem {
  id: string;
  projectId: string;
  requestingApplication: string;
  question: string;
  status: KnowledgeRequestStatus;
  resultSummary: string | null;
  createdAt: string;
  assignedMemberId: string | null;
  assignedMemberDisplayName: string | null;
}

export interface Person {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  email: string;
  displayName: string;
  timezone: string;
  title: string | null;
  descriptionMd: string;
}

export interface ImportPeopleParams {
  people: PersonImportEntry[];
}

export interface PersonImportEntry {
  email: string;
  displayName: string;
  timezone?: string;
  title?: string;
  descriptionMd?: string;
}

export interface ImportPersonResult {
  email: string;
  status: string;
  memberId: string | null;
  error: string | null;
}

export interface ImportPeopleResult {
  created: ImportPersonResult[];
  skipped: ImportPersonResult[];
  errors: ImportPersonResult[];
}

export interface ProjectUsageStats {
  contextRequestsTotal: number;
  contextRequestsPending: number;
  contextRequestsCompleted: number;
  contextPartsTotal: number;
  membersTotal: number;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = Record<string, JsonValue>;
