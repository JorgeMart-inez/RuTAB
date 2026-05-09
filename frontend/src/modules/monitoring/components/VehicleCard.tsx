import { MapPin } from 'lucide-react'; // Usando Lucide para los iconos

interface VehicleCardProps {
  id: string;
  driverName: string;
  currentLocation: string;
  speed: number;
  fuel: number;
  stops: string;
  eta: string;
  nextPoint: string;
  status: 'En ruta' | 'Detenido' | 'Alerta';
}

export const VehicleCard = ({ 
  id, driverName, currentLocation, speed, fuel, stops, eta, nextPoint, status 
}: VehicleCardProps) => {
  return (
    <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100 mb-4 hover:border-blue-300 transition-colors">
      {/* Header: ID y Status */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800">{id}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          status === 'En ruta' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
        }`}>
          {status}
        </span>
      </div>

      {/* Chofer y Ubicación */}
      <div className="mb-4">
        <p className="text-gray-500 text-sm">{driverName}</p>
        <div className="flex items-center text-gray-600 mt-1">
          <MapPin size={14} className="mr-1" />
          <span className="text-xs">{currentLocation}</span>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-2 gap-y-2 text-sm border-b border-gray-200 pb-3 mb-3">
        <div className="flex justify-between pr-4 border-r border-gray-100">
          <span className="text-gray-400">Velocidad:</span>
          <span className="font-medium text-gray-700">{speed} km/h</span>
        </div>
        <div className="flex justify-between pl-4">
          <span className="text-gray-400">Combustible:</span>
          <span className="font-medium text-gray-700">{fuel}%</span>
        </div>
        <div className="flex justify-between pr-4 border-r border-gray-100">
          <span className="text-gray-400">Parada:</span>
          <span className="font-medium text-gray-700">{stops}</span>
        </div>
        <div className="flex justify-between pl-4">
          <span className="text-gray-400">ETA:</span>
          <span className="font-medium text-gray-700">{eta}</span>
        </div>
      </div>

      {/* Footer: Siguiente Punto */}
      <div className="flex justify-between items-center text-xs">
        <div className="flex flex-col">
          <span className="text-gray-400 uppercase tracking-tighter font-bold">Siguiente:</span>
          <span className="text-gray-700 font-semibold">{nextPoint}</span>
        </div>
        <span className="text-green-500 font-bold uppercase">Óptimo</span>
      </div>
    </div>
  );
};