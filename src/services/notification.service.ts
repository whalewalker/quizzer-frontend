import { apiClient } from "./api";

export const notificationService = {
  async registerToken(token: string): Promise<void> {
    await apiClient.post("/notifications/register", { token });
  },

  async unregisterToken(token: string): Promise<void> {
    await apiClient.delete("/notifications/unregister", { data: { token } });
  },
};
