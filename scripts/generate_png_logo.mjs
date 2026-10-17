import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createShieldPng(width, height) {
  // Build RGBA bitmap
  const rowSize = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Normalized coordinates -1 to 1
      const nx = (x - width / 2) / (width / 2);
      const ny = (y - height / 2) / (height / 2);

      // Distance from center
      const inShield = (ny >= -0.8 && ny <= 0.85 && Math.abs(nx) <= (ny <= 0 ? 0.75 : 0.75 * (1 - (ny - 0) / 0.85)));

      // Padlock shackle: arch at top
      const shackleDist = Math.sqrt(nx * nx + (ny + 0.3) * (ny + 0.3));
      const inShackle = (shackleDist >= 0.18 && shackleDist <= 0.28 && ny <= -0.1);

      // Padlock body
      const inLockBody = (Math.abs(nx) <= 0.32 && ny >= -0.15 && ny <= 0.4);

      // Keyhole
      const inKeyCircle = Math.sqrt(nx * nx + (ny - 0.05) * (ny - 0.05)) <= 0.09;
      const inKeyStem = (Math.abs(nx) <= 0.04 && ny >= 0.05 && ny <= 0.25);
      const inKeyhole = inKeyCircle || inKeyStem;

      if (inShield) {
        if (inKeyhole) {
          // Bright cyan keyhole
          rawData[pixelOffset] = 56;
          rawData[pixelOffset + 1] = 189;
          rawData[pixelOffset + 2] = 248;
          rawData[pixelOffset + 3] = 255;
        } else if (inLockBody) {
          // Dark slate padlock body
          rawData[pixelOffset] = 15;
          rawData[pixelOffset + 1] = 23;
          rawData[pixelOffset + 2] = 42;
          rawData[pixelOffset + 3] = 255;
        } else if (inShackle) {
          // Silver-blue metallic shackle
          rawData[pixelOffset] = 147;
          rawData[pixelOffset + 1] = 197;
          rawData[pixelOffset + 2] = 253;
          rawData[pixelOffset + 3] = 255;
        } else {
          // Vibrant blue gradient shield background
          const grad = Math.min(1, Math.max(0, (ny + 0.8) / 1.6));
          rawData[pixelOffset] = Math.round(37 * (1 - grad) + 29 * grad);
          rawData[pixelOffset + 1] = Math.round(99 * (1 - grad) + 78 * grad);
          rawData[pixelOffset + 2] = Math.round(235 * (1 - grad) + 216 * grad);
          rawData[pixelOffset + 3] = 255;
        }
      } else {
        // Transparent outside shield
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  // Compress IDAT
  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC calculation
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // CRC-32 table
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pngBuffer = createShieldPng(128, 128);
const outPath = path.join(process.cwd(), 'public', 'logo.png');
fs.writeFileSync(outPath, pngBuffer);
console.log(`Generated logo.png (${pngBuffer.length} bytes) at ${outPath}`);
