import { useCallback, useEffect, useState } from "react";

export function useApiResource(loader, { enabled = true, initialData = null } = {}) {
  const [state, setState] = useState({ status: enabled ? "loading" : "success", data: initialData, error: null });

  const load = useCallback(() => {
    if (!enabled || !loader) {
      setState({ status: "success", data: initialData, error: null });
      return Promise.resolve(initialData);
    }
    setState(current => ({ ...current, status: "loading", error: null }));
    return loader().then(data => {
      setState({ status: "success", data, error: null });
      return data;
    }).catch(error => {
      setState(current => ({ ...current, status: "error", error }));
      return null;
    });
  }, [enabled, initialData, loader]);

  useEffect(() => { let active = true; load().then(() => { if (!active) return; }); return () => { active = false; }; }, [load]);
  return { ...state, retry: load };
}
