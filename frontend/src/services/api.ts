import { API_BASE_URL } from "@/config";
import type {
  CriarReservaDto,
  CriarUsuarioDto,
  HorarioDisponivelDto,
  LoginUsuarioDto,
  Quadra,
  ReservaDto,
  UsuarioDto,
} from "@/types/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    let message = `Erro ${response.status}`;

    if (responseText) {
      try {
        const parsed = JSON.parse(responseText) as Record<string, unknown>;
        message =
          (typeof parsed.detail === "string" && parsed.detail) ||
          (typeof parsed.title === "string" && parsed.title) ||
          (typeof parsed.message === "string" && parsed.message) ||
          message;
      } catch {
        message = responseText;
      }
    }

    throw new ApiError(response.status, message);
  }

  if (!responseText) {
    return undefined as T;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return undefined as T;
  }
}

export const api = {
  async getQuadras() {
    return request<Quadra[]>("/api/quadras");
  },

  async getHorariosDisponiveis(quadraId: string, dataIsoDate: string) {
    const params = new URLSearchParams({ data: dataIsoDate });
    return request<HorarioDisponivelDto[]>(`/api/quadras/${quadraId}/horarios-disponiveis?${params.toString()}`);
  },

  async criarReserva(payload: CriarReservaDto) {
    return request<ReservaDto>("/api/reservas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async registrarUsuario(payload: CriarUsuarioDto) {
    return request<UsuarioDto>("/api/usuarios", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async login(payload: LoginUsuarioDto) {
    return request<UsuarioDto>("/api/usuarios/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
