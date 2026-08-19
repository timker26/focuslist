#!/usr/bin/env node
import QRCode from "qrcode";

const url = process.argv[2];
const outputPath = process.argv[3] ?? "expo-qr-code.png";

if (!url) {
  console.error(
    'Usage: node scripts/generate_qr.mjs "https://..." [output.png]',
  );
  process.exit(1);
}

await QRCode.toFile(outputPath, url, { width: 512 });
console.log(`✅ QR code saved to ${outputPath}`);
