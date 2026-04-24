import { useQuery } from "@tanstack/react-query";
import { advocateService } from "@/services/advocate.service";
import { clientService } from "@/services/client.service";
import type { SearchFilters } from "@/types/law-firm";

export function useCases(params: {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
  type?: string;
  stage?: string;
  status?: string;
  query?: string;
}) {
  return useQuery({
    queryKey: ["advocate-cases", params],
    queryFn: () => advocateService.getCases(params),
  });
}

export function useSearchCases(filters: SearchFilters, enabled = false) {
  return useQuery({
    queryKey: ["search-cases", filters],
    queryFn: () => advocateService.searchCases(filters),
    enabled,
  });
}

export function useCaseDetail(id: string) {
  return useQuery({
    queryKey: ["case-detail", id],
    queryFn: () => advocateService.getCaseById(id),
    enabled: !!id,
  });
}

export function useClientCases() {
  return useQuery({
    queryKey: ["client-cases"],
    queryFn: () => clientService.getMyCases(),
  });
}
