import api from "./api";
import type { Case, Deadline, OverviewStats, PaginatedResponse, SearchFilters } from "@/types/law-firm";

export const advocateService = {
  async getOverview(): Promise<OverviewStats> {
    const { data } = await api.get<OverviewStats>("/advocate/overview");
    return data;
  },

  async getDeadlines(limit = 10): Promise<Deadline[]> {
    const { data } = await api.get<Deadline[]>("/advocate/deadlines", { params: { limit } });
    return data;
  },

  async getCases(params: {
    page?: number;
    pageSize?: number;
    sort?: string;
    order?: "asc" | "desc";
    type?: string;
    stage?: string;
    status?: string;
    query?: string;
  }): Promise<PaginatedResponse<Case>> {
    const { data } = await api.get<PaginatedResponse<Case>>("/advocate/cases", { params });
    return data;
  },

  async searchCases(filters: SearchFilters): Promise<Case[]> {
    const { data } = await api.get<Case[]>("/advocate/cases/search", { params: filters });
    return data;
  },

  async getCaseById(id: string): Promise<Case> {
    const { data } = await api.get<Case>(`/advocate/cases/${id}`);
    return data;
  },
};
