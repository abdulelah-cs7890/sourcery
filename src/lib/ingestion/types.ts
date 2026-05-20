export type VideoMeta = {
  id: string;
  caption: string;
  title: string;
  uploader: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
};

export type IngestionErrorCode =
  | "unreachable"
  | "private"
  | "unsupported"
  | "timeout"
  | "unknown";

export class IngestionError extends Error {
  readonly code: IngestionErrorCode;
  constructor(code: IngestionErrorCode, message: string) {
    super(message);
    this.name = "IngestionError";
    this.code = code;
  }
}
