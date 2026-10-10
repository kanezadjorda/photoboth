import React, { useState } from 'react';
import {
  getStoredSettings,
  saveSettings,
  getStoredTemplates,
  saveTemplates,
  getStoredSessions,
  saveSessionRecord,
} from './services/storage.js';
import { createQrisPayment, markPaymentAsPaid } from './services/qris.js';
import { WelcomeScreen } from './components/Kiosk/WelcomeScreen.jsx';
import { PaymentScreen } from './components/Kiosk/PaymentScreen.jsx';
import { TemplateSelectScreen } from './components/Kiosk/TemplateSelectScreen.jsx';
import { CameraScreen } from './components/Kiosk/CameraScreen.jsx';
import { ReviewScreen } from './components/Kiosk/ReviewScreen.jsx';
import { PrintScreen } from './components/Kiosk/PrintScreen.jsx';
import { FinishedScreen } from './components/Kiosk/FinishedScreen.jsx';
import { AdminPinModal } from './components/Admin/AdminPinModal.jsx';
import { AdminDashboard } from './components/Admin/AdminDashboard.jsx';
import { PrintDocument } from './components/Shared/PrintDocument.jsx';
import { Monitor, Lock, RotateCcw } from 'lucide-react';

/**
 * Main Application Component in JavaScript (ES Modules + JSX)
 */
export default function App() {
  const [settings, setSettings] = useState(getStoredSettings);
  const [templates, setTemplates] = useState(getStoredTemplates);
  const [sessions, setSessions] = useState(getStoredSessions);

  const [step, setStep] = useState('welcome');
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [retakeSlotIndex, setRetakeSlotIndex] = useState(undefined);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDualMonitorMode, setIsDualMonitorMode] = useState(false);

  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleUpdateTemplates = (newTemplates) => {
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
  };

  const handleStartSession = () => {
    const sessionId = `PB-${Date.now().toString().slice(-6)}`;
    const qris = createQrisPayment(settings.sessionPrice);

    const newSession = {
      id: sessionId,
      templateId: '',
      status: 'menunggu_bayar',
      photos: [],
      retakeCount: {},
      orderId: qris.orderId,
      nominal: qris.nominal,
      paymentStatus: 'PENDING',
      qrisString: qris.qrisString,
      qrisImageUrl: qris.qrisImageUrl,
      copies: settings.copiesPerSession,
      dibuat_pada: new Date().toISOString(),
    };

    setCurrentSession(newSession);
    saveSessionRecord(newSession);
    setSessions(getStoredSessions());
    setStep('payment');
  };

  const handlePaymentSuccess = () => {
    if (!currentSession) return;
    const updated = {
      ...currentSession,
      status: 'foto',
      paymentStatus: 'PAID',
      dibayar_pada: new Date().toISOString(),
    };
    setCurrentSession(updated);
    saveSessionRecord(updated);
    setSessions(getStoredSessions());
    setStep('select_template');
  };

  const handleStaffManualConfirm = () => {
    if (!currentSession) return;
    markPaymentAsPaid(currentSession.orderId, true);
    const updated = {
      ...currentSession,
      status: 'foto',
      paymentStatus: 'MANUAL_CONFIRMED',
      dibayar_pada: new Date().toISOString(),
    };
    setCurrentSession(updated);
    saveSessionRecord(updated);
    setSessions(getStoredSessions());
    setStep('select_template');
  };

  const handleCancelSession = () => {
    if (currentSession) {
      const updated = {
        ...currentSession,
        status: 'batal',
      };
      saveSessionRecord(updated);
      setSessions(getStoredSessions());
    }
    setCurrentSession(null);
    setSelectedTemplate(null);
    setRetakeSlotIndex(undefined);
    setStep('welcome');
  };

  const handleSelectTemplate = (template) => {
    if (!currentSession) return;
    setSelectedTemplate(template);
    const updated = {
      ...currentSession,
      templateId: template.id,
    };
    setCurrentSession(updated);
    saveSessionRecord(updated);
    setStep('camera');
  };

  const handleCompleteCapture = (photos) => {
    if (!currentSession) return;

    if (retakeSlotIndex !== undefined) {
      const currentCount = currentSession.retakeCount[retakeSlotIndex] || 0;
      const updated = {
        ...currentSession,
        photos,
        retakeCount: {
          ...currentSession.retakeCount,
          [retakeSlotIndex]: currentCount + 1,
        },
      };
      setCurrentSession(updated);
      saveSessionRecord(updated);
      setRetakeSlotIndex(undefined);
      setStep('review');
    } else {
      const updated = {
        ...currentSession,
        photos,
      };
      setCurrentSession(updated);
      saveSessionRecord(updated);
      setStep('review');
    }
  };

  const handleRetakeSlot = (slotIndex) => {
    setRetakeSlotIndex(slotIndex);
    setStep('camera');
  };

  const handleConfirmPrint = () => {
    setStep('print');
  };

  const handlePrintCompleted = (compositeUrl) => {
    if (!currentSession) return;
    const updated = {
      ...currentSession,
      compositePhotoUrl: compositeUrl,
      status: 'selesai',
      selesai_pada: new Date().toISOString(),
    };
    setCurrentSession(updated);
    saveSessionRecord(updated);
    setSessions(getStoredSessions());
    setStep('finish');
  };

  const handleEmergencyReset = () => {
    handleCancelSession();
    setIsAdminOpen(false);
  };

  const handleReprintSession = (sessionToReprint) => {
    if (!sessionToReprint.compositePhotoUrl) return;
    window.print();
  };

  const activeTemplate =
    selectedTemplate ||
    templates.find((t) => t.id === currentSession?.templateId) ||
    templates[0];

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col font-sans">
      <PrintDocument
        compositeImageUrl={currentSession?.compositePhotoUrl || null}
        copies={settings.copiesPerSession}
      />

      <aside className="no-print fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-white/95 border-[3px] border-black p-1.5 shadow-[4px_4px_0px_#000000]">
        <button
          onClick={() => setIsDualMonitorMode(!isDualMonitorMode)}
          title="Simulasi Layar Ganda (Staff + Customer)"
          className={`p-2 border-[2px] border-black font-mono text-xs flex items-center gap-1.5 cursor-pointer ${
            isDualMonitorMode ? 'bg-black text-white' : 'bg-[#f0f0f0] hover:bg-black hover:text-white'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isDualMonitorMode ? 'MODE LAYAR TUNGGAL' : 'DUAL MONITOR SIMULATOR'}
          </span>
        </button>

        <button
          onClick={() => setIsPinModalOpen(true)}
          title="Buka Panel Admin"
          className="p-2 border-[2px] border-black bg-white hover:bg-black hover:text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">PANEL ADMIN (PIN)</span>
        </button>

        {step !== 'welcome' && (
          <button
            onClick={handleCancelSession}
            title="Reset ke Layar Awal"
            className="p-2 border-[2px] border-black bg-[#ffdad6] text-[#ba1a1a] hover:bg-black hover:text-white font-mono text-xs flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        )}
      </aside>

      <div
        className={`flex-1 flex ${
          isDualMonitorMode ? 'flex-col lg:flex-row border-t-[8px] border-black' : ''
        }`}
      >
        {isDualMonitorMode && (
          <div className="w-full lg:w-[420px] bg-[#f0f0f0] border-b-[8px] lg:border-b-0 lg:border-r-[8px] border-black p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-[3px] border-black pb-2 mb-4">
                <div className="font-display text-sm uppercase">MONITOR 1 (LAPTOP STAFF)</div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#008000] animate-pulse"></span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="border-[2px] border-black bg-white p-3">
                  <div className="text-neutral-500 mb-1">STATUS KIOSK AKTIF:</div>
                  <div className="font-bold text-base uppercase text-black">{step}</div>
                </div>

                {currentSession && (
                  <div className="border-[2px] border-black bg-white p-3 space-y-1">
                    <div>
                      ID: <strong>#{currentSession.id}</strong>
                    </div>
                    <div>
                      Bayar:{' '}
                      <strong
                        className={
                          currentSession.paymentStatus === 'PAID'
                            ? 'text-[#008000]'
                            : 'text-[#ffa500]'
                        }
                      >
                        {currentSession.paymentStatus}
                      </strong>
                    </div>
                    <div>
                      Nominal: <strong>Rp {Number(currentSession.nominal).toLocaleString('id-ID')}</strong>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setIsAdminOpen(true)}
                    className="w-full brutal-btn-primary py-2.5 text-xs font-mono cursor-pointer"
                  >
                    BUKA DASHBOARD ADMIN LENGKAP
                  </button>

                  <button
                    onClick={handleEmergencyReset}
                    className="w-full brutal-btn-danger py-2.5 text-xs font-mono cursor-pointer"
                  >
                    RESET DARURAT KIOSK (F-16)
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t-[2px] border-black pt-3 font-mono text-[11px] text-neutral-600">
              PRD Bagian 1: Layar customer ditampilkan di monitor kedua (kiosk), staff mengontrol dari laptop.
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {step === 'welcome' && (
            <WelcomeScreen
              settings={settings}
              onStartSession={handleStartSession}
              onOpenAdmin={() => setIsPinModalOpen(true)}
            />
          )}

          {step === 'payment' && currentSession && (
            <PaymentScreen
              session={currentSession}
              onPaymentSuccess={handlePaymentSuccess}
              onCancelSession={handleCancelSession}
              onStaffManualConfirm={handleStaffManualConfirm}
            />
          )}

          {step === 'select_template' && (
            <TemplateSelectScreen
              templates={templates}
              onSelectTemplate={handleSelectTemplate}
            />
          )}

          {step === 'camera' && activeTemplate && (
            <CameraScreen
              template={activeTemplate}
              settings={settings}
              retakeSlotIndex={retakeSlotIndex}
              existingPhotos={currentSession?.photos || []}
              onCompleteCapture={handleCompleteCapture}
            />
          )}

          {step === 'review' && activeTemplate && currentSession && (
            <ReviewScreen
              template={activeTemplate}
              photos={currentSession.photos}
              retakeCount={currentSession.retakeCount}
              onRetakeSlot={handleRetakeSlot}
              onConfirmPrint={handleConfirmPrint}
            />
          )}

          {step === 'print' && activeTemplate && currentSession && (
            <PrintScreen
              session={currentSession}
              template={activeTemplate}
              settings={settings}
              onPrintCompleted={handlePrintCompleted}
            />
          )}

          {step === 'finish' && currentSession && currentSession.compositePhotoUrl && (
            <FinishedScreen
              session={currentSession}
              settings={settings}
              compositePhotoUrl={currentSession.compositePhotoUrl}
              onResetToWelcome={handleCancelSession}
            />
          )}
        </div>
      </div>

      <AdminPinModal
        correctPin={settings.adminPin}
        isOpen={isPinModalOpen}
        onSuccess={() => {
          setIsPinModalOpen(false);
          setIsAdminOpen(true);
        }}
        onClose={() => setIsPinModalOpen(false)}
      />

      {isAdminOpen && (
        <AdminDashboard
          settings={settings}
          templates={templates}
          sessions={sessions}
          currentSession={currentSession}
          currentStep={step}
          onUpdateSettings={handleUpdateSettings}
          onUpdateTemplates={handleUpdateTemplates}
          onReprintSession={handleReprintSession}
          onEmergencyReset={handleEmergencyReset}
          onCloseAdmin={() => {
            setIsAdminOpen(false);
            setSessions(getStoredSessions());
          }}
        />
      )}
    </div>
  );
}
