export type StockItem = {
  jerseyId: string;
  size: string;
  quantity: number;
};

export function reconcileStockForOrderEdit(oldItems: StockItem[], newItems: StockItem[]) {
  const oldByKey = new Map<string, StockItem>();
  for (const item of oldItems) {
    const key = `${item.jerseyId}::${item.size}`;
    oldByKey.set(key, {
      jerseyId: item.jerseyId,
      size: item.size,
      quantity: (oldByKey.get(key)?.quantity ?? 0) + item.quantity,
    });
  }

  const newByKey = new Map<string, StockItem>();
  for (const item of newItems) {
    const key = `${item.jerseyId}::${item.size}`;
    newByKey.set(key, {
      jerseyId: item.jerseyId,
      size: item.size,
      quantity: (newByKey.get(key)?.quantity ?? 0) + item.quantity,
    });
  }

  const keys = new Set([...oldByKey.keys(), ...newByKey.keys()]);
  const toRestore: StockItem[] = [];
  const toDeduct: StockItem[] = [];

  for (const key of keys) {
    const oldItem = oldByKey.get(key);
    const newItem = newByKey.get(key);
    const oldQty = oldItem?.quantity ?? 0;
    const newQty = newItem?.quantity ?? 0;
    const delta = newQty - oldQty;

    if (delta > 0) {
      toDeduct.push({
        jerseyId: newItem?.jerseyId ?? oldItem!.jerseyId,
        size: newItem?.size ?? oldItem!.size,
        quantity: delta,
      });
    }

    if (delta < 0) {
      toRestore.push({
        jerseyId: oldItem?.jerseyId ?? newItem!.jerseyId,
        size: oldItem?.size ?? newItem!.size,
        quantity: Math.abs(delta),
      });
    }
  }

  return {
    toRestore,
    toDeduct,
    inventoryAdjustments: [...toRestore, ...toDeduct].map((item) => ({
      jerseyId: item.jerseyId,
      size: item.size,
      quantity: item.quantity,
    })),
  };
}
