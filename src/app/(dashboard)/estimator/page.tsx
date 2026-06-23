'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Camera,
  Sparkles,
  User,
  ImageIcon,
  BarChart3,
  FileCheck,
  ChevronRight,
  Loader2,
  UploadCloud,
  AlertCircle,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { CustomerSearch } from '@/components/estimator/CustomerSearch';
import type { CustomerFormValues } from '@/components/estimator/CustomerSearch';
import { PhotoGallery } from '@/components/estimator/PhotoGallery';
import type { PhotoFile } from '@/components/estimator/PhotoGallery';
import { AIResultsPanel } from '@/components/estimator/AIResultsPanel';
import { EstimateCard } from '@/components/estimator/EstimateCard';
import type { EstimateOverrides } from '@/components/estimator/EstimateCard';
import type { Customer, AIEstimate } from '@/types';

// ---------------------------------------------------------------------------
// Steps config
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: 'Customer', icon: User },
  { id: 2, label: 'Photos',   icon: Camera },
  { id: 3, label: 'Analysis', icon: BarChart3 },
  { id: 4, label: 'Estimate', icon: FileCheck },
] as const;

type Step = typeof STEPS[number]['id'];

// ---------------------------------------------------------------------------
// Accepted file types
// ---------------------------------------------------------------------------

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png':  ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'video/mp4':  ['.mp4'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function convertHeicToJpeg(file: File): Promise<{ blob: Blob; url: string }> {
  try {
    // Dynamic import to avoid SSR issues
    const heic2any = (await import('heic2any')).default;
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 }) as Blob;
    const url = URL.createObjectURL(blob);
    return { blob, url };
  } catch {
    // Fallback: use original if conversion fails
    const url = URL.createObjectURL(file);
    return { blob: file, url };
  }
}

async function buildPhotoFile(file: File): Promise<PhotoFile> {
  const id = uuidv4();
  const isHeic = /\.(heic|heif)$/i.test(file.name);
  const isVideo = file.type.startsWith('video/');

  if (isHeic) {
    toast.loading(`Converting ${file.name}…`, { id: `heic-${id}` });
    try {
      const { url } = await convertHeicToJpeg(file);
      toast.success(`${file.name} converted`, { id: `heic-${id}` });
      return { id, file, previewUrl: url, originalName: file.name, isHeic: true, isVideo: false, uploading: false, uploaded: false };
    } catch {
      toast.error(`Failed to convert ${file.name}`, { id: `heic-${id}` });
    }
  }

  const url = URL.createObjectURL(file);
  return { id, file, previewUrl: url, originalName: file.name, isHeic: false, isVideo, uploading: false, uploaded: false };
}

// ---------------------------------------------------------------------------
// Step progress bar
// ---------------------------------------------------------------------------

function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                  done
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : active
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-gray-200 text-gray-400 bg-white'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  active ? 'text-blue-700' : done ? 'text-blue-500' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-20px] sm:mt-[-22px] transition-all',
                  done ? 'bg-blue-600' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function EstimatorPage() {
  const router = useRouter();

  // Step
  const [step, setStep] = useState<Step>(1);

  // Customer
  const [customer, setCustomer] = useState<Customer | CustomerFormValues | null>(null);

  // Photos
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [processingFiles, setProcessingFiles] = useState(false);

  // AI
  const [analyzing, setAnalyzing] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<AIEstimate | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Overrides
  const [overrides, setOverrides] = useState<EstimateOverrides>({
    suggestedPrice: 0,
    laborHours: 0,
    dumpFee: 0,
    cubicYards: 0,
  });

  // -------------------------------------------------------------------------
  // Drop handler
  // -------------------------------------------------------------------------

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setProcessingFiles(true);
    try {
      const built = await Promise.all(acceptedFiles.map(buildPhotoFile));
      setPhotos(prev => {
        const combined = [...prev, ...built];
        if (combined.length > prev.length) {
          toast.success(
            `${built.length} file${built.length !== 1 ? 's' : ''} added`
          );
        }
        return combined;
      });
    } catch {
      toast.error('Some files could not be processed.');
    } finally {
      setProcessingFiles(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 50 * 1024 * 1024, // 50 MB
    onDropRejected: files => {
      const first = files[0];
      const reason =
        first?.errors?.[0]?.code === 'file-too-large'
          ? 'File is too large (max 50 MB)'
          : 'File type not supported';
      toast.error(reason);
    },
  });

  // -------------------------------------------------------------------------
  // AI analysis
  // -------------------------------------------------------------------------

  async function runAnalysis() {
    if (photos.length === 0) {
      toast.error('Upload at least one photo first.');
      return;
    }

    setAnalyzing(true);
    setAiError(null);
    setAiEstimate(null);

    try {
      // Build form data with photos
      const formData = new FormData();
      photos.forEach((p, i) => {
        formData.append(`photo_${i}`, p.file);
      });

      const res = await fetch('/api/estimator/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(errData?.error?.message ?? 'Analysis failed');
      }

      const data: { estimate: AIEstimate } = await res.json();
      setAiEstimate(data.estimate);

      // Pre-fill overrides with AI values
      setOverrides({
        suggestedPrice: data.estimate.suggested_price,
        laborHours: data.estimate.estimated_labor_hours,
        dumpFee: data.estimate.estimated_dump_cost,
        cubicYards: data.estimate.total_cubic_yards,
      });

      toast.success('AI analysis complete!');
      setStep(4);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setAiError(message);
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  }

  // -------------------------------------------------------------------------
  // Navigation helpers
  // -------------------------------------------------------------------------

  function canProceedFrom(s: Step): boolean {
    if (s === 1) return !!customer && ('name' in customer ? !!customer.name : false);
    if (s === 2) return photos.length > 0;
    if (s === 3) return !!aiEstimate;
    return true;
  }

  function nextStep() {
    if (step < 4) setStep((prev) => (prev + 1) as Step);
  }

  // -------------------------------------------------------------------------
  // Build quote
  // -------------------------------------------------------------------------

  function handleBuildQuote() {
    if (!aiEstimate) return;
    // Encode state as search params and navigate to quote builder
    const params = new URLSearchParams({
      price:   String(overrides.suggestedPrice),
      labor:   String(overrides.laborHours),
      dump:    String(overrides.dumpFee),
      yards:   String(overrides.cubicYards),
    });
    if (customer && 'id' in customer) {
      params.set('customer_id', (customer as Customer).id);
    }
    toast.success('Opening quote builder…');
    router.push(`/quotes/new?${params.toString()}`);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Photo Estimator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload photos of the job site and let AI generate an instant estimate.
        </p>
      </div>

      {/* Step bar */}
      <StepBar current={step} />

      {/* Step content */}
      <AnimatePresence mode="wait">

        {/* ================================================================
            STEP 1 — Customer Info
        ================================================================ */}
        {step === 1 && (
          <Section
            key="step1"
            title="Customer Information"
            description="Search for an existing customer or create a new one."
          >
            <CustomerSearch
              value={customer}
              onChange={setCustomer}
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={nextStep}
                disabled={!canProceedFrom(1)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all',
                  canProceedFrom(1)
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                Continue to Photos <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </Section>
        )}

        {/* ================================================================
            STEP 2 — Photo Upload
        ================================================================ */}
        {step === 2 && (
          <Section
            key="step2"
            title="Upload Job Site Photos"
            description="Add photos or videos. HEIC files are automatically converted."
          >
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                'relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200',
                isDragActive
                  ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <AnimatePresence mode="wait">
                  {processingFiles ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                      <p className="text-sm font-medium text-blue-600">Processing files…</p>
                    </motion.div>
                  ) : isDragActive ? (
                    <motion.div
                      key="dragging"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <UploadCloud className="h-14 w-14 text-blue-500" />
                      <p className="text-base font-semibold text-blue-600">Drop files here!</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                        <Camera className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-700">
                          Upload Photos / Take Photo / Drop Files Here
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          JPG, PNG, WEBP, HEIC, MP4 · Up to 50 MB each
                        </p>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-600 shadow-sm">
                          Browse Files
                        </span>
                        <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-600 shadow-sm">
                          Take Photo
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Gallery */}
            {photos.length > 0 && (
              <PhotoGallery
                photos={photos}
                onRemove={id => setPhotos(prev => {
                  const p = prev.find(x => x.id === id);
                  if (p) URL.revokeObjectURL(p.previewUrl);
                  return prev.filter(x => x.id !== id);
                })}
              />
            )}

            {/* Nav */}
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!canProceedFrom(2)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all',
                  canProceedFrom(2)
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                Continue to Analysis <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </Section>
        )}

        {/* ================================================================
            STEP 3 — AI Analysis
        ================================================================ */}
        {step === 3 && (
          <Section
            key="step3"
            title="AI Analysis"
            description={`Analyzing ${photos.length} photo${photos.length !== 1 ? 's' : ''} to detect items and generate estimate.`}
          >
            {/* Analyze button */}
            {!analyzing && !aiEstimate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6 py-8"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-800">Ready to analyze {photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    AI will detect all items, estimate volume, and suggest pricing.
                  </p>
                </div>
                <button
                  onClick={runAnalysis}
                  className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-base font-semibold text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-blue-600 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="h-5 w-5" />
                  Analyze with AI
                </button>
              </motion.div>
            )}

            {/* Scanning animation */}
            {analyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6 py-8"
              >
                {/* Animated scan effect */}
                <div className="relative w-64 h-40 rounded-2xl overflow-hidden bg-gray-900">
                  {/* Show first photo as background */}
                  {photos[0] && !photos[0].isVideo && (
                    <img
                      src={photos[0].previewUrl}
                      alt="Scanning"
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                    />
                  )}
                  {/* Scan line */}
                  <motion.div
                    animate={{ y: [0, 160, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_10px_2px_rgba(59,130,246,0.6)]"
                  />
                  {/* Corner brackets */}
                  {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-5 h-5 border-blue-400 border-2 ${i < 2 ? 'border-b-0' : 'border-t-0'} ${i % 2 === 0 ? 'border-r-0' : 'border-l-0'}`} />
                  ))}
                  {/* AI icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-blue-400 drop-shadow-lg animate-pulse" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-gray-700">Scanning photos with AI…</p>
                  <p className="text-xs text-gray-400">Detecting items, volumes, and hazards</p>
                </div>
              </motion.div>
            )}

            {/* Error state */}
            {aiError && !analyzing && (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Analysis failed</p>
                  <p className="text-sm text-red-600 mt-0.5">{aiError}</p>
                  <button
                    onClick={runAnalysis}
                    className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Results shown inline while on step 3 */}
            {aiEstimate && !analyzing && (
              <AIResultsPanel estimate={aiEstimate} />
            )}

            {/* Nav */}
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={analyzing}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              {aiEstimate && (
                <button
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-blue-700 shadow-sm active:scale-[0.98] transition-all"
                >
                  View Estimate <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </Section>
        )}

        {/* ================================================================
            STEP 4 — Estimate Results
        ================================================================ */}
        {step === 4 && aiEstimate && (
          <Section
            key="step4"
            title="Estimate Results"
            description="Review and modify the AI-generated estimate before building a quote."
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: AI results summary */}
              <div className="space-y-4">
                <AIResultsPanel estimate={aiEstimate} />
              </div>

              {/* Right: Estimate card */}
              <div>
                <EstimateCard
                  estimate={aiEstimate}
                  overrides={overrides}
                  onOverridesChange={setOverrides}
                  onBuildQuote={handleBuildQuote}
                />
              </div>
            </div>

            {/* Back */}
            <div className="flex justify-start pt-2">
              <button
                onClick={() => setStep(3)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back to Analysis
              </button>
            </div>
          </Section>
        )}

      </AnimatePresence>

      {/* Photo summary strip (always visible after photos are added) */}
      {photos.length > 0 && step > 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-gray-200 shadow-lg px-4 py-2"
          >
            <ImageIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => setStep(2)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-1"
            >
              Edit
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
