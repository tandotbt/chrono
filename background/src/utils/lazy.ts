type LazyFunction<T> = () => T;
export type Lazyable<T> = T | LazyFunction<T>;

export function resolve<T>(value: Lazyable<T>) {
	return typeof value === "function"
		? (value as LazyFunction<T>)() // Cast 'value' to 'LazyFunction<T>' before calling it
		: value;
}
