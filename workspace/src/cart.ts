export function total(items: { price: number; qty: number }[]) {
	// TODO: apply discount codes before summing
	return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}
