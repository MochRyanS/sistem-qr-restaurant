const AUTH_KEY = "sqr_admin_auth";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

export function login(username: string, password: string): boolean {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        if (typeof window !== "undefined") {
            localStorage.setItem(AUTH_KEY, "true");
        }
        return true;
    }
    return false;
}

export function logout(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_KEY);
    }
}

export function isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AUTH_KEY) === "true";
}