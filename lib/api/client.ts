import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type { ApiError } from "@/types/api";
import {
  clearAuth,
  getToken,
  setStoredUser,
  setToken,
} from "@/lib/auth/tokens";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<string> | null = null;

const SKIP_AUTH = ["/auth/login", "/auth/refresh"];

function shouldSkipAuth(url: string | undefined) {
  if (!url) return false;
  return SKIP_AUTH.some((path) => url.includes(path));
}

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (shouldSkipAuth(config.url)) return config;

  if (!config.headers.Authorization) {
    const token = getToken();
    if (token) {
      config.headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    }
  }
  return config;
});

async function refreshAccessToken(): Promise<string> {
  const { data } = await axios.post<{ access_token: string; user?: unknown }>(
    `${baseURL}/auth/refresh`,
    {},
    { headers: { Authorization: getToken() ?? "" } }
  );
  if (!data?.access_token) {
    throw new Error("No access token returned by /auth/refresh");
  }
  setToken(data.access_token);
  if (data.user) setStoredUser(data.user);
  return data.access_token;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (!originalRequest || shouldSkipAuth(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        refreshInFlight ??= refreshAccessToken().finally(() => {
          refreshInFlight = null;
        });
        const newToken = await refreshInFlight;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function normalizeApiError(error: unknown): ApiError {
  const apiError: ApiError = {
    message: "Ha ocurrido un error",
    status: null,
    data: null,
  };

  if (axios.isAxiosError(error)) {
    if (error.response) {
      apiError.status = error.response.status;
      apiError.data = error.response.data;
      const responseMessage =
        (error.response.data as { message?: string } | undefined)?.message;
      apiError.message = responseMessage ?? `Error ${error.response.status}`;
    } else if (error.request) {
      apiError.message =
        "Error de conexión. Verifica tu conexión a internet.";
    } else {
      apiError.message = error.message || "Error desconocido";
    }
    return apiError;
  }

  if (error instanceof Error) {
    apiError.message = error.message;
    return apiError;
  }

  return apiError;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const { data } = await api.get<T>(url, config);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const { data } = await api.post<T>(url, body, config);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function apiPut<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const { data } = await api.put<T>(url, body, config);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const { data } = await api.patch<T>(url, body, config);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const { data } = await api.delete<T>(url, config);
    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
