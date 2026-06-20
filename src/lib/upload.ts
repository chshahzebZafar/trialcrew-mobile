/**
 * Day-0 proof upload. Real image picker (expo-image-picker) + R2 upload flow.
 *
 * Backend mode (EXPO_PUBLIC_USE_BACKEND=true): ask the backend for a signed PUT url
 * (`/cycles/:id/proof/upload-url`), PUT the bytes to R2, and record the public url.
 * If the backend has no R2 configured (or in mock mode), we keep the local image uri
 * so the flow still works — it just isn't persisted remotely.
 */
import * as ImagePicker from "expo-image-picker";
import { http, USE_BACKEND } from "@/api/config";

export interface PickedImage {
  uri: string;
  fileName: string;
  mimeType: string;
}

/** Pick a screenshot from the library (asks permission). Returns null if cancelled/denied. */
export async function pickProofImage(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return {
    uri: a.uri,
    fileName: a.fileName ?? "day0-proof.jpg",
    mimeType: a.mimeType ?? "image/jpeg",
  };
}

interface UploadTarget {
  configured: boolean;
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

/** Upload the proof and return the URL to record via `POST /cycles/:id/proof`. */
export async function uploadProof(image: PickedImage, cycleId: string): Promise<string> {
  if (USE_BACKEND) {
    try {
      const target = await http<UploadTarget>(`/cycles/${cycleId}/proof/upload-url`, {
        json: { contentType: image.mimeType },
      });
      if (target.configured && target.uploadUrl) {
        const blob = await (await fetch(image.uri)).blob();
        const put = await fetch(target.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": image.mimeType },
          body: blob,
        });
        if (put.ok) return target.publicUrl;
      }
    } catch (e) {
      if (__DEV__) console.log("[upload] R2 path unavailable, using local uri:", String(e));
    }
  }
  // Mock mode or R2 not configured — keep the local uri (no remote persistence).
  return image.uri;
}
