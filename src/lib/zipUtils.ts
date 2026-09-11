import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ProjectFile } from "../types";

export async function downloadFilesAsZip(
  files: ProjectFile[],
  targetLanguage: string = "project"
): Promise<void> {
  if (!files || files.length === 0) {
    throw new Error("No files to download.");
  }

  const zip = new JSZip();

  for (const file of files) {
    // Normalize path separators and remove leading slashes
    const normalizedPath = file.path.replace(/\\/g, "/").replace(/^\/+/, "");
    zip.file(normalizedPath, file.content);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const cleanLang = targetLanguage.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `translated-${cleanLang}-${timestamp}.zip`;

  saveAs(blob, filename);
}
