# @valmar/sdk

TypeScript SDK for the Valmar platform.

Documentation: https://docs.getvalmar.com

Source: https://github.com/TheValmarAI/valmar-js

License: Apache-2.0

## Installation

```bash
bun add @valmar/sdk
```

## Quick start

```ts
import { Valmar } from "@valmar/sdk";

const valmar = new Valmar({
  apiKey: "valmr_proj_sk_...",
  organizationId: "your-org-id",
  projectId: "your-project-id",
  baseUrl: "https://your-valmar-deployment.example.com",
});
```

`baseUrl` is required because Valmar is deployed per customer. Use the base URL for your own Valmar deployment.

## Search knowledge

Find relevant saved knowledge across the configured project.

```ts
const results = await valmar.knowledge.search({ query: "deployment process" });

for (const item of results.items) {
  console.log(`${item.title} (${item.confidence})`);
  console.log(item.contentMd);
}
```

## Create a knowledge request

Create a knowledge request that gets routed to the right people in your organization.

```ts
const handle = await valmar.knowledgeRequests.create({
  question: "How do we handle database migrations in production?",
  backgroundContext: "Planning a schema change for the orders table",
});

console.log(`Request created: ${handle.knowledgeRequestId}`);
console.log(`Status: ${handle.status}`);

const request = await valmar.knowledgeRequests.get(handle.knowledgeRequestId);
if (request.status === "completed") {
  console.log(request.resultSummary);
}
```

## List and import people

```ts
const people = await valmar.people.list();

const result = await valmar.people.importBulk({
  people: [
    {
      email: "ada@example.com",
      displayName: "Ada Lovelace",
      timezone: "UTC",
      title: "Principal Engineer",
    },
  ],
});
```

## Error handling

```ts
import { Valmar, ValmarApiError } from "@valmar/sdk";

try {
  await valmar.knowledge.search({ query: "test" });
} catch (err) {
  if (err instanceof ValmarApiError) {
    console.error(`API error ${err.status}: ${err.body}`);
  }
}
```
