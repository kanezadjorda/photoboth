import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Printer,
  Layers,
  History,
  Settings as SettingsIcon,
  RotateCcw,
  Plus,
  AlertOctagon,
  FileSpreadsheet,
} from 'lucide-react';
import { TemplateEditorModal } from './TemplateEditorModal.jsx';
import { exportSessionsToCSV, saveSessionRecord } from '../../services/storage.js';
import { markPaymentAsPaid } from '../../services/qris.js';

/**
 * AdminDashboard component (JavaScript)
 */
export function AdminDashboard({
  settings,
  templates,
  sessions,
  currentSession,
  currentStep,
  onUpdateSettings,
  onUpdateTemplates,
  onReprintSession,
  onEmergencyReset,
  onCloseAdmin,
}) {
  const [activeTab, setActiveTab] = useState('devices');

  const [videoDevices, setVideoDevices] = useState([]);
  const [testStream, setTestStream] = useState(null);
  const testVideoRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('Memeriksa kamera...');

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [formSettings, setFormSettings] = useState({ ...settings });
  const [settingsSavedBanner, setSettingsSavedBanner] = useState(false);

  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
      } catch (err) {
        console.warn('Failed to enumerate devices', err);
      }
    }
    getDevices();
  }, []);

  useEffect(() => {
    if (activeTab !== 'devices') {
      if (testStream) {
        testStream.getTracks().forEach((t) => t.stop());
        setTestStream(null);
      }
      return;
    }

    async function startTestCamera() {
      try {
        setCameraStatus('Menghubungkan ke kamera...');
        if (testStream) {
          testStream.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: formSettings.selectedCameraDeviceId
              ? { exact: formSettings.selectedCameraDeviceId }
              : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        setTestStream(stream);
        if (testVideoRef.current) {
          testVideoRef.current.srcObject = stream;
        }
        setCameraStatus('Kamera terhubung (1080p / 30 FPS)');
      } catch (err) {
        console.warn('Test camera failed or denied', err);
        setCameraStatus('Kamera eksternal tidak terdeteksi (Gunakan USB UVC atau HDMI Capture Card)');
      }
    }

    startTestCamera();

    return () => {
      if (testStream) {
        testStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeTab, formSettings.selectedCameraDeviceId]);

  const handleTestPrint = () => {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1200;
    testCanvas.height = 1800;
    const ctx = testCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 1800);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 1180, 1780);

    const colors = ['#000000', '#0000ff', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'];
    colors.forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.fillRect(80 + idx * 150, 150, 140, 200);
    });

    ctx.fillStyle = '#000000';
    ctx.font = '900 48px "Archivo Black", sans-serif';
    ctx.fillText('TES CETAK PRINTER 4R (300 DPI)', 80, 440);

    ctx.font = '700 24px "Space Mono", monospace';
    ctx.fillText(`WAKTU TES: ${new Date().toLocaleString('id-ID')}`, 80, 500);
    ctx.fillText('TARGET: EPSON BORDERLESS 4R (1200x1800 PX)', 80, 540);
    ctx.fillText('STATUS: ALIGNMENT & COLOR ACCURACY VERIFIED', 80, 580);

    ctx.beginPath();
    ctx.arc(600, 1000, 200, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.moveTo(600, 750);
    ctx.lineTo(600, 1250);
    ctx.moveTo(350, 1000);
    ctx.lineTo(850, 1000);
    ctx.stroke();

    const dataUrl = testCanvas.toDataURL('image/jpeg');
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <style>
              @page { size: 4in 6in; margin: 0; }
              body { margin: 0; padding: 0; }
              img { width: 100%; height: 100%; object-fit: cover; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <img src="${dataUrl}" />
          </body>
        </html>
      `);
      win.document.close();
    } else {
      window.print();
    }
  };

  const handleToggleTemplate = (templateId) => {
    const updated = templates.map((t) =>
      t.id === templateId ? { ...t, aktif: !t.aktif } : t
    );
    onUpdateTemplates(updated);
  };

  const handleDeleteTemplate = (templateId) => {
    if (confirm('Hapus template ini dari daftar?')) {
      const updated = templates.filter((t) => t.id !== templateId);
      onUpdateTemplates(updated);
    }
  };

  const handleSaveTemplate = (saved) => {
    const existingIndex = templates.findIndex((t) => t.id === saved.id);
    if (existingIndex >= 0) {
      const updated = [...templates];
      updated[existingIndex] = saved;
      onUpdateTemplates(updated);
    } else {
      onUpdateTemplates([...templates, saved]);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    onUpdateSettings(formSettings);
    setSettingsSavedBanner(true);
    setTimeout(() => setSettingsSavedBanner(false), 2500);
  };

  const totalRevenue = sessions
    .filter((s) => s.paymentStatus === 'PAID' || s.paymentStatus === 'MANUAL_CONFIRMED')
    .reduce((sum, s) => sum + Number(s.nominal || 0), 0);

  const completedSessions = sessions.filter((s) => s.status === 'selesai').length;
  const totalPrints = sessions
    .filter((s) => s.status === 'selesai' || s.status === 'cetak')
    .reduce((sum, s) => sum + (s.copies || 1), 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#f9f9f9] text-[#1a1c1c] flex flex-col border-[8px] border-black select-none overflow-hidden">
      <header className="bg-black text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b-[5px] border-black">
        <div className="flex items-center gap-3">
          <div className="bg-white text-black font-mono text-xs px-2.5 py-1 font-bold">
            PANEL OPERATOR
          </div>
          <h1 className="font-display text-xl uppercase tracking-wider">
            ADMINISTRASI PHOTOBOOTH
          </h1>
        </div>

        <div className="flex items-center gap-1 bg-[#1b1b1b] p-1 border-[2px] border-white/20 flex-wrap">
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'devices' ? 'bg-white text-black' : 'text-white hover:bg-neutral-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>TES PERANGKAT</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'templates' ? 'bg-white text-black' : 'text-white hover:bg-neutral-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>TEMPLATE</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-black' : 'text-white hover:bg-neutral-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>RIWAYAT & LAPORAN</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings' ? 'bg-white text-black' : 'text-white hover:bg-neutral-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>PENGATURAN</span>
          </button>

          <button
            onClick={() => setActiveTab('remote')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'remote' ? 'bg-[#ff0000] text-white' : 'text-white hover:bg-neutral-800'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>KONTROL DARURAT</span>
          </button>
        </div>

        <button
          onClick={onCloseAdmin}
          className="brutal-btn-secondary bg-white text-black py-1.5 px-4 min-h-[40px] text-xs font-mono font-bold cursor-pointer"
        >
          KEMBALI KE KIOSK &times;
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {activeTab === 'devices' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="border-[5px] border-black bg-white p-6">
              <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-6 h-6" />
                  <h2 className="font-display text-xl uppercase">TES KAMERA EKSTERNAL & LIVE FEED</h2>
                </div>
                <div className="font-mono text-xs bg-[#f0f0f0] border-[2px] border-black px-3 py-1">
                  STATUS: {cameraStatus}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 aspect-[16/9] bg-black border-[4px] border-black relative overflow-hidden flex items-center justify-center">
                  <video
                    ref={testVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      formSettings.mirrorCamera ? 'scale-x-[-1]' : ''
                    }`}
                  />
                  <div className="absolute top-2 left-2 bg-black/80 text-white font-mono text-[10px] px-2 py-0.5 border border-white">
                    LIVE RESOLUSI TERTINGGI // UVC
                  </div>
                </div>

                <div className="md:col-span-5 space-y-4 font-mono text-xs">
                  <div>
                    <label className="font-display text-xs uppercase block mb-1">
                      PILIH PERANGKAT KAMERA (CANON / UVC):
                    </label>
                    <select
                      value={formSettings.selectedCameraDeviceId}
                      onChange={(e) => {
                        const updated = {
                          ...formSettings,
                          selectedCameraDeviceId: e.target.value,
                        };
                        setFormSettings(updated);
                        onUpdateSettings(updated);
                      }}
                      className="brutal-input text-xs font-bold"
                    >
                      <option value="">Default Kamera Sistem</option>
                      {videoDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Camera ${d.deviceId.substring(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-[2px] border-black bg-[#f0f0f0] p-3 space-y-1">
                    <div>
                      <strong>TIPS CANON DSLR DI MAC/WINDOWS:</strong>
                    </div>
                    <p className="font-sans text-[11px] text-neutral-700">
                      Browser membaca kamera lewat sinyal UVC. Gunakan <em>HDMI Capture Card</em> (clean HDMI out) atau <em>Canon EOS Webcam Utility</em>. Pasang dummy battery dan matikan fitur auto-power off pada DSLR.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={formSettings.mirrorCamera}
                      onChange={(e) => {
                        const updated = {
                          ...formSettings,
                          mirrorCamera: e.target.checked,
                        };
                        setFormSettings(updated);
                        onUpdateSettings(updated);
                      }}
                      className="w-5 h-5 accent-black"
                    />
                    <span>AKTIFKAN CERMIN (MIRROR PREVIEW)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-[5px] border-black bg-white p-6">
              <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Printer className="w-6 h-6" />
                  <h2 className="font-display text-xl uppercase">TES PRINTER EKSTERNAL (EPSON 4R)</h2>
                </div>
                <button
                  onClick={handleTestPrint}
                  className="brutal-btn-primary py-2 px-6 min-h-[44px] text-xs font-mono cursor-pointer"
                >
                  KIRIM TES CETAK 4R (BORDERLESS)
                </button>
              </div>

              <div className="font-sans text-xs text-neutral-700 leading-relaxed">
                Tombol di atas akan mencetak pola tes 300 DPI berisi color bars nozzle dan garis kalibrasi potongan borderless 4R. Pastikan ukuran kertas di driver printer Epson sudah diset ke <strong>4×6 in (10×15 cm) borderless</strong>.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-[4px] border-black pb-4">
              <div>
                <h2 className="font-display text-2xl uppercase">KELOLA TEMPLATE CETAKAN</h2>
                <p className="font-mono text-xs text-neutral-500 uppercase">
                  F-07 DETEKSI TRANSPARANSI OTOMATIS &bull; F-22 KOREKSI KOORDINAT SLOT
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsEditorOpen(true);
                }}
                className="brutal-btn-primary py-3 px-6 min-h-[48px] text-xs font-display flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>TAMBAH TEMPLATE (UPLOAD PNG)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`border-[4px] border-black bg-white p-4 flex flex-col justify-between ${
                    !tpl.aktif ? 'opacity-50' : ''
                  }`}
                >
                  <div className="aspect-[2/3] bg-neutral-200 border-[3px] border-black mb-3 overflow-hidden flex items-center justify-center p-2 relative">
                    <img
                      src={tpl.overlay}
                      alt={tpl.nama}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-black text-white font-mono text-[10px] px-2 py-0.5 border border-white">
                      {tpl.slots ? tpl.slots.length : 0} SLOT FOTO
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-base uppercase leading-tight line-clamp-1 mb-1">
                      {tpl.nama}
                    </h3>
                    <div className="font-mono text-xs text-neutral-500 flex justify-between border-t border-black/20 pt-1 mb-3">
                      <span>{String(tpl.paper).toUpperCase()}</span>
                      <span>
                        {tpl.canvas?.width}x{tpl.canvas?.height}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t-[2px] border-black">
                    <button
                      onClick={() => handleToggleTemplate(tpl.id)}
                      className={`w-full py-1.5 px-2 font-mono text-xs font-bold uppercase border-[2px] border-black cursor-pointer ${
                        tpl.aktif
                          ? 'bg-[#008000] text-white hover:bg-black'
                          : 'bg-[#f0f0f0] text-neutral-500 hover:bg-black hover:text-white'
                      }`}
                    >
                      {tpl.aktif ? 'AKTIF DI KIOSK' : 'NONAKTIF'}
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setIsEditorOpen(true);
                        }}
                        className="flex-1 py-1.5 font-mono text-xs font-bold border-[2px] border-black bg-white hover:bg-black hover:text-white cursor-pointer"
                      >
                        EDIT SLOT
                      </button>

                      {tpl.isCustom && (
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="px-2 font-mono text-xs border-[2px] border-black text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                        >
                          HAPUS
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-[4px] border-black bg-white p-4">
                <div className="font-mono text-xs uppercase text-neutral-500 mb-1">
                  TOTAL SESI BERHASIL
                </div>
                <div className="font-display text-3xl">{completedSessions}</div>
                <div className="font-mono text-xs text-neutral-600 mt-1">
                  Dari total {sessions.length} sesi
                </div>
              </div>

              <div className="border-[4px] border-black bg-white p-4">
                <div className="font-mono text-xs uppercase text-neutral-500 mb-1">
                  TOTAL PENDAPATAN
                </div>
                <div className="font-display text-3xl">
                  Rp {totalRevenue.toLocaleString('id-ID')}
                </div>
                <div className="font-mono text-xs text-[#008000] mt-1 font-bold">QRIS TERVERIFIKASI</div>
              </div>

              <div className="border-[4px] border-black bg-white p-4">
                <div className="font-mono text-xs uppercase text-neutral-500 mb-1">
                  TOTAL LEMBAR CETAK
                </div>
                <div className="font-display text-3xl">{totalPrints}</div>
                <div className="font-mono text-xs text-neutral-600 mt-1">4R Borderless</div>
              </div>

              <div className="border-[4px] border-black bg-white p-4 flex flex-col justify-between">
                <div className="font-mono text-xs uppercase text-neutral-500 mb-1">
                  EKSPOR DATA (F-15)
                </div>
                <button
                  onClick={() => exportSessionsToCSV(sessions)}
                  className="brutal-btn-primary py-2 px-3 min-h-[44px] text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>UNDUH CSV LAPORAN</span>
                </button>
              </div>
            </div>

            <div className="border-[4px] border-black bg-white p-4">
              <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                <h3 className="font-display text-lg uppercase">DAFTAR RIWAYAT TRANSAKSI & FOTO</h3>
                <span className="font-mono text-xs text-neutral-500">
                  {sessions.length} TRANSAKSI TERCATAT
                </span>
              </div>

              {sessions.length === 0 ? (
                <div className="py-12 text-center font-mono text-sm text-neutral-500">
                  Belum ada riwayat transaksi. Mulai sesi dari layar Kiosk untuk mencatat.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b-[3px] border-black bg-[#f0f0f0]">
                        <th className="p-3">ID SESI / ORDER</th>
                        <th className="p-3">WAKTU</th>
                        <th className="p-3">NOMINAL</th>
                        <th className="p-3">STATUS BAYAR</th>
                        <th className="p-3">STATUS SESI</th>
                        <th className="p-3 text-right">AKSI OPERATOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id} className="border-b border-black/20 hover:bg-[#f9f9f9]">
                          <td className="p-3">
                            <div className="font-bold text-black">#{s.id}</div>
                            <div className="text-[10px] text-neutral-500">{s.orderId}</div>
                          </td>
                          <td className="p-3 text-neutral-700">
                            {new Date(s.dibuat_pada).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="p-3 font-bold">
                            Rp {Number(s.nominal).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 border text-[10px] font-bold ${
                                s.paymentStatus === 'PAID'
                                  ? 'bg-[#008000] text-white border-black'
                                  : s.paymentStatus === 'MANUAL_CONFIRMED'
                                  ? 'bg-[#0000ff] text-white border-black'
                                  : 'bg-[#ffa500] text-black border-black'
                              }`}
                            >
                              {s.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3 uppercase font-bold text-neutral-700">
                            {s.status}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {s.paymentStatus === 'PENDING' && (
                              <button
                                onClick={() => {
                                  markPaymentAsPaid(s.orderId, true);
                                  const updated = {
                                    ...s,
                                    paymentStatus: 'MANUAL_CONFIRMED',
                                  };
                                  saveSessionRecord(updated);
                                }}
                                className="px-2 py-1 border border-black bg-white hover:bg-black hover:text-white text-[10px] font-bold cursor-pointer"
                              >
                                KONFIRMASI (F-04)
                              </button>
                            )}

                            {s.compositePhotoUrl && (
                              <button
                                onClick={() => onReprintSession(s)}
                                className="px-3 py-1 border-[2px] border-black bg-black text-white hover:bg-white hover:text-black text-[10px] font-bold cursor-pointer"
                              >
                                CETAK ULANG (F-13)
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <form onSubmit={handleSaveSettings} className="border-[5px] border-black bg-white p-6 space-y-6">
              <div className="flex items-center justify-between border-b-[3px] border-black pb-3">
                <h2 className="font-display text-xl uppercase">PENGATURAN HARGA & OPERASIONAL</h2>
                {settingsSavedBanner && (
                  <span className="bg-[#008000] text-white font-mono text-xs px-3 py-1 font-bold animate-pulse">
                    PENGATURAN TERSIMPAN!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                <div>
                  <label className="font-display text-xs uppercase block mb-1">
                    HARGA PER SESI FOTO (RP):
                  </label>
                  <input
                    type="number"
                    value={formSettings.sessionPrice}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, sessionPrice: Number(e.target.value) })
                    }
                    className="brutal-input text-base font-bold"
                  />
                  <span className="text-neutral-500 text-[11px] mt-1 block">
                    Berlaku sama untuk semua pilihan template (PRD Bagian 5).
                  </span>
                </div>

                <div>
                  <label className="font-display text-xs uppercase block mb-1">
                    JUMLAH SALINAN CETAK (COPIES):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formSettings.copiesPerSession}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        copiesPerSession: Number(e.target.value),
                      })
                    }
                    className="brutal-input text-base font-bold"
                  />
                  <span className="text-neutral-500 text-[11px] mt-1 block">
                    Default 1 lembar; bisa diatur 2 untuk pengunjung berpasangan.
                  </span>
                </div>

                <div>
                  <label className="font-display text-xs uppercase block mb-1">
                    PIN KEAMANAN ADMIN:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formSettings.adminPin}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, adminPin: e.target.value })
                    }
                    className="brutal-input text-base font-bold"
                  />
                </div>

                <div>
                  <label className="font-display text-xs uppercase block mb-1">
                    FOLDER PENYIMPANAN LOCAL / DRIVE (F-18):
                  </label>
                  <input
                    type="text"
                    value={formSettings.outputFolderName}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, outputFolderName: e.target.value })
                    }
                    className="brutal-input text-xs font-bold"
                  />
                  <span className="text-neutral-500 text-[11px] mt-1 block">
                    Folder lokal yang disinkronkan Google Drive for Desktop.
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="font-display text-xs uppercase block mb-1">
                    URL FOLDER GOOGLE DRIVE PUBLIK (QR CETAKAN):
                  </label>
                  <input
                    type="text"
                    value={formSettings.driveFolderUrl}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, driveFolderUrl: e.target.value })
                    }
                    className="brutal-input text-xs font-bold"
                  />
                  <span className="text-neutral-500 text-[11px] mt-1 block">
                    Tautan Drive yang di-share &quot;Anyone with the link - Viewer&quot; untuk soft file customer.
                  </span>
                </div>

                <div className="md:col-span-2 border-[2px] border-black bg-[#f0f0f0] p-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSettings.printSessionIdOnPhoto}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          printSessionIdOnPhoto: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-black"
                    />
                    <div>
                      <span className="font-display text-xs uppercase block">
                        CETAK NOMOR SESI KECIL DI FOTO (F-19)
                      </span>
                      <span className="font-sans text-[11px] text-neutral-600">
                        Memudahkan customer mencari soft filenya di folder Drive.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t-[3px] border-black pt-4 flex justify-end">
                <button
                  type="submit"
                  className="brutal-btn-primary py-3 px-8 text-sm font-display cursor-pointer"
                >
                  SIMPAN PENGATURAN
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'remote' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-[5px] border-black bg-white p-6 space-y-6">
              <div className="flex items-center gap-2 border-b-[3px] border-black pb-3 text-red-600">
                <AlertOctagon className="w-7 h-7" />
                <h2 className="font-display text-xl uppercase">KONTROL DARURAT STASIUN KIOSK (F-16)</h2>
              </div>

              <div className="border-[3px] border-black bg-[#f0f0f0] p-4 font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span>LANGKAH KIOSK AKTIF SAAT INI:</span>
                  <span className="font-bold uppercase text-black">{currentStep}</span>
                </div>
                {currentSession && (
                  <>
                    <div className="flex justify-between">
                      <span>ID SESI AKTIF:</span>
                      <span className="font-bold">#{currentSession.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>STATUS BAYAR:</span>
                      <span className="font-bold">{currentSession.paymentStatus}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <button
                  onClick={onEmergencyReset}
                  className="w-full brutal-btn-danger min-h-[64px] text-base font-display flex items-center justify-center gap-3 cursor-pointer"
                >
                  <RotateCcw className="w-6 h-6" />
                  <span>RESET DARURAT: KEMBALI KE LAYAR WELCOME (F-16)</span>
                </button>

                <p className="font-sans text-xs text-neutral-600 text-center">
                  Gunakan tombol darurat di atas jika customer meninggalkan booth di tengah sesi atau terjadi kendala tak terduga. Sesi aktif akan dihentikan dan booth kembali siap melayani customer baru.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <TemplateEditorModal
        isOpen={isEditorOpen}
        initialTemplate={editingTemplate}
        onSave={handleSaveTemplate}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
