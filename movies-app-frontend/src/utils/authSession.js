const TOKEN_KEY = "token";
const USER_KEY = "user";
const FULL_NAME_KEY = "fullName";
const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";

/**
 * Keeps auth-related browser storage access in one place.
 * This avoids repeating raw localStorage/sessionStorage calls across API clients.
 */
export function readStoredSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    const fullName = localStorage.getItem(FULL_NAME_KEY);

    return {
        token,
        user,
        fullName,
        isAuthenticated: Boolean(token && user),
    };
}

/**
 * Persists the backend auth payload after a successful login.
 */
export function persistSession({ token, userName, fullName }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, userName);
    localStorage.setItem(FULL_NAME_KEY, fullName ?? "");
}

/**
 * Clears only the keys owned by the auth flow.
 */
export function clearStoredSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(FULL_NAME_KEY);
}

/**
 * Saves the current route so users can continue where they left off after logging in.
 */
export function saveRedirectAfterLogin(pathname) {
    sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, pathname);
}

export function readToken() {
    return localStorage.getItem(TOKEN_KEY);
}
