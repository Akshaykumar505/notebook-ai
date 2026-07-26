import { FileText, Type, Link2, Clapperboard, Captions, type LucideIcon } from "lucide-react";
import type { SourceType } from "@/types";

const ICONS: Record<SourceType, LucideIcon> = {
  PDF: FileText,
  TEXT: Type,
  URL: Link2,
  YOUTUBE: Clapperboard,
  VTT: Captions,
};

export function SourceIcon({ type, className }: { type: SourceType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon className={className} strokeWidth={1.75} />;
}
