import { useEffect, useState } from 'react';
import { KeyRound, ShieldAlert, WalletCards } from 'lucide-react';
import { HIVE_ACCOUNT_MAX_LENGTH, HIVE_ACCOUNT_MIN_LENGTH, HIVE_ACCOUNT_PATTERN, validateHiveAccount } from '../lib/hive-proof';

type LoginState = 'checking' | 'idle' | 'loading' | 'connected' | 'error';

type Props = {
	onConnected: (account: string) => void;
};

export default function HiveLogin({ onConnected }: Props) {
	const [username, setUsername] = useState('');
	const [state, setState] = useState<LoginState>('checking');
	const [message, setMessage] = useState('');
	const accountError = username ? validateHiveAccount(username) : null;

	useEffect(() => {
		const checkKeychain = () => setState(window.hive_keychain ? 'idle' : 'error');
		checkKeychain();
		const timer = window.setTimeout(checkKeychain, 450);
		return () => window.clearTimeout(timer);
	}, []);

	function connect() {
		const nextAccount = username.trim().toLowerCase();
		const validationError = validateHiveAccount(nextAccount);
		if (validationError) {
			setMessage(validationError);
			setState('error');
			return;
		}
		const keychain = window.hive_keychain;
		if (!keychain) {
			setMessage('Instala Hive Keychain para continuar.');
			setState('error');
			return;
		}

		setState('loading');
		setMessage('Confirma la firma de acceso en Keychain.');
		keychain.requestHandshake(() => {
			const signMessage = `Proof Existence login · ${nextAccount} · ${new Date().toISOString()}`;
			keychain.requestSignBuffer(nextAccount, signMessage, 'Posting', (response) => {
				if (response.success) {
					setState('connected');
					setMessage('Cuenta conectada. La prueba se firmará con tu autoridad posting.');
					onConnected(nextAccount);
					return;
				}
				setState('error');
				setMessage(response.error ?? response.message ?? 'La firma fue cancelada.');
			});
		});
	}

	return <section className="rounded-[1.75rem] border border-ocean/15 bg-white/85 p-6 shadow-[0_20px_70px_rgba(36,66,74,0.08)] sm:p-8">
		<div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-aqua-100 text-ocean"><WalletCards size={22} /></div><div><p className="eyebrow text-ocean">Acceso necesario</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">Conecta tu cuenta Hive</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Keychain mantiene tus claves fuera de Proof Existence. Solo te pediremos una firma para confirmar que controlas la cuenta.</p></div></div>
		<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start"><div className="min-w-0 flex-1"><label className="sr-only" htmlFor="hive-username">Nombre de cuenta Hive</label><input id="hive-username" aria-label="Nombre de cuenta Hive" aria-describedby="hive-username-help" aria-invalid={Boolean(accountError)} value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} autoComplete="username" autoCapitalize="none" spellCheck={false} inputMode="text" minLength={HIVE_ACCOUNT_MIN_LENGTH} maxLength={HIVE_ACCOUNT_MAX_LENGTH} pattern={HIVE_ACCOUNT_PATTERN.source} className="min-h-12 w-full min-w-0 rounded-xl border border-ocean/15 bg-aqua-50 px-4 text-sm text-ink outline-none transition hover:border-ocean/35 focus:border-ocean focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/10" placeholder="tu-cuenta-hive" /><p id="hive-username-help" className={`mt-1 text-xs ${accountError ? 'text-red-700' : 'text-ink-muted'}`}>{accountError ?? `${username.length} / ${HIVE_ACCOUNT_MAX_LENGTH} caracteres · minúsculas, números, guiones y puntos`}</p></div><button type="button" onClick={connect} disabled={state === 'checking' || state === 'loading'} className="inline-flex h-12 w-full shrink-0 self-start items-center justify-center gap-2 rounded-xl bg-ocean px-5 text-sm font-bold text-white transition hover:bg-ocean-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/25 disabled:cursor-wait disabled:opacity-60 sm:w-auto">{state === 'loading' ? 'Esperando Keychain...' : 'Conectar con Hive'} <KeyRound size={17} /></button></div>
		{state === 'error' && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><ShieldAlert size={18} className="shrink-0" /><span>{message || 'Hive Keychain no está disponible.'} <a className="font-semibold underline" href="https://hive-keychain.com" target="_blank" rel="noopener noreferrer">Descargar Keychain</a></span></div>}
		{state === 'idle' && <p className="mt-4 text-xs text-ink-muted">Necesitas tener la extensión Hive Keychain instalada en tu navegador.</p>}
	</section>;
}
