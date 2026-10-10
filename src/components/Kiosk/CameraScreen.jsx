import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, FlipHorizontal, AlertCircle } from 'lucide-react';
import { playCountdownBeep, playShutterSound } from '../../utils/audio.js';

/**
 * CameraScreen component (JavaScript)
 */
export function CameraScreen({
  template,
  settings,
  retakeSlotIndex,
  existingPhotos = [],
  onCompleteCapture,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const totalSlots = template.slots.length;
  const isRetakeSingle = retakeSlotIndex !== undefined;

  const [currentSlotIndex, setCurrentSlotIndex] = useState(
    isRetakeSingle ? retakeSlotIndex : 0
  );
  const [capturedPhotos, setCapturedPhotos] = useState(
    existingPhotos.length > 0 ? [...existingPhotos] : []
  );

  const [countdown, setCountdown] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isMirror, setIsMirror] = useState(settings.mirrorCamera);
  const [isSimulatedStream, setIsSimulatedStream] = useState(false);

  const fallbackCanvasRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          deviceId: settings.selectedCameraDeviceId ? { exact: settings.selectedCameraDeviceId } : undefined,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsSimulatedStream(false);
    } catch (err) {
      console.warn('Physical camera unavailable or permission denied, using simulated stream', err);
      setIsSimulatedStream(true);
    }
  }, [settings.selectedCameraDeviceId]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  useEffect(() => {
    if (!isSimulatedStream) return;
    let animId;
    let frame = 0;

    const canvas = fallbackCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      frame++;
      ctx.fillStyle = '#1b1b1b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const cx = canvas.width / 2 + Math.sin(frame * 0.03) * 20;
      const cy = canvas.height / 2 + Math.cos(frame * 0.02) * 10;

      ctx.fillStyle = '#f3f3f4';
      ctx.beginPath();
      ctx.arc(cx, cy - 30, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.fillRect(cx - 65, cy - 50, 130, 32);

      ctx.beginPath();
      ctx.arc(cx, cy - 10, 35, 0.2, Math.PI - 0.2);
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.fillStyle = '#080cff';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 180, 150, 100, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 16px "Space Mono", monospace';
      ctx.fillText('[ SIMULASI KAMERA STANDBY ]', 24, 36);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isSimulatedStream]);

  const captureCurrentFrame = useCallback(() => {
    playShutterSound();
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = document.createElement('canvas');
    const targetW = 1920;
    const targetH = 1080;
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isMirror) {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }

    if (isSimulatedStream && fallbackCanvasRef.current) {
      ctx.drawImage(fallbackCanvasRef.current, 0, 0, targetW, targetH);
    } else if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, targetW, targetH);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    if (isRetakeSingle) {
      const updated = [...capturedPhotos];
      updated[retakeSlotIndex] = dataUrl;
      onCompleteCapture(updated);
    } else {
      const nextList = [...capturedPhotos, dataUrl];
      setCapturedPhotos(nextList);

      if (currentSlotIndex + 1 < totalSlots) {
        setCurrentSlotIndex((prev) => prev + 1);
      } else {
        setTimeout(() => {
          onCompleteCapture(nextList);
        }, 800);
      }
    }
  }, [
    isMirror,
    isSimulatedStream,
    isRetakeSingle,
    retakeSlotIndex,
    capturedPhotos,
    onCompleteCapture,
    currentSlotIndex,
    totalSlots,
  ]);

  const startCountdown = () => {
    if (countdown !== null) return;
    let count = settings.countdownSeconds || 3;
    setCountdown(count);
    playCountdownBeep(false);

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playCountdownBeep(false);
      } else if (count === 0) {
        setCountdown(0);
        playCountdownBeep(true);
      } else {
        clearInterval(timer);
        setCountdown(null);
        captureCurrentFrame();
      }
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col justify-between p-6 md:p-8 border-[8px] border-black select-none">
      {isFlashing && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none animate-out fade-out duration-300" />
      )}

      <header className="flex items-center justify-between border-b-[5px] border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white px-3 py-1 font-mono text-xs font-bold tracking-widest uppercase">
            {isRetakeSingle ? 'ULANG FOTO' : `FOTO ${currentSlotIndex + 1} DARI ${totalSlots}`}
          </div>
          <h2 className="font-display text-xl uppercase">
            {isRetakeSingle ? `AMBIL ULANG SLOT ${retakeSlotIndex + 1}` : 'AMBIL FOTO POSE'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMirror(!isMirror)}
            className={`border-[3px] border-black px-3 py-1 font-mono text-xs flex items-center gap-1.5 cursor-pointer ${
              isMirror ? 'bg-black text-white' : 'bg-white text-black'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
            <span>MIRROR: {isMirror ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={startCamera}
            title="Restart Kamera"
            className="border-[3px] border-black p-2 bg-white hover:bg-neutral-100 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="my-auto py-4 max-w-5xl mx-auto w-full flex flex-col items-center">
        <div className="relative w-full aspect-[16/9] max-h-[65vh] bg-black border-[6px] border-black overflow-hidden flex items-center justify-center">
          {isSimulatedStream ? (
            <canvas
              ref={fallbackCanvasRef}
              width={1920}
              height={1080}
              className={`w-full h-full object-cover ${isMirror ? 'scale-x-[-1]' : ''}`}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isMirror ? 'scale-x-[-1]' : ''}`}
            />
          )}

          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start font-mono text-xs text-white drop-shadow-md">
              <span className="bg-black/70 px-2 py-0.5 border border-white">REC // 1080P 300DPI</span>
              <span className="bg-black/70 px-2 py-0.5 border border-white">
                SLOT {currentSlotIndex + 1}/{totalSlots}
              </span>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 border-2 border-white/60 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-white" />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-white" />
                <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-2 h-0.5 bg-white" />
                <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-2 h-0.5 bg-white" />
              </div>
            </div>

            <div className="flex justify-between items-end font-mono text-xs text-white drop-shadow-md">
              <span className="bg-black/70 px-2 py-0.5 border border-white">CANON UVC / WEBCAM</span>
              <span className="bg-black/70 px-2 py-0.5 border border-white">ASPECT 16:9 RAW</span>
            </div>
          </div>

          {countdown !== null && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
              <div className="font-display text-9xl md:text-[14rem] text-white animate-ping select-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                {countdown === 0 ? 'FLASH!' : countdown}
              </div>
            </div>
          )}

          {isSimulatedStream && (
            <div className="absolute bottom-4 left-4 bg-yellow-400 text-black border-[2px] border-black px-3 py-1 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Mode Uji Kamera (Simulasi Video Aktif)</span>
            </div>
          )}
        </div>

        <div className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase text-neutral-600">SLOT PROGRESS:</span>
            <div className="flex gap-2">
              {template.slots.map((s, idx) => (
                <div
                  key={s.id}
                  className={`w-9 h-9 border-[3px] border-black flex items-center justify-center font-mono text-xs font-bold ${
                    idx === currentSlotIndex
                      ? 'bg-black text-white'
                      : idx < capturedPhotos.length
                      ? 'bg-[#008000] text-white'
                      : 'bg-white text-black'
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={startCountdown}
            disabled={countdown !== null}
            className="brutal-btn-primary min-h-[64px] px-8 text-xl font-display flex items-center gap-3 cursor-pointer w-full sm:w-auto justify-center"
          >
            <Camera className="w-7 h-7" />
            <span>{countdown !== null ? 'BERSIAP...' : 'AMBIL FOTO (3-2-1)'}</span>
          </button>
        </div>
      </main>

      <footer className="border-t-[5px] border-black pt-4 font-mono text-xs text-neutral-600 flex justify-between uppercase">
        <span>PETUNJUK: LIHAT KE LENSA KAMERA SAAT HITUNG MUNDUR</span>
        <span>SENYUM DAN TAHAN POSE</span>
      </footer>
    </div>
  );
}
