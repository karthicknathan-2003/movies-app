const USER_KEY = "user";
const FULL_NAME_KEY = "fullName";
const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";

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
    sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, pathname);
}

/**
 * Reads and clears the pending post-login redirect path.
 * Returns null when no redirect is waiting.
 */
export function consumeRedirectAfterLogin() {
    const redirectPath = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
    if (redirectPath) {
        sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
    }
    return redirectPath;
}

export function readToken() {
    return null;
}