import { useEffect, useState } from 'react';
import { ChevronDown, LockKeyhole, LogOut, RefreshCw } from 'lucide-react';
import { clearHiveAccount, getStoredHiveAccount, storeHiveAccount } from '../lib/hive-session';
import HiveLogin from './HiveLogin';
import ProofForm from './ProofForm';

export default function CreateProofPage() {
	const [account, setAccount] = useState('');
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);

	useEffect(() => {
		setAccount(getStoredHiveAccount());
	}, []);

	function handleConnected(nextAccount: string) {
		storeHiveAccount(nextAccount);
		setAccount(nextAccount);
	}

	function handleDisconnected() {
		clearHiveAccount();
		setAccount('');
		setAccountMenuOpen(false);
	}

	return <>
		<header className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between border-b border-ocean/10 bg-white px-5 sm:px-8 lg:px-10"><a href="/" className="flex items-center gap-3 text-sm font-bold tracking-tight text-ink"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ocean text-white"><span className="h-3 w-3 rounded-full border-2 border-gold" /></span> Proof Existence</a><nav className="flex items-center gap-2 text-sm font-semibold text-ink-muted"><a href="/" className="rounded-lg px-3 py-2 transition hover:bg-aqua-50 hover:text-ink">Inicio</a><a href="/#verificar" className="hidden rounded-lg px-3 py-2 transition hover:bg-aqua-50 hover:text-ink sm:block">Verificar TXID</a>{account && <div className="relative ml-2"><button type="button" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)} className="inline-flex min-h-10 items-center gap-2 border border-mint/30 bg-[#f5faf7] px-4 text-sm font-bold text-mint transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/20">@{account}<ChevronDown size={16} /></button>{accountMenuOpen && <div role="menu" className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-ocean/15 bg-white p-1.5 shadow-[0_16px_40px_rgba(18,43,52,0.14)]"><button type="button" role="menuitem" onClick={handleDisconnected} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-ink-muted transition hover:bg-aqua-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/20"><RefreshCw size={15} /> Cambiar cuenta</button><button type="button" role="menuitem" onClick={handleDisconnected} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-ink-muted transition hover:bg-aqua-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/20"><LogOut size={15} /> Salir</button></div>}</div>}</nav></header>
		<main className="px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:px-10"><div className="mx-auto mb-10 max-w-5xl"><p className="eyebrow text-ocean">Nueva prueba</p><h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-ink sm:text-6xl">Prepara una evidencia para firmar.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Primero conecta tu cuenta Hive. Después podrás subir el documento, calcular su hash y revisar el JSON antes de publicarlo.</p></div><div className="mx-auto max-w-5xl">{!account && <HiveLogin onConnected={handleConnected} />}{account ? <div className="mt-8"><ProofForm account={account} /></div> : <div className="mt-8 flex min-h-40 items-center justify-center rounded-[1.75rem] border border-dashed border-ocean/20 bg-white/45 p-8 text-center"><div><div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-aqua-100 text-ocean"><LockKeyhole size={20} /></div><p className="mt-4 text-sm font-semibold text-ink">El formulario aparecerá después de conectar Hive.</p><p className="mt-1 text-xs text-ink-muted">Así la prueba siempre queda asociada a una cuenta que puede firmarla.</p></div></div>}</div></main>
	</>;
}
