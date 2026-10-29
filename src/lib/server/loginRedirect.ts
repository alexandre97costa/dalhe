// Where to send the user after the magic link, set by the login action from `?redirectTo=`.
export const LOGIN_REDIRECT_COOKIE = 'login_redirect';

// Only same-site paths: "/connect/x" yes, "//evil.example", "/\evil.example" or "https://…" no.
export function safeRedirectPath(path: string | null | undefined): string | null {
	if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
		return null;
	}
	return path;
}
