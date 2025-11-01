import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UsuarioDto, PerfilUsuario } from "@/types/api";

interface AuthUser {
  id: string;
  nome: string;
  perfil: PerfilUsuario;
}

interface AuthContextValue {
  usuario: AuthUser | null;
  login: (usuario: UsuarioDto) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  id: "usuarioId",
  nome: "usuarioNome",
  perfil: "usuarioPerfil",
} as const;

const formatNome = (usuario: UsuarioDto) => `${usuario.nome} ${usuario.sobrenome}`.trim();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedId = window.localStorage.getItem(STORAGE_KEYS.id);
    const storedNome = window.localStorage.getItem(STORAGE_KEYS.nome);
    const storedPerfil = window.localStorage.getItem(STORAGE_KEYS.perfil);

    if (storedId && storedNome && storedPerfil) {
      const perfilNumero = Number(storedPerfil);
      if (!Number.isNaN(perfilNumero)) {
        setUsuario({
          id: storedId,
          nome: storedNome,
          perfil: perfilNumero as PerfilUsuario,
        });
      }
    }
  }, []);

  const login = useCallback((dados: UsuarioDto) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.id, dados.id);
      window.localStorage.setItem(STORAGE_KEYS.nome, formatNome(dados));
      window.localStorage.setItem(STORAGE_KEYS.perfil, String(dados.perfil));
    }

    setUsuario({
      id: dados.id,
      nome: formatNome(dados),
      perfil: dados.perfil,
    });
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEYS.id);
      window.localStorage.removeItem(STORAGE_KEYS.nome);
      window.localStorage.removeItem(STORAGE_KEYS.perfil);
    }

    setUsuario(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ usuario, login, logout }), [usuario, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
