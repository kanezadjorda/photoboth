import React from 'react';
import { RotateCcw, Check, Printer } from 'lucide-react';

/**
 * ReviewScreen component (JavaScript)
 */
export function ReviewScreen({
  template,
  photos,
  retakeCount,
  onRetakeSlot,
  onConfirmPrint,
}) {
  return (
    <div className="relative min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col justify-between p-6 md:p-10 border-[8px] border-black select-none">
      <header className="flex items-center justify-between border-b-[5px] border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white px-3 py-1 font-mono text-xs font-bold tracking-widest uppercase">
            LANGKAH 3/4
          </div>
          <h2 className="font-display text-xl md:text-2xl uppercase">REVIEW FOTO & RETAKE</h2>
        </div>

        <div className="border-[3px] border-black bg-white px-3 py-1 font-mono text-xs uppercase">
          BATAS RETAKE: MAKS 1X PER SLOT (F-10)
        </div>
      </header>

      <main className="my-auto py-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {photos.map((photoUrl, index) => {
            const retakesUsed = (retakeCount && retakeCount[index]) || 0;
            const canRetake = retakesUsed < 1;

            return (
              <div
                key={index}
                className="border-[4px] border-black bg-white p-3 flex flex-col justify-between relative group"
              >
                <div className="flex items-center justify-between border-b-[2px] border-black pb-2 mb-2 font-mono text-xs">
                  <span className="font-bold">SLOT #{index + 1}</span>
                  <span
                    className={`px-1.5 py-0.5 border text-[10px] font-bold ${
                      canRetake
                        ? 'bg-[#008000] text-white border-black'
                        : 'bg-[#dadada] text-neutral-600 border-neutral-400'
                    }`}
                  >
                    {canRetake ? 'RETAKE TERSEDIA' : 'RETAKE HABIS'}
                  </span>
                </div>

                <div className="aspect-[4/3] bg-black border-[3px] border-black overflow-hidden mb-3">
                  <img
                    src={photoUrl}
                    alt={`Slot ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <button
                  onClick={() => onRetakeSlot(index)}
                  disabled={!canRetake}
                  className={`w-full py-2.5 px-2 font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 border-[3px] border-black transition-colors ${
                    canRetake
                      ? 'bg-white hover:bg-black hover:text-white cursor-pointer'
                      : 'bg-[#f0f0f0] text-neutral-400 border-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{canRetake ? 'ULANG FOTO INI' : 'SUDAH DIRETAKE'}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="border-[5px] border-black bg-white p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 border-[3px] border-black bg-[#f0f0f0] flex items-center justify-center">
              <Check className="w-8 h-8 text-[#008000]" />
            </div>
            <div>
              <div className="font-display text-xl uppercase">SUDAH PUAS DENGAN HASILNYA?</div>
              <div className="font-sans text-xs text-neutral-600">
                Klik tombol cetak di samping untuk memulai komposit 300 DPI dan pencetakan otomatis ke printer.
              </div>
            </div>
          </div>

          <button
            onClick={onConfirmPrint}
            className="brutal-btn-primary min-h-[64px] px-8 text-xl font-display flex items-center gap-3 cursor-pointer w-full md:w-auto justify-center"
          >
            <Printer className="w-6 h-6" />
            <span>CETAK SEKARANG</span>
          </button>
        </div>
      </main>

      <footer className="border-t-[5px] border-black pt-4 font-mono text-xs text-neutral-500 uppercase flex justify-between">
        <span>SETIAP FOTO AKAN DIKOMPOSITKAN DENGAN TEMPLATE: {template.nama.toUpperCase()}</span>
        <span>HASIL CETAK 4R / STRIP BERSIFAT FINAL</span>
      </footer>
    </div>
  );
}
