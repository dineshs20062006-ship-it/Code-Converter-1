import React, { useRef, useState } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  UploadCloud,
} from "lucide-react";
import { ReferenceImagePayload } from "../types";

interface FrontendPreviewConfigProps {
  previewDescription: string;
  onSetPreviewDescription: (val: string) => void;
  referenceImage: ReferenceImagePayload | null;
  onSetReferenceImage: (img: ReferenceImagePayload | null) => void;
  isVisible: boolean;
}

export function FrontendPreviewConfig({
  previewDescription,
  onSetPreviewDescription,
  referenceImage,
  onSetReferenceImage,
  isVisible,
}: FrontendPreviewConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isVisible) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, WebP, SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onSetReferenceImage({
        data: dataUrl,
        mimeType: file.type,
        name: file.name,
        previewUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const hasConfig = Boolean(previewDescription.trim() || referenceImage);

  return (
    <div className="bg-[#0C0E16] border-b border-[#1C202F] text-xs">
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Frontend Preview Design & Guidance</span>
          </div>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            (Optional visual mockup & UI behavior)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] transition-colors cursor-pointer ${
            hasConfig || isExpanded
              ? "bg-cyan-950/30 border-cyan-700/50 text-cyan-300"
              : "bg-[#141724] hover:bg-[#1A1F30] border-[#23283B] text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span>{isExpanded ? "Collapse" : hasConfig ? "Edit Guidance" : "Add UI Guidance"}</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-[#171B28] grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-top-1 duration-150">
          {/* Text Description */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Describe what you want the preview to look like or behave like (optional)</span>
            </label>
            <textarea
              rows={3}
              value={previewDescription}
              onChange={(e) => onSetPreviewDescription(e.target.value)}
              placeholder="e.g. Modern dark theme with high contrast, responsive 3-column dashboard card grid, smooth hover animations, and accessible text..."
              className="w-full bg-[#121522] border border-[#23293D] rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-sans resize-none"
            />
          </div>

          {/* Reference Image Upload */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Attach a reference screenshot or mockup (optional)</span>
            </label>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {!referenceImage ? (
              <div
                onClick={() => imageInputRef.current?.click()}
                className="flex-1 min-h-[75px] border-2 border-dashed border-[#23283B] hover:border-cyan-500/50 rounded-lg bg-[#121522] hover:bg-[#151928] p-3 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
              >
                <UploadCloud className="w-5 h-5 text-zinc-400 mb-1" />
                <span className="text-[11px] text-zinc-300 font-medium">
                  Click to attach image (PNG, JPG, WebP)
                </span>
                <span className="text-[10px] text-zinc-500">
                  Visual theme and layout will be matched by Gemini
                </span>
              </div>
            ) : (
              <div className="flex-1 min-h-[75px] p-2.5 rounded-lg bg-[#121522] border border-indigo-700/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={referenceImage.previewUrl || referenceImage.data}
                    alt="Mockup Reference"
                    className="w-14 h-14 rounded object-cover border border-indigo-500/40 shrink-0 bg-black/40"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {referenceImage.name || "Mockup Image"}
                    </p>
                    <p className="text-[10px] text-indigo-300 font-mono">
                      Multimodal image attached
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSetReferenceImage(null)}
                  className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors shrink-0"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
