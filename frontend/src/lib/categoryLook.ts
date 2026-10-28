import {
  Apple, Baby, Beef, BookOpen, Briefcase, Camera, Car, Coffee, Cookie, CookingPot, Croissant, CupSoda, Dumbbell, Fish, Flower2,
  Footprints, Gamepad2, Gem, Gift, Headphones, HeartPulse, House, Laptop, Luggage, Milk, Music, Palette, PawPrint, PenLine,
  Pill, Shirt, ShoppingBag, ShoppingBasket, Smartphone, Snowflake, Sofa, Sparkles, SprayCan, Blocks, Watch, Wrench, LucideIcon,
} from 'lucide-react';

/**
 * Picks an icon (for categories) and an emoji (for products without a photo) from the name,
 * so a new category like "Books" gets a book icon without any extra setup.
 * The first rule whose keyword appears in the name wins.
 */
const RULES: [string[], LucideIcon, string][] = [
  [['book', 'novel', 'magazine'], BookOpen, '📚'],
  [['pet', 'dog', 'cat '], PawPrint, '🐾'],
  [['baby', 'infant', 'diaper'], Baby, '🍼'],
  [['toy', 'kids', 'game'], Blocks, '🧸'],
  [['video game', 'gaming', 'console'], Gamepad2, '🎮'],
  [['sport', 'fitness', 'gym'], Dumbbell, '🏋️'],
  [['furniture', 'sofa', 'decor'], Sofa, '🛋️'],
  [['garden', 'plant', 'flower'], Flower2, '🌷'],
  [['pharmacy', 'medicine', 'medical'], Pill, '💊'],
  [['health', 'wellness'], HeartPulse, '🩺'],
  [['kitchen', 'cookware', 'utensil'], CookingPot, '🍳'],
  [['stationery', 'office supplies', 'pen'], PenLine, '✏️'],
  [['office', 'business'], Briefcase, '💼'],
  [['beauty', 'makeup', 'cosmetic', 'skin', 'hair'], Sparkles, '💄'],
  [['mobile', 'phone', 'tablet'], Smartphone, '📱'],
  [['laptop', 'computer', 'pc'], Laptop, '💻'],
  [['camera', 'photo'], Camera, '📷'],
  [['watch'], Watch, '⌚'],
  [['electronic', 'audio', 'charger', 'cable', 'power bank', 'gadget'], Headphones, '🎧'],
  [['shoe', 'footwear', 'sneaker'], Footprints, '👟'],
  [['jewel', 'jewellery', 'jewelry', 'ring'], Gem, '💍'],
  [['cloth', 'fashion', 'wear', 'men', 'women'], Shirt, '👕'],
  [['bag', 'luggage', 'travel'], Luggage, '🧳'],
  [['gift', 'hamper'], Gift, '🎁'],
  [['music', 'instrument'], Music, '🎵'],
  [['art', 'craft', 'paint'], Palette, '🎨'],
  [['car', 'auto', 'motor', 'bike'], Car, '🚗'],
  [['tool', 'hardware', 'diy'], Wrench, '🔧'],
  [['clean', 'laundry', 'household', 'detergent'], SprayCan, '🧼'],
  [['home', 'storage'], House, '📦'],
  [['frozen', 'ice'], Snowflake, '🧊'],
  [['meat', 'chicken', 'beef', 'mutton'], Beef, '🥩'],
  [['fish', 'seafood'], Fish, '🐟'],
  [['fruit', 'vegetable', 'fresh produce'], Apple, '🍎'],
  [['dairy', 'milk', 'egg'], Milk, '🥛'],
  [['bakery', 'bread', 'cake'], Croissant, '🥐'],
  [['snack', 'biscuit', 'chocolate', 'sweet'], Cookie, '🍪'],
  [['tea', 'coffee'], Coffee, '☕'],
  [['beverage', 'drink', 'juice', 'water'], CupSoda, '🧃'],
  [['cooking', 'rice', 'oil', 'spice', 'pantry'], CookingPot, '🍚'],
  [['grocer', 'food', 'supermarket'], ShoppingBasket, '🛒'],
];

const find = (name = '') => {
  const n = ` ${name.toLowerCase()} `;
  return RULES.find(([words]) => words.some((w) => n.includes(w)));
};

export const iconForCategory = (name?: string): LucideIcon => find(name)?.[1] || ShoppingBag;
export const emojiForCategory = (name?: string) => find(name)?.[2] || '🛍️';
