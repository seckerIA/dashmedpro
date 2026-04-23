import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'image' | 'video';
  url: string;
  fileName?: string;
}

export function MediaViewer({ isOpen, onClose, type, url, fileName }: MediaViewerProps) {
  if (!url) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `media-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] max-h-[90vh] p-0 border-none bg-black/90 text-white overflow-hidden flex flex-col">
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 min-h-[300px]">
          {type === 'image' ? (
            <img
              src={url}
              alt="Media"
              className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-sm"
            />
          ) : (
            <video
              src={url}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] shadow-2xl rounded-sm"
            >
              Seu navegador não suporta a reprodução de vídeos.
            </video>
          )}
        </div>
        
        {fileName && (
          <div className="p-4 bg-black/50 backdrop-blur-sm text-center">
            <p className="text-sm font-medium truncate">{fileName}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
