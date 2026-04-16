import { useQuery } from "@tanstack/react-query";
import { queryClient, getQueryFn } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
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
