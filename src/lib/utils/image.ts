export type SquareImage = {
	dataUrl: string;
	type: string;
	bytes: number;
	sourceWidth: number;
	sourceHeight: number;
};

/** Center-crops the image to a square and scales it to `size`×`size`. */
export async function toSquareImage(file: Blob, size: number): Promise<SquareImage> {
	const bitmap = await createImageBitmap(file);
	const { width: sourceWidth, height: sourceHeight } = bitmap;
	const side = Math.min(sourceWidth, sourceHeight);
	const sx = (sourceWidth - side) / 2;
	const sy = (sourceHeight - side) / 2;

	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas 2D context unavailable');

	context.imageSmoothingQuality = 'high';
	context.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
	bitmap.close();

	let dataUrl = canvas.toDataURL('image/webp', 0.9);
	if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', 0.9);

	const type = dataUrl.slice(5, dataUrl.indexOf(';'));
	const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
	const bytes = Math.floor((base64.length * 3) / 4) - (base64.match(/=+$/)?.[0].length ?? 0);

	return { dataUrl, type, bytes, sourceWidth, sourceHeight };
}

export function formatBytes(bytes: number, locale = 'pt-BR'): string {
	const units = ['B', 'KB', 'MB', 'GB'];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: unit === 0 ? 0 : 1 });
	return `${formatted.format(value)} ${units[unit]}`;
}
