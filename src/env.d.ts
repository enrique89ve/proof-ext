type HiveKeychainResponse = {
	success?: boolean;
	result?: unknown;
	error?: string;
	message?: string;
};

type HiveKeychainApi = {
	requestHandshake(callback: () => void): void;
	requestSignBuffer(
		account: string | null,
		message: string,
		key: 'Posting' | 'Active' | 'Memo',
		callback: (response: HiveKeychainResponse) => void,
		rpc?: string | null,
		title?: string | null,
	): void;
	requestBroadcast(
		account: string,
		operations: unknown[],
		key: 'Posting' | 'Active',
		callback: (response: HiveKeychainResponse) => void,
		rpc?: string | null,
		title?: string | null,
	): void;
};

interface Window {
	hive_keychain?: HiveKeychainApi;
}
