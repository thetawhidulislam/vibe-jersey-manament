"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useEntries<T extends { id: string }>(endpoint: string) {
  const queryClient = useQueryClient();
  const query = useQuery<T[]>({ queryKey: [endpoint], queryFn: async () => {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to load entries");
    return response.json();
  }});
  const mutation = useMutation({
    mutationFn: async ({ id, values }: { id?: string; values?: Record<string, unknown> }) => {
      const response = await fetch(id ? `${endpoint}/${id}` : endpoint, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Could not save entry");
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" }); if (!response.ok) throw new Error("Could not delete entry"); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
  });
  return { ...query, save: mutation.mutateAsync, remove: deleteMutation.mutateAsync };
}