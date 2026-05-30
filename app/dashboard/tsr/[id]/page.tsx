'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import {
  FileText, CloudUpload, Loader2, Download, FileOutput,
  AlertCircle, Building2, Hash, BookOpen, CheckCircle2,
  Plus, X, Image as ImageIcon, RefreshCw, ChevronRight,
  Clock, Sparkles, Trash2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/utils/supabase/client'
import TsrPaymentModal, { type TsrPaymentRecord } from '../_components/TsrPaymentModal'
import InvoiceView, { type Payment as InvoicePayment } from '@/components/InvoiceView'

interface CaseData {
  id:               string
  case_name:        string
  case_no:          string
  bank_name:        string
  status:           string
  scrutiny_report:  unknown | null
  final_report:     unknown | null
}

interface DroppedFile {
  file: File
}

const PIPELINE_STEPS = [
  'Uploading documents to secure cloud...',
  'Running AI-powered OCR analysis...',
  'Extracting chain of title...',
  'Cross-referencing legal clauses...',
  'Checking encumbrances & EC records...',
  'Analysing GPA & Sub-Division deeds...',
  'Generating Scrutiny queries...',
  'Compiling Legal Opinion Report...',
  'Finalising your Scrutiny Report...',
] as const

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ name }: { name: string }) {
  const ext      = name.split('.').pop()?.toLowerCase() ?? ''
  const isImage  = ['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp'].includes(ext)
  return isImage
    ? <ImageIcon className="w-4 h-4 text-rust shrink-0" />
    : <FileText  className="w-4 h-4 text-maroon shrink-0" />
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  new:        { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', label: 'New'        },
  processing: { bg: '#FEF9C3', text: '#713F12', dot: '#CA8A04', label: 'Processing' },
  complete:   { bg: '#DCFCE7', text: '#14532D', dot: '#16A34A', label: 'Complete'   },
  error:      { bg: '#FEE2E2', text: '#7F1D1D', dot: '#DC2626', label: 'Error'      },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] ?? STATUS_CONFIG.new
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  )
}

function ScrutinyReportCard({ report }: { report: unknown }) {
  if (!report) return null

  if (typeof report === 'string') {
    return (
      <div className="bg-cream-soft rounded-2xl border border-maroon/15 shadow-[0_18px_40px_-30px_rgba(104,3,24,0.35)] p-6">
        <h3 className="font-display font-bold text-maroon mb-4 flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-maroon grid place-items-center">
            <BookOpen className="w-4 h-4 text-cream" />
          </div>
          Scrutiny Report
        </h3>
        <pre className="text-xs text-ink/75 whitespace-pre-wrap leading-relaxed font-sans">
          {report}
        </pre>
      </div>
    )
  }

  const obj        = report as Record<string, unknown>
  const masterCase = obj.master_case_json as Record<string, unknown> | null
  const queries    = obj.active_queries   as Array<{ id: string; text: string; cleared: boolean }> | null
  const reportText = obj.scrutiny_report  as string | null

  return (
    <div className="space-y-5">
      {masterCase && Object.keys(masterCase).length > 0 && (
        <div className="bg-cream-soft rounded-2xl border border-maroon/15 shadow-[0_18px_40px_-30px_rgba(104,3,24,0.35)] p-6">
          <h3 className="font-display font-bold text-maroon mb-5 flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-maroon grid place-items-center">
              <BookOpen className="w-4 h-4 text-cream" />
            </div>
            Extracted Property Facts
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(masterCase).map(([key, val]) => {
              if (val === null || val === undefined || val === '') return null
              const display = Array.isArray(val) ? val.join(', ') : String(val)
              const label   = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              return (
                <div key={key} className="flex flex-col gap-1 p-3 rounded-xl bg-cream border border-maroon/8">
                  <dt className="text-[10px] font-bold text-rust uppercase tracking-[0.18em]">{label}</dt>
                  <dd className="text-sm text-ink leading-snug font-medium">{display}</dd>
                </div>
              )
            })}
          </dl>
        </div>
      )}

      {queries && queries.length > 0 && (
        <div className="bg-cream-soft rounded-2xl border border-maroon/15 shadow-[0_18px_40px_-30px_rgba(104,3,24,0.35)] p-6">
          <h3 className="font-display font-bold text-maroon mb-5 flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-rust grid place-items-center">
              <CheckCircle2 className="w-4 h-4 text-cream" />
            </div>
            Scrutiny Queries
            <span className="ml-auto text-xs text-ink/55 font-medium font-sans">
              {queries.filter(q => q.cleared).length}/{queries.length} resolved
            </span>
          </h3>
          <ul className="space-y-2">
            {queries.map((q, i) => (
              <li
                key={q.id ?? i}
                className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                  q.cleared
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-cream border-maroon/15'
                }`}
              >
                <span
                  className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full grid place-items-center text-[11px] font-bold text-cream ${
                    q.cleared ? 'bg-emerald-500' : 'bg-rust'
                  }`}
                >
                  {q.cleared ? '✓' : '!'}
                </span>
                <span className={q.cleared ? 'text-ink/45 line-through' : 'text-ink'}>
                  {q.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reportText && (
        <div className="bg-cream-soft rounded-2xl border border-maroon/15 shadow-[0_18px_40px_-30px_rgba(104,3,24,0.35)] p-6">
          <h3 className="font-display font-bold text-maroon mb-4 text-lg">Full Report</h3>
          <pre className="text-xs text-ink/75 whitespace-pre-wrap leading-relaxed font-sans">
            {reportText}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function CaseWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const id     = params.id as string

  const [caseData,        setCaseData]        = useState<CaseData | null>(null)
  const [pageLoading,     setPageLoading]      = useState(true)
  const [notFound,        setNotFound]         = useState(false)
  const [droppedFiles,    setDroppedFiles]     = useState<DroppedFile[]>([])
  const [pipelineRunning, setPipelineRunning]  = useState(false)
  const [uploadStage,     setUploadStage]      = useState<'idle' | 'uploading' | 'processing'>('idle')

  const [stepIdx, setStepIdx] = useState(0)
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const [additionalFiles,     setAdditionalFiles]     = useState<DroppedFile[]>([])
  const [showAdditional,      setShowAdditional]       = useState(false)
  const [additionalUploading, setAdditionalUploading]  = useState(false)

  const [downloadingQuery, setDownloadingQuery] = useState(false)
  const [downloadingFinal, setDownloadingFinal] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  // Payment gating for the "Run OCR Pipeline" (= generate scrutiny report) action.
  // - existingPayment: latest successful payment for THIS case (one-time per case).
  // - paymentModalOpen: shows the Cashfree payment modal before kicking off the pipeline.
  // - invoicePayment: drives the InvoiceView modal that appears post-payment.
  const [existingPayment, setExistingPayment] = useState<TsrPaymentRecord | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [invoicePayment, setInvoicePayment] = useState<TsrPaymentRecord | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [userFullName, setUserFullName] = useState<string>('')


  useEffect(() => {
    if (!id) return
    let mounted = true
    const load  = async () => {
      setPageLoading(true)
      const { data, error } = await supabase
        .from('tsr_clients')
        .select('id, case_name, case_no, bank_name, status, scrutiny_report, final_report')
        .eq('id', id)
        .single()
      if (!mounted) return
      if (error || !data) { setNotFound(true); setPageLoading(false); return }
      setCaseData(data as CaseData)
      setPageLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [id])

  // Look up the latest successful payment for this case + the signed-in user's
  // identity for the invoice. Uses getSession() (cache-only, no Web Lock) to
  // avoid colliding with the dashboard layout's getUser() — two concurrent
  // getUser() calls race the auth-token lock and one rejects with "Lock was
  // released because another request stole it", which unmounts the page.
  useEffect(() => {
    if (!id) return
    let mounted = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        const user = session?.user
        const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>
        const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim()
        setUserEmail(user?.email ?? '')
        setUserFullName(fullName)

        const { data: payRow } = await supabase
          .from('tsr_payments')
          .select('*')
          .eq('case_id', id)
          .eq('status', 'success')
          .order('paid_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (mounted && payRow) setExistingPayment(payRow as TsrPaymentRecord)
      } catch (err) {
        // Defensive: a transient supabase lock/auth hiccup must not blank the page.
        console.warn('[tsr/[id]] payment+user lookup failed:', err)
      }
    })()
    return () => { mounted = false }
  }, [id])


  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`tsr-case-workspace-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tsr_clients', filter: `id=eq.${id}` },
        (payload) => {
          setCaseData(prev => prev ? { ...prev, ...(payload.new as Partial<CaseData>) } : prev)
          if ((payload.new as CaseData).status !== 'processing') setPipelineRunning(false)
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    if (pipelineRunning) {
      setStepIdx(0)
      stepTimer.current = setInterval(() => {
        setStepIdx(i => (i + 1) % PIPELINE_STEPS.length)
      }, 3000)
    } else {
      if (stepTimer.current) { clearInterval(stepTimer.current); stepTimer.current = null }
      setStepIdx(0)
    }
    return () => { if (stepTimer.current) clearInterval(stepTimer.current) }
  }, [pipelineRunning])

  const onDrop = useCallback((accepted: File[]) => {
    setDroppedFiles(prev => [
      ...prev,
      ...accepted
        .filter(f => !prev.some(p => p.file.name === f.name && p.file.size === f.size))
        .map(file => ({ file })),
    ])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.tif'] },
    multiple: true,
  })

  const removeFile = (index: number) => setDroppedFiles(prev => prev.filter((_, i) => i !== index))

  const onAdditionalDrop = useCallback((accepted: File[]) => {
    setAdditionalFiles(prev => [...prev, ...accepted.map(file => ({ file }))])
  }, [])

  const { getRootProps: getAdditionalRootProps, getInputProps: getAdditionalInputProps, isDragActive: isAdditionalDrag } = useDropzone({
    onDrop: onAdditionalDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.tiff'] },
    multiple: true,
  })

  const uploadFilesViaGCS = async (
    files: { file: File }[],
    onStatusChange: (msg: string) => void,
  ): Promise<{ case_id: string; mode: string; queries: number; report: unknown }> => {
    const apiBase = process.env.NEXT_PUBLIC_TSR_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://lex-doc-analyzer.onrender.com'

    onStatusChange(`Uploading ${files.length} file(s) to cloud storage…`)

    const CONCURRENCY = 6
    const gcsDocuments: { gcs_uri: string; filename: string; mime_type: string }[] = []
    let completed = 0

    const uploadOne = async ({ file }: { file: File }) => {
      const contentType = file.type || 'application/pdf'

      const urlRes = await fetch(
        `${apiBase}/cases/${id}/upload-url?${new URLSearchParams({ filename: file.name, content_type: contentType })}`,
      )
      if (!urlRes.ok) throw new Error(`Failed to get upload URL for ${file.name}: HTTP ${urlRes.status}`)
      const { upload_url, gcs_uri } = await urlRes.json() as { upload_url: string; gcs_uri: string }

      const putRes = await fetch(upload_url, {
        method:  'PUT',
        headers: { 'Content-Type': contentType },
        body:    file,
      })
      if (!putRes.ok) throw new Error(`GCS upload failed for ${file.name}: HTTP ${putRes.status}`)

      completed++
      onStatusChange(`Uploading ${completed}/${files.length} files to cloud storage…`)
      console.log(`[GCS] ${file.name} → ${gcs_uri}`)
      return { gcs_uri, filename: file.name, mime_type: contentType }
    }

    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch   = files.slice(i, i + CONCURRENCY)
      const results = await Promise.all(batch.map(uploadOne))
      gcsDocuments.push(...results)
    }

    onStatusChange('Analysing with Gemini AI…')
    const res = await fetch(`${apiBase}/cases/${id}/process-scrutiny-gcs`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ documents: gcsDocuments }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => `HTTP ${res.status}`)
      throw new Error(`Server error ${res.status}: ${errText}`)
    }
    return res.json()
  }

  // Opens the payment modal unless the user has already paid for this case's
  // report. Already-paid users skip straight to the pipeline.
  const handleStartReport = () => {
    if (droppedFiles.length === 0) return
    if (existingPayment) {
      handleRunPipeline()
      return
    }
    setPaymentModalOpen(true)
  }

  // Called by TsrPaymentModal once Cashfree confirms + our server records
  // status='success'. Shows the invoice modal and kicks off the pipeline.
  const handlePaymentSuccess = (payment: TsrPaymentRecord) => {
    setExistingPayment(payment)
    setInvoicePayment(payment)
    setPaymentModalOpen(false)
    handleRunPipeline()
  }


  const handleRunPipeline = async () => {
    if (droppedFiles.length === 0) return

    setUploadStage('uploading')
    setPipelineRunning(true)
    setCaseData(prev => prev ? { ...prev, status: 'extracting' } : prev)

    try {
      const data = await uploadFilesViaGCS(droppedFiles, (msg) => {
        console.log('[OCR Pipeline]', msg)
        if (msg.startsWith('Analysing')) setUploadStage('processing')
      })

      console.log('[OCR Pipeline] Success:', data)
      setCaseData(prev =>
        prev ? { ...prev, scrutiny_report: data.report ?? prev.scrutiny_report, status: 'complete' } : prev
      )
      setDroppedFiles([])
    } catch (err: unknown) {
      console.error('[OCR Pipeline] FAILED:', err instanceof Error ? err.message : err)
      setCaseData(prev => prev ? { ...prev, status: 'error' } : prev)
    } finally {
      setPipelineRunning(false)
      setUploadStage('idle')
    }
  }

  const handleUploadAdditional = async () => {
    if (additionalFiles.length === 0) return
    setAdditionalUploading(true)

    try {
      const data = await uploadFilesViaGCS(additionalFiles, (msg) => {
        console.log('[Additional Upload]', msg)
      })
      setCaseData(prev =>
        prev ? { ...prev, scrutiny_report: data.report ?? prev.scrutiny_report, status: 'complete' } : prev
      )
      setAdditionalFiles([])
      setShowAdditional(false)
    } catch (err: unknown) {
      console.error('[Additional Upload] FAILED:', err instanceof Error ? err.message : err)
    } finally {
      setAdditionalUploading(false)
    }
  }

  const handleDownloadQueryReport = async () => {
    if (!caseData) return
    const apiBase = process.env.NEXT_PUBLIC_TSR_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://lex-doc-analyzer.onrender.com'
    setDownloadingQuery(true)
    try {
      const res = await fetch(`${apiBase}/cases/${id}/download-query-report`, { method: 'GET' })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const blob     = await res.blob()
      const filename = `${caseData.case_name}_Query_Report.docx`
      downloadBlob(blob, filename)
      console.log('[Download] Query Report saved as', filename)
    } catch (err: unknown) {
      console.error('[Download] Query Report failed:', err instanceof Error ? err.message : err)
    } finally {
      setDownloadingQuery(false)
    }
  }

  const handleDraftFinalReport = async () => {
    if (!caseData) return
    const apiBase = process.env.NEXT_PUBLIC_TSR_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://lex-doc-analyzer.onrender.com'
    setDownloadingFinal(true)
    try {
      const res = await fetch(`${apiBase}/cases/${id}/generate-final-report`, { method: 'POST' })

      if (!res.ok) {
        let detail = `Server error ${res.status}`
        try {
          const body = await res.json()
          detail = body.detail ?? body.message ?? detail
        } catch {
          // body wasn't JSON — keep the status string
        }

        if (res.status === 503) {
          alert('AI servers are busy. Please try again in a moment.')
        } else {
          alert(`Download failed: ${detail}`)
        }
        console.error('[Download] Final Report failed:', res.status, detail)
        return
      }

      const contentType = res.headers.get('content-type') ?? ''
      const filename    = `${caseData.case_name}_Final_Legal_Opinion.docx`

      if (contentType.includes('wordprocessingml') || contentType.includes('octet-stream')) {
        downloadBlob(await res.blob(), filename)
      } else {
        const data = await res.json()
        const text = data.final_report ?? data.markdown ?? JSON.stringify(data, null, 2)
        downloadBlob(new Blob([text], { type: 'text/plain' }), filename.replace('.docx', '.txt'))
      }

      console.log('[Download] Final Report saved as', filename)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[Download] Final Report network error:', message)
      alert(`Download failed: ${message}`)
    } finally {
      setDownloadingFinal(false)
    }
  }

  const handleDeleteCase = async () => {
    if (!caseData) return
    const confirmed = window.confirm(
      `Are you sure you want to delete "${caseData.case_name}"?\nThis cannot be undone.`,
    )
    if (!confirmed) return

    const apiBase = process.env.NEXT_PUBLIC_TSR_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://lex-doc-analyzer.onrender.com'
    setIsDeleting(true)
    try {
      const res = await fetch(`${apiBase}/cases/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const msg = await res.text().catch(() => `HTTP ${res.status}`)
        throw new Error(msg)
      }
      console.log('[Delete] Case deleted:', id)
      router.push('/dashboard/tsr')
      router.refresh()
    } catch (err: unknown) {
      console.error('[Delete] Failed:', err instanceof Error ? err.message : err)
      setIsDeleting(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-full bg-cream">
        <Loader2 className="w-7 h-7 animate-spin text-maroon" />
      </div>
    )
  }

  if (notFound || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-3 text-center px-6 bg-cream">
        <div className="w-16 h-16 rounded-2xl bg-maroon/10 grid place-items-center mb-2">
          <AlertCircle className="w-7 h-7 text-maroon/60" />
        </div>
        <h2 className="font-display text-2xl font-bold text-maroon">Client not found</h2>
        <p className="text-sm text-ink/55">This client doesn&apos;t exist or you don&apos;t have access.</p>
      </div>
    )
  }

  const hasReport = Boolean(caseData.scrutiny_report)

  const CaseHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
          <Sparkles className="w-3 h-3 text-rust" />
          Client File
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight truncate text-maroon">
          {caseData.case_name}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="inline-flex items-center gap-1.5 text-sm text-ink/65 font-medium">
            <Hash className="w-3.5 h-3.5 text-rust" />
            {caseData.case_no}
          </span>
          <span className="text-maroon/20">·</span>
          <span className="inline-flex items-center gap-1.5 text-sm text-ink/65 font-medium">
            <Building2 className="w-3.5 h-3.5 text-rust" />
            {caseData.bank_name}
          </span>
          <span className="text-maroon/20">·</span>
          <StatusBadge status={caseData.status} />
        </div>
      </div>

      <button
        onClick={handleDeleteCase}
        disabled={isDeleting || pipelineRunning}
        title="Delete this client"
        className="flex items-center gap-1.5 self-start shrink-0 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all
          border-maroon/15 text-ink/55 bg-cream-soft
          hover:border-red-300 hover:text-red-700 hover:bg-red-50
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isDeleting
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Trash2  className="w-3.5 h-3.5" />
        }
        {isDeleting ? 'Deleting…' : 'Delete Client'}
      </button>
    </div>
  )

  const ProcessingOverlay = () => (
    <div className="relative overflow-hidden rounded-3xl p-10 flex flex-col items-center gap-6 text-center border border-rust/30 bg-gradient-to-br from-maroon-deep via-[#3a0c14] to-maroon shadow-[0_30px_80px_-25px_rgba(104,3,24,0.55)]">
      <motion.div
        aria-hidden
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-rust/30 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-rust-soft/15 blur-3xl"
        animate={{ x: [0, -15, 0], y: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex items-center justify-center">
        <motion.span
          aria-hidden
          className="absolute rounded-full bg-rust/30"
          animate={{ scale: [0.6, 1.8, 0.6], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          style={{ width: 96, height: 96 }}
        />
        <motion.span
          aria-hidden
          className="absolute rounded-full bg-rust-soft/30"
          animate={{ scale: [0.6, 1.5, 0.6], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }}
          style={{ width: 96, height: 96 }}
        />
        <div className="relative w-16 h-16 rounded-2xl bg-cream/95 grid place-items-center shadow-2xl">
          <Sparkles className="w-7 h-7 text-rust" />
        </div>
      </div>

      <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rust/15 text-rust-soft text-[10px] font-bold tracking-[0.2em] uppercase">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rust-soft opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rust-soft" />
        </span>
        Running Title Scrutiny
      </div>

      <div className="relative space-y-2 min-h-[3.5rem] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="font-display text-cream font-semibold text-xl leading-tight max-w-md"
          >
            {PIPELINE_STEPS[stepIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-cream/60 text-xs">
          This may take 2–5 minutes for large document sets.
        </p>
      </div>

      <div className="relative flex items-center gap-1.5">
        {PIPELINE_STEPS.map((_, i) => (
          <motion.span
            key={i}
            className="h-1.5 rounded-full"
            animate={{
              width: i === stepIdx ? 24 : 6,
              backgroundColor: i === stepIdx ? '#d96944' : 'rgba(255,240,223,0.18)',
            }}
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>
    </div>
  )

  const PaymentChrome = () => (
    <>
      <TsrPaymentModal
        open={paymentModalOpen}
        caseId={caseData!.id}
        caseName={caseData!.case_name}
        onSuccess={handlePaymentSuccess}
        onClose={() => setPaymentModalOpen(false)}
      />
      <InvoiceView
        payment={invoicePayment ? mapTsrPaymentToInvoice(invoicePayment) : null}
        userEmail={userEmail}
        userName={userFullName}
        onClose={() => setInvoicePayment(null)}
      />
    </>
  )

  if (!hasReport) {
    return (
      <>
      <div className="min-h-full px-6 py-10 max-w-3xl mx-auto w-full bg-cream">
        <CaseHeader />

        {pipelineRunning ? (
          <ProcessingOverlay />
        ) : (
          <>
            <div
              {...getRootProps()}
              className={[
                'relative overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300',
                isDragActive
                  ? 'border-rust bg-rust/5 scale-[1.01] shadow-[0_30px_60px_-30px_rgba(185,72,38,0.5)]'
                  : 'border-maroon/25 bg-cream-soft hover:border-rust/50 hover:bg-cream-warm/40',
              ].join(' ')}
            >
              <input {...getInputProps()} />

              {isDragActive && (
                <motion.div
                  aria-hidden
                  className="absolute inset-0 -z-10"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at center, rgba(185,72,38,0.2), transparent 65%)',
                  }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}

              <div className="flex flex-col items-center gap-4 pointer-events-none">
                <motion.div
                  className={`w-20 h-20 rounded-3xl grid place-items-center shadow-lg ${
                    isDragActive ? 'bg-rust' : 'bg-maroon'
                  }`}
                  animate={isDragActive ? { scale: 1.1, rotate: -6 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  <CloudUpload className="w-9 h-9 text-cream" />
                </motion.div>

                {isDragActive ? (
                  <>
                    <p className="font-display text-2xl font-bold text-rust">Drop your files here</p>
                    <p className="text-sm text-ink/55">Release anywhere in this zone.</p>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="font-display text-xl font-bold text-maroon">
                        Drag &amp; drop your property documents
                      </p>
                      <p className="text-sm text-ink/60 mt-1.5">
                        or{' '}
                        <span className="underline underline-offset-2 font-medium text-rust">
                          click to browse files
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {['PDF', 'PNG', 'JPG', 'TIFF'].map(fmt => (
                        <span
                          key={fmt}
                          className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-maroon/10 text-maroon"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <AnimatePresence>
              {droppedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-rust uppercase tracking-[0.2em]">
                      {droppedFiles.length} file{droppedFiles.length > 1 ? 's' : ''} staged
                    </p>
                    <button
                      onClick={() => setDroppedFiles([])}
                      className="text-xs text-ink/45 hover:text-red-600 transition-colors font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {droppedFiles.map(({ file }, i) => (
                      <motion.li
                        key={`${file.name}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}
                        className="group flex items-center gap-3 bg-cream-soft rounded-xl px-4 py-3 border border-maroon/15 hover:border-maroon/30 transition-all"
                      >
                        <div className="w-9 h-9 rounded-xl bg-maroon/10 grid place-items-center shrink-0">
                          <FileIcon name={file.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink truncate font-medium">{file.name}</p>
                          <p className="text-[11px] text-ink/50">{formatBytes(file.size)}</p>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          Ready
                        </span>

                        <button
                          onClick={() => removeFile(i)}
                          className="text-ink/30 hover:text-red-600 hover:bg-red-50 transition-colors p-1.5 rounded-lg opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                onClick={handleStartReport}
                disabled={droppedFiles.length === 0}
                className="group flex items-center gap-2.5 px-9 py-4 rounded-2xl text-cream font-semibold text-sm bg-maroon hover:bg-maroon-deep transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-[0_18px_40px_-16px_rgba(104,3,24,0.55)]"
              >
                <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
                {existingPayment ? 'Run OCR Pipeline' : 'Pay & Generate Report'}
                {droppedFiles.length > 0 && (
                  <span className="ml-1 bg-cream/20 text-cream text-xs font-bold px-2 py-0.5 rounded-full">
                    {droppedFiles.length}
                  </span>
                )}
              </button>
              {droppedFiles.length === 0 ? (
                <p className="text-xs text-ink/45">Upload at least one document to enable the pipeline.</p>
              ) : !existingPayment ? (
                <p className="text-xs text-ink/45">A one-time per-report payment is required before AI processing begins.</p>
              ) : null}
            </div>
          </>
        )}
      </div>
      <PaymentChrome />
      </>
    )
  }

  return (
    <>
    <div className="min-h-full px-6 py-10 max-w-4xl mx-auto w-full bg-cream">
      <CaseHeader />

      {pipelineRunning && (
        <div className="mb-8">
          <ProcessingOverlay />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button
          onClick={handleDownloadQueryReport}
          disabled={downloadingQuery}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-cream font-semibold text-sm bg-maroon hover:bg-maroon-deep transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-[0_14px_30px_-14px_rgba(104,3,24,0.55)] flex-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {downloadingQuery
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Download className="w-4 h-4" /> Download Query Report</>
          }
        </button>

        <button
          onClick={handleDraftFinalReport}
          disabled={downloadingFinal}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm bg-cream-soft text-maroon border-2 border-maroon/25 hover:border-rust hover:bg-rust hover:text-cream transition-all hover:-translate-y-0.5 active:scale-[0.98] flex-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {downloadingFinal
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Drafting…</>
            : <><FileOutput className="w-4 h-4" /> Draft Final Legal Opinion</>
          }
        </button>
      </div>

      <ScrutinyReportCard report={caseData.scrutiny_report} />

      <div className="mt-8">
        {!showAdditional ? (
          <button
            onClick={() => setShowAdditional(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-rust hover:text-maroon transition-colors group"
          >
            <span className="w-7 h-7 rounded-lg bg-rust/15 group-hover:bg-maroon/15 grid place-items-center transition-colors">
              <Plus className="w-4 h-4" />
            </span>
            Upload Additional Documents
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        ) : (
          <div className="bg-cream-soft rounded-2xl border border-maroon/15 shadow-[0_18px_40px_-30px_rgba(104,3,24,0.35)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-maroon text-lg">Upload Additional Documents</h3>
              <button
                onClick={() => { setShowAdditional(false); setAdditionalFiles([]) }}
                className="text-ink/40 hover:text-maroon p-1.5 rounded-lg hover:bg-maroon/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              {...getAdditionalRootProps()}
              className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                isAdditionalDrag
                  ? 'border-rust bg-rust/5'
                  : 'border-maroon/20 bg-cream hover:border-rust/40'
              }`}
            >
              <input {...getAdditionalInputProps()} />
              <div className={`w-12 h-12 mx-auto mb-2 rounded-xl grid place-items-center ${isAdditionalDrag ? 'bg-rust' : 'bg-maroon'}`}>
                <CloudUpload className="w-6 h-6 text-cream" />
              </div>
              <p className="text-sm font-medium text-ink/70">
                {isAdditionalDrag ? 'Drop files here' : 'Drag files here or click to browse'}
              </p>
            </div>

            <AnimatePresence>
              {additionalFiles.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 space-y-1.5"
                >
                  {additionalFiles.map(({ file }, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="group flex items-center gap-3 text-sm px-3 py-2.5 rounded-xl bg-cream border border-maroon/10"
                    >
                      <div className="w-7 h-7 rounded-lg bg-maroon/10 grid place-items-center shrink-0">
                        <FileIcon name={file.name} />
                      </div>
                      <span className="flex-1 truncate text-ink font-medium">{file.name}</span>
                      <span className="text-xs text-ink/50 shrink-0">{formatBytes(file.size)}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        Ready
                      </span>
                      <button
                        onClick={() => setAdditionalFiles(prev => prev.filter((_, j) => j !== i))}
                        className="text-ink/30 hover:text-red-600 hover:bg-red-50 transition-colors p-1.5 rounded-lg opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleUploadAdditional}
                disabled={additionalFiles.length === 0 || additionalUploading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-cream text-sm font-semibold bg-maroon hover:bg-maroon-deep transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-[0_10px_24px_-12px_rgba(104,3,24,0.55)]"
              >
                {additionalUploading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
                  : <><RefreshCw className="w-3.5 h-3.5" /> Re-run with New Files</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    <PaymentChrome />
    </>
  )
}

/** Adapt a tsr_payments row to the shared InvoiceView Payment shape. */
function mapTsrPaymentToInvoice(p: TsrPaymentRecord): InvoicePayment {
  return {
    id: p.id,
    order_id: p.order_id,
    user_id: p.user_id,
    amount_inr: p.amount_inr,
    amount: p.amount_inr,
    status: p.status,
    currency: p.currency,
    user_email: p.user_email ?? undefined,
    user_phone: p.user_phone ?? undefined,
    cashfree_payment_id: p.cashfree_payment_id ?? undefined,
    cashfree_order_id: p.order_id,
    created_at: p.created_at,
    paid_at: p.paid_at ?? undefined,
  }
}
