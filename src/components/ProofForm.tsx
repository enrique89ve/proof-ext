import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, ArrowUpRight, Check, CircleHelp, Hash, Link2, LockKeyhole, ShieldCheck, Upload } from 'lucide-react';
import { sha256 } from '../lib/hash';
import { countCharacters, countUtf8Bytes, EXPERIMENTAL_FLAG, LIMITS, validateProofPayload, validateSafeUrl } from '../lib/proof-schema';

type FormStatus = 'idle' | 'hashing' | 'ready' | 'broadcasting' | 'broadcasted' | 'error';

const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-ocean/15 bg-white/80 px-4 text-[0.95rem] text-ink outline-none transition placeholder:text-ink-muted/65 hover:border-ocean/35 focus:border-ocean focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/10';
const labelClass = 'text-sm font-semibold text-ink';

export default function ProofForm({ account }: { account?: string }) {
	const [file, setFile] = useState<File | null>(null);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [content, setContent] = useState('');
	const [documentUrl, setDocumentUrl] = useState('');
	const [extraUrl, setExtraUrl] = useState('');
	const [originHash, setOriginHash] = useState('');
	const [proofJson, setProofJson] = useState('');
	const [payloadJson, setPayloadJson] = useState('');
	const [payloadBytes, setPayloadBytes] = useState(0);
	const [isReviewOpen, setIsReviewOpen] = useState(false);
	const [broadcastTxid, setBroadcastTxid] = useState('');
	const [errors, setErrors] = useState<string[]>([]);
	const [status, setStatus] = useState<FormStatus>('idle');

	const sourceLabel = useMemo(() => file?.name ?? (content.trim() ? 'Texto preparado en el editor' : 'Ningún documento seleccionado'), [content, file]);

async function handleSubmit(event: { preventDefault(): void }) {
		event.preventDefault();
		setErrors([]);
		setStatus('hashing');

		const nextErrors: string[] = [];
		if (!file && !content.trim()) nextErrors.push('Adjunta un PDF o escribe el texto que quieres acreditar.');
		if (!title.trim()) nextErrors.push('El título es obligatorio.');
		if (countCharacters(title) > LIMITS.title) nextErrors.push('El título supera los 100 caracteres.');
		if (countCharacters(description) > LIMITS.description) nextErrors.push('La descripción supera los 280 caracteres.');
		if (countCharacters(originHash) > LIMITS.originHash) nextErrors.push('El hash de origen supera los 256 caracteres.');
		const documentUrlError = validateSafeUrl(documentUrl, LIMITS.documentUrl);
		if (documentUrlError) nextErrors.push(documentUrlError);
		if (extraUrl && validateSafeUrl(extraUrl, LIMITS.extraUrl)) nextErrors.push('El enlace adicional no es válido.');

		if (nextErrors.length) {
			setErrors(nextErrors);
			setStatus('error');
			return;
		}

		const sourceHash = file ? await sha256(await file.arrayBuffer()) : await sha256(content.replace(/\r\n/g, '\n').trim());
		const payload: Record<string, string> = {
			version: '1',
			type: 'document_proof',
			algorithm: 'SHA-256',
			hash: sourceHash,
			title: title.trim(),
			document_url: documentUrl.trim(),
			app: 'proof-existence',
			experimental: EXPERIMENTAL_FLAG,
		};
		if (description.trim()) payload.description = description.trim();
		if (extraUrl.trim()) payload.extra_url = extraUrl.trim();
		if (originHash.trim()) payload.hash_origen = originHash.trim();

		const payloadErrors = validateProofPayload(payload);
		if (payloadErrors.length) {
			setErrors(payloadErrors);
			setStatus('error');
			return;
		}

		const serializedPayload = JSON.stringify(payload, null, 2);
		const compactPayload = JSON.stringify(payload);
		setPayloadBytes(countUtf8Bytes(JSON.stringify(payload)));
		setProofJson(serializedPayload);
		setPayloadJson(compactPayload);
		setBroadcastTxid('');
		setStatus('ready');
		setIsReviewOpen(true);
	}

	function getTransactionId(value: unknown): string {
		if (typeof value === 'string') return value;
		if (value && typeof value === 'object') {
			for (const key of ['id', 'tx_id', 'txid', 'transaction_id']) {
				const candidate = (value as Record<string, unknown>)[key];
				if (typeof candidate === 'string') return candidate;
			}
		}
		return '';
	}

	function handleBroadcast() {
		if (!account || !payloadJson) return;
		const keychain = window.hive_keychain;
		if (!keychain) {
			setErrors(['Hive Keychain no está disponible en este navegador.']);
			setStatus('error');
			return;
		}

		setErrors([]);
		setStatus('broadcasting');
		const operation = ['custom_json', {
			required_auths: [],
			required_posting_auths: [account],
			id: 'proof_ext',
			json: payloadJson,
		}];
		keychain.requestBroadcast(account, [operation], 'Posting', (response) => {
			if (response.success) {
				setBroadcastTxid(getTransactionId(response.result));
				setStatus('broadcasted');
				return;
			}
			setErrors([response.error ?? response.message ?? 'La publicación fue cancelada en Hive Keychain.']);
			setStatus('error');
		}, 'https://api.hive.blog', 'Proof Existence · publicar prueba');
	}

	return (
		<section id="crear" className="relative isolate overflow-hidden rounded-[2rem] border border-ocean/10 bg-aqua-100/70 p-1 shadow-[0_24px_80px_rgba(36,66,74,0.14)]">
			<div className="grid gap-0 overflow-hidden rounded-[1.75rem] bg-white/85 lg:grid-cols-[0.78fr_1.22fr]">
				<div className="relative overflow-hidden bg-ocean-dark p-7 text-white sm:p-10">
					<div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border-[30px] border-gold/35" aria-hidden="true" />
					<div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-ocean/60" aria-hidden="true" />
					<div className="relative">
						<div className="mb-16 flex items-center gap-3 text-white/75">
							<div className="grid h-11 w-11 place-items-center rounded-2xl bg-gold text-ocean-dark"><ShieldCheck size={22} strokeWidth={2.5} /></div>
							<span className="text-sm font-semibold tracking-wide">Proof Existence</span>
						</div>
						<p className="eyebrow text-gold">Nueva prueba</p>
						<h2 className="mt-4 max-w-sm text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Deja una huella verificable.</h2>
						<p className="mt-5 max-w-sm text-base leading-7 text-white/70">El documento permanece contigo. En Hive solo registramos su evidencia criptográfica y una referencia pública.</p>
						<div className="mt-14 space-y-4 border-t border-white/15 pt-6 text-sm text-white/75">
							<div className="flex gap-3"><LockKeyhole size={17} className="mt-0.5 text-gold" /><span>Tu archivo se procesa localmente en el navegador.</span></div>
							<div className="flex gap-3"><Hash size={17} className="mt-0.5 text-gold" /><span>El hash SHA-256 representa los bytes exactos del documento.</span></div>
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit} aria-busy={status === 'hashing' || status === 'broadcasting'} aria-invalid={errors.length > 0} className="p-6 sm:p-10">
					<div className="flex items-start justify-between gap-4">
						<div><p className="eyebrow text-ocean">Paso 01 · preparar</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">Crea tu prueba</h3>{account && <p className="mt-2 text-xs text-ink-muted">Firmante: <span className="font-semibold text-ocean">@{account}</span></p>}</div>
						<span className="rounded-full bg-aqua-100 px-3 py-1.5 text-xs font-semibold text-ocean">Client-side</span>
					</div>

					<div className="mt-8 space-y-6">
						<div>
							<div className="flex items-center gap-2"><label className={labelClass} htmlFor="proof-file">Adjunto PDF</label><span className="text-xs font-semibold text-ocean">SHA-256</span><button type="button" aria-label="Ayuda sobre SHA-256" title="Usamos SHA-256 sobre los bytes originales del PDF mediante la Web Crypto API del navegador." className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition hover:bg-aqua-100 hover:text-ocean focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/20"><CircleHelp size={16} /></button></div>
							<label htmlFor="proof-file" className="mt-2 flex min-h-28 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-ocean/30 bg-aqua-50 px-5 transition hover:border-ocean hover:bg-aqua-100 focus-within:ring-4 focus-within:ring-ocean/10">
								<div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-ocean shadow-sm"><Upload size={20} /></div>
								<div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{sourceLabel}</p><p className="mt-1 text-xs leading-5 text-ink-muted">Se procesa localmente · o usa el editor de texto</p></div>
								<input id="proof-file" aria-label="Adjuntar PDF" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { const selectedFile = event.target.files?.[0] ?? null; if (selectedFile && selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) { setErrors(['El adjunto debe ser un archivo PDF.']); setFile(null); return; } setErrors([]); setFile(selectedFile); }} />
							</label>
						</div>

						<div><label className={labelClass} htmlFor="proof-content">Texto a acreditar <span className="font-normal text-ink-muted">(alternativa al PDF)</span></label><textarea id="proof-content" aria-label="Texto a acreditar" value={content} onChange={(event) => setContent(event.target.value)} maxLength={LIMITS.content} rows={4} className={`${inputClass} resize-y py-3`} placeholder="Escribe un acta, una declaración o una nota breve..." /><p className="mt-1 text-right text-xs text-ink-muted">{countCharacters(content)} / {LIMITS.content}</p></div>

						<div><label className={labelClass} htmlFor="proof-title">Título o asunto <span className="text-gold">*</span></label><input id="proof-title" aria-label="Título o asunto" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={LIMITS.title} className={inputClass} placeholder="Ej. Contrato de arrendamiento" /><p className="mt-1 text-right text-xs text-ink-muted">{countCharacters(title)} / {LIMITS.title}</p></div>

						<div><label className={labelClass} htmlFor="document-url">URL pública del documento <span className="text-gold">*</span></label><div className="relative"><Link2 size={17} className="absolute left-4 top-4 text-ink-muted" /><input id="document-url" aria-label="URL pública del documento" required value={documentUrl} onChange={(event) => setDocumentUrl(event.target.value)} maxLength={LIMITS.documentUrl} inputMode="url" className={`${inputClass} pl-11`} placeholder="ipfs://... o https://..." /></div><p className="mt-1 text-xs text-ink-muted">Aceptamos únicamente HTTPS o IPFS. Máximo 512 caracteres.</p></div>
						<div><label className={labelClass} htmlFor="extra-url">Enlace adicional <span className="font-normal text-ink-muted">(opcional)</span></label><input id="extra-url" aria-label="Enlace adicional" value={extraUrl} onChange={(event) => setExtraUrl(event.target.value)} maxLength={LIMITS.extraUrl} inputMode="url" className={inputClass} placeholder="https://expediente.example" /></div>
						<div><label className={labelClass} htmlFor="origin-hash">hash_origen <span className="font-normal text-ink-muted">(opcional)</span></label><input id="origin-hash" aria-label="Hash de origen" value={originHash} onChange={(event) => setOriginHash(event.target.value)} maxLength={LIMITS.originHash} className={`${inputClass} font-mono text-sm`} placeholder="Hash de otro sistema o blockchain" /></div>
						<div><label className={labelClass} htmlFor="proof-description">Descripción corta <span className="font-normal text-ink-muted">(opcional)</span></label><textarea id="proof-description" aria-label="Descripción corta" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={LIMITS.description} rows={2} className={`${inputClass} resize-none py-3`} placeholder="Qué demuestra esta prueba..." /><p className="mt-1 text-right text-xs text-ink-muted">{countCharacters(description)} / {LIMITS.description}</p></div>
					</div>

					{errors.length > 0 && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><div className="flex gap-2 font-semibold"><AlertCircle size={18} /> Revisa estos datos</div><ul className="mt-2 list-disc space-y-1 pl-6">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

					<p className="mt-6 text-xs leading-5 text-ink-muted">El PDF nunca sale del navegador. Hive recibe solo strings en un JSON de hasta 8 KB: título, hash, URL y metadatos opcionales.</p>
					<button type="submit" disabled={status === 'hashing'} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ocean px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(53,95,104,0.2)] transition hover:bg-ocean-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/25 disabled:cursor-wait disabled:opacity-60">{status === 'hashing' ? 'Calculando hash...' : 'Generar hash'} <ArrowRight size={17} /></button>

					{status === 'broadcasted' && <div role="status" className="mt-6 rounded-2xl border border-mint/25 bg-[#eff8f3] p-4"><div className="flex items-center gap-2 text-sm font-bold text-mint"><Check size={18} /> Prueba publicada en Hive</div>{broadcastTxid ? <><p className="mt-2 break-all font-mono text-xs leading-5 text-ink-muted">TXID: {broadcastTxid}</p><a href={`https://hivehub.dev/tx/${encodeURIComponent(broadcastTxid)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-ocean underline decoration-ocean/30 underline-offset-4 transition hover:text-ocean-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/20">Ver transacción en HiveHub <ArrowUpRight size={15} /></a></> : <p className="mt-2 text-xs text-ink-muted">Keychain confirmó la publicación.</p>}</div>}
				</form>
			</div>
			{isReviewOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && status !== 'broadcasting') setIsReviewOpen(false); }}><div role="dialog" aria-modal="true" aria-labelledby="proof-review-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ocean/15 bg-white p-6 shadow-[0_24px_80px_rgba(18,43,52,0.24)] sm:p-8"><div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-ocean">Paso 02 · revisar</p><h2 id="proof-review-title" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">Esto se enviará a Hive</h2><p className="mt-2 text-sm leading-6 text-ink-muted">Revisa el registro exacto antes de abrir Keychain. El archivo PDF no forma parte de la transacción.</p></div><button type="button" aria-label="Cerrar revisión" disabled={status === 'broadcasting'} onClick={() => setIsReviewOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ocean/15 text-xl text-ink-muted transition hover:bg-aqua-50 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/20 disabled:opacity-50">×</button></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-ocean/10 bg-aqua-50 p-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-muted">Cuenta</p><p className="mt-2 text-sm font-semibold text-ink">@{account}</p></div><div className="rounded-xl border border-ocean/10 bg-aqua-50 p-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-muted">Operación</p><p className="mt-2 font-mono text-sm font-semibold text-ink">custom_json · proof_ext</p></div></div><div className="mt-4 rounded-xl border border-ocean/10 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-ink">Payload de aplicación</p><span className="text-xs text-ink-muted">{payloadBytes.toLocaleString('es-VE')} / {LIMITS.hiveCustomJsonBytes.toLocaleString('es-VE')} bytes</span></div><pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-[#f7faf9] p-4 text-xs leading-5 text-ink">{proofJson}</pre></div><details className="mt-4 rounded-xl border border-ocean/10 p-4"><summary className="cursor-pointer text-sm font-bold text-ocean">Ver operación custom_json exacta</summary><pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-[#f7faf9] p-4 text-xs leading-5 text-ink">{JSON.stringify({ required_auths: [], required_posting_auths: account ? [account] : [], id: 'proof_ext', json: payloadJson }, null, 2)}</pre></details>{errors.length > 0 && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errors.join(' ')}</div>}{status === 'broadcasted' && <div className="mt-4 rounded-xl border border-mint/25 bg-[#eff8f3] p-3 text-sm text-mint">{broadcastTxid ? <><span className="block">Publicado. TXID: {broadcastTxid}</span><a href={`https://hivehub.dev/tx/${encodeURIComponent(broadcastTxid)}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 font-bold text-ocean underline decoration-ocean/30 underline-offset-4 transition hover:text-ocean-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/20">Ver en HiveHub <ArrowUpRight size={15} /></a></> : 'Publicado correctamente en Hive.'}</div>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={status === 'broadcasting'} onClick={() => setIsReviewOpen(false)} className="min-h-12 rounded-xl border border-ocean/20 px-5 text-sm font-bold text-ocean transition hover:bg-aqua-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/20">Seguir editando</button>{status !== 'broadcasted' && <button type="button" disabled={status === 'broadcasting'} onClick={handleBroadcast} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ocean px-5 text-sm font-bold text-white transition hover:bg-ocean-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/25 disabled:cursor-wait disabled:opacity-60">{status === 'broadcasting' ? 'Esperando Keychain...' : 'Enviar a Hive'} <ArrowRight size={17} /></button>}</div></div></div>}
		</section>
	);
}
