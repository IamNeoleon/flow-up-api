import { randomUUID } from "crypto";
import { safeFileName } from "./safe-file-name";

export const buildAttachmentKey = (taskId: string, originalName: string) => {
   const safe = safeFileName(originalName);
   return `tasks/${taskId}/attachments/${randomUUID()}-${safe}`;
}