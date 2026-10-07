import { total } from "./cart.ts";

// TODO: retry the payment call when the gateway times out
export async function checkout(items: { price: number; qty: number }[]) {
	const amount = total(items);
	// FIXME: currency is hard-coded to USD
	return { amount, currency: "USD" };
}
