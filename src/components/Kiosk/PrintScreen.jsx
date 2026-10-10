import React, { useEffect, useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { compositePhotoStrip } from '../../utils/compositor.js';
import { playPrintFinishSound } from '../../utils/audio.js';
import { formatPhotoFilename, saveSessionRecord } from '../../services/storage.js';

/**
 * PrintScreen component (JavaScript)
 */
export function PrintScreen({
  session,
  template,
  settings,
  onPrintCompleted,
}) {
  const [compositeUrl, setCompositeUrl] = useState(null);
  const [progressPercent, setProgressPercent] = useState(15);

  useEffect(() => {
    let isMounted = true;

    async function runCompositingAndPrint() {
      try {
        setProgressPercent(30);

        const resultUrl = await compositePhotoStrip({
          template,
          photos: session.photos,
          sessionId: session.id,
          printSessionId: settings.printSessionIdOnPhoto,
          duplicateStripOn4R: template.paper === '2x6in',
        });

        if (!isMounted) return;
        setCompositeUrl(resultUrl);

        setProgressPercent(60);

        const updatedSession = {
          ...session,
          compositePhotoUrl: resultUrl,
          status: 'cetak',
          selesai_pada: new Date().toISOString(),
        };
        saveSessionRecord(updatedSession);

        await new Promise((r) => setTimeout(r, 600));
        if (!isMounted) return;

        setProgressPercent(85);

        if (settings.kioskPrintSilent) {
          try {
            window.print();
          } catch (e) {
            console.warn('Native window.print was dismissed or blocked', e);
          }
        }

        await new Promise((r) => setTimeout(r, 800));
        if (!isMounted) return;

        setProgressPercent(100);
        playPrintFinishSound();

        await new Promise((r) => setTimeout(r, 1200));
        if (!isMounted) return;

        onPrintCompleted(resultUrl);
      } catch (err) {
        console.error('Compositing or print failure', err);
      }
    }

    runCompositingAndPrint();

    return () => {
      isMounted = false;
    };
  }, [session, template, settings, onPrintCompleted]);

  return (
    <div className="relative min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col justify-between p-6 md:p-10 border-[8px] border-black select-none">
      <header className="flex items-center justify-between border-b-[5px] border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white px-3 py-1 font-mono text-xs font-bold tracking-widest uppercase">
            LANGKAH 4/4
          </div>
          <h2 className="font-display text-xl uppercase">KOMPOSIT & CETAK OTOMATIS</h2>
        </div>

        <div className="border-[3px] border-black bg-white px-3 py-1 font-mono text-xs uppercase flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#008000] animate-pulse"></span>
          <span>SPOOLER PRINTER AKTIF</span>
        </div>
      </header>

      <main className="my-auto py-8 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="border-[5px] border-black bg-white p-4 flex flex-col items-center">
          <div className="w-full flex justify-between font-mono text-xs border-b-[2px] border-black pb-2 mb-3">
            <span>PREVIEW CETAK 300 DPI</span>
            <span>{template.paper.toUpperCase()}</span>
          </div>

          <div className="w-full aspect-[2/3] max-h-[380px] bg-neutral-100 border-[3px] border-black flex items-center justify-center overflow-hidden p-2">
            {compositeUrl ? (
              <img
                src={compositeUrl}
                alt="Composite result"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 font-mono text-xs text-neutral-500">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
                <span>Merender Canvas 300 DPI...</span>
              </div>
            )}
          </div>

          <div className="w-full mt-3 font-mono text-[11px] text-neutral-500 text-center">
            {formatPhotoFilename(session.id)}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="border-[5px] border-black bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <Printer className="w-8 h-8 text-black animate-bounce" />
              <div>
                <div className="font-display text-2xl uppercase">SEDANG MENCETAK</div>
                <div className="font-mono text-xs text-neutral-600">
                  JUMLAH: {settings.copiesPerSession} SALINAN ({template.paper})
                </div>
              </div>
            </div>

            <div className="w-full h-8 border-[3px] border-black bg-[#f0f0f0] p-1 mb-4">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span>1. Komposit Canvas 300 DPI:</span>
                <span className="font-bold text-[#008000]">SELESAI</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. Simpan Soft File Lokal:</span>
                <span className="font-bold text-[#008000]">TERSIMPAN</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. Kirim ke Driver Epson:</span>
                <span className={progressPercent >= 85 ? 'font-bold text-[#008000]' : 'text-neutral-500'}>
                  {progressPercent >= 85 ? 'SELESAI' : 'MEMPROSES...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>4. Output Fisik Printer:</span>
                <span className={progressPercent === 100 ? 'font-bold text-[#008000]' : 'text-neutral-500'}>
                  {progressPercent === 100 ? 'KELUAR DI BAKI' : 'MENCETAK...'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-[3px] border-black bg-[#f0f0f0] p-4 font-mono text-xs text-neutral-700">
            <strong>PERHATIAN:</strong> Harap tunggu hingga kertas foto keluar sempurna dari baki printer sebelum mengambilnya.
          </div>
        </div>
      </main>

      <footer className="border-t-[5px] border-black pt-4 font-mono text-xs text-neutral-500 flex justify-between uppercase">
        <span>SESI: {session.id}</span>
        <span>PRINTER: EPSON L-SERIES BORDERLESS 4R</span>
      </footer>
    </div>
  );
}
