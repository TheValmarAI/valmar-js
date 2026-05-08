import { afterEach, describe, expect, test } from "bun:test";

import { Valmar, ValmarApiError } from "../src/index";

const organizationId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const knowledgeRequestId = "33333333-3333-4333-8333-333333333333";
const knowledgeItemId = "44444444-4444-4444-8444-444444444444";
const originalFetch = globalThis.fetch;

function client(): Valmar {
  return new Valmar({
    apiKey: "valmr_proj_sk_test",
    baseUrl: "https://api.example.test",
    organizationId,
    projectId,
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("Valmar", () => {
  test("searches knowledge with project scope and maps response names", async () => {
    let requestBody: unknown;

    globalThis.fetch = async (_input: string | URL | Request, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body));
      return Response.json({
        items: [
          {
            id: knowledgeItemId,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
            organization_id: organizationId,
            project_id: projectId,
            context_request_id: knowledgeRequestId,
            type: "text",
            title: "Deployment process",
            content_md: "Use the release checklist.",
            provenance: {
              source_context_request_id: knowledgeRequestId,
            },
            confidence: 0.8,
            review_status: "auto_accepted",
            related_member_ids: ["55555555-5555-4555-8555-555555555555"],
            related_twin_node_ids: [],
            tags: ["runbook"],
          },
        ],
        total_count: 1,
      });
    };

    const result = await client().knowledge.search({ query: "deployment", limit: 3 });

    expect(requestBody).toEqual({
      organization_id: organizationId,
      project_id: projectId,
      query: "deployment",
      limit: 3,
      types: [],
      related_member_ids: [],
    });
    expect(result.items[0]?.knowledgeRequestId).toBe(knowledgeRequestId);
    expect(result.items[0]?.provenance.sourceKnowledgeRequestId).toBe(knowledgeRequestId);
    expect(result.items[0]?.relatedMemberIds).toEqual([
      "55555555-5555-4555-8555-555555555555",
    ]);
  });

  test("creates and gets knowledge requests with new names", async () => {
    const paths: string[] = [];

    globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      paths.push(url.pathname);

      if (init?.method === "POST") {
        expect(JSON.parse(String(init.body))).toEqual({
          question: "How do releases work?",
          project_id: projectId,
          requesting_application: "test-agent",
        });
        return Response.json({
          context_request_id: knowledgeRequestId,
          status: "pending",
          resource_uri: `valmar://knowledge-requests/${knowledgeRequestId}`,
        });
      }

      return Response.json({
        id: knowledgeRequestId,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        organization_id: organizationId,
        project_id: projectId,
        requesting_application: "test-agent",
        question: "How do releases work?",
        already_tried: null,
        background_context: null,
        candidate_member_ids: [],
        status: "completed",
        source_agent_config_id: null,
        response_deadline_at: null,
        result_summary: "Use the checklist.",
        answer: {
          status: "resolved",
          answer_text: "Use the checklist.",
          answer_context_parts: [knowledgeItemId],
        },
        resolved_thread_id: null,
        created_by_actor_id: "machine:test",
      });
    };

    const valmar = client();
    const handle = await valmar.knowledgeRequests.create({
      question: "How do releases work?",
      requestingApplication: "test-agent",
    });
    const request = await valmar.knowledgeRequests.get(handle.knowledgeRequestId);

    expect(handle.knowledgeRequestId).toBe(knowledgeRequestId);
    expect(request.answer?.answerKnowledgeItems).toEqual([knowledgeItemId]);
    expect(paths).toEqual([
      "/api/context/requests",
      `/api/context/requests/${knowledgeRequestId}`,
    ]);
  });

  test("lists people and imports bulk people", async () => {
    const paths: string[] = [];

    globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      paths.push(url.pathname);

      if (init?.method === "POST") {
        expect(JSON.parse(String(init.body))).toEqual({
          members: [{ email: "ada@example.com", display_name: "Ada Lovelace" }],
        });
        return Response.json({
          created: [
            {
              email: "ada@example.com",
              status: "created",
              member_id: "55555555-5555-4555-8555-555555555555",
              error: null,
            },
          ],
          skipped: [],
          errors: [],
        });
      }

      return Response.json([
        {
          id: "55555555-5555-4555-8555-555555555555",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          organization_id: organizationId,
          email: "ada@example.com",
          display_name: "Ada Lovelace",
          timezone: "UTC",
          title: null,
          description_md: "",
        },
      ]);
    };

    const valmar = client();
    const people = await valmar.people.list();
    const result = await valmar.people.importBulk({
      people: [{ email: "ada@example.com", displayName: "Ada Lovelace" }],
    });

    expect(people[0]?.displayName).toBe("Ada Lovelace");
    expect(result.created[0]?.memberId).toBe("55555555-5555-4555-8555-555555555555");
    expect(paths).toEqual([
      `/api/organizations/${organizationId}/members`,
      `/api/organizations/${organizationId}/members/import`,
    ]);
  });

  test("throws ValmarApiError for non-2xx responses", async () => {
    globalThis.fetch = async () =>
      new Response("bad key", {
        status: 401,
        statusText: "Unauthorized",
      });

    await expect(client().knowledge.search({ query: "test" })).rejects.toBeInstanceOf(
      ValmarApiError,
    );
  });
});
