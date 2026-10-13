export const PORTRAIT_SIZE = 512;
export const PORTRAIT_MAX_BYTES = 10 * 1024 * 1024;
export const PORTRAIT_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const MOTTO_MAX_LENGTH = 140;

export type Portrait = {
	dataUrl: string;
	fileName: string;
	originalType: string;
	originalWidth: number;
	originalHeight: number;
	originalBytes: number;
	outputType: string;
	outputBytes: number;
};

export type BasicInfo = {
	name: string;
	nickname: string;
	formerOccupation: string;
	portrait: Portrait | null;
	motto: string;
	heightCm: number | null;
	weightKg: number | null;
	age: number | null;
};

export function createEmptyBasicInfo(): BasicInfo {
	return {
		name: '',
		nickname: '',
		formerOccupation: '',
		portrait: null,
		motto: '',
		heightCm: null,
		weightKg: null,
		age: null
	};
}

export const formerOccupationSuggestions = [
	'Acólito',
	'Alfaiate',
	'Artista de rua',
	'Batedor',
	'Caçador',
	'Contrabandista',
	'Cortesão',
	'Erudito',
	'Escriba',
	'Estalajadeiro',
	'Ferreiro',
	'Gladiador',
	'Guarda da cidade',
	'Herbalista',
	'Marinheiro',
	'Mercador',
	'Mineiro',
	'Nobre',
	'Pastor',
	'Soldado',
	'Trapaceiro'
];
