export const LIMITS = {
	title: 100,
	description: 280,
	content: 1500,
	originHash: 256,
	documentUrl: 512,
	extraUrl: 512,
	hiveCustomJsonBytes: 8192,
} as const;

export type ProofPayload = {
	version: string;
	type: string;
	algorithm: string;
	hash: string;
	title: string;
	description?: string;
	document_url: string;
	extra_url?: string;
	hash_origen?: string;
	hash_origen_algorithm?: string;
	app: string;
};

const hasOnlyStringValues = (value: Record<string, unknown>) =>
	Object.values(value).every((entry) => typeof entry === 'string');

export const countCharacters = (value: string) => Array.from(value).length;

export const countUtf8Bytes = (value: string) => new TextEncoder().encode(value).byteLength;

export function validateSafeUrl(value: string, maxLength: number): string | null {
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > maxLength || /[\u0000-\u001f\u007f\s]/.test(trimmed)) {
		return 'Introduce una URL válida sin espacios ni caracteres de control.';
	}

	try {
		const parsed = new URL(trimmed);
		const allowedProtocol = parsed.protocol === 'https:' || parsed.protocol === 'ipfs:';
		if (!allowedProtocol || parsed.username || parsed.password) {
			return 'Solo aceptamos enlaces HTTPS o IPFS seguros.';
		}
		if (parsed.protocol === 'https:' && !parsed.hostname) {
			return 'El enlace HTTPS debe incluir un dominio válido.';
		}
		if (parsed.protocol === 'ipfs:' && !parsed.hostname && !parsed.pathname) {
			return 'El enlace IPFS debe incluir un CID.';
		}
		return null;
	} catch {
		return 'Introduce una URL válida.';
	}
}

export function validateProofPayload(payload: Record<string, unknown>): string[] {
	const errors: string[] = [];
	if (!hasOnlyStringValues(payload)) errors.push('Todos los valores deben ser strings.');
	if (typeof payload.title !== 'string' || !payload.title.trim()) errors.push('El título es obligatorio.');
	if (typeof payload.hash !== 'string' || !/^[a-f0-9]{64}$/i.test(payload.hash)) errors.push('El hash SHA-256 no es válido.');
	if (typeof payload.document_url !== 'string' || validateSafeUrl(payload.document_url, LIMITS.documentUrl)) errors.push('La URL del documento no es válida.');
	if (typeof payload.description === 'string' && countCharacters(payload.description) > LIMITS.description) errors.push('La descripción supera el límite.');
	if (typeof payload.hash_origen === 'string' && countCharacters(payload.hash_origen) > LIMITS.originHash) errors.push('El hash de origen supera el límite.');
	if (countUtf8Bytes(JSON.stringify(payload)) > LIMITS.hiveCustomJsonBytes) errors.push('El JSON supera los 8 KB permitidos para custom_json en Hive.');
	return errors;
}
