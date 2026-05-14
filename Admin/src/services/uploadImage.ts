// R2-backed image upload helper. Mirrors the frontend implementation —
// Cloudflare doesn't support unsigned browser uploads, so we go through
// /upload/presign for a short-lived PUT URL, then PUT the file directly to R2.
import { apiClient } from "./apiClient";

export type UploadFolder =
  | "products"
  | "profile"
  | "posts"
  | "messages"
  | "banners"
  | "kyc"
  | "uploads";

interface PresignResponse {
  success: boolean;
  data?: {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
  };
  message?: string;
}

export const uploadImage = async (
  file: File,
  folder: UploadFolder = "uploads"
): Promise<string> => {
  const presign: PresignResponse = await apiClient("/upload/presign", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      folder,
    }),
  });
  if (!presign?.success || !presign.data) {
    throw new Error(presign?.message || "Failed to get upload URL");
  }
  const { uploadUrl, publicUrl } = presign.data;

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Upload failed: HTTP ${putRes.status}`);
  }
  return publicUrl;
};
