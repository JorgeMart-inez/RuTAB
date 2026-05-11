import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { X, Check, ZoomIn } from "lucide-react";
import { getCroppedImg } from "../../utils/imageUtils";

interface Props {
  isOpen: boolean;
  imageFile: File; // Recibimos el archivo crudo
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number;
}

export const ImageCropperModal = ({
  isOpen,
  imageFile,
  onClose,
  onCropComplete,
  aspectRatio = 1,
}: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Generar URL temporal a partir del File
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);

      // Limpieza: Revocar la URL cuando el componente se desmonte o cambie el archivo
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    }
  }, [imageFile]);

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location);
  };

  const onZoomChange = (zoomLevel: number) => {
    setZoom(zoomLevel);
  };

  const handleCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setProcessing(true);
    try {
      // getCroppedImg debe devolver un objeto File (preferiblemente WebP)
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedFile) {
        onCropComplete(croppedFile);
      }
    } catch (e) {
      console.error("Error al procesar el recorte:", e);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Ajustar Imagen</h3>
            <p className="text-xs text-slate-400 font-medium">
              Arrastra y ajusta el encuadre
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Área del Cropper */}
        <div className="relative h-96 w-full bg-slate-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={handleCropComplete}
          />
        </div>

        {/* Controles y Acciones */}
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-500">
                <ZoomIn size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Zoom
                </span>
              </div>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                {zoom.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={processing}
              className="flex-[2] flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check size={18} /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
