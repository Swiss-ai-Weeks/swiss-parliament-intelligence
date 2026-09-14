/**
 * Thin API boundary for the prototype. Screens can use the fixture provider
 * today and switch to this client when the backend endpoints are available.
 */
export function createApiClient({ baseUrl = "", fetchImpl = fetch } = {}) {
  async function request(path, options = {}) {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
  }

  return {
    getDashboard: () => request("/dashboard"),
    ask: (question, scope = "parliament") => request("/ask", { method: "POST", body: JSON.stringify({ question, scope }) }),
    getEvidence: id => request(`/evidence/${id}`),
    getDebate: id => request(`/debates/${id}`),
    getTranscript: id => request(`/debates/${id}/transcript`),
    searchEvidence: filters => request(`/search/evidence?${new URLSearchParams(filters)}`),
    getProposal: id => request(`/proposals/${id}`),
    getCalendar: (from, to, level = "all") => request(`/calendar?${new URLSearchParams({ from, to, level })}`),
    getAlerts: () => request("/me/alerts"),
    updateAlerts: alerts => request("/me/alerts", { method: "PATCH", body: JSON.stringify({ alerts }) }),
    parseFilters: prompt => request("/ai/parse-filters", { method: "POST", body: JSON.stringify({ prompt }) }),
    getPreferences: () => request("/me/preferences"),
    updatePreferences: preferences => request("/me/preferences", { method: "PATCH", body: JSON.stringify(preferences) }),
  };
}
