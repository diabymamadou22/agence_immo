import { Tenant, RentReceipt, SaleReceipt, AgencyConfig } from '../types';
import { formatFCFA, formatDate } from './formatters';

/**
 * Cleans and standardizes Malian phone numbers for WhatsApp api (wa.me)
 * E.g. "+223 76 12 34 56" -> "22376123456"
 * "76123456" -> "22376123456"
 */
export function cleanPhoneNumberForWhatsApp(phone?: string): string {
  if (!phone) return '';
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // If starts with 00223, replace with 223
  if (digits.startsWith('00223')) {
    digits = digits.slice(2);
  }

  // If local 8-digit Mali number (e.g. 76123456 or 66123456), prepend 223
  if (digits.length === 8) {
    digits = `223${digits}`;
  }

  return digits;
}

/**
 * Generates and triggers WhatsApp discussion for Rent Receipt
 */
export function sendRentReceiptWhatsApp(
  receipt: RentReceipt,
  agencyConfig: AgencyConfig,
  tenantPhone?: string
): void {
  const phone = cleanPhoneNumberForWhatsApp(tenantPhone || receipt.tenantPhone || '');
  const remaining = receipt.remainingBalance || 0;
  const isPartial = receipt.paymentType === 'partiel' || remaining > 0;

  const message = `🏢 *${agencyConfig.name.toUpperCase()}*
📍 ${agencyConfig.address} • Bamako (Mali)
📞 Contact : ${agencyConfig.phoneDisplay}

*QUITTANCE OFFICIELLE DE PAIEMENT DE LOYER*
━━━━━━━━━━━━━━━━━━━━
📄 *Réf. Quittance :* ${receipt.receiptNumber}
📅 *Date d'encaissement :* ${formatDate(receipt.paymentDate)}

👤 *Locataire :* ${receipt.tenantName}
🏠 *Bien Loué :* ${receipt.propertyTitle}
🗓️ *Mois / Terme :* ${receipt.periodMonth}

💰 *MONTANT REÇU :* ${formatFCFA(receipt.amount)}
💳 *Mode de versement :* ${receipt.paymentMethod.toUpperCase()}${receipt.transactionRef ? ` (${receipt.transactionRef})` : ''}

${isPartial ? `⚠️ *RELIQUAT RESTANT À PAYER :* ${formatFCFA(remaining)}\n(Paiement partiel enregistré - solde attendu)` : '✅ *Statut :* Loyer soldé et acquitté intégralement.'}
━━━━━━━━━━━━━━━━━━━━
Le présent message confirme la bonne réception de votre versement.
Merci pour votre confiance !

_La Direction & Gestion Locative - ${agencyConfig.name}_`;

  const url = phone 
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(url, '_blank');
}

/**
 * Generates and triggers WhatsApp discussion for Sale Receipt
 */
export function sendSaleReceiptWhatsApp(
  receipt: SaleReceipt,
  agencyConfig: AgencyConfig
): void {
  const phone = cleanPhoneNumberForWhatsApp(receipt.buyerPhone || '');
  const remaining = receipt.remainingBalance || 0;
  const isFullyPaid = remaining <= 0;

  const message = `🏢 *${agencyConfig.name.toUpperCase()}*
📍 ${agencyConfig.address} • Bamako (Mali)
📞 Service Commercial : ${agencyConfig.phoneDisplay}

*REÇU OFFICIEL DE VENTE IMMOBILIÈRE*
━━━━━━━━━━━━━━━━━━━━
📄 *N° Reçu :* ${receipt.receiptNumber}
📅 *Date de transaction :* ${formatDate(receipt.saleDate)}

👤 *Acquéreur :* ${receipt.buyerName}
📍 *Bien / Parcelle :* ${receipt.propertyTitle}
📋 *Réf. Bien :* ${receipt.propertyReference}
📜 *Statut Foncier :* ${receipt.documentType.toUpperCase()} ${receipt.documentNumber ? `(N° ${receipt.documentNumber})` : ''}

💵 *Prix Total Convenu :* ${formatFCFA(receipt.totalAgreedPrice)}
✅ *Acompte / Montant Versé :* ${formatFCFA(receipt.amountPaid)}
${!isFullyPaid ? `⏳ *Reliquat restant à solder :* ${formatFCFA(remaining)}` : '🎉 *Paiement :* 100% Soldé et Réglé'}

💳 *Mode de règlement :* ${receipt.paymentMethod}${receipt.transactionReference ? ` (Réf: ${receipt.transactionReference})` : ''}
${receipt.notaryOffice ? `🏛️ *Étude Notariale :* ${receipt.notaryOffice}` : ''}
━━━━━━━━━━━━━━━━━━━━
Ce reçu atteste de l'encaissement officiel des fonds par notre agence.
Merci pour votre achat et votre confiance !

_La Direction - ${agencyConfig.name}_`;

  const url = phone 
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(url, '_blank');
}

/**
 * Sends a polite Rent Overdue / Payment Reminder to a tenant via WhatsApp
 */
export function sendRentReminderWhatsApp(
  tenant: Tenant,
  agencyConfig: AgencyConfig
): void {
  const phone = cleanPhoneNumberForWhatsApp(tenant.phone || '');

  const message = `Bonjour M./Mme *${tenant.name}*,

L'agence *${agencyConfig.name}* espère que vous vous portez bien.

Nous vous contactons concernant l'échéance de loyer de votre logement :
🏠 *${tenant.propertyTitle}* (Porte/Unité : ${tenant.unitNumber})
💰 *Montant du loyer :* ${formatFCFA(tenant.monthlyRent)}
📅 *Échéance habituelle :* le ${tenant.rentPaymentDay} du mois

Sauf erreur de notre part, votre règlement pour le terme en cours est actuellement en attente.

📌 *Moyens de paiement acceptés :*
- Orange Money / Moov Money au : *${agencyConfig.phoneDisplay}*
- Virement bancaire / Dépôt direct
- Espèces à notre agence (${agencyConfig.address})

Pour toute question ou si le versement a déjà été effectué aujourd'hui, merci de nous transmettre votre preuve de paiement.

Nous vous remercions pour votre collaboration habituelle.
Bien cordialement,

_Service Gestion Locative - ${agencyConfig.name}_`;

  const url = phone 
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(url, '_blank');
}

/**
 * Sends a Lease Contract Expiration / Renewal reminder via WhatsApp
 */
export function sendLeaseExpiryWhatsApp(
  tenant: Tenant,
  daysRemaining: number,
  agencyConfig: AgencyConfig
): void {
  const phone = cleanPhoneNumberForWhatsApp(tenant.phone || '');
  const isExpired = daysRemaining < 0;

  const message = `Bonjour M./Mme *${tenant.name}*,

L'agence *${agencyConfig.name}* vous informe concernant votre bail locatif pour le bien :
🏠 *${tenant.propertyTitle}* (Unité : ${tenant.unitNumber})
📅 *Date de fin de bail :* ${formatDate(tenant.leaseEndDate)} ${isExpired ? '(Bail arrivé à échéance)' : `(dans ${daysRemaining} jours)`}

${isExpired 
  ? `Votre contrat de location est arrivé à son terme. Afin d'établir votre avenant de renouvellement ou faire le point sur votre dossier, merci de bien vouloir vous rapprocher de notre agence.` 
  : `Afin de préparer sereinement le renouvellement de votre bail ou organiser la suite de votre contrat, notre service gestion reste à votre écoute.`}

📞 Contact gestionnaire : *${agencyConfig.phoneDisplay}*
📍 Adresse agence : ${agencyConfig.address}

Merci pour votre fidélité.
Bien cordialement,

_La Direction - ${agencyConfig.name}_`;

  const url = phone 
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(url, '_blank');
}

/**
 * Notice when lease is expiring soon or already expired
 */
export function sendLeaseExpiryNoticeWhatsApp(
  tenant: Tenant,
  agencyConfig: AgencyConfig
): void {
  const endDate = new Date(tenant.leaseEndDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  sendLeaseExpiryWhatsApp(tenant, diffDays, agencyConfig);
}

/**
 * Sends landlord payout notification via WhatsApp
 */
export function sendOwnerPayoutWhatsApp(
  payout: any,
  agencyConfig: AgencyConfig
): void {
  const phone = cleanPhoneNumberForWhatsApp(payout.ownerPhone || '');

  const message = `🏢 *${agencyConfig.name.toUpperCase()}*
📍 Bamako, Mali • Tél : ${agencyConfig.phoneDisplay}

*AVIS DE REVERSEMENT DE LOYERS PROPRIÉTAIRE*
━━━━━━━━━━━━━━━━━━━━
📄 *Bordereau N° :* ${payout.payoutNumber}
📅 *Date :* ${formatDate(payout.payoutDate)}

👤 *Propriétaire :* ${payout.ownerName}
🏠 *Bien(s) Géré(s) :* ${payout.propertyTitle || 'Portefeuille locatif'}
🗓️ *Période :* ${payout.periodMonth}

💵 *Loyers Bruts Encaissés :* ${formatFCFA(payout.grossRents)}
📉 *Commission Agence (${payout.commissionRate}%) :* -${formatFCFA(payout.commissionAmount)}
${payout.deductions > 0 ? `🛠️ *Dépenses / Travaux déduits :* -${formatFCFA(payout.deductions)}\n` : ''}
💰 *NET REVERSÉ :* *${formatFCFA(payout.netPayout)}*
💳 *Mode de versement :* ${payout.paymentMethod}

Les fonds ont été virés sur votre compte / numéro selon les modalités convenues.
Nous vous remercions de votre confiance accordée à notre cabinet.

_La Direction Générale - ${agencyConfig.name}_`;

  const url = phone 
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(url, '_blank');
}
