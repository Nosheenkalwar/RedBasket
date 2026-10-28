/**
 * Shipping rules for RedBasket. Each rule is a plain "if this, then that" check that runs
 * at checkout, so nobody has to price or route an order by hand.
 *
 * Order of rules:
 *   1. Destination must be inside Karachi, otherwise the order is refused.
 *   2. The area decides the delivery zone and the base fee.
 *   3. Orders of Rs. 3,000 or more ship free.
 *   4. Heavy orders (over 20 kg) pay a surcharge, even when delivery is free.
 *   5. The courier is picked from the weight: bike rider up to 15 kg, van above that.
 */

export type Zone = 'A' | 'B' | 'C';

export const ZONES: Record<Zone, { name: string; fee: number }> = {
  A: { name: 'Central Karachi', fee: 149 },
  B: { name: 'Mid Karachi', fee: 199 },
  C: { name: 'Outer Karachi', fee: 249 },
};

export const KARACHI_AREAS: Record<string, Zone> = {
  Clifton: 'A', 'DHA': 'A', Saddar: 'A', PECHS: 'A', Bahadurabad: 'A', 'Tariq Road': 'A', Garden: 'A', 'Civil Lines': 'A',
  'Gulshan-e-Iqbal': 'B', 'Gulistan-e-Jauhar': 'B', 'North Nazimabad': 'B', Nazimabad: 'B', 'FB Area': 'B',
  'Gulberg': 'B', Lyari: 'B', 'Karachi Cantonment': 'B', 'Shah Faisal Colony': 'B', 'Model Colony': 'B',
  Malir: 'C', Korangi: 'C', Landhi: 'C', Orangi: 'C', 'North Karachi': 'C', 'New Karachi': 'C', 'Surjani Town': 'C',
  'Baldia Town': 'C', 'SITE Area': 'C', 'Scheme 33': 'C', 'Bahria Town Karachi': 'C', Gadap: 'C',
};

export const FREE_DELIVERY_FROM = 3000;
const HEAVY_FROM_KG = 20;
const HEAVY_FEE = 150;
const VAN_FROM_KG = 15;
const DEFAULT_ITEM_KG = 0.5;

/** "5 kg" -> 5, "500 g" -> 0.5, "1.5 litre" -> 1.5, "pack of 6" -> null */
export function unitWeightKg(unit: string): number | null {
  const m = unit.toLowerCase().match(/([\d.]+)\s*(kg|g|litre|liter|l|ml)\b/);
  if (!m) return null;
  const n = Number(m[1]);
  return { kg: n, g: n / 1000, litre: n, liter: n, l: n, ml: n / 1000 }[m[2] as 'kg'] ?? null;
}

export type ShippingInput = { city: string; area: string; subtotal: number; items: { unit: string; quantity: number }[] };
export type ShippingResult = {
  deliverable: boolean;
  reason?: string;
  zone?: Zone;
  fee: number;
  weightKg: number;
  courier: string;
  applied: string[]; // human readable list of rules that fired, shown at checkout and to staff
};

export function evaluateShipping({ city, area, subtotal, items }: ShippingInput): ShippingResult {
  const weightKg = Math.round(items.reduce((a, i) => a + (unitWeightKg(i.unit) ?? DEFAULT_ITEM_KG) * i.quantity, 0) * 10) / 10;
  const base = { fee: 0, weightKg, courier: '', applied: [] as string[] };

  // rule 1: destination
  if (city.trim().toLowerCase() !== 'karachi') return { ...base, deliverable: false, reason: 'We deliver only within Karachi for now.' };
  const zone = KARACHI_AREAS[area];
  if (!zone) return { ...base, deliverable: false, reason: `We do not deliver to "${area}" yet. Pick an area from the list.` };

  // rule 2: zone fee
  let fee = ZONES[zone].fee;
  const applied = [`${ZONES[zone].name} delivery: Rs. ${fee}`];

  // rule 3: free delivery by order value
  if (subtotal >= FREE_DELIVERY_FROM) {
    fee = 0;
    applied.push(`Order over Rs. ${FREE_DELIVERY_FROM.toLocaleString('en-US')}: delivery is free`);
  }

  // rule 4: heavy order surcharge
  if (weightKg > HEAVY_FROM_KG) {
    fee += HEAVY_FEE;
    applied.push(`Heavy order (${weightKg} kg): +Rs. ${HEAVY_FEE}`);
  }

  // rule 5: courier
  const courier = weightKg > VAN_FROM_KG ? 'RedBasket van' : 'Bike rider';
  applied.push(`${courier} assigned (${weightKg} kg)`);

  return { deliverable: true, zone, fee, weightKg, courier, applied };
}

/** delivery slots for today and tomorrow; same-day slots close at 4 PM Karachi time */
export function deliverySlots(now = new Date()) {
  const pkHour = Number(now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Karachi' }));
  const today = pkHour < 16 ? ['Today, 6 to 8 PM', 'Today, 8 to 10 PM'] : [];
  return [...today, 'Tomorrow, 10 AM to 12 PM', 'Tomorrow, 2 to 4 PM', 'Tomorrow, 6 to 8 PM'];
}
