const DEFAULT_MAX_UPLOAD_SIZE_MB = 5;
const BYTES_PER_MB = 1024 * 1024;

const allowedFileTypes = [
  {
    extension: "pdf",
    mimeTypes: ["application/pdf"],
    label: "PDF (.pdf)",
  },
  {
    extension: "jpg",
    mimeTypes: ["image/jpeg"],
    label: "JPEG image (.jpg, .jpeg)",
  },
  {
    extension: "jpeg",
    mimeTypes: ["image/jpeg"],
    label: "JPEG image (.jpg, .jpeg)",
  },
  {
    extension: "png",
    mimeTypes: ["image/png"],
    label: "PNG image (.png)",
  },
  {
    extension: "doc",
    mimeTypes: ["application/msword"],
    label: "Word document (.doc)",
  },
  {
    extension: "docx",
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    label: "Word document (.docx)",
  },
  {
    extension: "xls",
    mimeTypes: ["application/vnd.ms-excel"],
    label: "Excel spreadsheet (.xls)",
  },
  {
    extension: "xlsx",
    mimeTypes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    label: "Excel spreadsheet (.xlsx)",
  },
] as const;

const allowedExtensionSet = new Set<string>(allowedFileTypes.map((item) => item.extension));
const allowedMimeTypeSet = new Set<string>(allowedFileTypes.flatMap((item) => item.mimeTypes));
const allowedAcceptValues = Array.from(new Set(allowedFileTypes.map((item) => `.${item.extension}`)));

function parseMaxUploadSizeBytes(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_MAX_UPLOAD_SIZE_MB * BYTES_PER_MB;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_UPLOAD_SIZE_MB * BYTES_PER_MB;
  }

  return Math.floor(parsed * BYTES_PER_MB);
}

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const parts = normalized.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.at(-1) || "";
}

export const workItemFileValidation = {
  maxUploadSizeBytes: parseMaxUploadSizeBytes(process.env.WORK_ITEM_FILE_MAX_SIZE_MB),
  defaultMaxUploadSizeMb: DEFAULT_MAX_UPLOAD_SIZE_MB,
  allowedAcceptValues,
  allowedExtensions: Array.from(allowedExtensionSet),
  allowedLabels: ["PDF", "JPG/JPEG", "PNG", "DOC", "DOCX", "XLS", "XLSX"],
};

export function formatBytesAsMb(bytes: number) {
  const mb = bytes / BYTES_PER_MB;
  return Number.isInteger(mb) ? `${mb} MB` : `${mb.toFixed(1)} MB`;
}

export function validateWorkItemFile(file: File) {
  const extension = getFileExtension(file.name);
  const normalizedMimeType = file.type.trim().toLowerCase();
  const hasAllowedExtension = allowedExtensionSet.has(extension);
  const hasAllowedMimeType = !normalizedMimeType || allowedMimeTypeSet.has(normalizedMimeType);

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    return {
      valid: false as const,
      error: `รองรับเฉพาะไฟล์ ${workItemFileValidation.allowedLabels.join(", ")} เท่านั้น`,
    };
  }

  if (file.size > workItemFileValidation.maxUploadSizeBytes) {
    return {
      valid: false as const,
      error: `ไฟล์มีขนาดเกิน ${formatBytesAsMb(workItemFileValidation.maxUploadSizeBytes)}`,
    };
  }

  return { valid: true as const };
}
