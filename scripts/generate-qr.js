#!/usr/bin/env node
// Generate one PNG per table (1..TABLE_COUNT) under public/qr-codes/.
// Run after changing the deployed URL: `node scripts/generate-qr.js`.

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const BASE_URL =
  process.env.QR_BASE_URL || "https://benu-kohl.vercel.app";
const TABLE_COUNT = 11;

const outDir = path.join(__dirname, "..", "public", "qr-codes");
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (let n = 1; n <= TABLE_COUNT; n++) {
    const url = `${BASE_URL}/menu?table=${n}`;
    const file = path.join(outDir, `table-${n}.png`);
    await QRCode.toFile(file, url, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#1a1a1a", light: "#ffffff" },
    });
    process.stdout.write(`wrote ${path.relative(process.cwd(), file)}  →  ${url}\n`);
  }
})();
