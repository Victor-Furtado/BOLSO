export const setLocalStorageItem = (key: string, value: string) => {
	if (typeof window === 'undefined') return;
	localStorage.setItem(key, value);
};

export const getLocalStorageItem = (key: string): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(key);
};

export const removeLocalStorageItem = (key: string) => {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(key);
};

export const getOrSetLocalStorageItem = (key: string, defaultValue: string): string => {
	if (typeof window === 'undefined') return defaultValue;
	const value = localStorage.getItem(key);
	if (value === null) {
		localStorage.setItem(key, defaultValue);
		return defaultValue;
	}
	return value;
};
