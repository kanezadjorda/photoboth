import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

/**
 * AdminPinModal component (JavaScript)
 */
export function AdminPinModal({
  correctPin,
  isOpen,
  onSuccess,
  onClose,
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (pin === correctPin || pin === '1234') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleKeyClick = (digit) => {
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4 && (next === correctPin || next === '1234')) {
        setTimeout(() => {
          setError(false);
          setPin('');
          onSuccess();
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="border-[5px] border-black bg-white w-full max-w-sm p-6 relative select-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 border-[2px] border-black bg-white hover:bg-black hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg uppercase">PANEL STAFF & OWNER</h3>
            <p className="font-mono text-xs text-neutral-500">MASUKKAN PIN OPERATOR</p>
          </div>
        </div>

        <div className="border-[3px] border-black bg-[#f0f0f0] p-4 mb-4 flex justify-center items-center gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-5 h-5 border-[2px] border-black ${
                idx < pin.length ? 'bg-black' : 'bg-white'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-[#ffdad6] border-[2px] border-[#ba1a1a] text-[#ba1a1a] font-mono text-xs p-2 mb-4 text-center font-bold">
            PIN SALAH! (DEFAULT: 1234)
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyClick(digit)}
              className="border-[3px] border-black bg-white p-3 font-mono text-xl font-bold hover:bg-black hover:text-white active:bg-neutral-800 transition-colors cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="border-[3px] border-black bg-[#f0f0f0] p-3 font-mono text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
          >
            CLEAR
          </button>
          <button
            onClick={() => handleKeyClick('0')}
            className="border-[3px] border-black bg-white p-3 font-mono text-xl font-bold hover:bg-black hover:text-white cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="border-[3px] border-black bg-[#f0f0f0] p-3 font-mono text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
          >
            DEL
          </button>
        </div>

        <button
          onClick={() => handleSubmit()}
          className="w-full brutal-btn-primary min-h-[48px] text-sm font-display cursor-pointer"
        >
          MASUK PANEL ADMIN
        </button>

        <div className="mt-3 text-center font-mono text-[11px] text-neutral-500">
          PIN default bawaan adalah: <strong>1234</strong>
        </div>
      </div>
    </div>
  );
}
