import test from "node:test";
import assert from "node:assert/strict";
import { createApiClient } from "../src/services/api.js";

function fakeFetch() {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ ok: true }) };
  };
  return { calls, fetchImpl };
}

test("API client keeps endpoint URLs behind the service boundary", async () => {
  const { calls, fetchImpl } = fakeFetch();
  const api = createApiClient({ baseUrl: "https://parliament.example/api", fetchImpl });

  await api.getDashboard();
  await api.ask("What changed?", "parliament");
  await api.searchEvidence({ query: "e-ID", level: "federal" });
  await api.getCalendar("2026-09-01", "2026-09-30", "all");

  assert.equal(calls[0].url, "https://parliament.example/api/dashboard");
  assert.equal(calls[1].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[1].options.body), { question: "What changed?", scope: "parliament" });
  assert.match(calls[2].url, /\/search\/evidence\?query=e-ID&level=federal/);
  assert.match(calls[3].url, /\/calendar\?from=2026-09-01&to=2026-09-30&level=all/);
});

test("API client surfaces non-2xx responses for the UI error state", async () => {
  const api = createApiClient({ fetchImpl: async () => ({ ok: false, status: 503 }) });
  await assert.rejects(() => api.getDashboard(), /API request failed: 503/);
});
