import PropTypes from "prop-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import {
  clearSession,
  getSession,
  persistSession
} from "@/lib/auth-storage";
import { API_BASE_URL } from "@/lib/api-client";

const AuthContext = createContext(null);
AuthContext.displayName = "AuthContext";

const VERIFY_TIMEOUT_MS = 4000;
const PROTECTED_PATH_PREFIXES = ["/client", "/freelancer", "/dashboard", "/admin"];
const SAVED_PROPOSAL_KEY = "markify:savedProposal";
const SAVED_PROPOSAL_SYNCED_KEY = "markify:savedProposalSynced";

const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(value);

const resolveRequestUrl = (target) => {
  if (!target) {
    throw new Error("authFetch requires a request URL.");
  }

  if (isAbsoluteUrl(target)) {
    return target;
  }

  if (!API_BASE_URL) {
    throw new Error(
      "API_BASE_URL is not configured. Provide a full URL or set VITE_API_BASE_URL."
    );
  }

  const normalizedBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const normalizedPath = target.startsWith("/") ? target : `/${target}`;

  return `${normalizedBase}${normalizedPath}`;
};

const profileEndpointConfig = import.meta.env.VITE_AUTH_PROFILE_ENDPOINT;
const PROFILE_ENDPOINT =
  typeof profileEndpointConfig === "string" &&
  ["false", "off", "disabled", "none"].includes(
    profileEndpointConfig.toLowerCase()
  )
    ? null
    : resolveRequestUrl(profileEndpointConfig || "/auth/profile");

const sessionFromStorage = () => {
  const session = getSession();
  return {
    user: session?.user ?? null,
    token: session?.accessToken ?? null
  };
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialSession = useMemo(sessionFromStorage, []);

  const [user, setUser] = useState(initialSession.user);
  const [token, setToken] = useState(initialSession.token);
  const [isLoading, setIsLoading] = useState(true);

  const syncSession = useCallback((nextSession) => {
    if (nextSession?.accessToken && nextSession?.user) {
      persistSession(nextSession);
      setToken(nextSession.accessToken);
      setUser(nextSession.user);
      return;
    }

    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    syncSession(null);
    toast.success("You have been logged out.");
    navigate("/login", { replace: true });
  }, [navigate, syncSession]);

  const authFetch = useCallback(
    async (target, options = {}) => {
      if (!token) {
        logout();
        throw new Error("No token found. Please log in again.");
      }

      const url = resolveRequestUrl(target);

      try {
        const defaultHeaders =
          options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" };

        const response = await fetch(url, {
          ...options,
          headers: {
            ...defaultHeaders,
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
          }
        });

        if (response.status === 401) {
          if (!options.skipLogoutOn401) {
            toast.error("Session expired. Please log in again.");
            logout();
          }
          const unauthorizedError = new Error("Unauthorized");
          unauthorizedError.code = 401;
          unauthorizedError.skipLogout = Boolean(options.skipLogoutOn401);
          throw unauthorizedError;
        }

        return response;
      } catch (error) {
        if (error.name === "AbortError") {
          console.warn("Auth fetch aborted:", error.message || "timeout");
          throw error;
        }

        if (error.code === 401 && error.skipLogout) {
          // Suppress toast/logout for caller-handled unauthorized cases.
          throw error;
        }
        console.error("Auth fetch failed:", error);
        toast.error("Network error. Please try again.");
        throw error;
      }
    },
    [token, logout]
  );

  const verifyUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (!PROFILE_ENDPOINT) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    try {
      const response = await authFetch(PROFILE_ENDPOINT, {
        signal: controller.signal
      });

      if (response.status === 404) {
        console.warn(
          "Profile endpoint returned 404. Skip verification until backend exposes /auth/profile."
        );
        return;
      }

      if (response.status >= 500) {
        console.warn("Profile endpoint returned a server error; skipping verification.");
        return;
      }

      if (!response.ok) {
        console.warn(`Profile verification failed with status ${response.status}.`);
        return;
      }

      const payload = await response.json().catch(() => null);
      const nextUser = payload?.data ?? payload ?? null;

      if (nextUser) {
        persistSession({ accessToken: token, user: nextUser });
        setUser(nextUser);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("User verification timed out.");
      } else if (error.message !== "Unauthorized") {
        console.error("User verification failed:", error);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [token, authFetch]);

  useEffect(() => {
    verifyUser();
  }, [verifyUser]);

  // NOTE: Automatic proposal sync has been DISABLED.
  // Proposals are now stored locally in drafts and only sent when user
  // explicitly clicks "Send Proposal" from the dashboard.
  // This prevents proposals from being automatically created/sent.
  
  // The old sync code has been removed to prevent any automatic sending.
  // Users must manually send proposals from the Client Dashboard.

  const login = useCallback(
    (userData, authToken) => {
      if (!authToken || !userData) {
        toast.error("Invalid login payload received.");
        return;
      }

      syncSession({
        user: userData,
        accessToken: authToken
      });
      setIsLoading(false);
    },
    [syncSession]
  );

  const authValue = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      authFetch,
      refreshUser: verifyUser,
      isAuthenticated: Boolean(user && token),
      isLoading
    }),
    [user, token, login, logout, authFetch, verifyUser, isLoading]
  );

  const shouldShowGlobalLoader =
    isLoading &&
    PROTECTED_PATH_PREFIXES.some((path) =>
      location.pathname?.startsWith(path)
    );

  return (
    <AuthContext.Provider value={authValue}>
      {shouldShowGlobalLoader ? (
        <div className="flex min-h-screen items-center justify-center">
          <span className="loading loading-spinner text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export { AuthContext };
