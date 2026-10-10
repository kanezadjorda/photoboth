import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, RefreshCw, QrCode, ExternalLink } from 'lucide-react';
import { formatPhotoFilename } from '../../services/storage.js';

/**
 * FinishedScreen component (JavaScript)
 */
export function FinishedScreen({
  session,
  settings,
  compositePhotoUrl,
  onResetToWelcome,
}) {
  const [countdown, setCountdown] = useState(settings.autoResetFinishSeconds || 15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onResetToWelcome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onResetToWelcome, settings.autoResetFinishSeconds]);

  const handleDownloadSoftFile = () => {
    const a = document.createElement('a');
    a.href = compositePhotoUrl;
    a.download = formatPhotoFilename(session.id);
    a.click();
  };

  return (
    <div className="relative min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col justify-between p-6 md:p-10 border-[8px] border-black select-none">
      <header className="flex items-center justify-between border-b-[5px] border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#008000] text-white px-3 py-1 font-mono text-xs font-bold tracking-widest uppercase">
            STATUS: SELESAI
          </div>
          <h2 className="font-display text-xl uppercase">AMBIL HASIL CETAKMU!</h2>
        </div>

        <div className="border-[3px] border-black bg-white px-3 py-1 font-mono text-xs uppercase">
          RESET OTOMATIS: {countdown} DETIK
        </div>
      </header>

      <main className="my-auto py-6 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="border-[5px] border-black bg-white p-4 flex flex-col items-center">
          <div className="w-full flex justify-between font-mono text-xs border-b-[2px] border-black pb-2 mb-3">
            <span className="font-bold">HASIL CETAKAN FISIK</span>
            <span className="text-[#008000] font-bold">100% SUKSES</span>
          </div>

          <div className="w-full aspect-[2/3] max-h-[360px] bg-neutral-100 border-[3px] border-black flex items-center justify-center overflow-hidden p-2">
            <img
              src={compositePhotoUrl}
              alt="Hasil Cetak"
              className="w-full h-full object-contain"
            />
          </div>

          <button
            onClick={handleDownloadSoftFile}
            className="w-full mt-3 brutal-btn-secondary min-h-[44px] py-2 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>UNDUH SOFT FILE LANGSUNG (.JPG)</span>
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="border-[5px] border-black bg-white p-6">
            <div className="flex items-center gap-2 text-[#008000] font-display text-xl uppercase mb-2">
              <CheckCircle2 className="w-7 h-7" />
              <span>TERIMA KASIH!</span>
            </div>

            <p className="font-sans text-sm text-neutral-800 mb-4 leading-relaxed">
              Foto fisikmu sudah keluar di baki printer. Foto digital berkualitas tinggi (soft file) juga telah disimpan ke folder Google Drive event.
            </p>

            <div className="border-[3px] border-black bg-[#f0f0f0] p-4 mb-4">
              <div className="flex items-center justify-between font-mono text-xs text-neutral-600 mb-2">
                <span>GOOGLE DRIVE SYNC FOLDER:</span>
                <span className="text-[#0000ff] flex items-center gap-1 font-bold">
                  ONLINE <ExternalLink className="w-3 h-3" />
                </span>
              </div>
              <div className="font-mono text-xs font-bold break-all bg-white p-2 border-[2px] border-black mb-2">
                {settings.driveFolderUrl}
              </div>
              <div className="font-mono text-xs text-neutral-700">
                Nama File Kamu: <strong className="text-black">#{session.id}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 border-[2px] border-black bg-white p-3 font-mono text-xs">
              <QrCode className="w-8 h-8 text-black shrink-0" />
              <span>
                Atau scan QR code yang tercetak di kertas fotomu untuk langsung membuka album Google Drive.
              </span>
            </div>
          </div>

          <button
            onClick={onResetToWelcome}
            className="brutal-btn-primary min-h-[64px] text-lg font-display flex items-center justify-center gap-3 cursor-pointer"
          >
            <RefreshCw className="w-6 h-6" />
            <span>SELESAI (KEMBALI KE BERANDA)</span>
          </button>
        </div>
      </main>

      <footer className="border-t-[5px] border-black pt-4 font-mono text-xs text-neutral-500 uppercase flex justify-between">
        <span>SAMPAI JUMPA DI SESI BERIKUTNYA</span>
        <span>BOOTH OPERATIONAL MVP // 2026</span>
      </footer>
    </div>
  );
}
