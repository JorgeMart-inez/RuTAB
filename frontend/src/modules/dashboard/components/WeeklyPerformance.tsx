// src/modules/dashboard/components/WeeklyPerformance.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  const fechaTexto = item?.fecha
    ? new Date(`${item.fecha}T00:00:00Z`).toLocaleDateString('es-MX', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null;

  return (
    <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
        {item?.nombreDia?.toUpperCase()}
      </p>
      {fechaTexto && (
        <p className="text-[10px] text-slate-400 mt-1">{fechaTexto}</p>
      )}
      <div className="mt-2 text-slate-800 text-sm font-bold space-y-1">
        <p className='text-sm font-black text-green-400 uppercase tracking-tighter'>Entregados: {payload.find((p: any) => p.dataKey === 'entregados')?.value ?? 0}</p>
        <p className='text-sm font-black text-red-400 uppercase tracking-tighter'>Fallidos: {payload.find((p: any) => p.dataKey === 'fallidos')?.value ?? 0}</p>
      </div>
    </div>
  );
};

export const WeeklyPerformance = ({ data }: any) => {
  const hasData = Array.isArray(data) && data.length > 0;
  const weekdayOrder = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
  const normalizeDay = (value?: string) =>
    (value || '')
      .toUpperCase()
      .replace(/Á/g, 'A')
      .replace(/É/g, 'E')
      .replace(/Í/g, 'I')
      .replace(/Ó/g, 'O')
      .replace(/Ú/g, 'U');

  const chartData = hasData
    ? [...data].sort((a, b) => {
        const first = normalizeDay(a?.nombreDia);
        const second = normalizeDay(b?.nombreDia);
        const posA = weekdayOrder.indexOf(first);
        const posB = weekdayOrder.indexOf(second);

        if (posA === posB) return (a?.fecha || '').localeCompare(b?.fecha || '');
        if (posA === -1) return 1;
        if (posB === -1) return -1;
        return posA - posB;
      })
    : [];

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[350px]">
      <div className="mb-4">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">RENDIMIENTO SEMANAL</h3>
        <p className="text-md font-bold text-slate-500">Histórico de Entregas</p>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="nombreDia"
              axisLine={false}
              tickLine={false}
              fontSize={10}
              fontWeight="bold"
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              content={<CustomTooltip />}
              wrapperStyle={{ outline: 'none' }}
              allowEscapeViewBox={{ x: true, y: true }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
            <Bar dataKey="entregados" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} name="Exitosos" />
            <Bar dataKey="fallidos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} name="Incidencias" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm font-semibold">
          No hay datos de rendimiento semanal disponibles todavía.
        </div>
      )}
    </div>
  );
};