import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, CheckCircle2, ShieldAlert, Check } from 'lucide-react';
import { checkPaymentStatus, markPaymentAsPaid } from '../../services/qris.js';
import { playSuccessSound } from '../../utils/audio.js';

/**
 * PaymentScreen component (JavaScript)
 */
export function PaymentScreen({
  session,
  onPaymentSuccess,
  onCancelSession,
  onStaffManualConfirm,
}) {
  const [timeLeft, setTimeLeft] = useState(180);
  const [isPaid, setIsPaid] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isPaid) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCancelSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaid, onCancelSession]);

  useEffect(() => {
    if (isPaid) return;

    const poll = setInterval(() => {
      const status = checkPaymentStatus(session.orderId);
      if (status === 'PAID' || status === 'MANUAL_CONFIRMED') {
        clearInterval(poll);
        setIsPaid(true);
        playSuccessSound();
        setTimeout(() => {
          onPaymentSuccess();
        }, 1500);
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [session.orderId, isPaid, onPaymentSuccess]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleSimulatePayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      markPaymentAsPaid(session.orderId, false);
      setIsVerifying(false);
      setIsPaid(true);
      playSuccessSound();
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 800);
  };

  return (
    <div className="relative min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col justify-between p-6 md:p-10 border-[8px] border-black select-none">
      <header className="flex items-center justify-between border-b-[5px] border-black pb-4">
        <button
          onClick={onCancelSession}
          className="brutal-btn-secondary py-2 px-4 min-h-[48px] text-xs font-mono flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BATALKAN / KEMBALI</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="font-mono text-xs uppercase px-3 py-1 bg-black text-white">
            LANGKAH 1/4: PEMBAYARAN
          </div>
          <div className="border-[3px] border-black bg-white px-3 py-1 flex items-center gap-2 font-mono text-sm font-bold">
            <Clock className={`w-4 h-4 ${timeLeft < 30 ? 'text-[#ff0000] animate-pulse' : 'text-black'}`} />
            <span className={timeLeft < 30 ? 'text-[#ff0000]' : ''}>TIMEOUT: {timeFormatted}</span>
          </div>
        </div>
      </header>

      <main className="my-auto py-6 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="border-[5px] border-black bg-white p-6 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
            <span className="font-display text-sm tracking-wider uppercase">QRIS DINAMIS</span>
            <span className="font-mono text-xs bg-[#f0f0f0] border-[2px] border-black px-2 py-0.5">
              MAYAR GATEWAY
            </span>
          </div>

          {session.qrisImageUrl ? (
            <div className="relative border-[4px] border-black bg-white p-2 w-full max-w-[340px] shadow-none">
              <img
                src={session.qrisImageUrl}
                alt="QRIS Code"
                className="w-full h-auto object-contain block mx-auto"
              />

              {isPaid && (
                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center border-[4px] border-[#008000] p-4 text-center">
                  <CheckCircle2 className="w-16 h-16 text-[#008000] mb-2 animate-bounce" />
                  <div className="font-display text-2xl text-[#008000] uppercase">LUNAS!</div>
                  <div className="font-mono text-xs mt-1 text-black">Membuka Galeri Template...</div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-[300px] h-[300px] border-[3px] border-black flex items-center justify-center font-mono">
              Membuat QRIS...
            </div>
          )}

          <div className="mt-4 font-mono text-xs text-neutral-500 text-center">
            Mendukung semua m-Banking & E-Wallet (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, Dana)
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-neutral-600 mb-1">
              TOTAL TAGIHAN SESI
            </div>
            <div className="font-display text-4xl md:text-5xl uppercase tracking-tight text-black border-b-[4px] border-black pb-3">
              Rp {Number(session.nominal).toLocaleString('id-ID')}
            </div>
          </div>

          <div className="border-[3px] border-black bg-white p-4 font-mono text-xs space-y-2">
            <div className="flex justify-between border-b border-black/20 pb-1">
              <span className="text-neutral-500">ORDER ID:</span>
              <span className="font-bold">{session.orderId}</span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-1">
              <span className="text-neutral-500">ID SESI:</span>
              <span className="font-bold">{session.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">STATUS DETEKSI:</span>
              <span className="font-bold flex items-center gap-1.5 text-black">
                <span className="w-2 h-2 rounded-full bg-[#ffa500] animate-ping"></span>
                POLLING TRANSAKSI OTOMATIS...
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleSimulatePayment}
              disabled={isVerifying || isPaid}
              className="w-full brutal-btn-primary min-h-[56px] text-base font-display flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifying ? (
                <span>MEMVERIFIKASI...</span>
              ) : isPaid ? (
                <span className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#008000]" /> PEMBAYARAN BERHASIL
                </span>
              ) : (
                <span>SIMULASIKAN PEMBAYARAN QRIS (TEST)</span>
              )}
            </button>

            <div className="border-[3px] border-black bg-[#f0f0f0] p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-neutral-700 shrink-0" />
                <div className="font-sans text-xs">
                  <span className="font-bold uppercase block">CADANGAN OPERATOR (F-04)</span>
                  Internet gateway bermasalah?
                </div>
              </div>
              <button
                onClick={onStaffManualConfirm}
                className="brutal-btn-secondary text-xs py-2 px-3 min-h-[40px] font-mono cursor-pointer shrink-0"
              >
                KONFIRMASI MANUAL
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t-[5px] border-black pt-4 font-mono text-xs flex flex-col sm:flex-row justify-between items-center gap-2 text-neutral-600 uppercase">
        <div>1. Buka aplikasi m-Banking atau E-Wallet</div>
        <div>2. Scan QRIS di layar</div>
        <div>3. Konfirmasi pembayaran nominal pas</div>
      </footer>
    </div>
  );
}
