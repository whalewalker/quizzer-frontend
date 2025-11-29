import { apiClient } from "./api";
import { AUTH_ENDPOINTS } from "../config/api";
import type { AuthResponse, User } from "../types";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase.config";

export const authService = {
  // Email/password login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(AUTH_ENDPOINTS.LOGIN, {
      email,
      password,
    });
    return response.data;
  },

  // Email/password signup
  signup: async (
    email: string,
    password: string,
    name: string,
    schoolName: string
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(AUTH_ENDPOINTS.SIGNUP, {
      email,
      password,
      name,
      schoolName,
    });
    return response.data;
  },

  // Google Sign-In
  googleSignIn: async (): Promise<AuthResponse> => {
    try {
      // Sign in with Google using Firebase
      const result = await signInWithPopup(auth, googleProvider);

      // Get the ID token
      const idToken = await result.user.getIdToken();

      // Send the token to backend for verification
      const response = await apiClient.post<AuthResponse>(
        AUTH_ENDPOINTS.GOOGLE_LOGIN,
        { idToken }
      );

      return response.data;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>(AUTH_ENDPOINTS.ME);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  },

  // Save auth data
  saveAuthData: (data: AuthResponse) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get stored token
  getStoredToken: (): string | null => {
    return localStorage.getItem("accessToken");
  },
};
