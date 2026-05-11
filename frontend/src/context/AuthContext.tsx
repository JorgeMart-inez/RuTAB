// src/context/AuthContext.tsx

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { api } from "../config/api";

/**
 * Representa la estructura de datos del usuario autenticado.
 */
interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  telefono?: string | null;
  foto_perfil_url?: string | null;
}

/**
 * Define el contrato del contexto de autenticación.
 */
interface AuthContextType {
  /** Token JWT actual */
  token: string | null;
  /** Datos del perfil del usuario logueado */
  usuario: Usuario | null;
  /** Estado de carga inicial mientras se valida la sesión con el backend */
  cargandoAuth: boolean;
  /** Método para iniciar sesión y persistir datos */
  login: (token: string, usuario: Usuario, tipo: string) => void;
  /** Método para cerrar sesión y limpiar persistencia */
  logout: () => void;

  updateUsuario: (nuevosDatos: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveedor de contexto que gestiona el estado global de autenticación.
 * Implementa persistencia en LocalStorage y validación contra el servidor.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  /**
   * Efecto de inicialización:
   * Recupera el token del almacenamiento local y valida su vigencia con el backend.
   */
  useEffect(() => {
    const verificarSesion = async () => {
      const tokenGuardado = localStorage.getItem("token");

      if (!tokenGuardado) {
        setCargandoAuth(false);
        return;
      }

      try {
        // Validación de integridad del token mediante el perfil del usuario
        const { data } = await api.get("/auth/profile");

        setToken(tokenGuardado);
        setUsuario(data);
        localStorage.setItem("usuario", JSON.stringify(data));
      } catch (error) {
        // En caso de error, el interceptor de la API gestiona la limpieza de LocalStorage
        console.error("Sesión inválida o manipulada detectada.");
        setToken(null);
        setUsuario(null);
      } finally {
        setCargandoAuth(false);
      }
    };

    verificarSesion();
  }, []);

  /**
   * Registra las credenciales en el estado y en el almacenamiento persistente.
   * @param tipo - Filtro de seguridad para restringir el acceso solo a administradores.
   */
  const login = (newToken: string, newUsuario: Usuario, tipo: string) => {
    if (tipo !== "ADMIN") {
      throw new Error(
        "Acceso denegado. Esta plataforma es exclusiva para administradores.",
      );
    }

    setToken(newToken);
    setUsuario(newUsuario);
    localStorage.setItem("token", newToken);
    localStorage.setItem("usuario", JSON.stringify(newUsuario));
  };

  /**
   * Finaliza la sesión del usuario.
   * Realiza una limpieza completa y redirige al login para purgar el estado de la memoria.
   */
  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/login";
  };

  const updateUsuario = (nuevosDatos: Partial<Usuario>) => {
    setUsuario((prev) => {
      if (!prev) return null;
      const usuarioActualizado = { ...prev, ...nuevosDatos };
      // Persistimos el cambio en LocalStorage para que al recargar se mantenga
      localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
      return usuarioActualizado;
    });
  };

  return (
    <AuthContext.Provider
      value={{ token, usuario, cargandoAuth, login, logout, updateUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para acceder de forma segura al contexto de autenticación.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
