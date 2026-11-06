'use strict';

const fs = require('node:fs');
const path = require('node:path');

const size = 256;
const scale = size / 32;
const header = Buffer.alloc(40);
header.writeUInt32LE(40, 0);
header.writeInt32LE(size, 4);
header.writeInt32LE(size * 2, 8);
header.writeUInt16LE(1, 12);
header.writeUInt16LE(32, 14);
header.writeUInt32LE(size * size * 4, 20);

const pixels = Buffer.alloc(size * size * 4);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const offset = ((size - 1 - y) * size + x) * 4;
    let color = [118, 11, 217, 255];
    const unitX = Math.floor(x / scale), unitY = Math.floor(y / scale);
    const isMark = (unitX >= 8 && unitX <= 11 && unitY >= 7 && unitY <= 23) ||
      (unitX >= 12 && unitX <= 15 && unitY >= 7 && unitY <= 14) ||
      (unitX >= 16 && unitX <= 19 && unitY >= 14 && unitY <= 23) ||
      (unitX >= 20 && unitX <= 23 && unitY >= 7 && unitY <= 23);
    if (isMark) color = [255, 255, 255, 255];
    pixels.set(color, offset);
  }
}

const mask = Buffer.alloc(Math.ceil(size / 32) * 4 * size);
const dib = Buffer.concat([header, pixels, mask]);
const iconHeader = Buffer.alloc(6);
iconHeader.writeUInt16LE(0, 0);
iconHeader.writeUInt16LE(1, 2);
iconHeader.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry.writeUInt8(size === 256 ? 0 : size, 0);
entry.writeUInt8(size === 256 ? 0 : size, 1);
entry.writeUInt8(0, 2);
entry.writeUInt8(0, 3);
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(dib.length, 8);
entry.writeUInt32LE(iconHeader.length + entry.length, 12);

const output = path.join(__dirname, '..', 'assets', 'icon.ico');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([iconHeader, entry, dib]));
console.log(`Ícone criado em ${output}`);
