import React, { useRef, useState } from "react";
import {
  Layers,
  Cpu,
  Image as ImageIcon,
  FileText,
  Trash2,
  UploadCloud,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { TARGET_FRONTEND_OPTIONS, TARGET_BACKEND_OPTIONS } from "../data/presets";
import { ReferenceImagePayload } from "../types";

interface TargetConfigPanelProps {
  targetFrontend: string;
  onSetTargetFrontend: (val: string) => void;
  targetBackend: string;
  onSetTargetBackend: (val: string) => void;
  conversionInstructions: string;
  onSetConversionInstructions: (val: string) => void;
  referenceImage: ReferenceImagePayload | null;
  onSetReferenceImage: (img: ReferenceImagePayload | null) => void;
  maxAttempts: number;
  onSetMaxAttempts: (val: number) => void;
}

export function TargetConfigPanel({
  targetFrontend,
  onSetTargetFrontend,
  targetBackend,
  onSetTargetBackend,
  conversionInstructions,
  onSetConversionInstructions,
  referenceImage,
  onSetReferenceImage,
  maxAttempts,
  onSetMaxAttempts,
}: TargetConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WebP).");
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
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    onSetReferenceImage(null);
  };

  return (
    <div className="bg-[#0E1018] border-b border-[#1C202F] text-xs">
      {/* Primary Toolbar Row */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
          {/* Target Frontend Selector */}
          <div className="flex items-center gap-2 bg-[#141724] border border-[#23283B] rounded-md px-3 py-1.5 shadow-sm hover:border-[#2E364F] transition-colors">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">Target Frontend:</span>
            <select
              value={targetFrontend}
              onChange={(e) => onSetTargetFrontend(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs pr-1"
            >
              {TARGET_FRONTEND_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.name} className="bg-[#141724] text-white">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Backend Selector */}
          <div className="flex items-center gap-2 bg-[#141724] border border-[#23283B] rounded-md px-3 py-1.5 shadow-sm hover:border-[#2E364F] transition-colors">
            <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">Target Backend:</span>
            <select
              value={targetBackend}
              onChange={(e) => onSetTargetBackend(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs pr-1"
            >
              {TARGET_BACKEND_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.name} className="bg-[#141724] text-white">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Image Button / Indicator */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />

          {!referenceImage ? (
            <button
              onClick={() => imageInputRef.current?.click()}
              title="Upload UI Reference Image for Visual Styling"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#141724] hover:bg-[#1A1F30] border border-[#23283B] hover:border-[#2E364F] text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">Upload Reference Image</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-indigo-950/30 border border-indigo-700/50 rounded-md px-2.5 py-1 text-indigo-200 shadow-sm">
              <img
                src={referenceImage.previewUrl || referenceImage.data}
                alt="Mockup Reference"
                className="w-5 h-5 rounded object-cover border border-indigo-500/40"
              />
              <span className="text-[11px] font-mono truncate max-w-[120px]" title={referenceImage.name}>
                {referenceImage.name || "Mockup"}
              </span>
              <button
                onClick={handleRemoveImage}
                title="Remove Reference Image"
                className="p-0.5 text-indigo-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-all cursor-pointer shadow-sm ${
              isExpanded || conversionInstructions.trim()
                ? "bg-cyan-950/30 border-cyan-700/50 text-cyan-300"
                : "bg-[#141724] hover:bg-[#1A1F30] border-[#23283B] hover:border-[#2E364F] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[11px]">Conversion Instructions</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Conversion Instructions & Advanced Options */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-2 border-t border-[#1C202F] bg-[#0A0C13] flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Custom Conversion & Styling Instructions
              </span>
              <span className="text-zinc-500">Guides Gemini in theme, routing, APIs, and components</span>
            </div>
            <textarea
              value={conversionInstructions}
              onChange={(e) => onSetConversionInstructions(e.target.value)}
              placeholder="e.g. Use dark Tailwind aesthetic with rounded cards, add interactive particle controls, mock REST API endpoints, ensure mobile responsiveness, and export clean components..."
              rows={2}
              className="w-full bg-[#121522] border border-[#202538] rounded-md p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-sans resize-none shadow-inner"
            />
          </div>

          <div className="flex flex-col justify-between w-full md:w-56 shrink-0 space-y-2 border-t md:border-t-0 md:border-l border-[#1C202F] md:pl-4 pt-2 md:pt-0">
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400 block font-semibold">Self-Repair Attempts</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => onSetMaxAttempts(num)}
                    className={`flex-1 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
                      maxAttempts === num
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-400 text-white font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                        : "bg-[#141724] border-[#22273A] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-zinc-500 font-mono">
              Sandbox bindings: <span className="text-cyan-400">0.0.0.0:3000</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
