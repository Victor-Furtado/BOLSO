export type FeatOption = {
	id: string;
	slug: string;
	name: string;
	traits: string[];
	/** Opening flavor sentence. */
	description: string | null;
	/** Mechanical text after that sentence. */
	rules: string | null;
};

export type FeatCategory = 'class' | 'ancestry' | 'skill' | 'general';

export const featCategoryLabels: Record<FeatCategory, string> = {
	class: 'Talento de classe',
	ancestry: 'Talento de ancestralidade',
	skill: 'Talento de perícia',
	general: 'Talento geral'
};
