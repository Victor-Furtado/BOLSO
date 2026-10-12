export const ancestrySizeMap = {
	med: 'Médio',
	sm: 'Pequeno',
	lg: 'Grande',
	tiny: 'Minúsculo',
	huge: 'Enorme'
} as const;

export const ancestryVisionMap = {
	normal: 'Normal',
	darkvision: 'Visão no escuro',
	'low-light-vision': 'Visão na penumbra'
} as const;

export const creatureTraitMap = {
	aberration: 'Aberração',
	aeon: 'Éon',
	amphibious: 'Anfíbio',
	beast: 'Besta',
	construct: 'Constructo',
	dragon: 'Dragão',
	fey: 'Fada',
	giant: 'Gigante',
	humanoid: 'Humanoide',
	plant: 'Planta',
	shadow: 'Sombra',
	spirit: 'Espírito',
	undead: 'Morto-vivo'
} as const;

export const languageMap = {
	arboreal: 'Arbóreo',
	chthonian: 'Ctônico',
	common: 'Comum',
	diabolic: 'Diabólico',
	draconic: 'Dracônico',
	dwarven: 'Anão',
	elven: 'Élfico',
	empyrean: 'Empíreo',
	fey: 'Feérico',
	gnomish: 'Gnômico',
	necril: 'Nécril',
	orcish: 'Órquico',
	petran: 'Petrano',
	pyric: 'Pírico',
	shadowtongue: 'Língua das Sombras',
	sussuran: 'Sussurrano',
	thalassic: 'Talássico',
	utopian: 'Utópico'
} as const;

export const skillMap = {
	acrobatics: 'Acrobacia',
	arcana: 'Arcanismo',
	athletics: 'Atletismo',
	crafting: 'Manufatura',
	deception: 'Enganação',
	diplomacy: 'Diplomacia',
	intimidation: 'Intimidação',
	medicine: 'Medicina',
	nature: 'Natureza',
	occultism: 'Ocultismo',
	performance: 'Atuação',
	religion: 'Religião',
	society: 'Sociedade',
	stealth: 'Furtividade',
	survival: 'Sobrevivência',
	thievery: 'Ladroagem'
} as const;

export const classAttackMap = {
	'Alchemical Bombs': 'Bombas alquímicas',
	"Deity's favored weapon": 'Arma favorita da divindade',
	'Simple Firearms, Martial Firearms': 'Armas de fogo simples e marciais'
} as const;

export function getMappedValue<T extends string>(map: Record<string, string>, value?: T) {
	if (!value) return undefined;
	return map[value] ?? value;
}

/** Like `getMappedValue`, but title-cases unmapped slugs (e.g. `mwangi` → `Mwangi`). */
export function getLabel(map: Record<string, string>, value: string) {
	return (
		map[value] ??
		value.replace(/(^|-)(\w)/g, (_, dash, char) => `${dash ? ' ' : ''}${char.toUpperCase()}`)
	);
}
