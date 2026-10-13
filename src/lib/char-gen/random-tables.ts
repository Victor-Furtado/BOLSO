const firstNames = [
	'Aldric',
	'Amara',
	'Bastian',
	'Brienna',
	'Cassian',
	'Corina',
	'Dario',
	'Elowen',
	'Esme',
	'Fenna',
	'Garrick',
	'Hesper',
	'Isolde',
	'Ivo',
	'Jorund',
	'Kaela',
	'Lucan',
	'Maelis',
	'Mirela',
	'Niall',
	'Odalys',
	'Orsolya',
	'Perrin',
	'Quessa',
	'Rurik',
	'Sabine',
	'Soren',
	'Tamsin',
	'Ulric',
	'Vesna',
	'Wendel',
	'Yara',
	'Zoltan'
];

const familyNames = [
	'Ventoalto',
	'Pedranegra',
	'Ferrobranco',
	'Cinzaflor',
	'Brumaverde',
	'Corvalho',
	'Montvarre',
	'Valdemar',
	'Martelo-de-Prata',
	'Sombravale',
	'Rochafria',
	'Luzdourada',
	'Espinheira',
	'Marfundo',
	'Torrequeda',
	'Velacinza',
	'Galhardo',
	'Ardentina'
];

const nicknameNouns = [
	{ article: 'a', noun: 'Lâmina' },
	{ article: 'o', noun: 'Corvo' },
	{ article: 'a', noun: 'Raposa' },
	{ article: 'o', noun: 'Martelo' },
	{ article: 'a', noun: 'Sombra' },
	{ article: 'o', noun: 'Lobo' },
	{ article: 'a', noun: 'Chama' },
	{ article: 'o', noun: 'Escudo' },
	{ article: 'a', noun: 'Víbora' },
	{ article: 'o', noun: 'Sino' },
	{ article: 'a', noun: 'Lanterna' },
	{ article: 'o', noun: 'Espinho' },
	{ article: 'a', noun: 'Tempestade' },
	{ article: 'o', noun: 'Urso' }
];

const nicknameComplements = [
	'de Absalom',
	'das Cinzas',
	'do Mwangi',
	'Sem Sombra',
	'de Ferro',
	'da Ponte Quebrada',
	'dos Mil Passos',
	'do Sétimo Sino',
	'de Magnimar',
	'das Terras Saqueadas',
	'do Mar Interior',
	'de Varísia',
	'Que Não Dorme',
	'de Olhos Dourados',
	'da Última Vela'
];

const mottos = [
	'Nenhuma porta resiste a quem bate duas vezes.',
	'O aço esquece; eu não.',
	'Quem anda no escuro aprende a ouvir.',
	'Promessa feita é dívida de sangue.',
	'Toda trilha começa com um passo e uma mentira.',
	'Prefiro cicatrizes a arrependimentos.',
	'Os deuses ajudam quem afia a própria lâmina.',
	'Ouro vai, ouro vem; honra fica.',
	'Se não há caminho, eu abro um.',
	'A sorte favorece quem rola os dados.',
	'Nenhuma maldição dura mais que a teimosia.',
	'Fogo no peito, gelo na mente.',
	'Hoje não, morte. Volte amanhã.',
	'Um amigo vale mais que mil mapas.',
	'Ninguém fica para trás.',
	'Conhecimento é a única moeda que não se perde.',
	'Ataque primeiro, pergunte depois, peça desculpas nunca.',
	'Onde há ruínas, há histórias.',
	'Minha palavra é meu escudo.',
	'Corra se puder. Lute se precisar.'
];

function pick<T>(list: readonly T[]): T {
	return list[Math.floor(Math.random() * list.length)];
}

/** Rolls until the result differs from `current`, so a click always changes something. */
function rollDistinct(roll: () => string, current: string): string {
	let result = roll();
	for (let attempt = 0; result === current && attempt < 10; attempt++) result = roll();
	return result;
}

export function rollName(current = ''): string {
	return rollDistinct(() => `${pick(firstNames)} ${pick(familyNames)}`, current);
}

export function rollNickname(current = ''): string {
	return rollDistinct(() => {
		const { article, noun } = pick(nicknameNouns);
		return `${article} ${noun} ${pick(nicknameComplements)}`;
	}, current);
}

export function rollMotto(current = ''): string {
	return rollDistinct(() => pick(mottos), current);
}
