# Background Job Processing

> Never perform heavy work in the request cycle. Every API endpoint that triggers significant work must follow asynchronous execution guidelines.

## 🔄 Request Lifecycle Flow

```
Client Request
  │
  ├── 1. Accept Request (Validate inputs, generate jobId, persist pending job)
  ├── 2. Return Response immediately: { jobId, status: "processing" }
  └── 3. Do work asynchronously (Worker processes job -> updates state to completed/failed)
```

## 🛠️ Worker Infrastructure Selection

Choose one of the following depending on your deployment context and requirements:

| Worker Platform | Best For | Key Capabilities / Trade-offs |
| :--- | :--- | :--- |
| **Trigger.dev** | Serverless / Edge | Managed retries, scheduling, and observability out of the box. |
| **BullMQ** | Node.js + Redis | Fine-grained queue control, concurrency limits, and rate limiting. |
| **Inngest** | Event-driven Pipelines | Triggered by incoming webhooks or real-time data streams. |

## 🔑 Idempotency Guarantees

Every job-creating request must carry a client-generated idempotency key:

- **Key Generation:** Client generates a stable, unique key per logical operation (e.g. `sha256(userId + action + entityId)` or a UUID stored client-side before the first attempt).
- **Duplication Prevention:** Before creating a job, check whether a job with that key already exists for the requesting user.
  - If one exists: Return the existing job record — do not enqueue a duplicate.
  - If none exists: Create the job and store the key atomically with the record.
- **Scoping & TTL:** Idempotency keys must be scoped to the user (same key from different users represents two different jobs) and stored with a Time-To-Live (TTL) appropriate to the operation (e.g., 24h for standard jobs, longer for async imports).
- **State Behavior:** Failed jobs should be retryable by the worker. Resubmitting the same idempotency key should still return the existing (failed) job, rather than creating a new one — unless explicitly targeting a "retry" endpoint that clears the key.
