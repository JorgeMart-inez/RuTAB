// src/modules/audit/routes/pages/RoutesPage.tsx
import { useState, useEffect } from "react";
import { Truck, Calendar, MapPin, Package } from "lucide-react";
import { optimizationService } from "../../../optimization/services/optimizationService";
import { RutaPendiente } from "../../../optimization/pages/VehicleSelectionPage";

export const RoutesPage = () => {
  const [routes, setRoutes] = useState<RutaPendiente[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, []);

  const filteredRoutes = routes.filter((route) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return [route.rutaId, route.placas, route.modelo]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  const formatRouteDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      // Obtener rutas pendientes (borrador)
      const pendingRoutes = await optimizationService.obtenerRutasPendientes();
      setRoutes(pendingRoutes);
    } catch (error) {
      console.error("Error al cargar rutas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">
          Auditoría de Rutas
        </h1>
        <p className="text-gray-500">
          Supervisa y valida las rutas cargadas antes de su optimización.
        </p>
      </header>

      <div className="mb-6">
        <label htmlFor="route-search" className="sr-only">
          Buscar rutas
        </label>
        <input
          id="route-search"
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar por ID, placas o modelo..."
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
          <div className="size-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-medium">Cargando rutas...</p>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Truck className="mx-auto size-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {routes.length === 0
              ? "No hay rutas pendientes de auditoría"
              : "No se encontraron rutas para la búsqueda"}
          </p>
          <p className="text-sm">
            {routes.length === 0
              ? "Las rutas cargadas aparecerán aquí para su revisión."
              : "Intenta con otro texto de búsqueda."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutes.map((route) => (
            <div
              key={route.rutaId}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Truck className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Ruta {route.rutaId.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">{route.placas}</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Borrador
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="size-4" />
                  <span>{formatRouteDate(route.fechaProgramada)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="size-4" />
                  <span>{route.pedidosAsignados} pedidos asignados</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="size-4" />
                  <span>{route.modelo}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Creada para optimización y planificación de entregas
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};