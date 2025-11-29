import { apiClient as api } from "./api";

export interface SystemStats {
  users: {
    total: number;
    active: number;
    newLast7Days: number;
  };
  content: {
    quizzes: number;
    flashcards: number;
    studyMaterials: number;
  };
  engagement: {
    totalAttempts: number;
    attemptsLast7Days: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  schoolName?: string;
  grade?: string;
  createdAt: string;
  _count?: {
    quizzes: number;
    flashcardSets: number;
    attempts: number;
  };
}

export interface UserFilter {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const adminService = {
  getSystemStats: async (): Promise<SystemStats> => {
    const response = await api.get("/admin/stats");
    return response.data;
  },

  getUsers: async (filter: UserFilter) => {
    const response = await api.get("/admin/users", { params: filter });
    return response.data;
  },

  getUserDetails: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId: string, isActive: boolean) => {
    const response = await api.patch(`/admin/users/${userId}/status`, {
      isActive,
    });
    return response.data;
  },

  updateUserRole: async (userId: string, role: string) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getAllContent: async (filter: any) => {
    const response = await api.get("/admin/content", { params: filter });
    return response.data;
  },
};
