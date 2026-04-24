export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "FACULTY" | "STUDENT" | "SITE_SUPERVISOR" | string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
};

const SESSION_STORAGE_KEY = "cui_auth_session";

export async function postJson<T>(
  url: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: T | { message?: string; error?: string } }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export function saveSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function updateAccessToken(nextToken: string) {
  const current = getSession();
  if (!current) return;
  saveSession({
    ...current,
    accessToken: nextToken,
  });
}

type AuthFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export async function authFetch(path: string, options: AuthFetchOptions = {}) {
  const session = getSession();
  if (!session?.accessToken) {
    throw new Error("You are not authenticated. Please login again.");
  }

  const hasFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
  const baseHeaders: Record<string, string> = {
    ...(options.headers ?? {}),
  };
  if (!hasFormDataBody && !baseHeaders["Content-Type"]) {
    baseHeaders["Content-Type"] = "application/json";
  }

  const request = () =>
    fetch(path, {
      ...options,
      credentials: "include",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        ...baseHeaders,
      },
    });

  let response = await request();
  if (response.status !== 401) return response;

  const refreshResponse = await fetch("/api/auth/refresh-token", {
    method: "GET",
    credentials: "include",
  });

  if (!refreshResponse.ok) {
    clearSession();
    throw new Error("Session expired. Please login again.");
  }

  const refreshData = (await refreshResponse.json()) as { accessToken?: string };
  if (!refreshData.accessToken) {
    clearSession();
    throw new Error("Unable to refresh your session. Please login again.");
  }

  updateAccessToken(refreshData.accessToken);
  response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${refreshData.accessToken}`,
      ...baseHeaders,
    },
  });

  return response;
}

export async function authJson<T>(path: string, options: AuthFetchOptions = {}): Promise<T> {
  const response = await authFetch(path, options);
  const data = await response.json();
  if (!response.ok) {
    const errorData = data as { error?: string; message?: string };
    throw new Error(errorData.error || errorData.message || "Request failed");
  }
  return data as T;
}
