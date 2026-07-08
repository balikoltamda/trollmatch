import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { NextRequest } from "next/server";
import {
  isMiddlewareMatched,
  shouldApplyLocaleMiddleware,
} from "./lib/middleware-routing";

type MiddlewareHandler = (
  request: NextRequest,
  event: { waitUntil: (promise: Promise<unknown>) => void },
) => Promise<Response | undefined> | Response | undefined;

const mockEvent = { waitUntil: () => {} };

let middleware: MiddlewareHandler;

before(async () => {
  process.env.AUTH_SECRET ??= "test-middleware-auth-secret-min-32-chars";
  const mod = await import("./middleware");
  middleware = mod.default as MiddlewareHandler;
});

async function invokeMiddleware(url: string): Promise<Response | undefined> {
  const result = await middleware(new NextRequest(url), mockEvent);
  return result instanceof Response ? result : undefined;
}

function assertNoLocaleRedirect(
  response: Response | undefined,
  label: string,
): void {
  if (!response) {
    return;
  }

  assert.notEqual(
    response.status,
    307,
    `${label}: must not redirect (307)`,
  );
  assert.notEqual(
    response.status,
    308,
    `${label}: must not redirect (308)`,
  );

  const location = response.headers.get("location");
  if (location) {
    assert.ok(
      !location.includes("/tr/api"),
      `${label}: must not locale-prefix API (${location})`,
    );
    assert.ok(
      !location.includes("/en/api"),
      `${label}: must not locale-prefix API (${location})`,
    );
  }
}

describe("middleware route matching", () => {
  it("does not match public API routes", () => {
    assert.equal(isMiddlewareMatched("/api/health"), false);
    assert.equal(isMiddlewareMatched("/api/auth/session"), false);
  });

  it("matches studio API routes for auth", () => {
    assert.equal(isMiddlewareMatched("/api/studio/products"), true);
  });

  it("does not match static or Next internals", () => {
    assert.equal(isMiddlewareMatched("/favicon.ico"), false);
    assert.equal(isMiddlewareMatched("/robots.txt"), false);
    assert.equal(isMiddlewareMatched("/sitemap.xml"), false);
    assert.equal(isMiddlewareMatched("/_next/image"), false);
    assert.equal(isMiddlewareMatched("/_next/static/chunks/main.js"), false);
  });

  it("matches application pages", () => {
    assert.equal(isMiddlewareMatched("/"), true);
    assert.equal(isMiddlewareMatched("/tr"), true);
    assert.equal(isMiddlewareMatched("/en/lures"), true);
    assert.equal(isMiddlewareMatched("/studio/login"), true);
  });

  it("never applies locale middleware to API paths", () => {
    assert.equal(shouldApplyLocaleMiddleware("/api/health"), false);
    assert.equal(shouldApplyLocaleMiddleware("/api/auth/session"), false);
  });
});

describe("middleware HTTP behavior", () => {
  it("GET /api/health → no locale redirect", async () => {
    const response = await invokeMiddleware("http://localhost:3000/api/health");
    assertNoLocaleRedirect(response, "GET /api/health");
  });

  it("GET /api/auth/session → no locale redirect", async () => {
    const response = await invokeMiddleware(
      "http://localhost:3000/api/auth/session",
    );
    assertNoLocaleRedirect(response, "GET /api/auth/session");
  });

  it("GET / → 307 redirect to default locale /tr", async () => {
    const response = await invokeMiddleware("http://localhost:3000/");

    assert.ok(response, "GET / should return a redirect response");
    assert.equal(response!.status, 307);
    const location = response!.headers.get("location") ?? "";
    assert.ok(
      location.endsWith("/tr") || location.includes("/tr"),
      `expected redirect to /tr, got ${location}`,
    );
  });

  it("GET /tr → no redirect", async () => {
    const response = await invokeMiddleware("http://localhost:3000/tr");
    assertNoLocaleRedirect(response, "GET /tr");
  });

  it("GET /favicon.ico is excluded from matcher", () => {
    assert.equal(isMiddlewareMatched("/favicon.ico"), false);
  });

  it("GET /_next/image is excluded from matcher", () => {
    assert.equal(isMiddlewareMatched("/_next/image"), false);
  });

  it("GET /robots.txt is excluded from matcher", () => {
    assert.equal(isMiddlewareMatched("/robots.txt"), false);
  });
});
