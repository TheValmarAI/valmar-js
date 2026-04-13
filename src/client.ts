import type {
  ValmarConfig,
  ContextGatherParams,
  ContextRequestHandle,
  ContextRequest,
  ContextSearchParams,
  ContextSearchResult,
  KnowledgeSearchParams,
  KnowledgeSearchResult,
  Member,
  MemberImportBulkParams,
  MemberImportBulkResult,
  JsonObject,
  JsonValue,
} from "./types.js";

// ---------------------------------------------------------------------------
// Case-conversion helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API error
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Resource namespaces
// ---------------------------------------------------------------------------

class ContextResource {
  constructor(private request: RequestFn) {}

  async gather(params: ContextGatherParams): Promise<ContextRequestHandle> {
    return this.request<ContextRequestHandle>("POST", "/api/context/requests", params);
  }

  async get(contextRequestId: string): Promise<ContextRequest> {
    return this.request<ContextRequest>(
      "GET",
      `/api/context/requests/${contextRequestId}`,
    );
  }

  async search(params: ContextSearchParams): Promise<ContextSearchResult> {
    return this.request<ContextSearchResult>("POST", "/api/context/search", params);
  }
}

class KnowledgeResource {
  constructor(private request: RequestFn) {}

  async search(params: KnowledgeSearchParams): Promise<KnowledgeSearchResult> {
    return this.request<KnowledgeSearchResult>(
      "POST",
      "/api/context/search",
      params,
    );
  }
}

class MembersResource {
  constructor(private request: RequestFn) {}

  async list(organizationId: string): Promise<Member[]> {
    return this.request<Member[]>("GET", `/api/organizations/${organizationId}/members`);
  }

  async importBulk(organizationId: string, params: MemberImportBulkParams): Promise<MemberImportBulkResult> {
    return this.request<MemberImportBulkResult>(
      "POST",
      `/api/organizations/${organizationId}/members/import`,
      params,
    );
  }
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type RequestFn = <T>(
  method: string,
  path: string,
  body?: object,
) => Promise<T>;

// ---------------------------------------------------------------------------
// Valmar client
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://api.valmar.dev";

export class Valmar {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  public readonly context: ContextResource;
  public readonly knowledge: KnowledgeResource;
  public readonly members: MembersResource;

  constructor(config: ValmarConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");

    const boundRequest = this.request.bind(this);
    this.context = new ContextResource(boundRequest);
    this.knowledge = new KnowledgeResource(boundRequest);
    this.members = new MembersResource(boundRequest);
  }

  // -------------------------------------------------------------------------
  // Core HTTP helper
  // -------------------------------------------------------------------------

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

    const res = await fetch(url, init);

    if (!res.ok) {
      const text = await res.text();
      throw new ValmarApiError(res.status, res.statusText, text);
    }

    // DELETE endpoints may return 204 No Content
    if (res.status === 204) {
      return undefined as T;
    }

    const json: JsonValue = await res.json() as JsonValue;
    return toCamelCase<T>(json);
  }
}
