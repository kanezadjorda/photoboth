import { generateDefaultTemplates } from '../utils/defaultTemplates.js';

const STORAGE_KEYS = {
  TEMPLATES: 'photobooth_templates_v1',
  SETTINGS: 'photobooth_settings_v1',
  SESSIONS: 'photobooth_sessions_v1',
};

const DEFAULT_SETTINGS = {
  sessionPrice: 25000,
  copiesPerSession: 1,
  adminPin: '1234',
  outputFolderName: 'C:/Users/Staff/Google Drive/Photobooth-Event-2026',
  driveFolderUrl: 'https://drive.google.com/drive/folders/photobooth-demo-public',
  printSessionIdOnPhoto: true,
  selectedCameraDeviceId: '',
  mirrorCamera: true,
  countdownSeconds: 3,
  autoResetFinishSeconds: 15,
  kioskPrintSilent: true,
};

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Failed to read settings from storage', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function getStoredTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    console.warn('Failed to read templates from storage', err);
  }
  const defaults = generateDefaultTemplates();
  saveTemplates(defaults);
  return defaults;
}

export function saveTemplates(templates) {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save templates', err);
  }
}

export function getStoredSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read sessions', err);
  }
  return [];
}

export function saveSessionRecord(session) {
  try {
    const list = getStoredSessions();
    const existingIndex = list.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      list[existingIndex] = session;
    } else {
      list.unshift(session);
    }
    const trimmed = list.slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save session', err);
  }
}

export function formatPhotoFilename(sessionId) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}-${sessionId}.jpg`;
}

export function exportSessionsToCSV(sessions) {
  const headers = [
    'ID Sesi',
    'Order ID',
    'Waktu Dibuat',
    'Nominal (Rp)',
    'Status Bayar',
    'Template ID',
    'Jumlah Cetak',
    'Waktu Selesai',
  ];

  const rows = sessions.map((s) => [
    `"${s.id}"`,
    `"${s.orderId}"`,
    `"${s.dibuat_pada}"`,
    s.nominal,
    `"${s.paymentStatus}"`,
    `"${s.templateId}"`,
    s.copies,
    `"${s.selesai_pada || '-'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `photobooth-laporan-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
