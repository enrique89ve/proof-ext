export const HIVE_ACCOUNT_MIN_LENGTH = 3;
export const HIVE_ACCOUNT_MAX_LENGTH = 16;
export const HIVE_ACCOUNT_PATTERN = /^[a-z][a-z0-9-]{1,14}[a-z0-9](\.[a-z][a-z0-9-]{1,14}[a-z0-9])*$/;

export function validateHiveAccount(value: string): string | null {
	const normalized = value.trim().toLowerCase();
	const byteLength = new TextEncoder().encode(normalized).byteLength;
	if (!normalized) return 'Escribe tu cuenta Hive.';
	if (byteLength < HIVE_ACCOUNT_MIN_LENGTH || byteLength > HIVE_ACCOUNT_MAX_LENGTH) return 'La cuenta Hive debe tener entre 3 y 16 caracteres.';
	if (!HIVE_ACCOUNT_PATTERN.test(normalized)) return 'Usa minúsculas, números y guiones; cada segmento debe comenzar con letra y terminar en letra o número.';
	return null;
}

export type HiveOperation = {
	type?: string;
	value?: {
		id?: string;
		json?: string;
		required_auths?: string[];
		required_posting_auths?: string[];
	};
};

export function isProofExtOperation(operation: HiveOperation): boolean {
	const isCustomJson = operation.type === 'custom_json_operation' || operation.type === 'custom_json';
	return isCustomJson && operation.value?.id === 'proof_ext';
}
