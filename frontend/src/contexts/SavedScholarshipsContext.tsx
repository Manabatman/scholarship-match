import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "./AuthContext";

interface SavedScholarshipsContextType {
  savedIds: Set<number>;
  isSaved: (id: number) => boolean;
  toggleSave: (id: number) => Promise<boolean>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SavedScholarshipsContext = createContext<SavedScholarshipsContextType | null>(null);

export function SavedScholarshipsProvider({ children }: { children: ReactNode }) {
  const { token: authToken } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchIds = useCallback(async () => {
    if (!authToken) {
      setSavedIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/saved-scholarships/ids", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { scholarship_ids?: number[] };
        setSavedIds(new Set(data.scholarship_ids ?? []));
      } else {
        setSavedIds(new Set());
      }
    } catch {
      setSavedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchIds();
  }, [fetchIds]);

  const isSaved = useCallback(
    (id: number) => savedIds.has(id),
    [savedIds]
  );

  const toggleSave = useCallback(
    async (id: number): Promise<boolean> => {
      if (!authToken) return false;
      const currentlySaved = savedIds.has(id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        if (currentlySaved) {
          const res = await apiFetch(`/api/v1/saved-scholarships/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (!res.ok) throw new Error("Failed to unsave");
          return false;
        } else {
          const res = await apiFetch("/api/v1/saved-scholarships", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ scholarship_id: id }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            if (res.status === 409) return true;
            throw new Error(data?.detail ?? "Failed to save");
          }
          return true;
        }
      } catch {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (currentlySaved) next.add(id);
          else next.delete(id);
          return next;
        });
        return currentlySaved;
      }
    },
    [authToken, savedIds]
  );

  return (
    <SavedScholarshipsContext.Provider
      value={{ savedIds, isSaved, toggleSave, loading, refresh: fetchIds }}
    >
      {children}
    </SavedScholarshipsContext.Provider>
  );
}

export function useSavedScholarships() {
  const ctx = useContext(SavedScholarshipsContext);
  if (!ctx) throw new Error("useSavedScholarships must be used within SavedScholarshipsProvider");
  return ctx;
}
