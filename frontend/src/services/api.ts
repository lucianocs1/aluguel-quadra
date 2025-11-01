import { API_BASE_URL } from "@/config";
import type {
  CriarReservaDto,
  CriarUsuarioComPerfilDto,
  CriarUsuarioDto,
  HorarioDisponivelDto,
  LoginUsuarioDto,
  Quadra,
  ReservaDto,
  ReservaPagamentoDto,
  ReservaPagamentoStatusDto,
  UsuarioDto,
} from "@/types/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export interface QuadraFormPayload {
  nome: string;
  modalidadePrincipal: string;
  precoPorHora: number;
  imagem?: File | null;
}

export interface QuadraUpdatePayload extends QuadraFormPayload {
  removerImagem?: boolean;
}

function buildQuadraFormData(payload: QuadraFormPayload | QuadraUpdatePayload): FormData {
  const formData = new FormData();
  formData.append("Nome", payload.nome);
  formData.append("ModalidadePrincipal", payload.modalidadePrincipal);
  formData.append("PrecoPorHora", payload.precoPorHora.toString());

  if (payload.imagem) {
    formData.append("Imagem", payload.imagem);
  }

  return formData;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const body = init?.body ?? null;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(init?.headers ?? {}),
  };

  if (body && !isFormData && !("Content-Type" in (headers as Record<string, string>))) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...init,
    body,
    headers,
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

  async getQuadra(id: string) {
    return request<Quadra>(`/api/quadras/${id}`);
  },

  async getHorariosDisponiveis(quadraId: string, dataIsoDate: string) {
    const params = new URLSearchParams({ data: dataIsoDate });
    return request<HorarioDisponivelDto[]>(`/api/quadras/${quadraId}/horarios-disponiveis?${params.toString()}`);
  },

  async criarReserva(payload: CriarReservaDto) {
    return request<ReservaPagamentoDto>("/api/reservas", {
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

  async registrarUsuarioComoAdmin(adminId: string, payload: CriarUsuarioComPerfilDto) {
    return request<UsuarioDto>("/api/usuarios/admin", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "X-Admin-Id": adminId,
      },
    });
  },

  async login(payload: LoginUsuarioDto) {
    return request<UsuarioDto>("/api/usuarios/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listarUsuarios(adminId: string) {
    return request<UsuarioDto[]>("/api/usuarios", {
      headers: {
        "X-Admin-Id": adminId,
      },
    });
  },

  async removerUsuario(adminId: string, usuarioId: string) {
    return request<void>(`/api/usuarios/${usuarioId}`, {
      method: "DELETE",
      headers: {
        "X-Admin-Id": adminId,
      },
    });
  },

  async criarQuadra(adminId: string, payload: QuadraFormPayload) {
    const formData = buildQuadraFormData(payload);

    return request<Quadra>("/api/quadras", {
      method: "POST",
      body: formData,
      headers: {
        "X-Admin-Id": adminId,
      },
    });
  },

  async atualizarQuadra(adminId: string, quadraId: string, payload: QuadraUpdatePayload) {
    const formData = buildQuadraFormData(payload);

    if (payload.removerImagem) {
      formData.set("RemoverImagem", String(payload.removerImagem));
    }

    return request<Quadra>(`/api/quadras/${quadraId}`, {
      method: "PUT",
      body: formData,
      headers: {
        "X-Admin-Id": adminId,
      },
    });
  },

  async removerQuadra(adminId: string, quadraId: string) {
    return request<void>(`/api/quadras/${quadraId}`, {
      method: "DELETE",
      headers: {
        "X-Admin-Id": adminId,
      },
    });
  },

  async listarReservas(adminId: string) {
    return request<ReservaDto[]>("/api/reservas", {
      headers: {
        "X-Admin-Id": adminId,
      },
    });
  },

  async verificarStatusPagamentoReserva(reservaId: string) {
    return request<ReservaPagamentoStatusDto>(`/api/reservas/${reservaId}/pagamento-status`);
  },
};
