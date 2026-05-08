function camelToSnake(str) {
    return str.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
}
function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
}
function convertKeys(obj, converter) {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => convertKeys(item, converter));
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[converter(key)] = convertKeys(value, converter);
    }
    return result;
}
function toSnakeCase(obj) {
    return convertKeys(obj, camelToSnake);
}
function toCamelCase(obj) {
    return convertKeys(obj, snakeToCamel);
}
export class ValmarApiError extends Error {
    status;
    statusText;
    body;
    constructor(status, statusText, body) {
        super(`Valmar API error ${status} ${statusText}: ${body}`);
        this.status = status;
        this.statusText = statusText;
        this.body = body;
        this.name = "ValmarApiError";
    }
}
function mapKnowledgeItemProvenance(provenance = {}) {
    return {
        sourceThreadId: provenance.sourceThreadId ?? null,
        sourceMemberId: provenance.sourceMemberId ?? null,
        sourceAgentRunId: provenance.sourceAgentRunId ?? null,
        sourceKnowledgeRequestId: provenance.sourceKnowledgeRequestId ?? null,
        sourceMessageId: provenance.sourceMessageId ?? null,
    };
}
function mapKnowledgeItem(item) {
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
function mapKnowledgeRequestAnswer(answer) {
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
    request;
    organizationId;
    projectId;
    constructor(request, organizationId, projectId) {
        this.request = request;
        this.organizationId = organizationId;
        this.projectId = projectId;
    }
    async search(params = {}) {
        const result = await this.request("POST", "/api/knowledge/search", {
            organizationId: this.organizationId,
            projectId: this.projectId,
            query: params.query ?? "",
            limit: params.limit,
            types: params.types ?? [],
            relatedMemberIds: params.relatedMemberIds ?? [],
        });
        return {
            items: result.items.map(mapKnowledgeItem),
            totalCount: result.totalCount,
        };
    }
}
class KnowledgeRequestsResource {
    request;
    projectId;
    constructor(request, projectId) {
        this.request = request;
        this.projectId = projectId;
    }
    async create(params) {
        const handle = await this.request("POST", "/api/knowledge/requests", {
            ...params,
            projectId: this.projectId,
            requestingApplication: params.requestingApplication ?? "valmar-sdk-ts",
        });
        return {
            knowledgeRequestId: handle.knowledgeRequestId,
            status: handle.status,
            resourceUri: handle.resourceUri,
            message: handle.message,
        };
    }
    async get(knowledgeRequestId) {
        const request = await this.request("GET", `/api/knowledge/requests/${knowledgeRequestId}`);
        return {
            ...request,
            answer: mapKnowledgeRequestAnswer(request.answer),
        };
    }
    async list() {
        return this.request("GET", `/api/projects/${this.projectId}/knowledge-requests`);
    }
}
class PeopleResource {
    request;
    organizationId;
    constructor(request, organizationId) {
        this.request = request;
        this.organizationId = organizationId;
    }
    async list() {
        return this.request("GET", `/api/organizations/${this.organizationId}/people`);
    }
    async importBulk(params) {
        return this.request("POST", `/api/organizations/${this.organizationId}/people/import`, { people: params.people });
    }
}
const DEFAULT_BASE_URL = "https://api.valmar.dev";
export class Valmar {
    apiKey;
    baseUrl;
    organizationId;
    projectId;
    knowledge;
    knowledgeRequests;
    people;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
        this.organizationId = config.organizationId;
        this.projectId = config.projectId;
        const boundRequest = this.request.bind(this);
        this.knowledge = new KnowledgeResource(boundRequest, this.organizationId, this.projectId);
        this.knowledgeRequests = new KnowledgeRequestsResource(boundRequest, this.projectId);
        this.people = new PeopleResource(boundRequest, this.organizationId);
    }
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        };
        const init = { method, headers };
        if (body !== undefined) {
            init.body = JSON.stringify(toSnakeCase(body));
        }
        const response = await fetch(url, init);
        if (!response.ok) {
            const text = await response.text();
            throw new ValmarApiError(response.status, response.statusText, text);
        }
        if (response.status === 204) {
            return undefined;
        }
        const json = (await response.json());
        return toCamelCase(json);
    }
}
//# sourceMappingURL=client.js.map