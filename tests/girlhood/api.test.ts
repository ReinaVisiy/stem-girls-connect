import { test, mock } from "node:test";
import assert from "node:assert/strict";
import submit, { receiptCredentials } from "../../api/_lib/girlhood/submit";
import withdraw from "../../api/_lib/girlhood/withdraw";
import maintenance from "../../api/_lib/girlhood/maintenance";
import subscribe from "../../api/subscribe";
import { hashWithdrawalCode } from "../../api/_lib/girlhood/_shared";
const input = {
  requestToken: "a".repeat(64),
  age: 12,
  perspective: "own",
  language: "fr",
  girlhoodResponse: "Un monde plein de découvertes",
  futureResponse: "",
  supportResponse: "",
  displayName: "Name",
  cityRegion: "City",
  country: "Country",
  consentPublic: true,
  consentDisplayName: true,
  consentDisplayCountry: true,
  consentDisplayCity: true,
  consentReuse: true,
  consentAnalysis: true,
  acknowledgementReview: true,
  acknowledgementPrivacy: true,
};
const req = (body: unknown) =>
  ({
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    socket: { remoteAddress: "127.0.0.1" },
  }) as any;
function response() {
  return {
    statusCode: 0,
    body: null as any,
    headers: {} as Record<string, string>,
    setHeader(k: string, v: string) {
      this.headers[k] = v;
    },
    status(n: number) {
      this.statusCode = n;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  } as any;
}
function setup() {
  process.env.SUPABASE_URL = "http://127.0.0.1:9";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "local-test-key";
  process.env.GIRLHOOD_WITHDRAWAL_PEPPER = "test-pepper-".repeat(4);
  process.env.GIRLHOOD_RATE_LIMIT_SECRET = "test-rate-".repeat(4);
  process.env.GIRLHOOD_SUBMISSIONS_OPEN = "true";
  process.env.GIRLHOOD_ALLOWED_ORIGINS = 'https://campaign.example';
  process.env.NEWSLETTER_RATE_LIMIT_SECRET = 'newsletter-test-'.repeat(4);
  delete process.env.VERCEL;
  const records = new Map<string, any>();
  const state = {
    rateLimited: false,
    insertCount: 0,
    collision: false,
    subscriberDuplicate: false,
    subscriberFailure: false,
    subscribeCount: 0,
  };
  const stub = mock.method(
    globalThis,
    "fetch",
    async (raw: any, options: any) => {
      const url = new URL(String(raw));
      const body = options?.body ? JSON.parse(options.body) : null;
      const json = (v: unknown, status = 200) =>
        new Response(JSON.stringify(v), {
          status,
          headers: { "content-type": "application/json" },
        });
      if (url.pathname.includes("rpc/girlhood_rate_limit"))
        return json(!state.rateLimited);
      if (url.pathname.includes('rpc/newsletter_signup')) {
        if (state.rateLimited) return json(false);
        if (state.subscriberFailure) return json({ message: 'PRIVATE DATABASE DETAIL' }, 503);
        state.subscribeCount++;
        return json(true);
      }
      if (url.pathname.endsWith("/subscribers")) {
        state.subscribeCount++;
        if (state.subscriberFailure)
          return json(
            { code: "42501", message: "PRIVATE DATABASE DETAIL" },
            403,
          );
        return state.subscriberDuplicate
          ? json({ code: "23505" }, 409)
          : new Response(null, { status: 201 });
      }
      if (url.pathname.includes("girlhood_submissions")) {
        if (options?.method === "POST") {
          if (records.has(body.request_token_hash))
            return json({ code: "23505" }, 409);
          state.insertCount++;
          records.set(body.request_token_hash, {
            ...body,
            id: "fixture-id",
            withdrawn_at: null,
          });
          if (state.collision) {
            state.collision = false;
            return json({ code: "23505" }, 409);
          }
          return new Response(null, { status: 201 });
        }
        if (options?.method === "PATCH") {
          const row = [...records.values()].find(
            (r) => "eq." + r.id === url.searchParams.get("id"),
          );
          row.withdrawn_at = new Date().toISOString();
          row.consent_public = false;
          row.moderation_status = "withdrawn";
          return json({ id: row.id });
        }
        const row = url.searchParams.has("request_token_hash")
          ? records.get(url.searchParams.get("request_token_hash")!.slice(3))
          : [...records.values()].find(
              (r) =>
                "eq." + r.public_reference ===
                url.searchParams.get("public_reference"),
            );
        return json(row ? [row] : []);
      }
      throw new Error("Unexpected test request");
    },
  );
  return { records, state, restore: () => stub.mock.restore() };
}
test("lost response retry and reload recovery return the original receipt without another insert", async () => {
  const db = setup();
  try {
    const first = response();
    await submit(req(input), first);
    assert.equal(first.statusCode, 201);
    const stored = [...db.records.values()][0];
    assert.equal(stored.moderation_status, "pending");
    assert.equal(stored.display_name, "Name");
    assert.equal(
      stored.withdrawal_hash,
      hashWithdrawalCode(first.body.withdrawalCode),
    );
    assert.ok(!("withdrawalCode" in stored));
    const retry = response();
    await submit(req(input), retry);
    assert.equal(retry.statusCode, 200);
    assert.deepEqual(retry.body, first.body);
    assert.equal(db.state.insertCount, 1);
    const changed = response();
    await submit(
      req({ ...input, girlhoodResponse: "Different contribution" }),
      changed,
    );
    assert.equal(changed.statusCode, 409);
    process.env.GIRLHOOD_SUBMISSIONS_OPEN = "false";
    const recovery = response();
    await submit(
      req({
        requestToken: input.requestToken,
        recoverOnly: true,
        language: "fr",
      }),
      recovery,
    );
    assert.deepEqual(recovery.body, first.body);
    assert.equal(db.state.insertCount, 1);
    const unknown = response();
    await submit(
      req({ requestToken: "b".repeat(64), recoverOnly: true }),
      unknown,
    );
    assert.equal(unknown.statusCode, 404);
    const invalid = response();
    await submit(req({ ...input, requestToken: "short" }), invalid);
    assert.equal(invalid.statusCode, 400);
    const wrong = response();
    await withdraw(
      req({
        publicReference: first.body.publicReference,
        withdrawalCode: "wrong",
      }),
      wrong,
    );
    assert.equal(wrong.statusCode, 400);
    const removed = response();
    await withdraw(
      req({
        publicReference: first.body.publicReference,
        withdrawalCode: first.body.withdrawalCode,
      }),
      removed,
    );
    assert.equal(removed.statusCode, 200);
    const afterWithdrawal = response();
    await submit(
      req({ requestToken: input.requestToken, recoverOnly: true }),
      afterWithdrawal,
    );
    assert.equal(afterWithdrawal.body.withdrawn, true);
    assert.equal(db.state.insertCount, 1);
    db.state.rateLimited = true;
    const limited = response();
    await submit(req(input), limited);
    assert.equal(limited.statusCode, 429);
    assert.equal(limited.headers["Retry-After"], "900");
  } finally {
    db.restore();
  }
});
test("concurrent insert conflict recovers the committed row and stable private credentials", async () => {
  const db = setup();
  try {
    db.state.collision = true;
    const result = response();
    await submit(req(input), result);
    assert.equal(result.statusCode, 200);
    assert.equal(db.state.insertCount, 1);
    assert.equal(
      result.body.withdrawalCode,
      receiptCredentials(input.requestToken).withdrawalCode,
    );
    assert.notEqual(
      receiptCredentials("b".repeat(64)).withdrawalCode,
      result.body.withdrawalCode,
    );
  } finally {
    db.restore();
  }
});
test("newsletter hides membership, bounds input, limits abuse and conceals database errors", async () => {
  const db = setup();
  try {
    const first = response();
    await subscribe(req({ email: "reader@example.org" }), first);
    db.state.subscriberDuplicate = true;
    const duplicate = response();
    await subscribe(req({ email: "reader@example.org" }), duplicate);
    assert.equal(first.statusCode, 200);
    assert.equal(duplicate.statusCode, 200);
    assert.deepEqual(duplicate.body, first.body);
    assert.equal(first.headers["Cache-Control"], "no-store");
    db.state.subscriberFailure = true;
    const failed = response();
    await subscribe(req({ email: "reader@example.org" }), failed);
    assert.equal(failed.statusCode, 503);
    assert.doesNotMatch(JSON.stringify(failed.body), /PRIVATE DATABASE DETAIL/);
    db.state.rateLimited = true;
    const count = db.state.subscribeCount;
    const limited = response();
    await subscribe(req({ email: "reader@example.org" }), limited);
    assert.equal(limited.statusCode, 429);
    assert.equal(db.state.subscribeCount, count);
    const invalid = response();
    await subscribe(req({ email: "a".repeat(255) + "@example.org" }), invalid);
    assert.equal(invalid.statusCode, 400);
  } finally {
    db.restore();
  }
});
test("maintenance endpoint fails closed without its secret", async () => {
  delete process.env.CRON_SECRET;
  const r = response();
  await maintenance({ method: "GET", headers: {} } as any, r);
  assert.equal(r.statusCode, 401);
});
