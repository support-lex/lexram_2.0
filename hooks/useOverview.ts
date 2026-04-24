import { useQuery } from "@tanstack/react-query";
import { advocateService } from "@/services/advocate.service";

export function useOverview() {
  return useQuery({
    queryKey: ["advocate-overview"],
    queryFn: () => advocateService.getOverview(),
  });
}
