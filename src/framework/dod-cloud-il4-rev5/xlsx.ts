import { inflateRawSync } from "node:zlib";

const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_DIRECTORY = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCharCode(Number.parseInt(dec, 10)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Minimal ZIP reader for OOXML workbooks (store + deflate).
 * Does not follow ZIP64 or data-descriptor entries.
 */
export function unzipOoxml(buffer: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (
      signature === CENTRAL_DIRECTORY ||
      signature === END_OF_CENTRAL_DIRECTORY
    ) {
      break;
    }
    if (signature !== LOCAL_FILE_HEADER) {
      throw new Error(
        `Unexpected ZIP signature 0x${signature.toString(16)} at offset ${offset}`,
      );
    }
    const flags = buffer.readUInt16LE(offset + 6);
    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    if (flags & 0x8) {
      throw new Error("ZIP data descriptors are not supported.");
    }
    const nameStart = offset + 30;
    const name = buffer.subarray(nameStart, nameStart + nameLen).toString("utf8");
    const dataStart = nameStart + nameLen + extraLen;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    let data: Buffer;
    if (compression === 0) {
      data = Buffer.from(compressed);
    } else if (compression === 8) {
      data = Buffer.from(inflateRawSync(compressed));
    } else {
      throw new Error(`Unsupported ZIP compression ${compression} for ${name}`);
    }
    if (uncompressedSize > 0 && data.length !== uncompressedSize) {
      throw new Error(`Uncompressed size mismatch for ${name}`);
    }
    files.set(name.replaceAll("\\", "/"), data);
    offset = dataStart + compressedSize;
  }
  return files;
}

function xmlAttr(attrs: string, name: string): string | undefined {
  const match = new RegExp(`\\b${name}="([^"]*)"`).exec(attrs);
  return match?.[1];
}

export function parseSharedStrings(xml: string): string[] {
  const values: string[] = [];
  for (const si of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    const texts = [...si[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) =>
      decodeXmlEntities(match[1]),
    );
    values.push(texts.join(""));
  }
  return values;
}

export type SheetCellMap = Map<number, Map<string, string>>;

export function parseSheetCells(xml: string, sharedStrings: string[]): SheetCellMap {
  const rows: SheetCellMap = new Map();
  const opener = /<c\b([^>]*?)(\/>|>)/g;
  let match: RegExpExecArray | null;
  while ((match = opener.exec(xml))) {
    const attrs = match[1] ?? "";
    const selfClosing = match[2] === "/>";
    let inner = "";
    if (!selfClosing) {
      const start = opener.lastIndex;
      const end = xml.indexOf("</c>", start);
      if (end === -1) {
        break;
      }
      inner = xml.slice(start, end);
      opener.lastIndex = end + 4;
    }
    const ref = xmlAttr(attrs, "r");
    if (!ref) {
      continue;
    }
    const parsedRef = /^([A-Z]+)(\d+)$/.exec(ref);
    if (!parsedRef) {
      continue;
    }
    const col = parsedRef[1];
    const row = Number.parseInt(parsedRef[2], 10);
    const type = xmlAttr(attrs, "t");
    let value = "";
    if (type === "s") {
      const indexText = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      if (indexText !== undefined) {
        value = sharedStrings[Number.parseInt(indexText, 10)] ?? "";
      }
    } else if (type === "inlineStr") {
      const texts = [...inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) =>
        decodeXmlEntities(match[1]),
      );
      value = texts.join("");
    } else {
      const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      if (raw !== undefined) {
        value = decodeXmlEntities(raw);
      }
    }
    let rowMap = rows.get(row);
    if (!rowMap) {
      rowMap = new Map();
      rows.set(row, rowMap);
    }
    rowMap.set(col, value);
  }
  return rows;
}

export type WorkbookSheet = {
  name: string;
  path: string;
};

export function listWorkbookSheets(files: Map<string, Buffer>): WorkbookSheet[] {
  const workbook = files.get("xl/workbook.xml");
  const rels = files.get("xl/_rels/workbook.xml.rels");
  if (!workbook || !rels) {
    throw new Error("OOXML workbook or relationships part missing.");
  }
  const relById = new Map<string, string>();
  const relsXml = rels.toString("utf8");
  for (const rel of relsXml.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const attrs = rel[1] ?? "";
    const id = xmlAttr(attrs, "Id");
    const target = xmlAttr(attrs, "Target");
    if (id && target) {
      const normalized = target.replace(/^\//, "");
      const path = normalized.startsWith("xl/")
        ? normalized
        : `xl/${normalized.replace(/^\.\.\//, "")}`;
      relById.set(id, path);
    }
  }
  const sheets: WorkbookSheet[] = [];
  const workbookXml = workbook.toString("utf8");
  for (const sheet of workbookXml.matchAll(/<sheet\b([^>]*)\/>/g)) {
    const attrs = sheet[1] ?? "";
    const name = xmlAttr(attrs, "name");
    const rid = xmlAttr(attrs, "r:id") ?? xmlAttr(attrs, "id");
    if (!name || !rid) {
      continue;
    }
    const path = relById.get(rid);
    if (!path) {
      throw new Error(`Missing worksheet target for ${name} (${rid}).`);
    }
    sheets.push({ name, path });
  }
  if (sheets.length === 0) {
    throw new Error("Workbook contains no worksheets.");
  }
  return sheets;
}

export function loadOoxmlWorkbook(buffer: Buffer): {
  files: Map<string, Buffer>;
  sheets: WorkbookSheet[];
  sharedStrings: string[];
} {
  const files = unzipOoxml(buffer);
  const sstPart = files.get("xl/sharedStrings.xml");
  const sharedStrings = sstPart
    ? parseSharedStrings(sstPart.toString("utf8"))
    : [];
  return {
    files,
    sheets: listWorkbookSheets(files),
    sharedStrings,
  };
}

export function readSheetCells(
  files: Map<string, Buffer>,
  sharedStrings: string[],
  sheetPath: string,
): SheetCellMap {
  const part = files.get(sheetPath);
  if (!part) {
    throw new Error(`Missing worksheet part ${sheetPath}`);
  }
  return parseSheetCells(part.toString("utf8"), sharedStrings);
}

export function cell(row: Map<string, string> | undefined, column: string): string {
  return (row?.get(column) ?? "").trim();
}
