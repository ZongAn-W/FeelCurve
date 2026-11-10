import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/health/route";

type HealthBody = {
  status: string;
  timestamp: string;
  uptime: number;
};

test("health route returns ok with only the public fields", async () => {
  const response = GET();

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^application\/json/,
  );
  assert.equal(response.headers.get("cache-control"), "no-store");

  const body = (await response.json()) as HealthBody;
  assert.deepEqual(Object.keys(body).sort(), [
    "status",
    "timestamp",
    "uptime",
  ]);
  assert.equal(body.status, "ok");
  assert.equal(new Date(body.timestamp).toISOString(), body.timestamp);
  assert.equal(Number.isInteger(body.uptime), true);
  assert.ok(body.uptime >= 0);
});
