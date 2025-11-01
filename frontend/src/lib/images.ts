import { API_BASE_URL } from "@/config";

export const resolveQuadraImage = (imagemUrl?: string | null) => {
  if (!imagemUrl) {
    return null;
  }

  if (imagemUrl.startsWith("http://") || imagemUrl.startsWith("https://")) {
    return imagemUrl;
  }

  const normalized = imagemUrl.startsWith("/") ? imagemUrl : `/${imagemUrl}`;
  return `${API_BASE_URL}${normalized}`;
};
