import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Upload, Sparkles } from 'lucide-react';
import { detectSlotsFromImage } from '../../utils/slotDetection.js';

/**
 * TemplateEditorModal component (JavaScript)
 */
export function TemplateEditorModal({
  initialTemplate,
  isOpen,
  onSave,
  onClose,
}) {
  const [nama, setNama] = useState(initialTemplate?.nama || 'Template Kustom');
  const [paper, setPaper] = useState(initialTemplate?.paper || '4x6in');
  const [overlayUrl, setOverlayUrl] = useState(initialTemplate?.overlay || '');
  const [canvasDim, setCanvasDim] = useState({
    width: initialTemplate?.canvas?.width || 1200,
    height: initialTemplate?.canvas?.height || 1800,
  });
  const [slots, setSlots] = useState(
    initialTemplate?.slots || [
      { id: 'slot-1', order: 1, x: 80, y: 140, w: 500, h: 680 },
      { id: 'slot-2', order: 2, x: 620, y: 140, w: 500, h: 680 },
    ]
  );
  const [detectStatus, setDetectStatus] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result;
      setOverlayUrl(dataUrl);

      try {
        setDetectStatus('Menganalisis channel alpha & area transparan...');
        const detected = await detectSlotsFromImage(dataUrl);

        if (detected.slots && detected.slots.length > 0) {
          setSlots(detected.slots);
          setCanvasDim({ width: detected.width, height: detected.height });
          setDetectStatus(`Sukses mendeteksi ${detected.slots.length} slot foto otomatis!`);
        } else {
          setDetectStatus('Area transparan tidak ditemukan, silakan tambah slot manual.');
        }
      } catch (err) {
        console.error('Detection error', err);
        setDetectStatus('Gagal mendeteksi otomatis. Gunakan slot manual.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSlotChange = (index, field, value) => {
    setSlots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSlot = () => {
    const newIndex = slots.length + 1;
    setSlots((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}`,
        order: newIndex,
        x: 100,
        y: 100 + (newIndex - 1) * 300,
        w: 500,
        h: 400,
      },
    ]);
  };

  const handleRemoveSlot = (index) => {
    setSlots((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const handleSave = () => {
    if (!overlayUrl) {
      alert('Harap upload gambar template overlay PNG terlebih dahulu!');
      return;
    }

    const templateToSave = {
      id: initialTemplate?.id || `template-custom-${Date.now()}`,
      nama: nama.trim() || 'Template Baru',
      paper,
      overlay: overlayUrl,
      canvas: canvasDim,
      slots: slots.map((s, idx) => ({ ...s, order: idx + 1 })),
      aktif: initialTemplate?.aktif ?? true,
      isCustom: true,
    };

    onSave(templateToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="border-[6px] border-black bg-white w-full max-w-5xl my-6 p-6 relative max-h-[90vh] flex flex-col justify-between select-none">
        <div className="flex items-center justify-between border-b-[4px] border-black pb-4 mb-4">
          <div>
            <h2 className="font-display text-2xl uppercase">
              {initialTemplate ? 'EDIT TEMPLATE & KOREKSI SLOT' : 'TAMBAH TEMPLATE BARU'}
            </h2>
            <p className="font-mono text-xs text-neutral-500 uppercase">
              F-07 DETEKSI SLOT OTOMATIS + F-22 EDITOR KOORDINAT SLOT
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 border-[2px] border-black hover:bg-black hover:text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto pr-2 pb-4">
          <div className="md:col-span-7 space-y-4">
            <div className="border-[3px] border-black bg-[#f0f0f0] p-4 space-y-3">
              <div>
                <label className="font-display text-xs uppercase block mb-1">NAMA TEMPLATE</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="brutal-input text-sm"
                  placeholder="Contoh: Strip Vintage 4 Foto"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-xs uppercase block mb-1">UKURAN KERTAS</label>
                  <select
                    value={paper}
                    onChange={(e) => setPaper(e.target.value)}
                    className="brutal-input text-xs font-mono font-bold bg-white"
                  >
                    <option value="4x6in">4R (4x6 INCI - POSTCARD)</option>
                    <option value="2x6in">STRIP (2x6 INCI)</option>
                  </select>
                </div>

                <div>
                  <label className="font-display text-xs uppercase block mb-1">
                    DIMENSI KANVAS (PX)
                  </label>
                  <div className="font-mono text-xs p-2.5 border-[3px] border-black bg-white font-bold">
                    {canvasDim.width} x {canvasDim.height} PX
                  </div>
                </div>
              </div>

              <div>
                <label className="font-display text-xs uppercase block mb-1">
                  FILE OVERLAY PNG (TRANSPARAN)
                </label>
                <label className="brutal-btn-secondary w-full py-3 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer bg-white">
                  <Upload className="w-4 h-4" />
                  <span>UNGGAH PNG TEMPLATE DARI LAPTOP</span>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {detectStatus && (
                <div className="font-mono text-xs p-2 border-[2px] border-black bg-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0000ff]" />
                  <span>{detectStatus}</span>
                </div>
              )}
            </div>

            <div className="border-[3px] border-black bg-white p-4">
              <div className="flex items-center justify-between border-b-[2px] border-black pb-2 mb-3">
                <span className="font-display text-xs uppercase">
                  DAFTAR SLOT FOTO ({slots.length} SLOT)
                </span>
                <button
                  onClick={handleAddSlot}
                  className="font-mono text-xs font-bold px-2 py-1 border-[2px] border-black bg-[#f0f0f0] hover:bg-black hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>TAMBAH SLOT</span>
                </button>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {slots.map((slot, index) => (
                  <div
                    key={slot.id || index}
                    className="border-[2px] border-black p-2 bg-[#f9f9f9] flex flex-wrap items-center gap-2 text-xs font-mono"
                  >
                    <span className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      <span>X:</span>
                      <input
                        type="number"
                        value={slot.x}
                        onChange={(e) => handleSlotChange(index, 'x', Number(e.target.value))}
                        className="w-16 p-1 border border-black bg-white font-mono text-center"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span>Y:</span>
                      <input
                        type="number"
                        value={slot.y}
                        onChange={(e) => handleSlotChange(index, 'y', Number(e.target.value))}
                        className="w-16 p-1 border border-black bg-white font-mono text-center"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span>W:</span>
                      <input
                        type="number"
                        value={slot.w}
                        onChange={(e) => handleSlotChange(index, 'w', Number(e.target.value))}
                        className="w-16 p-1 border border-black bg-white font-mono text-center"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span>H:</span>
                      <input
                        type="number"
                        value={slot.h}
                        onChange={(e) => handleSlotChange(index, 'h', Number(e.target.value))}
                        className="w-16 p-1 border border-black bg-white font-mono text-center"
                      />
                    </div>

                    <button
                      onClick={() => handleRemoveSlot(index)}
                      className="ml-auto p-1 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col">
            <span className="font-display text-xs uppercase mb-2">
              PRATINJAU SLOT BERNOMOR (F-07)
            </span>
            <div className="w-full flex-1 min-h-[340px] bg-neutral-200 border-[4px] border-black relative overflow-hidden flex items-center justify-center p-2">
              {overlayUrl ? (
                <div
                  className="relative w-full h-full max-h-[420px] flex items-center justify-center"
                  style={{ aspectRatio: `${canvasDim.width} / ${canvasDim.height}` }}
                >
                  <img
                    src={overlayUrl}
                    alt="Template Preview"
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />

                  {slots.map((slot, index) => {
                    const leftPct = (slot.x / canvasDim.width) * 100;
                    const topPct = (slot.y / canvasDim.height) * 100;
                    const widthPct = (slot.w / canvasDim.width) * 100;
                    const heightPct = (slot.h / canvasDim.height) * 100;

                    return (
                      <div
                        key={slot.id || index}
                        className="absolute border-2 border-red-500 bg-red-500/20 flex items-center justify-center pointer-events-none"
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                        }}
                      >
                        <span className="bg-red-600 text-white font-mono font-bold text-xs px-1.5 py-0.5 border border-white">
                          #{index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="font-mono text-xs text-neutral-500 text-center p-4">
                  Unggah file PNG template untuk melihat kotak slot otomatis
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t-[4px] border-black pt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="brutal-btn-secondary py-2.5 px-6 min-h-[48px] text-xs font-mono cursor-pointer"
          >
            BATAL
          </button>
          <button
            onClick={handleSave}
            className="brutal-btn-primary py-2.5 px-8 min-h-[48px] text-sm font-display flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>SIMPAN TEMPLATE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
