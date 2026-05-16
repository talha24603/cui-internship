import { v2 as cloudinary } from "cloudinary";

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export function getCloudinaryPublicIdFromUrl(fileUrl: string) {
  try {
    const marker = "/upload/";
    const markerIndex = fileUrl.indexOf(marker);
    if (markerIndex === -1) return null;

    let publicPart = fileUrl.substring(markerIndex + marker.length);
    publicPart = publicPart.replace(/^v\d+\//, "");
    publicPart = publicPart.replace(/\.[^./]+$/, "");
    return publicPart || null;
  } catch {
    return null;
  }
}

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function destroyCloudinaryRaw(publicId: string) {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw", invalidate: true }).catch(() => undefined);
}

export async function uploadRawToCloudinary(
  buffer: Buffer,
  fileName: string,
  folder: string,
  format: string | undefined,
) {
  configureCloudinary();
  const safeName = sanitizeFileName(fileName || "file");
  const baseName = safeName.replace(/\.[^.]+$/, "");
  const ext = (safeName.match(/\.([^.]+)$/)?.[1] ?? "").toLowerCase();
  const publicId = `${Date.now()}-${baseName}`;

  return await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder,
        public_id: publicId,
        ...(format ? { format } : ext ? { format: ext } : {}),
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ secure_url: result.secure_url });
      },
    );

    stream.end(buffer);
  });
}
