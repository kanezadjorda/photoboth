import React from 'react';
import { Camera, Printer, QrCode, Lock, Sparkles, ArrowRight } from 'lucide-react';

/**
 * WelcomeScreen component (JavaScript)
 */
export function WelcomeScreen({ settings, onStartSession, onOpenAdmin }) {
  return (
    <div className="relative min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col justify-between p-6 md:p-12 border-[8px] border-black select-none">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b-[5px] border-black pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white px-3 py-1 font-mono text-sm font-bold tracking-widest uppercase">
            STATION 01 // KIOSK
          </div>
          <span className="font-mono text-xs md:text-sm tracking-wider uppercase text-neutral-600">
            AUTO-CAPTURE & DUAL SCREEN READY
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 border-[3px] border-black px-3 py-1 bg-white">
            <span className="w-3 h-3 bg-[#008000] inline-block animate-pulse"></span>
            <span className="font-mono text-xs font-bold uppercase">SISTEM SIAP</span>
          </div>

          <button
            onClick={onOpenAdmin}
            title="Panel Admin Staff (PIN)"
            className="border-[3px] border-black p-3 bg-white hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero Content */}
      <main className="my-auto py-10 max-w-5xl mx-auto w-full">
        <div className="inline-block bg-black text-white font-mono text-xs md:text-sm px-4 py-1.5 uppercase tracking-widest mb-4">
          [ ARCHITECTURAL PHOTO EXPERIENCE // 300 DPI BORDERLESS ]
        </div>

        <h1 className="font-display text-5xl md:text-8xl tracking-tight leading-none uppercase mb-6 text-black">
          PHOTO<br />BOOTH.
        </h1>

        <p className="font-sans text-lg md:text-2xl text-neutral-800 font-medium max-w-2xl mb-10 leading-snug">
          Abadikan momenmu dalam format strip 2x6 atau postcard 4R. Bayar mandiri via QRIS, foto bersama kamera resolusi tinggi, dan hasil cetak instan siap dalam 3 menit.
        </p>

        {/* Feature Specs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="border-[3px] border-black bg-white p-4">
            <div className="font-mono text-xs uppercase text-neutral-500 mb-1">HARGA SESI</div>
            <div className="font-mono text-xl md:text-2xl font-bold text-black">
              Rp {settings.sessionPrice.toLocaleString('id-ID')}
            </div>
            <div className="font-sans text-xs text-neutral-600 mt-1">Sama semua template</div>
          </div>

          <div className="border-[3px] border-black bg-white p-4">
            <div className="font-mono text-xs uppercase text-neutral-500 mb-1">PEMBAYARAN</div>
            <div className="font-mono text-xl md:text-2xl font-bold text-black flex items-center gap-1">
              <QrCode className="w-5 h-5" /> QRIS
            </div>
            <div className="font-sans text-xs text-neutral-600 mt-1">BCA, GoPay, OVO, Dana</div>
          </div>

          <div className="border-[3px] border-black bg-white p-4">
            <div className="font-mono text-xs uppercase text-neutral-500 mb-1">KAMERA</div>
            <div className="font-mono text-xl md:text-2xl font-bold text-black flex items-center gap-1">
              <Camera className="w-5 h-5" /> 1080P+
            </div>
            <div className="font-sans text-xs text-neutral-600 mt-1">Live preview & retake</div>
          </div>

          <div className="border-[3px] border-black bg-white p-4">
            <div className="font-mono text-xs uppercase text-neutral-500 mb-1">CETAKAN</div>
            <div className="font-mono text-xl md:text-2xl font-bold text-black flex items-center gap-1">
              <Printer className="w-5 h-5" /> {settings.copiesPerSession} LEMBAR
            </div>
            <div className="font-sans text-xs text-neutral-600 mt-1">Epson Borderless + Drive</div>
          </div>
        </div>

        {/* Giant Action Button */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <button
            onClick={onStartSession}
            className="brutal-btn-primary text-xl md:text-2xl px-10 py-6 min-h-[72px] flex items-center justify-center gap-4 bg-black text-white hover:bg-white hover:text-black border-[5px] border-black font-display cursor-pointer"
          >
            <span>SENTUH / KLIK UNTUK MULAI</span>
            <ArrowRight className="w-8 h-8" />
          </button>
        </div>
      </main>

      {/* Footer Instructions Banner */}
      <footer className="border-t-[5px] border-black pt-6 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs uppercase">
        <div className="flex flex-wrap items-center gap-6 text-neutral-700">
          <span>01. BAYAR QRIS</span>
          <span>&rarr;</span>
          <span>02. PILIH TEMPLATE</span>
          <span>&rarr;</span>
          <span>03. POSE (3-2-1)</span>
          <span>&rarr;</span>
          <span>04. REVIEW & CETAK</span>
        </div>

        <div className="flex items-center gap-2 text-neutral-500">
          <Sparkles className="w-4 h-4 text-black" />
          <span>SOFT FILE OTOMATIS TERSINKRON GOOGLE DRIVE</span>
        </div>
      </footer>
    </div>
  );
}
