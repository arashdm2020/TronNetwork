import type { TransferRecord } from "@/store/transfer-store";

export const encodeTransferRecord = (record: TransferRecord) => encodeURIComponent(JSON.stringify(record));

export const decodeTransferRecord = (value: string | null): TransferRecord | null => {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as TransferRecord;
  } catch {
    return null;
  }
};

export const transferDocumentPath = (record: TransferRecord) => `/transfer/${encodeURIComponent(record.transferId)}?data=${encodeTransferRecord(record)}`;
