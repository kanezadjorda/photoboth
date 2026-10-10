import React, { useState } from 'react';
import { ArrowRight, Layers } from 'lucide-react';

/**
 * TemplateSelectScreen component (JavaScript)
 */
export function TemplateSelectScreen({ templates, onSelectTemplate }) {
  const activeTemplates = templates.filter((t) => t.aktif);
  const [selectedId, setSelectedId] = useState(activeTemplates[0]?.id || '');

  const selectedTemplate = activeTemplates.find((t) => t.id === selectedId) || activeTemplates[0];

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col justify-between p-6 md:p-10 border-[8px] border-black select-none">
      <header className="flex items-center justify-between border-b-[5px] border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white px-3 py-1 font-mono text-xs font-bold tracking-widest uppercase">
            LANGKAH 2/4
          </div>
          <h2 className="font-display text-xl md:text-2xl uppercase">PILIH TEMPLATE CETAKAN</h2>
        </div>

        <div className="font-mono text-xs uppercase px-3 py-1 border-[3px] border-black bg-white">
          TERSEDIA: {activeTemplates.length} DESAIN
        </div>
      </header>

      <main className="my-auto py-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {activeTemplates.map((template) => {
            const isSelected = template.id === selectedId;
            return (
              <div
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                className={`relative cursor-pointer transition-all flex flex-col justify-between p-4 bg-white border-[4px] ${
                  isSelected
                    ? 'border-black ring-4 ring-black/20 bg-[#f0f0f0]'
                    : 'border-black hover:bg-neutral-50'
                }`}
              >
                <div className="w-full aspect-[2/3] bg-neutral-200 border-[3px] border-black mb-3 overflow-hidden flex items-center justify-center p-2 relative">
                  {template.overlay ? (
                    <img
                      src={template.overlay}
                      alt={template.nama}
                      className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
                    />
                  ) : (
                    <Layers className="w-12 h-12 text-neutral-400" />
                  )}

                  <div className="absolute top-2 left-2 bg-black text-white font-mono text-xs px-2 py-0.5 border border-white">
                    {template.slots.length} FOTO
                  </div>
                </div>

                <div>
                  <div className="font-display text-sm md:text-base uppercase leading-tight line-clamp-1 mb-1">
                    {template.nama}
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-neutral-600 border-t border-black/20 pt-2">
                    <span>{template.paper.toUpperCase()}</span>
                    <span>{template.slots.length} SLOT</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 bg-black text-white text-center py-1 font-mono text-xs font-bold uppercase tracking-wider">
                    [ TERPILIH ]
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-[5px] border-black bg-white p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 border-[3px] border-black bg-[#f0f0f0] flex items-center justify-center font-display text-2xl">
              {selectedTemplate?.slots.length}
            </div>
            <div>
              <div className="font-mono text-xs uppercase text-neutral-500">TEMPLATE TERPILIH</div>
              <div className="font-display text-xl uppercase">{selectedTemplate?.nama}</div>
              <div className="font-sans text-xs text-neutral-600">
                Kamu akan mengambil {selectedTemplate?.slots.length} foto berurutan di layar berikutnya.
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="brutal-btn-primary min-h-[64px] px-8 text-lg font-display flex items-center gap-3 w-full md:w-auto justify-center cursor-pointer"
          >
            <span>LANJUT KE KAMERA</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </main>

      <footer className="border-t-[5px] border-black pt-4 font-mono text-xs text-neutral-500 uppercase flex justify-between">
        <span>TIPS: POSISI BERDIRI TEGAK DI DEPAN KAMERA</span>
        <span>SIAPKAN POSEMU TERBAIK</span>
      </footer>
    </div>
  );
}
