export default {
	required: (value: string | unknown[]) =>
		(value != null && value.length > 0) || "Required.",
	min8Len: (v: string) => v.length >= 8 || "Min 8 characters",
	canNotZero: (v: number) => v > 0 || "Can not be zero",
	ncgAmount: (v: string | number) =>
		(Number(v) > 0 && Number(Number(v).toFixed(2)) === Number(v)) ||
		"Invalid Amount Format",
	address: (v: string) =>
		(v.length == 42 && v.match(/^0[xX][0-9a-fA-F]{40}$/) != null) ||
		"Invalid Address",
};
