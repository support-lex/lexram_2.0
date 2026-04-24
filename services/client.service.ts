import api from "./api";
import type { Case, Deadline } from "@/types/law-firm";

export const clientService = {
  async getMyCases(): Promise<Case[]> {
    const { data } = await api.get<Case[]>("/client/cases");
    return data;
  },

  async getUpcomingHearings(): Promise<Deadline[]> {
    const { data } = await api.get<Deadline[]>("/client/hearings");
    return data;
  },
};
