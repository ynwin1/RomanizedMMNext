# Admin integration testing (P3.9)

P3.9 adds deterministic integration coverage for the Phase 3 admin platform using the existing Node/TypeScript test runner.

Covered flows:
- anonymous admin access is denied through the real `requireAdmin` decision flow;
- authenticated non-admin users are denied without sign-in;
- authenticated admins are allowed;
- admin reads authorize before touching content services;
- song create → list → edit;
- artist create → list → edit;
- request submission → pending list → review → status update;
- audit actor propagation remains intact through write handlers and services.

The integration flow uses in-memory repository implementations behind the real application services and admin action handlers. This keeps the tests deterministic and runnable in every pull request without mutating real Mongo data.

## Browser E2E

A Playwright layer is intentionally not added in this phase because a meaningful Clerk-backed browser test requires dedicated Clerk test credentials and an isolated database environment. Adding browser specs that are skipped or depend on production-like credentials would not improve the CI safety net.

When a disposable Clerk + Mongo test environment is available, browser E2E can be layered on top of these integration tests for navigation, form rendering, and Clerk session behavior. The Phase 3 integration contract remains the same.
