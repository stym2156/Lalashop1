// Minimal PromptPay (Thai EMVCo) QR payload generator.
//
// Produces the exact same string a PromptPay-aware bank app expects when
// scanning a merchant QR. Spec reference:
//   https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Documents/Standard_QR_TH.pdf
//
// Usage:
//   const payload = buildPromptPayPayload(promptpayId, amount?);
//   const dataUrl = await QRCode.toDataURL(payload, { width: 320 });

import QRCode from "qrcode";

const tlv = (id: string, value: string): string =>
  id + value.length.toString().padStart(2, "0") + value;

// CRC-16/CCITT-FALSE — required by EMVCo. The CRC is computed over the
// payload text (including the "6304" tag) before appending the 4-digit
// hex digest.
const crc16 = (input: string): string => {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
};

// Format a Thai national ID, mobile number, or eWallet ID into the canonical
// 13-digit PromptPay merchant ID. Phone numbers (10 digits) get prefixed
// with country code 0066, leading zero dropped.
const normalizePromptpayId = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13) return digits; // national ID
  if (digits.length === 15) return digits; // eWallet (BillerID)
  if (digits.length === 10 && digits.startsWith("0")) return "0066" + digits.slice(1);
  return digits;
};

export const buildPromptPayPayload = (id: string, amount?: number): string => {
  const merchantId = normalizePromptpayId(id);
  const isPhone = merchantId.length === 13 && merchantId.startsWith("0066");
  const targetTag = isPhone ? "01" : "02"; // 01=phone, 02=national ID
  const merchantInfo =
    tlv("00", "A000000677010111") + tlv(targetTag, merchantId);

  let payload =
    tlv("00", "01") + // payload format indicator
    tlv("01", amount ? "12" : "11") + // 11 = static, 12 = dynamic
    tlv("29", merchantInfo) +
    tlv("53", "764") + // currency code: THB
    (amount ? tlv("54", amount.toFixed(2)) : "") +
    tlv("58", "TH"); // country code

  payload += "6304"; // CRC tag
  return payload + crc16(payload);
};

// Convenience wrapper — returns a base64 data URL ready for <img src>.
export const generatePromptPayQrDataUrl = async (
  id: string,
  amount?: number,
  size = 320
): Promise<string> => {
  const payload = buildPromptPayPayload(id, amount);
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
  });
};
