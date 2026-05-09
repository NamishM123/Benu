export type SpiceLevel = 0 | 1 | 2 | 3;

export type MenuItem = {
  name: string;
  price: number;
  category: string;
  description: string;
  spiceLevel: SpiceLevel;
  tags: string[];
  image: string;
};

export const MENU: MenuItem[] = [
  {
    name: "Popcorn Chicken",
    price: 11.99,
    category: "Appetizers",
    description:
      "Crispy bite-sized chicken tossed with cumin, chili, and Sichuan peppercorn salt.",
    spiceLevel: 1,
    tags: ["chicken", "meat", "gluten", "spicy"],
    image: "https://source.unsplash.com/featured/?popcorn-chicken",
  },
  {
    name: "Garlic Cucumber",
    price: 8.99,
    category: "Appetizers",
    description:
      "Smashed cucumber with fresh garlic, sesame oil, and a touch of black vinegar.",
    spiceLevel: 0,
    tags: ["vegetarian", "vegan", "dairy-free", "soy", "gluten-free"],
    image: "https://source.unsplash.com/featured/?cucumber-salad",
  },
  {
    name: "Yuba with Celery Salad",
    price: 8.99,
    category: "Appetizers",
    description:
      "Chilled tofu skin and crisp celery in a light soy-sesame dressing.",
    spiceLevel: 0,
    tags: ["vegetarian", "vegan", "soy", "dairy-free"],
    image: "https://source.unsplash.com/featured/?tofu-salad",
  },
  {
    name: "Chili Oil Wontons",
    price: 11.99,
    category: "Appetizers",
    description:
      "Pork wontons drenched in our house chili oil with garlic and scallion.",
    spiceLevel: 2,
    tags: ["pork", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?chili-wontons",
  },
  {
    name: "Pork and Cabbage Boiled Dumplings",
    price: 15.99,
    category: "Appetizers",
    description:
      "Hand-folded dumplings filled with pork and napa cabbage, gently boiled.",
    spiceLevel: 0,
    tags: ["pork", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?dumplings",
  },
  {
    name: "House Beef Roll",
    price: 12.99,
    category: "Appetizers",
    description:
      "Flaky scallion pancake rolled with thin-sliced beef and hoisin.",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?beef-roll",
  },
  {
    name: "House Cold Cut Beef",
    price: 12.99,
    category: "Appetizers",
    description:
      "Thin slices of slow-braised beef shank served chilled with chili oil.",
    spiceLevel: 1,
    tags: ["beef", "meat", "soy", "spicy", "gluten-free"],
    image: "https://source.unsplash.com/featured/?cold-beef",
  },

  {
    name: "Chili Oil Flat Noodle with Beef Bone",
    price: 21.99,
    category: "Dry Noodles",
    description:
      "Hand-pulled flat noodles tossed in fragrant chili oil, served with a roasted beef bone.",
    spiceLevel: 3,
    tags: ["beef", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?chili-noodles",
  },
  {
    name: "Regular Chili Oil Flat Noodle",
    price: 14.99,
    category: "Dry Noodles",
    description:
      "Our signature wide hand-pulled noodles in chili oil, garlic, and scallion.",
    spiceLevel: 2,
    tags: ["vegetarian", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?flat-noodle",
  },
  {
    name: "Numbing Spicy Minced Pork Noodle",
    price: 17.99,
    category: "Dry Noodles",
    description:
      "Springy noodles in a numbing Sichuan sauce topped with minced pork.",
    spiceLevel: 3,
    tags: ["pork", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?spicy-noodles",
  },
  {
    name: "Braised Pork Belly Noodle",
    price: 17.99,
    category: "Dry Noodles",
    description:
      "Tender soy-braised pork belly over hand-pulled noodles with bok choy.",
    spiceLevel: 0,
    tags: ["pork", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?pork-belly-noodle",
  },
  {
    name: "Cumin Onion Lamb Stirred Noodle",
    price: 19.99,
    category: "Dry Noodles",
    description:
      "Wok-tossed noodles with cumin, lamb, sweet onion, and a hint of chili.",
    spiceLevel: 2,
    tags: ["lamb", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?lamb-noodles",
  },
  {
    name: "Tomato Egg Noodle",
    price: 14.99,
    category: "Dry Noodles",
    description:
      "Comforting tomato and egg sauce over noodles — a homestyle classic.",
    spiceLevel: 0,
    tags: ["vegetarian", "egg", "gluten", "soy", "dairy-free"],
    image: "https://source.unsplash.com/featured/?tomato-noodles",
  },

  {
    name: "House Special Beef Bone Noodle Soup",
    price: 20.99,
    category: "Noodle Soup",
    description:
      "Slow-simmered beef bone broth with hand-pulled noodles and braised brisket.",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?beef-noodle-soup",
  },
  {
    name: "Braised Beef Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Aromatic five-spice broth with tender braised beef and bok choy.",
    spiceLevel: 1,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?braised-beef",
  },
  {
    name: "Pickled Cabbage Beef Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Tangy pickled mustard greens, beef, and noodles in a savory broth.",
    spiceLevel: 1,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?pickled-cabbage-soup",
  },
  {
    name: "Tomato Beef Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Bright tomato broth with tender beef chunks over hand-pulled noodles.",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?tomato-beef-noodle",
  },
  {
    name: "Golden Sour and Spicy Lamb Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Pickled-pepper broth with lamb and chewy noodles — bright, sour, and spicy.",
    spiceLevel: 3,
    tags: ["lamb", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?lamb-soup",
  },

  {
    name: "Tomato Beef over White Rice",
    price: 16.99,
    category: "Rice",
    description: "Stewed tomato and beef ladled over steamed jasmine rice.",
    spiceLevel: 0,
    tags: ["beef", "meat", "soy", "gluten-free", "dairy-free"],
    image: "https://source.unsplash.com/featured/?beef-rice",
  },
  {
    name: "Braised Pork over White Rice",
    price: 16.99,
    category: "Rice",
    description:
      "Soy-braised pork belly with marinated egg and greens over jasmine rice.",
    spiceLevel: 0,
    tags: ["pork", "meat", "egg", "soy", "gluten-free", "dairy-free"],
    image: "https://source.unsplash.com/featured/?pork-rice",
  },

  {
    name: "Handmade Fragrance Lemon Tea",
    price: 6.99,
    category: "Beverages",
    description: "Hand-pressed lemons, jasmine tea, and a touch of honey.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?lemon-tea",
  },
  {
    name: "Coffee Meets Milk Tea",
    price: 6.99,
    category: "Beverages",
    description:
      "Smooth espresso layered with creamy Hong Kong–style milk tea.",
    spiceLevel: 0,
    tags: ["dairy", "vegetarian", "gluten-free"],
    image: "https://source.unsplash.com/featured/?milk-tea",
  },
  {
    name: "Coke",
    price: 2.99,
    category: "Beverages",
    description: "Classic Coca-Cola, served chilled.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?coke",
  },
  {
    name: "Diet Coke",
    price: 2.99,
    category: "Beverages",
    description: "Zero-sugar Diet Coke, served chilled.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?diet-coke",
  },
  {
    name: "Sprite",
    price: 2.99,
    category: "Beverages",
    description: "Crisp lemon-lime soda, served chilled.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?sprite",
  },
  {
    name: "Peach Sparkling Water",
    price: 3.99,
    category: "Beverages",
    description: "Lightly sweet peach-infused sparkling water.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?peach-water",
  },
];

export function formatPrice(p: number): string {
  return `$${p.toFixed(2)}`;
}

export function spiceLabel(level: SpiceLevel): string {
  if (level === 0) return "not spicy";
  if (level === 1) return "mildly spicy";
  if (level === 2) return "spicy";
  return "very spicy";
}
