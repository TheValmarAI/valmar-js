# @valmar/sdk

TypeScript SDK for the Valmar platform.

## Installation

```bash
npm install @valmar/sdk
```

## Quick start

```typescript
import { Valmar } from "@valmar/sdk";

const valmar = new Valmar({ apiKey: "valmr_proj_sk_..." });
```

## Examples

### Search context

Find relevant context across your organization's knowledge base.

```typescript
const results = await valmar.context.search({ query: "deployment process" });

for (const item of results.items) {
  console.log(`${item.title} (${item.confidence})`);
  console.log(item.contentMd);
}
```

### Gather context

Create a context request that gets routed to the right people in your org.

```typescript
const handle = await valmar.context.gather({
  question: "How do we handle database migrations in production?",
  backgroundContext: "Planning a schema change for the orders table",
});

console.log(`Request created: ${handle.contextRequestId}`);
console.log(`Status: ${handle.status}`);

// Poll for the result later
const request = await valmar.context.get(handle.contextRequestId);
if (request.status === "completed") {
  console.log(request.resultSummary);
}
```

### Manage webhooks

Subscribe to events like context request completions.

```typescript
// Create a webhook endpoint
const endpoint = await valmar.webhooks.create({
  projectId: "your-project-id",
  url: "https://example.com/webhooks/valmar",
  events: ["context_request.completed"],
});

console.log(`Webhook secret: ${endpoint.secret}`);

// List all endpoints
const endpoints = await valmar.webhooks.list({
  projectId: "your-project-id",
});
```

### List members

```typescript
const members = await valmar.members.list("your-organization-id");

for (const member of members) {
  console.log(`${member.displayName} <${member.email}>`);
}
```

## Error handling

```typescript
import { Valmar, ValmarApiError } from "@valmar/sdk";

try {
  await valmar.context.search({ query: "test" });
} catch (err) {
  if (err instanceof ValmarApiError) {
    console.error(`API error ${err.status}: ${err.body}`);
  }
}
```
