/**
 * Thin API boundary for the prototype. Set VITE_API_BASE_URL to connect the
 * screens to the live parliamentary service; leave it unset to use fixtures.
 */
export function createApiClient({ baseUrl = import.meta.env?.VITE_API_BASE_URL || "", fetchImpl = fetch } = {}) {
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

export function getConfiguredApiClient() {
  const baseUrl = import.meta.env?.VITE_API_BASE_URL || "";
  return baseUrl ? createApiClient({ baseUrl }) : null;
}
