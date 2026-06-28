import { supabase } from "@/integrations/supabase/client";

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://se7en-fit-api.onrender.com/api";
export const API_BASE_URL = RAW_API_BASE_URL.endsWith("/") ? RAW_API_BASE_URL.slice(0, -1) : RAW_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status = 0, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

function normalizePayload(payload: any) {
  if (payload?.item !== undefined) return payload.item;
  if (payload?.items !== undefined) return payload.items;
  if (payload?.data !== undefined) return payload.data;
  return payload;
}

export async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const body = options.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body && !isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: body && !isFormData && typeof body !== "string" ? JSON.stringify(body) : body,
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new ApiError("Production API returned an invalid response.", response.status, text.slice(0, 300));
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok || payload?.success === false) throw new ApiError(payload?.error || payload?.message || "Request failed", response.status, payload);
  return normalizePayload(payload) as T;
}

const json = (payload: unknown) => JSON.stringify(payload);

export const adminApi = {
  dashboard: () => apiRequest("/admin/dashboard"),
  users: () => apiRequest("/admin/users"),
  user: (id: string) => apiRequest(`/admin/users/${id}`),
  updateUserStatus: (id: string, status: string) => apiRequest(`/admin/users/${id}/status`, { method: "PATCH", body: json({ status }) }),
  updateUserRole: (id: string, role: string) => apiRequest(`/admin/users/${id}/role`, { method: "PATCH", body: json({ role }) }),
  gyms: () => apiRequest("/admin/gyms"),
  gymOwners: () => apiRequest("/admin/gym-owners"),
  memberships: () => apiRequest("/admin/memberships"),
  leads: () => apiRequest("/admin/leads"),
  attendance: () => apiRequest("/admin/attendance"),
  updateGymStatus: (gymId: string, status: string) => apiRequest(`/admin/gyms/${gymId}/status`, { method: "PATCH", body: json({ status }) }),
  advertisements: () => apiRequest("/admin/advertisements"),
  createAdvertisement: (payload: unknown) => apiRequest("/admin/advertisements", { method: "POST", body: json(payload) }),
  updateAdvertisement: (id: string, payload: unknown) => apiRequest(`/admin/advertisements/${id}`, { method: "PATCH", body: json(payload) }),
  deleteAdvertisement: (id: string) => apiRequest(`/admin/advertisements/${id}`, { method: "DELETE" }),
  communityPosts: () => apiRequest("/admin/community/posts"),
  moderateCommunityPost: (id: string, payload: unknown) => apiRequest(`/admin/community/posts/${id}/moderate`, { method: "PATCH", body: json(payload) }),
  supportTickets: () => apiRequest("/admin/support/tickets"),
  updateSupportTicket: (id: string, payload: unknown) => apiRequest(`/admin/support/tickets/${id}`, { method: "PATCH", body: json(payload) }),
  notifications: () => apiRequest("/admin/notifications"),
  createNotification: (payload: unknown) => apiRequest("/admin/notifications", { method: "POST", body: json(payload) }),
  settings: () => apiRequest("/admin/settings"),
  updateSetting: (key: string, payload: unknown) => apiRequest(`/admin/settings/${key}`, { method: "PATCH", body: json(payload) }),
  logs: () => apiRequest("/admin/logs"),
};
