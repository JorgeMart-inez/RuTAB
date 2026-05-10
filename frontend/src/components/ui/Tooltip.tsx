import { ReactNode } from "react";

interface TooltipProps {
  text: string;
  children: ReactNode;
  enabled: boolean;
}

export const Tooltip = ({ text, children, enabled }: TooltipProps) => {
  if (!enabled) return <>{children}</>;

  return (
    <div className="group relative flex items-center">
      {children}
      {/* Contenedor del Tooltip */}
      <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[9999] min-w-max">
        <div className="relative px-3 py-2 bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-2xl border border-neutral-700">
          {text}
          {/* Triangulito */}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-neutral-800 rotate-45 border-l border-b border-neutral-700"></div>
        </div>
      </div>
    </div>
  );
};
