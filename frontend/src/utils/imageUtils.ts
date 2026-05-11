export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // Evita problemas de CORS
    image.src = url;
  });

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<File | null> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  // Forzamos la salida a 400x400 para ahorrar espacio en Supabase
  const TARGET_SIZE = 400;
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;

  // Dibujamos la sección recortada en el canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    TARGET_SIZE,
    TARGET_SIZE,
  );

  // Convertimos el canvas en un archivo WebP ligero (90% de calidad)
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], "avatar.webp", { type: "image/webp" });
        resolve(file);
      },
      "image/webp",
      0.9,
    );
  });
};
