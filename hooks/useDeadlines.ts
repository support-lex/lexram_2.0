import { useQuery } from "@tanstack/react-query";
import { advocateService } from "@/services/advocate.service";
import { clientService } from "@/services/client.service";

export function useAdvocateDeadlines(limit = 10) {
  return useQuery({
    queryKey: ["advocate-deadlines", limit],
    queryFn: () => advocateService.getDeadlines(limit),
  });
}

export function useClientHearings() {
  return useQuery({
    queryKey: ["client-hearings"],
    queryFn: () => clientService.getUpcomingHearings(),
  });
}
