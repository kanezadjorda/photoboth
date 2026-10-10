import { generateQRISVisual } from '../utils/qrGenerator.js';

// In-memory payment ledger for active sessions
const pendingTransactions = new Map();

/**
 * Creates dynamic QRIS payment session (JavaScript)
 * @param {number} amount
 */
export function createQrisPayment(amount) {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `MAYAR-QRIS-${timestamp.toString().slice(-6)}-${randomSuffix}`;

  const qrisString = `00020101021226610016ID.MAYAR.WWW011893600000000000000051440014ID.CO.QRIS.WWW0215ID10202688941010303UMI520458125303360540${amount.toString().length}${amount}5802ID5913PHOTOBOOTH-STN6007JAKARTA62070703A016304`;

  const qrisImageUrl = generateQRISVisual(qrisString, amount);
  const expiresAt = timestamp + 3 * 60 * 1000;

  pendingTransactions.set(orderId, {
    status: 'PENDING',
  });

  return {
    orderId,
    nominal: amount,
    qrisString,
    qrisImageUrl,
    expiresAt,
  };
}

export function checkPaymentStatus(orderId) {
  const tx = pendingTransactions.get(orderId);
  if (!tx) return 'EXPIRED';
  return tx.status;
}

export function markPaymentAsPaid(orderId, isManual = false) {
  const tx = pendingTransactions.get(orderId);
  if (tx) {
    tx.status = isManual ? 'MANUAL_CONFIRMED' : 'PAID';
    tx.paidAt = new Date().toISOString();
  } else {
    pendingTransactions.set(orderId, {
      status: isManual ? 'MANUAL_CONFIRMED' : 'PAID',
      paidAt: new Date().toISOString(),
    });
  }
}
