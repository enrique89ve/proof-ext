import { useState } from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2, Search, ShieldAlert } from 'lucide-react';
import { isProofExtOperation, type HiveOperation } from '../lib/hive-proof';

type VerifyState = 'idle' | 'loading' | 'found' | 'error';

type HiveResult = { transaction_id?: string; block_num?: number; expiration?: string; operations?: HiveOperation[] };

export default function VerifyForm() {
	const [txid, setTxid] = useState('');
	const [state, setState] = useState<VerifyState>('idle');
	const [message, setMessage] = useState('');
	const [result, setResult] = useState<HiveResult | null>(null);
	const [proofOperation, setProofOperation] = useState<HiveOperation | null>(null);
	const [proofPayload, setProofPayload] = useState<Record<string, string> | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	async function handleSubmit(event: { preventDefault(): void }) {
		event.preventDefault();
		setState('loading');
		setMessage('');
		setResult(null);
		setProofOperation(null);
		setProofPayload(null);
		setIsDetailsOpen(false);
		const normalizedTxid = txid.trim();
		if (!/^[a-f0-9]{40}$/i.test(normalizedTxid)) {
			setMessage('Introduce un TXID de Hive válido de 40 caracteres hexadecimales.');
			setState('error');
			return;
		}
		try {
			const response = await fetch('https://api.hive.blog', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'account_history_api.get_transaction', params: { id: normalizedTxid, include_reversible: true }, id: 1 }) });
			const body = await response.json() as { result?: HiveResult; error?: { message?: string } };
			if (!response.ok || !body.result) throw new Error(body.error?.message ?? 'No encontramos esa transacción.');
			const proofOperation = body.result.operations?.find(isProofExtOperation);
			if (!proofOperation) throw new Error('La transacción existe, pero no contiene una prueba proof_ext.');
			let parsedPayload: Record<string, string> | null = null;
			try {
				const candidate = JSON.parse(proofOperation.value?.json ?? '') as unknown;
				if (candidate && typeof candidate === 'object' && !Array.isArray(candidate) && Object.values(candidate).every((value) => typeof value === 'string')) parsedPayload = candidate as Record<string, string>;
			} catch {
				parsedPayload = null;
			}
			setResult(body.result);
			setProofOperation(proofOperation);
			setProofPayload(parsedPayload);
			setMessage('Prueba proof_ext encontrada en Hive.');
			setState('found');
			setIsDetailsOpen(true);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : 'No pudimos consultar Hive.');
			setState('error');
		}
	}

	return <div className="rounded-[1.75rem] border border-ocean/10 bg-white/80 p-6 shadow-[0_20px_70px_rgba(36,66,74,0.08)] sm:p-8">
		<div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-ocean">Paso 02 · comprobar</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">Verifica una prueba</h3></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-aqua-100 text-ocean"><Search size={20} /></div></div>
		<p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">Consulta la transacción directamente en Hive. No necesitas conectar tu wallet para verificar.</p>
		<form onSubmit={handleSubmit} aria-busy={state === 'loading'} aria-invalid={state === 'error'} className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="txid">TXID de Hive</label><input id="txid" aria-label="TXID de Hive" value={txid} onChange={(event) => setTxid(event.target.value)} className="min-h-12 min-w-0 flex-1 rounded-xl border border-ocean/15 bg-aqua-50 px-4 font-mono text-sm text-ink outline-none transition hover:border-ocean/35 focus:border-ocean focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/10" placeholder="Pega aquí el TXID de Hive" /><button disabled={state === 'loading'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-ocean-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/25 disabled:opacity-60">{state === 'loading' ? 'Consultando...' : 'Verificar'} <ArrowUpRight size={17} /></button></form>
		{message && <div role="status" className={`mt-5 rounded-2xl border p-4 text-sm ${state === 'found' ? 'border-mint/25 bg-[#eff8f3] text-mint' : 'border-red-200 bg-red-50 text-red-800'}`}><div className="flex items-center gap-2 font-semibold">{state === 'found' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />} {message}</div>{result && state === 'found' && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-mint/20 pt-3"><span className="text-xs text-ink-muted">Bloque {result.block_num} · TXID verificado</span><button type="button" onClick={() => setIsDetailsOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mint/30 px-3 text-xs font-bold text-mint transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/20">Ver información completa <ArrowUpRight size={15} /></button></div>}</div>}
		{state === 'error' && <div className="sr-only" role="alert"><AlertCircle /> {message}</div>}
		{isDetailsOpen && result && proofOperation && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsDetailsOpen(false); }}><div role="dialog" aria-modal="true" aria-labelledby="verification-details-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ocean/15 bg-white p-6 shadow-[0_24px_80px_rgba(18,43,52,0.24)] sm:p-8"><div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-ocean">Registro público · Hive</p><h2 id="verification-details-title" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">Detalle de la prueba</h2><p className="mt-2 text-sm leading-6 text-ink-muted">Información leída directamente desde la transacción verificada.</p></div><button type="button" aria-label="Cerrar detalle de la prueba" onClick={() => setIsDetailsOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ocean/15 text-xl text-ink-muted transition hover:bg-aqua-50 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/20">×</button></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-ocean/10 bg-aqua-50 p-4 sm:col-span-2"><p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-muted">TXID</p><p className="mt-2 break-all font-mono text-xs leading-5 text-ink">{result.transaction_id}</p></div><div className="rounded-xl border border-ocean/10 p-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-muted">Bloque</p><p className="mt-2 text-sm font-semibold text-ink">{result.block_num}</p></div><div className="rounded-xl border border-ocean/10 p-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-muted">Expiración</p><p className="mt-2 text-sm font-semibold text-ink">{result.expiration ?? '—'}</p></div><div className="rounded-xl border border-ocean/10 p-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-muted">Operación</p><p className="mt-2 font-mono text-sm font-semibold text-ink">{proofOperation.type}</p><p className="mt-1 text-xs text-ink-muted">ID: {proofOperation.value?.id}</p></div><div className="rounded-xl border border-ocean/10 p-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-muted">Cuenta firmante</p><p className="mt-2 text-sm font-semibold text-ink">{proofOperation.value?.required_posting_auths?.map((account) => `@${account}`).join(', ') || '—'}</p></div></div><div className="mt-4 rounded-xl border border-ocean/10 p-4"><p className="text-sm font-bold text-ink">Payload proof_ext</p>{proofPayload ? <div className="mt-3 divide-y divide-ocean/10 rounded-lg border border-ocean/10">{Object.entries(proofPayload).map(([key, value]) => <div className="grid gap-1 px-3 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-3" key={key}><span className="font-mono text-xs font-semibold text-ocean">{key}</span><span className="break-all text-xs leading-5 text-ink-muted">{value}</span></div>)}</div> : <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-[#f7faf9] p-4 text-xs leading-5 text-ink">{proofOperation.value?.json}</pre>}</div><details className="mt-4 rounded-xl border border-ocean/10 p-4"><summary className="cursor-pointer text-sm font-bold text-ocean">Ver JSON original</summary><pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-[#f7faf9] p-4 text-xs leading-5 text-ink">{proofOperation.value?.json}</pre></details><div className="mt-6 flex justify-end"><button type="button" onClick={() => setIsDetailsOpen(false)} className="min-h-12 rounded-xl bg-ocean px-5 text-sm font-bold text-white transition hover:bg-ocean-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/25">Cerrar</button></div></div></div>}
	</div>;
}
