// src/App.tsx
import { Suspense } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppRoutes } from "./routes";
import { useAlertListener } from "../src/modules/monitoring/hooks/useAlertListener";
import { Toaster } from "react-hot-toast";

const FullScreenLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-xl z-[100]">
    <div className="flex space-x-2">
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
    </div>
  </div>
);

// Componente para inicializar servicios globales
const GlobalServices = () => {
  useAlertListener();
  return <Toaster position="top-right" />;
};

export default function App() {
  const { cargandoAuth } = useAuth();

  if (cargandoAuth) return <FullScreenLoader />;

  return (
    <Router>
      <GlobalServices />
      <Suspense fallback={<FullScreenLoader />}>
        <AppRoutes />
      </Suspense>
    </Router>
  );
}
