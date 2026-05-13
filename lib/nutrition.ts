import type { MenuItem } from "./menu";

export type Nutrition = {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  sodium?: number; // milligrams
};

export type ItemNutritionInfo = {
  nutrition?: Nutrition;
  ingredients?: string;
  ingredientsZh?: string;
};

/**
 * Nutrition + ingredient facts keyed by canonical English item name.
 * Values are estimates for a standard regular portion (per the menu's
 * Regular/Large option). Add-ons and size upgrades aren't reflected
 * here — the detail sheet shows the base values only.
 *
 * To update: edit the entry inline or add a new one keyed by the same
 * `name:` string used in MENU.
 */
const NUTRITION_BY_NAME: Record<string, ItemNutritionInfo> = {
  // ─── Appetizers ─────────────────────────────────────────────────
  "Popcorn Chicken": {
    nutrition: { calories: 540, protein: 28, carbs: 34, fat: 32, sodium: 980 },
    ingredients:
      "Chicken thigh, sweet potato starch, egg, soy sauce, garlic, salt, white pepper, Taiwanese five-spice, basil leaves, vegetable oil",
    ingredientsZh:
      "鸡腿肉、地瓜粉、鸡蛋、酱油、蒜、盐、白胡椒、台式五香粉、九层塔、植物油",
  },
  "Garlic Cucumber": {
    nutrition: { calories: 110, protein: 3, carbs: 12, fat: 6, sodium: 540 },
    ingredients:
      "Cucumber, garlic, soy sauce, rice vinegar, sesame oil, sugar, salt",
    ingredientsZh: "黄瓜、大蒜、酱油、米醋、麻油、糖、盐",
  },
  "Chili Oil Potato Salad": {
    nutrition: { calories: 220, protein: 4, carbs: 28, fat: 11, sodium: 610 },
    ingredients:
      "Potato, chili oil, garlic, rice vinegar, scallion, soy sauce, salt, sugar",
    ingredientsZh: "土豆、红油、大蒜、米醋、葱花、酱油、盐、糖",
  },
  "Yuba with Celery Salad": {
    nutrition: { calories: 190, protein: 11, carbs: 10, fat: 12, sodium: 640 },
    ingredients: "Tofu skin (yuba), celery, soy sauce, sesame oil, salt",
    ingredientsZh: "腐竹、西芹、酱油、麻油、盐",
  },
  "Chili Oil Wontons (8 pc)": {
    nutrition: { calories: 480, protein: 18, carbs: 42, fat: 26, sodium: 1180 },
    ingredients:
      "Wheat wonton wrappers, ground pork, ginger, scallion, chili oil, soy sauce, garlic, rice vinegar, Sichuan peppercorn, sesame seeds",
    ingredientsZh:
      "小麦抄手皮、猪肉末、姜、葱花、红油、酱油、大蒜、米醋、花椒、芝麻",
  },
  "Pork and Cabbage Boiled Dumplings (12 pc)": {
    nutrition: { calories: 620, protein: 24, carbs: 72, fat: 24, sodium: 940 },
    ingredients:
      "Wheat dumpling wrappers, ground pork, napa cabbage, ginger, scallion, soy sauce, sesame oil, salt, white pepper",
    ingredientsZh:
      "小麦水饺皮、猪肉末、大白菜、姜、葱花、酱油、麻油、盐、白胡椒",
  },
  "House Beef Roll": {
    nutrition: { calories: 520, protein: 22, carbs: 46, fat: 26, sodium: 1080 },
    ingredients:
      "Scallion pancake (wheat flour, scallion, oil), soy-braised beef shank, hoisin sauce, scallion, cilantro",
    ingredientsZh:
      "葱油饼（小麦面粉、葱、油）、卤牛腱、海鲜酱、葱花、香菜",
  },
  "House Cold Cut Beef": {
    nutrition: { calories: 280, protein: 32, carbs: 6, fat: 14, sodium: 920 },
    ingredients:
      "Beef shank, soy sauce, star anise, ginger, scallion, chili oil, garlic, Sichuan peppercorn",
    ingredientsZh: "牛腱、酱油、八角、姜、葱花、红油、大蒜、花椒",
  },

  // ─── Dry Noodles ────────────────────────────────────────────────
  "Chili Oil Flat Noodle with Beef Bone": {
    nutrition: { calories: 820, protein: 38, carbs: 88, fat: 36, sodium: 1620 },
    ingredients:
      "Hand-pulled wide wheat noodles, bone-in braised beef, chili oil, soy sauce, garlic, scallion, Sichuan peppercorn, sesame, ginger",
    ingredientsZh:
      "手工宽面（小麦）、带骨卤牛肉、红油、酱油、大蒜、葱花、花椒、芝麻、姜",
  },
  "Regular Chili Oil Flat Noodle": {
    nutrition: { calories: 580, protein: 14, carbs: 88, fat: 20, sodium: 1340 },
    ingredients:
      "Hand-pulled wide wheat noodles, chili oil, soy sauce, garlic, scallion, Sichuan peppercorn, sesame, salt",
    ingredientsZh:
      "手工宽面（小麦）、红油、酱油、大蒜、葱花、花椒、芝麻、盐",
  },
  "Numbing Spicy Minced Pork Noodle": {
    nutrition: { calories: 720, protein: 28, carbs: 80, fat: 32, sodium: 1480 },
    ingredients:
      "Wheat noodles, ground pork, chili oil, doubanjiang, Sichuan peppercorn, garlic, scallion, soy sauce, ginger, sesame paste",
    ingredientsZh:
      "小麦面条、猪肉末、红油、豆瓣酱、花椒、大蒜、葱花、酱油、姜、芝麻酱",
  },
  "Braised Pork Belly Noodle": {
    nutrition: { calories: 780, protein: 26, carbs: 82, fat: 38, sodium: 1280 },
    ingredients:
      "Wheat noodles, pork belly, soy sauce, rock sugar, ginger, star anise, scallion, bok choy, garlic, Shaoxing wine",
    ingredientsZh:
      "小麦面条、五花肉、酱油、冰糖、姜、八角、葱花、青菜、大蒜、绍兴酒",
  },
  "Cumin Onion Lamb Stirred Noodle": {
    nutrition: { calories: 720, protein: 30, carbs: 78, fat: 30, sodium: 1340 },
    ingredients:
      "Wheat noodles, lamb shoulder, onion, cumin, dried chili, garlic, scallion, soy sauce, sesame oil",
    ingredientsZh:
      "小麦面条、羊肩肉、洋葱、孜然、干辣椒、大蒜、葱花、酱油、麻油",
  },
  "Diced Mushroom and Chicken Tossed Noodle": {
    nutrition: { calories: 620, protein: 28, carbs: 78, fat: 20, sodium: 1240 },
    ingredients:
      "Wheat noodles, chicken thigh, shiitake mushroom, garlic, scallion, soy sauce, oyster sauce, ginger, sesame oil",
    ingredientsZh:
      "小麦面条、鸡腿肉、香菇、大蒜、葱花、酱油、蚝油、姜、麻油",
  },
  "Potato Chicken Noodle": {
    nutrition: { calories: 650, protein: 26, carbs: 88, fat: 20, sodium: 1180 },
    ingredients:
      "Wheat noodles, chicken thigh, potato, ginger, scallion, soy sauce, garlic, rock sugar, Shaoxing wine",
    ingredientsZh:
      "小麦面条、鸡腿肉、土豆、姜、葱花、酱油、大蒜、冰糖、绍兴酒",
  },
  "Stew Lamb and Carrots Noodle": {
    nutrition: { calories: 680, protein: 28, carbs: 80, fat: 26, sodium: 1220 },
    ingredients:
      "Wheat noodles, lamb shoulder, carrot, ginger, garlic, scallion, soy sauce, star anise, Shaoxing wine",
    ingredientsZh:
      "小麦面条、羊肩肉、胡萝卜、姜、大蒜、葱花、酱油、八角、绍兴酒",
  },
  "Tomato Egg Noodle": {
    nutrition: { calories: 520, protein: 16, carbs: 80, fat: 16, sodium: 1080 },
    ingredients:
      "Wheat noodles, tomato, egg, garlic, scallion, soy sauce, sugar, sesame oil, salt",
    ingredientsZh:
      "小麦面条、番茄、鸡蛋、大蒜、葱花、酱油、糖、麻油、盐",
  },

  // ─── Noodle Soups ───────────────────────────────────────────────
  "House Special Beef Bone Noodle Soup": {
    nutrition: { calories: 720, protein: 36, carbs: 82, fat: 26, sodium: 1620 },
    ingredients:
      "Hand-pulled wheat noodles, beef bone broth, braised beef, bok choy, scallion, ginger, soy sauce, star anise, Shaoxing wine",
    ingredientsZh:
      "手工拉面（小麦）、牛骨高汤、卤牛肉、青菜、葱花、姜、酱油、八角、绍兴酒",
  },
  "Braised Beef Noodle Soup": {
    nutrition: { calories: 640, protein: 30, carbs: 78, fat: 22, sodium: 1480 },
    ingredients:
      "Wheat noodles, soy-braised beef, beef broth, star anise, ginger, scallion, soy sauce, rock sugar, Shaoxing wine",
    ingredientsZh:
      "小麦面条、红烧牛肉、牛肉高汤、八角、姜、葱花、酱油、冰糖、绍兴酒",
  },
  "Pickled Cabbage Beef Noodle Soup": {
    nutrition: { calories: 580, protein: 28, carbs: 74, fat: 18, sodium: 1640 },
    ingredients:
      "Wheat noodles, beef, Chinese pickled mustard greens (suan cai), ginger, scallion, chili, soy sauce, garlic",
    ingredientsZh:
      "小麦面条、牛肉、酸菜、姜、葱花、辣椒、酱油、大蒜",
  },
  "Tomato Beef Noodle Soup": {
    nutrition: { calories: 580, protein: 28, carbs: 78, fat: 18, sodium: 1280 },
    ingredients:
      "Wheat noodles, beef, tomato, ginger, scallion, garlic, soy sauce, sugar, salt",
    ingredientsZh:
      "小麦面条、牛肉、番茄、姜、葱花、大蒜、酱油、糖、盐",
  },
  "Golden Sour and Spicy Lamb Noodle Soup": {
    nutrition: { calories: 620, protein: 28, carbs: 72, fat: 24, sodium: 1540 },
    ingredients:
      "Wheat noodles, lamb, pickled yellow chili, ginger, garlic, white pepper, scallion, soy sauce, chicken broth",
    ingredientsZh:
      "小麦面条、羊肉、泡黄椒、姜、大蒜、白胡椒、葱花、酱油、鸡高汤",
  },
  "Sichuan Spicy Tofu Noodle Soup": {
    nutrition: { calories: 540, protein: 20, carbs: 72, fat: 18, sodium: 1480 },
    ingredients:
      "Wheat noodles, silken tofu, chili oil, doubanjiang, Sichuan peppercorn, garlic, scallion, soy sauce, ginger",
    ingredientsZh:
      "小麦面条、嫩豆腐、红油、豆瓣酱、花椒、大蒜、葱花、酱油、姜",
  },

  // ─── Rice ───────────────────────────────────────────────────────
  "Tomato Beef over White Rice": {
    nutrition: { calories: 620, protein: 26, carbs: 86, fat: 18, sodium: 980 },
    ingredients:
      "Jasmine rice, beef, tomato, scallion, ginger, garlic, soy sauce, sugar, salt",
    ingredientsZh:
      "茉莉香米、牛肉、番茄、葱花、姜、大蒜、酱油、糖、盐",
  },
  "Braised Pork over White Rice": {
    nutrition: { calories: 720, protein: 22, carbs: 86, fat: 32, sodium: 1240 },
    ingredients:
      "Jasmine rice, pork belly, soy sauce, rock sugar, fried shallot, ginger, star anise, egg, bok choy",
    ingredientsZh:
      "茉莉香米、五花肉、酱油、冰糖、油葱酥、姜、八角、鸡蛋、青菜",
  },

  // ─── Beverages ──────────────────────────────────────────────────
  "Coffee Meets Milk Tea": {
    nutrition: { calories: 180, protein: 4, carbs: 26, fat: 6, sodium: 70 },
    ingredients:
      "Brewed coffee, black tea, evaporated milk, sweetened condensed milk, sugar",
    ingredientsZh: "现煮咖啡、红茶、淡奶、炼乳、糖",
  },
  "Handmade Fragrance Lemon Tea": {
    nutrition: { calories: 90, protein: 0, carbs: 22, fat: 0, sodium: 10 },
    ingredients: "Fresh lemon, jasmine or green tea, honey, cane sugar, water",
    ingredientsZh: "鲜柠檬、茉莉茶或绿茶、蜂蜜、蔗糖、水",
  },
  "Peach Sparkling Water": {
    nutrition: { calories: 110, protein: 0, carbs: 28, fat: 0, sodium: 25 },
    ingredients:
      "Carbonated water, peach juice, natural peach flavor, cane sugar, citric acid",
    ingredientsZh: "气泡水、桃汁、天然桃味、蔗糖、柠檬酸",
  },
  "Coke": {
    nutrition: { calories: 140, protein: 0, carbs: 39, fat: 0, sodium: 45 },
    ingredients:
      "Carbonated water, high-fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine",
    ingredientsZh: "气泡水、高果糖浆、焦糖色、磷酸、天然香料、咖啡因",
  },
  "Diet Coke": {
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 40 },
    ingredients:
      "Carbonated water, caramel color, aspartame, phosphoric acid, potassium benzoate, natural flavors, citric acid, caffeine",
    ingredientsZh:
      "气泡水、焦糖色、阿斯巴甜、磷酸、苯甲酸钾、天然香料、柠檬酸、咖啡因",
  },
  "Sprite": {
    nutrition: { calories: 140, protein: 0, carbs: 38, fat: 0, sodium: 65 },
    ingredients:
      "Carbonated water, high-fructose corn syrup, citric acid, natural lemon-lime flavors, sodium citrate, sodium benzoate",
    ingredientsZh:
      "气泡水、高果糖浆、柠檬酸、天然柠檬青柠香料、柠檬酸钠、苯甲酸钠",
  },
};

export function getNutritionForItem(item: MenuItem): ItemNutritionInfo {
  return NUTRITION_BY_NAME[item.name] ?? {};
}
