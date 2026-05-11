import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check } from "lucide-react";
import { getCroppedImg } from "../utils/imageUtils";

interface Props {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
}

export const ImageCropperModal = ({
  imageSrc,
  onClose,
  onCropComplete,
}: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const handleCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedFile) {
        onCropComplete(croppedFile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Ajustar Foto</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative h-80 w-full bg-gray-50">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // Fuerza el cuadrado (1:1)
            cropShape="round" // Muestra un círculo para visualizar cómo quedará el avatar
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-gray-500">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:bg-blue-300"
            >
              {processing ? (
                "Procesando..."
              ) : (
                <>
                  <Check size={16} /> Aplicar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
