export type SpiceLevel = 0 | 1 | 2 | 3;

export type MenuItem = {
  // Stable identifier for KV lookups. Optional in this static seed file —
  // the server seed code derives one from the item name when missing.
  id?: string;
  name: string;
  nameZh?: string;
  price: number;
  category: string;
  description: string;
  descriptionZh?: string;
  spiceLevel: SpiceLevel;
  tags: string[];
  image: string;
  available?: boolean;
};

export const MENU_CATEGORIES = [
  "Appetizers",
  "Dry Noodles",
  "Noodle Soup",
  "Rice",
  "Beverages",
] as const;

export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "dairy-free",
  "gluten-free",
  "soy",
  "egg",
  "dairy",
  "gluten",
  "meat",
  "pork",
  "beef",
  "chicken",
  "lamb",
  "spicy",
] as const;

export const MENU: MenuItem[] = [
  {
    name: "Popcorn Chicken",
    nameZh: "盐酥鸡",
    price: 11.99,
    category: "Appetizers",
    description:
      "Bite-sized fried chicken pieces tossed with salt, pepper, and Taiwanese five spice; optional chili seasoning.",
    descriptionZh:
      "酥脆小块炸鸡,撒上盐、胡椒粉与台式五香粉,可选辣椒粉调味。",
    spiceLevel: 1,
    tags: ["chicken", "meat", "gluten", "spicy"],
    image: "/menu/popcorn-chicken.jpg",
  },
  {
    name: "Garlic Cucumber",
    nameZh: "蒜泥黄瓜",
    price: 8.99,
    category: "Appetizers",
    description:
      "Smashed cucumbers tossed in minced garlic, soy sauce, vinegar, sesame oil, and a touch of sugar.",
    descriptionZh:
      "拍黄瓜拌入蒜泥、酱油、香醋、麻油与少许糖。",
    spiceLevel: 0,
    tags: ["vegetarian", "vegan", "dairy-free", "soy", "gluten-free"],
    image: "/menu/garlic-cucumber.jpg",
  },
  {
    name: "Chili Oil Potato Salad",
    nameZh: "红油土豆丝",
    price: 8.99,
    category: "Appetizers",
    description:
      "Shredded potato chilled and tossed with chili oil, garlic, vinegar, and scallion.",
    descriptionZh:
      "土豆丝冷拌红油、蒜末、香醋与葱花。",
    spiceLevel: 1,
    tags: ["vegetarian", "vegan", "dairy-free", "soy", "gluten-free", "spicy"],
    image: "/menu/chili-oil-potato-salad.jpg",
  },
  {
    name: "Yuba with Celery Salad",
    nameZh: "凉拌腐竹西芹",
    price: 8.99,
    category: "Appetizers",
    description:
      "Cold tofu skin (yuba) and celery tossed in soy sauce, sesame oil, and salt.",
    descriptionZh:
      "凉拌腐竹与西芹,调以酱油、麻油及少许盐。",
    spiceLevel: 0,
    tags: ["vegetarian", "vegan", "soy", "dairy-free"],
    image: "/menu/yuba-celery-salad.png",
  },
  {
    name: "Chili Oil Wontons (8 pc)",
    nameZh: "红油抄手 (8只)",
    price: 11.99,
    category: "Appetizers",
    description:
      "Pork-filled wontons in chili oil, soy sauce, garlic, vinegar, and Sichuan peppercorn.",
    descriptionZh:
      "猪肉馅抄手淋上红油、酱油、蒜末、香醋及花椒。",
    spiceLevel: 2,
    tags: ["pork", "meat", "gluten", "soy", "spicy"],
    image: "/menu/chili-oil-wontons.png",
  },
  {
    name: "Pork and Cabbage Boiled Dumplings (12 pc)",
    nameZh: "猪肉大白菜水饺 (12只)",
    price: 15.99,
    category: "Appetizers",
    description:
      "Hand-wrapped dumplings filled with ground pork, napa cabbage, ginger, and scallion.",
    descriptionZh:
      "手工包制水饺,馅料含猪肉末、大白菜、姜与葱花。",
    spiceLevel: 0,
    tags: ["pork", "meat", "gluten", "soy"],
    image: "/menu/pork-cabbage-dumplings.jpg",
  },
  {
    name: "House Beef Roll",
    nameZh: "招牌牛肉卷饼",
    price: 12.99,
    category: "Appetizers",
    description:
      "Flaky scallion pancake rolled with sliced braised beef, hoisin sauce, scallions, and cilantro.",
    descriptionZh:
      "酥脆葱油饼卷入卤牛肉片、海鲜酱、葱花与香菜。",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "/menu/house-beef-roll.jpg",
  },
  {
    name: "House Cold Cut Beef",
    nameZh: "招牌酱牛肉",
    price: 12.99,
    category: "Appetizers",
    description:
      "Thinly sliced soy-braised beef shank served cold with chili oil, garlic, and scallion.",
    descriptionZh:
      "卤牛腱薄切凉盘,佐红油、蒜末与葱花。",
    spiceLevel: 1,
    tags: ["beef", "meat", "soy", "spicy", "gluten-free"],
    image: "/menu/house-cold-cut-beef.jpg",
  },

  {
    name: "Chili Oil Flat Noodle with Beef Bone",
    nameZh: "带骨牛肉红油宽面",
    price: 21.99,
    category: "Dry Noodles",
    description:
      "Wide hand-pulled noodles topped with chili oil, scallions, garlic, and bone-in braised beef.",
    descriptionZh:
      "手工宽面淋上红油、葱花、蒜末,搭配带骨卤牛肉。",
    spiceLevel: 3,
    tags: ["beef", "meat", "gluten", "soy", "spicy"],
    image: "/menu/chili-oil-flat-noodle-beef.png",
  },
  {
    name: "Regular Chili Oil Flat Noodle",
    nameZh: "红油宽面",
    price: 14.99,
    category: "Dry Noodles",
    description:
      "Wide hand-pulled noodles tossed with chili oil, soy sauce, garlic, scallions, and Sichuan peppercorn. Add tomato eggs +$2, ground pork +$3, braised beef +$4.",
    descriptionZh:
      "手工宽面拌红油、酱油、蒜末、葱花与花椒。可加番茄鸡蛋 +$2、肉末 +$3、卤牛肉 +$4。",
    spiceLevel: 2,
    tags: ["vegetarian", "gluten", "soy", "spicy"],
    image: "/menu/regular-chili-oil-flat-noodle.png",
  },
  {
    name: "Numbing Spicy Minced Pork Noodle",
    nameZh: "麻辣肉末面",
    price: 17.99,
    category: "Dry Noodles",
    description:
      "Noodles tossed with ground pork, chili oil, Sichuan peppercorn, garlic, and scallion (mala style).",
    descriptionZh:
      "面条拌入肉末、红油、花椒、蒜末与葱花,麻辣风味。",
    spiceLevel: 3,
    tags: ["pork", "meat", "gluten", "soy", "spicy"],
    image: "/menu/minced-pork-noodle.jpg",
  },
  {
    name: "Braised Pork Belly Noodle",
    nameZh: "红烧五花肉面",
    price: 17.99,
    category: "Dry Noodles",
    description:
      "Noodles topped with soy-braised pork belly, scallions, and bok choy in a light sauce.",
    descriptionZh:
      "面条搭配红烧五花肉、葱花与青菜,轻汁拌面。",
    spiceLevel: 0,
    tags: ["pork", "meat", "gluten", "soy"],
    image: "/menu/braised-pork-belly-noodle.jpg",
  },
  {
    name: "Cumin Onion Lamb Stirred Noodle",
    nameZh: "孜然洋葱羊肉拌面",
    price: 19.99,
    category: "Dry Noodles",
    description:
      "Stir-fried noodles with sliced lamb, onions, cumin, chili, garlic, and scallion.",
    descriptionZh:
      "炒面配羊肉片、洋葱、孜然、辣椒、蒜末与葱花。",
    spiceLevel: 2,
    tags: ["lamb", "meat", "gluten", "soy", "spicy"],
    image: "/menu/cumin-onion-lamb-noodle.png",
  },
  {
    name: "Diced Mushroom and Chicken Tossed Noodle",
    nameZh: "香菇鸡丁拌面",
    price: 16.99,
    category: "Dry Noodles",
    description:
      "Tossed noodles with diced chicken, mushrooms, garlic, and scallion in a savory soy-based sauce.",
    descriptionZh:
      "拌面搭配鸡丁、香菇、蒜末与葱花,佐酱油底咸香酱汁。",
    spiceLevel: 0,
    tags: ["chicken", "meat", "gluten", "soy"],
    image: "/menu/diced-mushroom-chicken-noodle.jpg",
  },
  {
    name: "Potato Chicken Noodle",
    nameZh: "土豆鸡块面",
    price: 16.99,
    category: "Dry Noodles",
    description:
      "Noodles topped with stewed chicken and potato in a fragrant ginger-soy sauce with scallion.",
    descriptionZh:
      "面条搭配炖鸡块与土豆,佐姜葱酱油香汁。",
    spiceLevel: 0,
    tags: ["chicken", "meat", "gluten", "soy"],
    image: "/menu/potato-chicken-noodle.jpg",
  },
  {
    name: "Stew Lamb and Carrots Noodle",
    nameZh: "胡萝卜炖羊肉面",
    price: 18.99,
    category: "Dry Noodles",
    description:
      "Tender stewed lamb with carrots over noodles, finished with ginger, garlic, and scallion.",
    descriptionZh:
      "炖羊肉与胡萝卜浇面,撒入姜、蒜末与葱花。",
    spiceLevel: 0,
    tags: ["lamb", "meat", "gluten", "soy"],
    image: "/menu/stew-lamb-carrots-noodle.jpg",
  },
  {
    name: "Tomato Egg Noodle",
    nameZh: "番茄鸡蛋面",
    price: 14.99,
    category: "Dry Noodles",
    description:
      "Noodles tossed with stir-fried tomato, scrambled egg, garlic, and scallion.",
    descriptionZh:
      "面条拌炒番茄、滑蛋、蒜末与葱花。",
    spiceLevel: 0,
    tags: ["vegetarian", "egg", "gluten", "soy", "dairy-free"],
    image: "/menu/tomato-egg-noodle.jpg",
  },

  {
    name: "House Special Beef Bone Noodle Soup",
    nameZh: "招牌牛骨汤面",
    price: 20.99,
    category: "Noodle Soup",
    description:
      "Slow-simmered beef bone broth with hand-pulled noodles, braised beef, bok choy, and scallions.",
    descriptionZh:
      "慢炖牛骨高汤搭配手工拉面、卤牛肉、青菜与葱花。",
    spiceLevel: 1,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "/menu/beef-bone-noodle-soup.png",
  },
  {
    name: "Braised Beef Noodle Soup",
    nameZh: "红烧牛肉面",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Soy-braised beef and noodles in a rich aromatic broth with star anise, ginger, and scallion.",
    descriptionZh:
      "红烧牛肉与面条共煮于浓郁高汤,加入八角、姜片与葱花。",
    spiceLevel: 1,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "/menu/braised-beef-noodle-soup.jpg",
  },
  {
    name: "Pickled Cabbage Beef Noodle Soup",
    nameZh: "酸菜牛肉面",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Beef and noodles in a tangy broth with Chinese pickled mustard greens (suan cai), scallion, and chili.",
    descriptionZh:
      "牛肉面浸于酸菜高汤,佐葱花与辣椒,酸辣开胃。",
    spiceLevel: 1,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "/menu/pickled-cabbage-soup.png",
  },
  {
    name: "Tomato Beef Noodle Soup",
    nameZh: "番茄牛肉面",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Beef and noodles in a tomato-based broth with stewed tomatoes, ginger, and scallion.",
    descriptionZh:
      "牛肉面搭配番茄汤底,佐炖番茄、姜片与葱花。",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "/menu/tomato-beef-noodle-soup.jpg",
  },
  {
    name: "Golden Sour and Spicy Lamb Noodle Soup",
    nameZh: "金汤酸辣羊肉面",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Lamb and noodles in a golden broth made with pickled peppers, ají amarillo–style chilies, garlic, and ginger.",
    descriptionZh:
      "羊肉面浸于金汤,以泡椒、黄椒、蒜末与姜调味,酸辣鲜香。",
    spiceLevel: 3,
    tags: ["lamb", "meat", "gluten", "soy", "spicy"],
    image: "/menu/golden-lamb-soup.png",
  },

  {
    name: "Sichuan Spicy Tofu Noodle Soup",
    nameZh: "川味麻辣豆腐汤面",
    price: 15.99,
    category: "Noodle Soup",
    description:
      "Silky tofu and noodles in a numbing Sichuan broth with chili oil, peppercorn, and scallion.",
    descriptionZh:
      "嫩豆腐与面条在川式麻辣高汤中,佐红油、花椒与葱花。",
    spiceLevel: 3,
    tags: ["vegetarian", "soy", "gluten", "spicy"],
    image: "/menu/sichuan-tofu-soup.jpg",
  },

  {
    name: "Tomato Beef over White Rice",
    nameZh: "番茄牛肉饭",
    price: 16.99,
    category: "Rice",
    description:
      "Stewed beef and tomato over steamed white rice with scallion.",
    descriptionZh:
      "炖牛肉番茄浇白米饭,撒上葱花。",
    spiceLevel: 0,
    tags: ["beef", "meat", "soy", "gluten-free", "dairy-free"],
    image: "/menu/tomato-beef-rice.jpg",
  },
  {
    name: "Braised Pork over White Rice",
    nameZh: "卤肉饭",
    price: 16.99,
    category: "Rice",
    description:
      "Soy-braised pork belly over steamed white rice, often with bok choy or pickled vegetables.",
    descriptionZh:
      "卤五花肉浇白米饭,常配青菜或腌菜。",
    spiceLevel: 0,
    tags: ["pork", "meat", "egg", "soy", "gluten-free", "dairy-free"],
    image: "/menu/braised-pork-rice.png",
  },

  {
    name: "Coffee Meets Milk Tea",
    nameZh: "鸳鸯奶茶",
    price: 6.99,
    category: "Beverages",
    description:
      "Hong Kong–style yuanyang: brewed coffee, black tea, and sweetened condensed or evaporated milk.",
    descriptionZh:
      "港式鸳鸯:咖啡与红茶相融,加入炼乳或淡奶。",
    spiceLevel: 0,
    tags: ["dairy", "vegetarian", "gluten-free"],
    image: "/menu/coffee-milk-tea.jpg",
  },
  {
    name: "Handmade Fragrance Lemon Tea",
    nameZh: "手作香水柠檬茶",
    price: 6.99,
    category: "Beverages",
    description:
      "Fresh lemon, jasmine or green tea, and a touch of honey or sugar.",
    descriptionZh:
      "鲜柠檬搭配茉莉或绿茶,加入少许蜂蜜或糖调味。",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "/menu/lemon-tea.jpg",
  },
  {
    name: "Peach Sparkling Water",
    nameZh: "蜜桃气泡水",
    price: 3.99,
    category: "Beverages",
    description: "Lightly sweet peach-infused sparkling water.",
    descriptionZh: "蜜桃风味气泡水,清淡微甜。",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "/menu/peach-sparkling-water.jpg",
  },
  {
    name: "Coke",
    nameZh: "可乐",
    price: 2.99,
    category: "Beverages",
    description: "Classic Coca-Cola, served chilled.",
    descriptionZh: "经典可口可乐,冰镇供应。",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "/menu/coke.jpg",
  },
  {
    name: "Diet Coke",
    nameZh: "健怡可乐",
    price: 2.99,
    category: "Beverages",
    description: "Zero-sugar Diet Coke, served chilled.",
    descriptionZh: "无糖健怡可乐,冰镇供应。",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "/menu/diet-coke.webp",
  },
  {
    name: "Sprite",
    nameZh: "雪碧",
    price: 2.99,
    category: "Beverages",
    description: "Crisp lemon-lime soda, served chilled.",
    descriptionZh: "清爽柠檬汽水,冰镇供应。",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "/menu/sprite.webp",
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

export function localName(
  item: MenuItem,
  lang: "en" | "zh",
  autoMap?: Record<string, string>,
): string {
  if (lang === "zh") {
    if (item.nameZh) return item.nameZh;
    if (autoMap && autoMap[item.name]) return autoMap[item.name];
  }
  return item.name;
}

export function localDescription(
  item: MenuItem,
  lang: "en" | "zh",
  autoMap?: Record<string, string>,
): string {
  if (lang === "zh") {
    if (item.descriptionZh) return item.descriptionZh;
    if (autoMap && autoMap[item.description]) return autoMap[item.description];
  }
  return item.description;
}
