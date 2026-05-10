// /src/modules/route-loader/pages/RouteLoaderPage.tsx

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { useRouteLoader } from "../hooks/useRouteLoader";

export const RouteLoaderPage = () => {
  const { uploadFile, isUploading } = useRouteLoader();

  // Estados locales para los archivos seleccionados
  const [fileNew, setFileNew] = useState<File | null>(null);
  const [fileFailed, setFileFailed] = useState<File | null>(null);

  // Referencias para limpiar los inputs físicamente
  const inputNewRef = useRef<HTMLInputElement>(null);
  const inputFailedRef = useRef<HTMLInputElement>(null);

  const handleProcess = async (type: "new" | "failed") => {
    const file = type === "new" ? fileNew : fileFailed;
    const endpoint = type === "new" ? "new-routes" : "failed-orders";

    if (file) {
      const success = await uploadFile(file, endpoint);
      if (success) {
        clearFile(type);
      }
    }
  };

  const clearFile = (type: "new" | "failed") => {
    if (type === "new") {
      setFileNew(null);
      if (inputNewRef.current) inputNewRef.current.value = "";
    } else {
      setFileFailed(null);
      if (inputFailedRef.current) inputFailedRef.current.value = "";
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Cargar Rutas y Operaciones
        </h1>
        <p className="text-slate-500 mt-2">
          Importación masiva de clientes, pedidos y re-asignación de logística
          fallida.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SECCIÓN 1: NUEVAS RUTAS */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">
              Nuevas Rutas y Pedidos
            </h2>
          </div>

          <p className="text-sm text-slate-500 mb-6">
            Crea registros de Rutas, Clientes y Pedidos. El sistema buscará
            vehículos y choferes por sus placas/correo.
          </p>

          <div className="relative flex-1 group">
            <label
              className={`h-full w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                fileNew
                  ? "border-green-400 bg-green-50/30"
                  : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
              }`}
            >
              <input
                ref={inputNewRef}
                type="file"
                accept=".csv"
                className="hidden"
                onClick={(e) => ((e.target as HTMLInputElement).value = "")} // Fix bug mismo archivo
                onChange={(e) => setFileNew(e.target.files?.[0] || null)}
              />
              {fileNew ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                  <span className="text-sm font-medium text-green-700 text-center break-all px-4">
                    {fileNew.name}
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-10 h-10 text-slate-300 mb-2" />
                  <span className="text-sm text-slate-400 text-center">
                    Seleccionar CSV de nuevas rutas
                  </span>
                </>
              )}
            </label>

            {fileNew && (
              <button
                onClick={() => clearFile("new")}
                className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full shadow-sm transition-colors"
                title="Quitar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleProcess("new")}
            disabled={!fileNew || isUploading}
            className="mt-6 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-lg shadow-blue-600/20"
          >
            {isUploading ? "Procesando..." : "Iniciar Carga Masiva"}
          </button>
        </section>

        {/* SECCIÓN 2: PEDIDOS FALLIDOS */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">
              Re-asignar Pedidos Fallidos
            </h2>
          </div>

          <p className="text-sm text-slate-500 mb-6">
            Actualiza pedidos con estado{" "}
            <span className="font-mono text-xs bg-slate-100 px-1 rounded text-orange-700">
              extraido_fallido
            </span>{" "}
            para vincularlos a una nueva ruta.
          </p>

          <div className="relative flex-1 group">
            <label
              className={`h-full w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                fileFailed
                  ? "border-green-400 bg-green-50/30"
                  : "border-slate-200 hover:border-orange-400 hover:bg-slate-50"
              }`}
            >
              <input
                ref={inputFailedRef}
                type="file"
                accept=".csv"
                className="hidden"
                onClick={(e) => ((e.target as HTMLInputElement).value = "")} // Fix bug mismo archivo
                onChange={(e) => setFileFailed(e.target.files?.[0] || null)}
              />
              {fileFailed ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                  <span className="text-sm font-medium text-green-700 text-center break-all px-4">
                    {fileFailed.name}
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-10 h-10 text-slate-300 mb-2" />
                  <span className="text-sm text-slate-400 text-center">
                    Seleccionar CSV de re-asignación
                  </span>
                </>
              )}
            </label>

            {fileFailed && (
              <button
                onClick={() => clearFile("failed")}
                className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full shadow-sm transition-colors"
                title="Quitar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleProcess("failed")}
            disabled={!fileFailed || isUploading}
            className="mt-6 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-lg shadow-slate-900/20"
          >
            {isUploading ? "Actualizando..." : "Procesar Re-asignación"}
          </button>
        </section>
      </div>

      {/* NOTA INFORMATIVA ACTUALIZADA */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 leading-relaxed">
          <p className="font-bold mb-1">Información importante:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>
              El archivo de nuevas rutas debe incluir las columnas{" "}
              <code className="bg-blue-100 px-1 rounded font-bold">
                latitud_cliente
              </code>{" "}
              y{" "}
              <code className="bg-blue-100 px-1 rounded font-bold">
                longitud_cliente
              </code>{" "}
              por separado.
            </li>
            <li>
              Para la re-asignación, asegúrate de que el código de la ruta ya
              exista en el sistema.
            </li>
            <li>
              Si ocurre un error en cualquier fila del archivo, se cancelará
              toda la operación para evitar datos incompletos.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
