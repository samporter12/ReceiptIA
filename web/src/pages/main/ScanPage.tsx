import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { receiptService } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { Camera, Upload, RefreshCw, Check, X, Image as ImageIcon } from 'lucide-react';

type ScanStep = 'camera' | 'preview' | 'processing' | 'success';

export default function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<ScanStep>('camera');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      setCameraError('No se pudo acceder a la cámara. Puedes subir una imagen desde tu dispositivo.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  // Capturar foto desde la cámara
  const takePicture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCapturedBlob(blob);
      setPreviewUrl(url);
      setStep('preview');
      // Detener cámara
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }, 'image/jpeg', 0.9);
  }, []);

  // Seleccionar desde archivo
  const pickFromFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapturedBlob(file);
    setPreviewUrl(url);
    setStep('preview');
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // Retomar — volver a la cámara
  const retake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedBlob(null);
    setUploadError('');
    setStep('camera');
    setCameraReady(false);
    startCamera();
  }, [previewUrl, startCamera]);

  // Procesar imagen
  const processImage = useCallback(async () => {
    if (!capturedBlob) return;
    setStep('processing');
    setUploadError('');

    try {
      // 1. Obtener URL prefirmada
      const { upload_url, image_key } = await receiptService.getUploadUrl('jpg');

      // 2. Subir a S3
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        body: capturedBlob,
        headers: { 'Content-Type': 'image/jpeg' },
      });
      if (!uploadRes.ok) throw new Error(`Upload error: ${uploadRes.status}`);

      // 3. Iniciar procesamiento
      await receiptService.processReceipt(image_key);

      setStep('success');
    } catch (err: any) {
      setUploadError(err?.message || 'Error al procesar el recibo');
      setStep('preview');
    }
  }, [capturedBlob]);

  // ─── Vista: Procesando ───
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-primary-dark flex flex-col items-center justify-center gap-6 text-white p-8">
        <Spinner size="lg" color="text-white" />
        <h2 className="text-2xl font-black">Analizando recibo...</h2>
        <p className="text-white/70 text-center">La IA está extrayendo los datos del recibo</p>
      </div>
    );
  }

  // ─── Vista: Éxito ───
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
          <Check size={40} className="text-success" />
        </div>
        <h2 className="text-2xl font-black text-text-primary">¡Recibo enviado!</h2>
        <p className="text-text-secondary text-center text-sm max-w-xs">
          Tu recibo se está analizando con IA. Tarda entre 5-10 segundos. Puedes ver el resultado en la lista de recibos.
        </p>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={retake} className="flex-1 btn-secondary">
            <Camera size={16} />
            Escanear otro
          </button>
          <button onClick={() => navigate('/receipts')} className="flex-1 btn-primary">
            Ver recibos
          </button>
        </div>
      </div>
    );
  }

  // ─── Vista: Preview ───
  if (step === 'preview' && previewUrl) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Imagen capturada */}
        <div className="flex-1 flex items-center justify-center">
          <img
            src={previewUrl}
            alt="Recibo capturado"
            className="max-h-[70vh] max-w-full object-contain"
          />
        </div>

        {/* Controles */}
        <div className="bg-surface p-6 rounded-t-3xl space-y-4">
          <h3 className="text-lg font-black text-text-primary text-center">¿Se ve bien el recibo?</h3>
          <p className="text-text-secondary text-sm text-center -mt-2">
            Asegúrate de que el texto sea legible
          </p>

          {uploadError && (
            <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 text-error text-sm text-center">
              {uploadError}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={retake} className="flex-1 btn-secondary py-3">
              <RefreshCw size={16} />
              Repetir
            </button>
            <button onClick={processImage} className="flex-1 btn-primary py-3">
              <Check size={16} />
              Procesar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Vista: Cámara ───
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Marco guía */}
        {cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-72 h-96">
              {/* Esquinas */}
              {[
                'top-0 left-0 border-t-4 border-l-4',
                'top-0 right-0 border-t-4 border-r-4',
                'bottom-0 left-0 border-b-4 border-l-4',
                'bottom-0 right-0 border-b-4 border-r-4',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-white rounded-sm ${cls}`} />
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-white font-bold">Escanear Recibo</h2>
            <div className="w-10" />
          </div>
          {cameraReady && (
            <p className="text-white/70 text-sm text-center mt-3">
              Centra el recibo dentro del marco
            </p>
          )}
        </div>

        {/* Error de cámara */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-black/80">
            <Camera size={48} className="text-white/50" />
            <p className="text-white text-center text-sm">{cameraError}</p>
          </div>
        )}
      </div>

      {/* Controles inferiores */}
      <div className="bg-black/90 px-8 py-8 flex items-center justify-between">
        {/* Subir desde archivo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <ImageIcon size={22} />
          </div>
          <span className="text-xs">Galería</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={pickFromFile}
        />

        {/* Botón de captura */}
        <button
          onClick={takePicture}
          disabled={!cameraReady}
          className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center disabled:opacity-40 hover:bg-white/30 transition-colors active:scale-95"
        >
          <div className="w-14 h-14 rounded-full bg-white" />
        </button>

        {/* Upload directo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Upload size={22} />
          </div>
          <span className="text-xs">Subir</span>
        </button>
      </div>
    </div>
  );
}
