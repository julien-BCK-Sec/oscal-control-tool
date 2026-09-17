/**
 * Minimal ZIP reader for generated DOCX packages in tests.
 * Supports stored and deflated local-file entries (the JSZip default).
 */

import { inflateRawSync } from "node:zlib";

const LOCAL_FILE = 0x04034b50;
const CENTRAL_DIR = 0x02014b50;
const END_CENTRAL = 0x06054b50;

export function readZipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 4 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature === CENTRAL_DIR || signature === END_CENTRAL) {
      break;
    }
    if (signature !== LOCAL_FILE) {
      throw new Error(`Unexpected ZIP signature at ${offset}`);
    }
    const flags = buffer.readUInt16LE(offset + 6);
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString("utf8");
    const dataStart = nameStart + nameLength + extraLength;
    if ((flags & 0x8) !== 0) {
      throw new Error(`ZIP data descriptor not supported for ${name}`);
    }
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    let uncompressed: Buffer;
    if (method === 0) {
      uncompressed = Buffer.from(compressed);
    } else if (method === 8) {
      uncompressed = inflateRawSync(compressed);
    } else {
      throw new Error(`Unsupported ZIP method ${method} for ${name}`);
    }
    entries.set(name, uncompressed);
    offset = dataStart + compressedSize;
  }
  return entries;
}

export function readZipTextEntries(buffer: Buffer): Map<string, string> {
  const files = new Map<string, string>();
  for (const [name, bytes] of readZipEntries(buffer)) {
    files.set(name, bytes.toString("utf8"));
  }
  return files;
}

/** Strip relationship/rsid noise so semantic XML can be compared. */
export function normalizeXml(xml: string): string {
  return xml
    .replace(/w:rsid\w*="[^"]*"/g, "")
    .replace(/\br:id="rId\d+"/g, 'r:id="rIdN"')
    .replace(/\bw:id="\d+"/g, 'w:id="0"')
    .replace(/xml:space="preserve"/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}
