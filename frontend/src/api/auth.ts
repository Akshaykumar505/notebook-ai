import { apiRequest } from "./client";
import type { User } from "@/types";

interface AuthResponse {
  token: string;
  user: User;
}

export function signup(email: string, password: string, name: string) {
  return apiRequest<AuthResponse>("/auth/signup", {
    method: "POST",
    body: { email, password, name },
  });
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}
