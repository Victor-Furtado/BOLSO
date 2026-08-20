export const ancestrySizeMap = {
	med: 'Médio',
	sm: 'Pequeno',
	lg: 'Grande',
	tiny: 'Minúsculo'
} as const;

export const ancestryVisionMap = {
	normal: 'Normal',
	darkvision: 'Visão no escuro',
	'low-light-vision': 'Visão na penumbra'
} as const;

export function getMappedValue<T extends string>(map: Record<string, string>, value: T) {
	return map[value] ?? value;
}
