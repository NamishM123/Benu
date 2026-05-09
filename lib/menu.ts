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
      "Bite-sized fried chicken pieces tossed with salt, pepper, and Taiwanese five spice; optional chili seasoning.",
    spiceLevel: 1,
    tags: ["chicken", "meat", "gluten", "spicy"],
    image: "/menu/popcorn-chicken.jpg",
  },
  {
    name: "Garlic Cucumber",
    price: 8.99,
    category: "Appetizers",
    description:
      "Smashed cucumbers tossed in minced garlic, soy sauce, vinegar, sesame oil, and a touch of sugar.",
    spiceLevel: 0,
    tags: ["vegetarian", "vegan", "dairy-free", "soy", "gluten-free"],
    image: "/menu/garlic-cucumber.jpg",
  },
  {
    name: "Chili Oil Potato Salad",
    price: 8.99,
    category: "Appetizers",
    description:
      "Shredded potato chilled and tossed with chili oil, garlic, vinegar, and scallion.",
    spiceLevel: 1,
    tags: ["vegetarian", "vegan", "dairy-free", "soy", "gluten-free", "spicy"],
    image: "/menu/chili-oil-potato-salad.jpg",
  },
  {
    name: "Yuba with Celery Salad",
    price: 8.99,
    category: "Appetizers",
    description:
      "Cold tofu skin (yuba) and celery tossed in soy sauce, sesame oil, and salt.",
    spiceLevel: 0,
    tags: ["vegetarian", "vegan", "soy", "dairy-free"],
    image: "https://source.unsplash.com/featured/?tofu-salad",
  },
  {
    name: "Chili Oil Wontons (8 pc)",
    price: 11.99,
    category: "Appetizers",
    description:
      "Pork-filled wontons in chili oil, soy sauce, garlic, vinegar, and Sichuan peppercorn.",
    spiceLevel: 2,
    tags: ["pork", "meat", "gluten", "soy", "spicy"],
    image: "/menu/chili-oil-wontons.png",
  },
  {
    name: "Pork and Cabbage Boiled Dumplings (12 pc)",
    price: 15.99,
    category: "Appetizers",
    description:
      "Hand-wrapped dumplings filled with ground pork, napa cabbage, ginger, and scallion.",
    spiceLevel: 0,
    tags: ["pork", "meat", "gluten", "soy"],
    image: "/menu/pork-cabbage-dumplings.jpg",
  },
  {
    name: "House Beef Roll",
    price: 12.99,
    category: "Appetizers",
    description:
      "Flaky scallion pancake rolled with sliced braised beef, hoisin sauce, scallions, and cilantro.",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "/menu/house-beef-roll.jpg",
  },
  {
    name: "House Cold Cut Beef",
    price: 12.99,
    category: "Appetizers",
    description:
      "Thinly sliced soy-braised beef shank served cold with chili oil, garlic, and scallion.",
    spiceLevel: 1,
    tags: ["beef", "meat", "soy", "spicy", "gluten-free"],
    image: "/menu/house-cold-cut-beef.jpg",
  },

  {
    name: "Chili Oil Flat Noodle with Beef Bone",
    price: 21.99,
    category: "Dry Noodles",
    description:
      "Wide hand-pulled noodles topped with chili oil, scallions, garlic, and bone-in braised beef.",
    spiceLevel: 3,
    tags: ["beef", "meat", "gluten", "soy", "spicy"],
    image: "/menu/chili-oil-flat-noodle-beef.png",
  },
  {
    name: "Regular Chili Oil Flat Noodle",
    price: 14.99,
    category: "Dry Noodles",
    description:
      "Wide hand-pulled noodles tossed with chili oil, soy sauce, garlic, scallions, and Sichuan peppercorn. Add tomato eggs +$2, ground pork +$3, braised beef +$4.",
    spiceLevel: 2,
    tags: ["vegetarian", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?flat-noodle",
  },
  {
    name: "Numbing Spicy Minced Pork Noodle",
    price: 17.99,
    category: "Dry Noodles",
    description:
      "Noodles tossed with ground pork, chili oil, Sichuan peppercorn, garlic, and scallion (mala style).",
    spiceLevel: 3,
    tags: ["pork", "meat", "gluten", "soy", "spicy"],
    image: "/menu/minced-pork-noodle.jpg",
  },
  {
    name: "Braised Pork Belly Noodle",
    price: 17.99,
    category: "Dry Noodles",
    description:
      "Noodles topped with soy-braised pork belly, scallions, and bok choy in a light sauce.",
    spiceLevel: 0,
    tags: ["pork", "meat", "gluten", "soy"],
    image: "/menu/braised-pork-belly-noodle.jpg",
  },
  {
    name: "Cumin Onion Lamb Stirred Noodle",
    price: 19.99,
    category: "Dry Noodles",
    description:
      "Stir-fried noodles with sliced lamb, onions, cumin, chili, garlic, and scallion.",
    spiceLevel: 2,
    tags: ["lamb", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?lamb-noodles",
  },
  {
    name: "Diced Mushroom and Chicken Tossed Noodle",
    price: 16.99,
    category: "Dry Noodles",
    description:
      "Tossed noodles with diced chicken, mushrooms, garlic, and scallion in a savory soy-based sauce.",
    spiceLevel: 0,
    tags: ["chicken", "meat", "gluten", "soy"],
    image: "/menu/diced-mushroom-chicken-noodle.jpg",
  },
  {
    name: "Potato Chicken Noodle",
    price: 16.99,
    category: "Dry Noodles",
    description:
      "Noodles topped with stewed chicken and potato in a fragrant ginger-soy sauce with scallion.",
    spiceLevel: 0,
    tags: ["chicken", "meat", "gluten", "soy"],
    image: "/menu/potato-chicken-noodle.jpg",
  },
  {
    name: "Stew Lamb and Carrots Noodle",
    price: 18.99,
    category: "Dry Noodles",
    description:
      "Tender stewed lamb with carrots over noodles, finished with ginger, garlic, and scallion.",
    spiceLevel: 0,
    tags: ["lamb", "meat", "gluten", "soy"],
    image: "/menu/stew-lamb-carrots-noodle.jpg",
  },
  {
    name: "Tomato Egg Noodle",
    price: 14.99,
    category: "Dry Noodles",
    description:
      "Noodles tossed with stir-fried tomato, scrambled egg, garlic, and scallion.",
    spiceLevel: 0,
    tags: ["vegetarian", "egg", "gluten", "soy", "dairy-free"],
    image: "/menu/tomato-egg-noodle.jpg",
  },

  {
    name: "House Special Beef Bone Noodle Soup",
    price: 20.99,
    category: "Noodle Soup",
    description:
      "Slow-simmered beef bone broth with hand-pulled noodles, braised beef, bok choy, and scallions.",
    spiceLevel: 1,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "/menu/beef-bone-noodle-soup.png",
  },
  {
    name: "Braised Beef Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Soy-braised beef and noodles in a rich aromatic broth with star anise, ginger, and scallion.",
    spiceLevel: 1,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "/menu/braised-beef-noodle-soup.jpg",
  },
  {
    name: "Pickled Cabbage Beef Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Beef and noodles in a tangy broth with Chinese pickled mustard greens (suan cai), scallion, and chili.",
    spiceLevel: 1,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "/menu/pickled-cabbage-soup.png",
  },
  {
    name: "Tomato Beef Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Beef and noodles in a tomato-based broth with stewed tomatoes, ginger, and scallion.",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?tomato-beef-noodle",
  },
  {
    name: "Golden Sour and Spicy Lamb Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Lamb and noodles in a golden broth made with pickled peppers, ají amarillo–style chilies, garlic, and ginger.",
    spiceLevel: 3,
    tags: ["lamb", "meat", "gluten", "soy", "spicy"],
    image: "/menu/golden-lamb-soup.png",
  },

  {
    name: "Sichuan Spicy Tofu Noodle Soup",
    price: 15.99,
    category: "Noodle Soup",
    description:
      "Silky tofu and noodles in a numbing Sichuan broth with chili oil, peppercorn, and scallion.",
    spiceLevel: 3,
    tags: ["vegetarian", "soy", "gluten", "spicy"],
    image: "/menu/sichuan-tofu-soup.jpg",
  },

  {
    name: "Tomato Beef over White Rice",
    price: 16.99,
    category: "Rice",
    description:
      "Stewed beef and tomato over steamed white rice with scallion.",
    spiceLevel: 0,
    tags: ["beef", "meat", "soy", "gluten-free", "dairy-free"],
    image: "https://source.unsplash.com/featured/?beef-rice",
  },
  {
    name: "Braised Pork over White Rice",
    price: 16.99,
    category: "Rice",
    description:
      "Soy-braised pork belly over steamed white rice, often with bok choy or pickled vegetables.",
    spiceLevel: 0,
    tags: ["pork", "meat", "egg", "soy", "gluten-free", "dairy-free"],
    image: "https://source.unsplash.com/featured/?pork-rice",
  },

  {
    name: "Handmade Fragrance Lemon Tea",
    price: 6.99,
    category: "Beverages",
    description:
      "Fresh lemon, jasmine or green tea, and a touch of honey or sugar.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?lemon-tea",
  },
  {
    name: "Coffee Meets Milk Tea",
    price: 6.99,
    category: "Beverages",
    description:
      "Hong Kong–style yuanyang: brewed coffee, black tea, and sweetened condensed or evaporated milk.",
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
