import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { ROUTE_SLUGS } from "@shared/i18n-routes";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

const PRIVATE_PAGE_KEYS = ["crm", "login", "myAccount", "onboarding"] as const;

const PRIVATE_SLUGS: ReadonlySet<string> = new Set(
  PRIVATE_PAGE_KEYS.flatMap((key) => Object.values(ROUTE_SLUGS[key])),
);

export function isPrivateAreaPath(pathname: string): boolean {
  return pathname
    .split("/")
    .filter(Boolean)
    .some((segment) => PRIVATE_SLUGS.has(segment));
}

export function useAuth() {
  const [location] = useLocation();
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    enabled: isPrivateAreaPath(location),
  });

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const data = await response.json();
      
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      
      // Redirect to OIDC logout endpoint to properly end Replit session
      // Validate redirect is same-origin to prevent open redirect attacks
      if (data.redirectUrl) {
        try {
          const url = new URL(data.redirectUrl, window.location.origin);
          window.location.href = url.origin === window.location.origin
            ? data.redirectUrl
            : "/";
        } catch {
          window.location.href = "/";
        }
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Logout error:", error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
