const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const svg192 = `
  <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" rx="40" fill="#2C6E49"/>
    <path d="M 60 55 L 96 137 L 132 55" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="96" cy="150" r="8" fill="#FFFFFF"/>
  </svg>
  `;

  const svg512 = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="100" fill="#2C6E49"/>
    <path d="M 160 145 L 256 365 L 352 145" stroke="#FFFFFF" stroke-width="50" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="256" cy="400" r="20" fill="#FFFFFF"/>
  </svg>
  `;

  const svgFavicon = `
  <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="10" fill="#2C6E49"/>
    <path d="M 14 12 L 24 34 L 34 12" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>
  `;

  await sharp(Buffer.from(svg192)).png().toFile(path.join(__dirname, '../public/icons/icon-192x192.png'));
  await sharp(Buffer.from(svg512)).png().toFile(path.join(__dirname, '../public/icons/icon-512x512.png'));
  await sharp(Buffer.from(svgFavicon)).png().toFile(path.join(__dirname, '../public/favicon.ico'));
  await sharp(Buffer.from(svg192)).png().toFile(path.join(__dirname, '../public/apple-touch-icon.png'));

  console.log('Successfully generated all icons!');
}

generate().catch(console.error);
