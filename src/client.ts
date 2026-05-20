import type {
  ValmarConfig,
  ImportPeopleParams,
  ImportPeopleResult,
  JsonObject,
  JsonValue,
  KnowledgeItem,
  KnowledgeItemProvenance,
  KnowledgeRequest,
  KnowledgeRequestAnswer,
  KnowledgeRequestCreateParams,
  KnowledgeRequestHandle,
  KnowledgeRequestListItem,
  KnowledgeSearchParams,
  KnowledgeSearchResult,
  Person,
} from "./types.js";

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
}

function convertKeys(
  obj: JsonValue,
  converter: (key: string) => string,
): JsonValue {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeys(item, converter));
  }
  const result: JsonObject = {};
  for (const [key, value] of Object.entries(obj)) {
    result[converter(key)] = convertKeys(value, converter);
  }
  return result;
}

function toSnakeCase(obj: JsonObject): JsonObject {
  return convertKeys(obj, camelToSnake) as JsonObject;
}

function toCamelCase<T>(obj: JsonValue): T {
  return convertKeys(obj, snakeToCamel) as T;
}

export class ValmarApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
  ) {
    super(`Valmar API error ${status} ${statusText}: ${body}`);
    this.name = "ValmarApiError";
  }
}

interface BackendKnowledgeItemProvenance {
  sourceThreadId?: string | null;
  sourceMemberId?: string | null;
  sourceAgentRunId?: string | null;
  sourceKnowledgeRequestId?: string | null;
  sourceMessageId?: string | null;
}

interface BackendKnowledgeItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  projectId: string;
  knowledgeRequestId?: string | null;
  type: KnowledgeItem["type"];
  title: string;
  contentMd: string;
  provenance?: BackendKnowledgeItemProvenance;
  confidence: number;
  reviewStatus: KnowledgeItem["reviewStatus"];
  relatedMemberIds?: string[];
  relatedTwinNodeIds?: string[];
  tags?: string[];
}

interface BackendKnowledgeSearchResult {
  items: BackendKnowledgeItem[];
  totalCount: number;
}

interface BackendKnowledgeRequestHandle {
  knowledgeRequestId: string;
  status: KnowledgeRequestHandle["status"];
  resourceUri: string;
  message: string;
}

interface BackendKnowledgeRequestAnswer {
  status: KnowledgeRequestAnswer["status"];
  answerText: string;
  answerKnowledgeItems?: string[];
}

interface BackendKnowledgeRequest extends Omit<KnowledgeRequest, "answer"> {
  answer: BackendKnowledgeRequestAnswer | null;
}

type RequestFn = <T>(
  method: string,
  path: string,
  body?: object,
) => Promise<T>;

function mapKnowledgeItemProvenance(
  provenance: BackendKnowledgeItemProvenance = {},
): KnowledgeItemProvenance {
  return {
    sourceThreadId: provenance.sourceThreadId ?? null,
    sourceMemberId: provenance.sourceMemberId ?? null,
    sourceAgentRunId: provenance.sourceAgentRunId ?? null,
    sourceKnowledgeRequestId: provenance.sourceKnowledgeRequestId ?? null,
    sourceMessageId: provenance.sourceMessageId ?? null,
  };
}

function mapKnowledgeItem(item: BackendKnowledgeItem): KnowledgeItem {
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    organizationId: item.organizationId,
    projectId: item.projectId,
    knowledgeRequestId: item.knowledgeRequestId ?? null,
    type: item.type,
    title: item.title,
    contentMd: item.contentMd,
    provenance: mapKnowledgeItemProvenance(item.provenance),
    confidence: item.confidence,
    reviewStatus: item.reviewStatus,
    relatedMemberIds: item.relatedMemberIds ?? [],
    relatedTwinNodeIds: item.relatedTwinNodeIds ?? [],
    tags: item.tags ?? [],
  };
}

function mapKnowledgeRequestAnswer(
  answer: BackendKnowledgeRequestAnswer | null,
): KnowledgeRequestAnswer | null {
  if (answer === null) {
    return null;
  }
  return {
    status: answer.status,
    answerText: answer.answerText,
    answerKnowledgeItems: answer.answerKnowledgeItems ?? [],
  };
}

class KnowledgeResource {
  constructor(
    private request: RequestFn,
    private organizationId: string,
    private projectId: string,
  ) {}

  async search(params: KnowledgeSearchParams = {}): Promise<KnowledgeSearchResult> {
    const result = await this.request<BackendKnowledgeSearchResult>(
      "POST",
      "/api/knowledge/search",
      {
        organizationId: this.organizationId,
        projectId: this.projectId,
        query: params.query ?? "",
        limit: params.limit,
        types: params.types ?? [],
        relatedMemberIds: params.relatedMemberIds ?? [],
      },
    );

    return {
      items: result.items.map(mapKnowledgeItem),
      totalCount: result.totalCount,
    };
  }
}

class KnowledgeRequestsResource {
  constructor(
    private request: RequestFn,
    private projectId: string,
  ) {}

  async create(params: KnowledgeRequestCreateParams): Promise<KnowledgeRequestHandle> {
    const handle = await this.request<BackendKnowledgeRequestHandle>(
      "POST",
      "/api/knowledge/requests",
      {
        ...params,
        projectId: this.projectId,
        requestingApplication: params.requestingApplication ?? "valmar-sdk-ts",
      },
    );

    return {
      knowledgeRequestId: handle.knowledgeRequestId,
      status: handle.status,
      resourceUri: handle.resourceUri,
      message: handle.message,
    };
  }

  async get(knowledgeRequestId: string): Promise<KnowledgeRequest> {
    const request = await this.request<BackendKnowledgeRequest>(
      "GET",
      `/api/knowledge/requests/${knowledgeRequestId}`,
    );
    return {
      ...request,
      answer: mapKnowledgeRequestAnswer(request.answer),
    };
  }

  async list(): Promise<KnowledgeRequestListItem[]> {
    return this.request<KnowledgeRequestListItem[]>(
      "GET",
      `/api/projects/${this.projectId}/knowledge-requests`,
    );
  }
}

class PeopleResource {
  constructor(
    private request: RequestFn,
    private organizationId: string,
  ) {}

  async list(): Promise<Person[]> {
    return this.request<Person[]>("GET", `/api/organizations/${this.organizationId}/people`);
  }

  async importBulk(params: ImportPeopleParams): Promise<ImportPeopleResult> {
    return this.request<ImportPeopleResult>(
      "POST",
      `/api/organizations/${this.organizationId}/people/import`,
      { people: params.people },
    );
  }
}

export class Valmar {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly organizationId: string;
  private readonly projectId: string;

  public readonly knowledge: KnowledgeResource;
  public readonly knowledgeRequests: KnowledgeRequestsResource;
  public readonly people: PeopleResource;

  constructor(config: ValmarConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.organizationId = config.organizationId;
    this.projectId = config.projectId;

    const boundRequest = this.request.bind(this);
    this.knowledge = new KnowledgeResource(boundRequest, this.organizationId, this.projectId);
    this.knowledgeRequests = new KnowledgeRequestsResource(boundRequest, this.projectId);
    this.people = new PeopleResource(boundRequest, this.organizationId);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: object,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const init: RequestInit = { method, headers };

    if (body !== undefined) {
      init.body = JSON.stringify(toSnakeCase(body as JsonObject));
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      const text = await response.text();
      throw new ValmarApiError(response.status, response.statusText, text);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const json = (await response.json()) as JsonValue;
    return toCamelCase<T>(json);
  }
}
