const USER_KEY = "user";
const FULL_NAME_KEY = "fullName";
const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";
const AUTH_ROUTE_PATHS = new Set(["/login", "/signup"]);

/**
 * Normalizes a pathname to ensure it starts with a leading slash and is not empty.
 * Returns null for invalid or empty pathnames.
 */
function normalizePath(pathname) {
    if (typeof pathname !== "string") {
        return null;
    }
    const trimmedPath = pathname.trim();
    if (!trimmedPath) {
        return null;
    }
    return trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
}

/**
 * Checks if a given pathname is allowed for redirect after login.
 * Disallows redirecting to login or signup pages, to prevent redirect loops.
 */
function isAllowedRedirectPath(pathname) {
    const normalizedPath = normalizePath(pathname);
    return Boolean(normalizedPath) && !AUTH_ROUTE_PATHS.has(normalizedPath.split("?")[0]);
}

/**
 * Keeps auth-related browser storage access in one place.
 * Only non-sensitive identity fields stay in localStorage now.
 * The JWT itself lives in an HttpOnly cookie managed by the backend.
 */
export function readStoredSession() {
    const user = localStorage.getItem(USER_KEY);
    const fullName = localStorage.getItem(FULL_NAME_KEY);

    return {
        token: null,
        user,
        fullName,
        isAuthenticated: Boolean(user),
    };
}

/**
 * Persists only the user identity after a successful login.
 * We explicitly remove any legacy token value so old localStorage sessions migrate cleanly.
 */
export function persistSession({ userName, fullName }) {
    localStorage.removeItem("token");
    localStorage.setItem(USER_KEY, userName);
    localStorage.setItem(FULL_NAME_KEY, fullName ?? "");
}

/**
 * Clears only the keys owned by the auth flow.
 */
export function clearStoredSession() {
    localStorage.removeItem("token");
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(FULL_NAME_KEY);
}

/**
 * Saves the current route so users can continue where they left off after logging in.
 */
export function saveRedirectAfterLogin(pathname) {
    if (!isAllowedRedirectPath(pathname)) {
        sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
        return;
    }

    sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, normalizePath(pathname));
}

/**
 * Reads and clears the pending post-login redirect path.
 * Returns null when no redirect is waiting.
 */
export function consumeRedirectAfterLogin() {
    const redirectPath = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
    sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);

    return isAllowedRedirectPath(redirectPath) ? normalizePath(redirectPath) : null;
}

export function readToken() {
    return null;
}