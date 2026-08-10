const HIVE_SESSION_STORAGE_KEY = 'proof-existence:hive-session';
const HIVE_ACCOUNT_PATTERN = /^[a-z0-9.-]{3,16}$/;

export function normalizeHiveAccount(value: string): string {
	return value.trim().toLowerCase();
}

export function isValidHiveAccount(value: string): boolean {
	return HIVE_ACCOUNT_PATTERN.test(normalizeHiveAccount(value));
}

export function getStoredHiveAccount(): string {
	if (typeof window === 'undefined') return '';

	try {
		const storedAccount = window.localStorage.getItem(HIVE_SESSION_STORAGE_KEY) ?? '';
		return isValidHiveAccount(storedAccount) ? normalizeHiveAccount(storedAccount) : '';
	} catch {
		return '';
	}
}

export function storeHiveAccount(account: string): void {
	const normalizedAccount = normalizeHiveAccount(account);
	if (!isValidHiveAccount(normalizedAccount) || typeof window === 'undefined') return;

	try {
		window.localStorage.setItem(HIVE_SESSION_STORAGE_KEY, normalizedAccount);
	} catch {
		// localStorage puede estar bloqueado por el navegador.
	}
}

export function clearHiveAccount(): void {
	if (typeof window === 'undefined') return;

	try {
		window.localStorage.removeItem(HIVE_SESSION_STORAGE_KEY);
	} catch {
		// localStorage puede estar bloqueado por el navegador.
	}
}
