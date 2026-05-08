import type { ValmarConfig, ImportPeopleParams, ImportPeopleResult, KnowledgeRequest, KnowledgeRequestCreateParams, KnowledgeRequestHandle, KnowledgeRequestListItem, KnowledgeSearchParams, KnowledgeSearchResult, Person } from "./types.js";
export declare class ValmarApiError extends Error {
    readonly status: number;
    readonly statusText: string;
    readonly body: string;
    constructor(status: number, statusText: string, body: string);
}
type RequestFn = <T>(method: string, path: string, body?: object) => Promise<T>;
declare class KnowledgeResource {
    private request;
    private organizationId;
    private projectId;
    constructor(request: RequestFn, organizationId: string, projectId: string);
    search(params?: KnowledgeSearchParams): Promise<KnowledgeSearchResult>;
}
declare class KnowledgeRequestsResource {
    private request;
    private projectId;
    constructor(request: RequestFn, projectId: string);
    create(params: KnowledgeRequestCreateParams): Promise<KnowledgeRequestHandle>;
    get(knowledgeRequestId: string): Promise<KnowledgeRequest>;
    list(): Promise<KnowledgeRequestListItem[]>;
}
declare class PeopleResource {
    private request;
    private organizationId;
    constructor(request: RequestFn, organizationId: string);
    list(): Promise<Person[]>;
    importBulk(params: ImportPeopleParams): Promise<ImportPeopleResult>;
}
export declare class Valmar {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly organizationId;
    private readonly projectId;
    readonly knowledge: KnowledgeResource;
    readonly knowledgeRequests: KnowledgeRequestsResource;
    readonly people: PeopleResource;
    constructor(config: ValmarConfig);
    private request;
}
export {};
//# sourceMappingURL=client.d.ts.map