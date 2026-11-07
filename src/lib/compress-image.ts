/** Canvas WebP encoding is unavailable in some Safari versions. JPEG is a
 * transport fallback; the upload API always produces the final WebP. */
export async function canvasToUploadFile(canvas: HTMLCanvasElement, name: string, quality = .82): Promise<File> {
  const encode = (type: string, q: number) => new Promise<Blob | null>(resolve => {
    try { canvas.toBlob(resolve, type, q); } catch { resolve(null); }
  });
  let blob = await encode('image/webp', quality);
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg', quality);
  if (!blob || !['image/webp', 'image/jpeg'].includes(blob.type)) throw new Error('ไม่สามารถเตรียมรูปภาพได้ กรุณาลองเลือกรูปใหม่');
  if (blob.size > 3_500_000) blob = await encode(blob.type, .6);
  if (!blob || blob.size > 3_500_000) throw new Error('รูปหลังบีบอัดยังใหญ่เกินไป กรุณาเลือกรูปอื่น');
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${name.replace(/\.[^.]+$/, '')}.${extension}`, { type: blob.type });
}

export async function loadImageFile(file: File) {
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('ไม่สามารถอ่านรูปนี้ได้ กรุณาเลือก JPG, PNG หรือ WebP อีกครั้ง'));
      image.src = url;
    });
    return { image, release: () => URL.revokeObjectURL(url) };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}

export async function compressImage(file: File, portrait = true): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('รองรับเฉพาะรูป JPG, PNG และ WebP');
  if (file.size > 8_000_000) throw new Error('รูปต้นฉบับต้องไม่เกิน 8 MB');
  const { image, release } = await loadImageFile(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = portrait ? 1200 : 1600; canvas.height = portrait ? 1600 : 900;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('ไม่สามารถประมวลผลรูปภาพได้');
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    return await canvasToUploadFile(canvas, file.name);
  } finally { release(); }
}
