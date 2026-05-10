// Allergen synonym table. The user might say "prawn" and the dish has
// "shrimp" in its description; "ham" and the dish is pork; "lactose"
// and the dish has "milk". Without synonym expansion the substring
// matcher returns nothing — so we expand each detected allergen to
// every form that should be considered equivalent for filtering.
//
// Format: each entry maps a CANONICAL English form to a list of
// equivalents. When the user names any of the values, we treat it as
// the key. Example: ["pork", "ham", "bacon", "prosciutto", "свинина",
// "豚肉", "돼지고기", …] — all map to the same constraint.
//
// Foreign-language values are included so a non-English user statement
// that the LLM correctly identified can still be normalized to English
// for matching against (English) dish names. Substring matching makes
// "potato" match "potatoes", so we keep singular/canonical forms here.

export const SYNONYM_GROUPS: Record<string, string[]> = {
  // Meats
  pork: [
    "pork", "ham", "bacon", "prosciutto", "pancetta", "salami", "chorizo",
    "sausage", "pepperoni", "guanciale", "lard",
    "свинина", "ветчина", "бекон", "колбас",
    "porc", "jambon", "lard",
    "cerdo", "jamón", "tocino",
    "schwein", "schinken", "speck",
    "maiale", "prosciutto",
    "porco", "presunto",
    "豚", "豚肉", "ハム", "ベーコン",
    "돼지", "돼지고기", "햄", "베이컨",
    "猪肉", "火腿", "培根", "腊肠",
    "خنزير", "لحم خنزير",
  ],
  beef: [
    "beef", "steak", "veal",
    "говядина", "телятина",
    "bœuf", "boeuf", "veau",
    "carne de res", "ternera",
    "rind", "rindfleisch", "kalb",
    "manzo", "vitello",
    "carne bovina", "vitela",
    "牛", "牛肉",
    "소", "소고기",
    "牛肉",
    "بقر",
    "गोमांस",
  ],
  chicken: [
    "chicken", "poultry", "hen", "rooster",
    "курица", "куриный",
    "poulet", "poule",
    "pollo",
    "huhn", "hähnchen",
    "frango",
    "鶏", "鶏肉", "チキン",
    "닭", "닭고기",
    "鸡", "鸡肉",
    "دجاج",
    "मुर्गी", "चिकन",
  ],
  lamb: [
    "lamb", "mutton",
    "баранина", "ягнятина",
    "agneau", "mouton",
    "cordero",
    "lamm", "hammel",
    "agnello",
    "羊", "ラム", "羊肉",
    "양", "양고기",
    "羊肉",
  ],
  // Dairy
  dairy: [
    "dairy", "milk", "cream", "butter", "cheese", "yogurt", "yoghurt",
    "lactose", "casein", "whey",
    "молоко", "сливки", "сыр", "масло", "молочный",
    "lait", "crème", "fromage", "beurre", "yaourt", "lactose",
    "leche", "queso", "mantequilla", "crema", "yogur", "lactosa",
    "milch", "käse", "butter", "sahne", "joghurt",
    "latte", "formaggio", "burro", "panna", "yogurt", "lattosio",
    "leite", "queijo", "manteiga", "iogurte",
    "牛乳", "ミルク", "チーズ", "バター", "ヨーグルト", "乳製品",
    "우유", "치즈", "버터", "요구르트", "유제품",
    "牛奶", "奶酪", "黄油", "酸奶", "乳制品",
    "حليب", "جبن", "زبدة",
    "दूध", "पनीर", "मक्खन",
  ],
  egg: [
    "egg", "eggs", "albumen", "yolk",
    "яйцо", "яйца", "яичный",
    "œuf", "oeuf", "œufs",
    "huevo", "huevos",
    "ei", "eier",
    "uovo", "uova",
    "ovo", "ovos",
    "卵", "玉子", "たまご",
    "달걀", "계란",
    "蛋", "鸡蛋",
    "بيض", "بيضة",
    "अंडा",
  ],
  // Seafood
  fish: [
    "fish", "tuna", "salmon", "cod", "halibut", "trout", "anchovy", "sardine", "mackerel",
    "рыба", "тунец", "лосось", "семга",
    "poisson", "thon", "saumon",
    "pescado", "atún", "salmón",
    "fisch", "thunfisch", "lachs",
    "pesce", "tonno", "salmone",
    "peixe", "atum", "salmão",
    "魚", "魚肉", "マグロ", "サーモン",
    "생선", "참치", "연어", "물고기",
    "鱼", "鱼肉", "金枪鱼", "三文鱼",
    "سمك", "تونة",
    "मछली",
  ],
  shrimp: [
    "shrimp", "prawn", "prawns", "shrimps",
    "креветка", "креветки",
    "crevette", "crevettes", "gambas",
    "camarón", "gambas",
    "garnele", "garnelen",
    "gambero", "gamberi",
    "camarão",
    "エビ", "海老",
    "새우",
    "虾",
    "روبيان", "جمبري",
    "झींगा",
  ],
  shellfish: [
    "shellfish", "crab", "lobster", "oyster", "clam", "mussel", "scallop",
    "моллюск", "ракообразн", "краб", "омар",
    "fruits de mer", "crabe", "homard", "huître", "moule",
    "marisco", "mariscos", "cangrejo", "langosta", "ostra",
    "schalentier", "krebs", "hummer", "auster",
    "frutti di mare", "granchio", "aragosta",
    "marisco", "caranguejo", "lagosta",
    "甲殻類", "貝", "カニ",
    "조개", "갑각류", "게",
    "贝类", "蟹", "龙虾",
  ],
  // Plant allergens
  soy: [
    "soy", "soya", "soybean", "soybeans", "tofu", "edamame", "tempeh",
    "соя", "соевый", "тофу",
    "soja",
    "豆腐", "大豆", "醤油",
    "두부", "콩",
    "豆腐", "大豆", "酱油",
  ],
  peanut: [
    "peanut", "peanuts", "groundnut",
    "арахис",
    "cacahuète", "arachide",
    "cacahuate", "maní",
    "erdnuss",
    "arachide",
    "amendoim",
    "ピーナッツ", "落花生",
    "땅콩",
    "花生",
  ],
  "tree-nut": [
    "tree nut", "tree-nut", "almond", "almonds", "cashew", "walnut", "pecan", "pistachio", "hazelnut", "macadamia",
    "орех", "миндаль", "кешью",
    "noix", "amande", "noisette",
    "almendra", "nuez", "anacardo",
    "nuss", "mandel", "haselnuss",
    "noce", "mandorla", "nocciola",
    "noz", "amêndoa",
    "ナッツ", "アーモンド", "クルミ",
    "견과", "아몬드", "호두",
    "坚果", "杏仁", "核桃",
  ],
  gluten: [
    "gluten", "wheat", "barley", "rye", "spelt",
    "пшеница", "глютен",
    "blé", "gluten",
    "trigo",
    "weizen", "gluten",
    "grano", "frumento",
    "trigo",
    "小麦", "グルテン",
    "밀", "글루텐",
    "小麦", "麸质",
  ],
  sesame: [
    "sesame", "tahini",
    "кунжут",
    "sésame",
    "ajonjolí", "sésamo",
    "sesam",
    "sesamo",
    "gergelim",
    "ごま", "胡麻", "セサミ",
    "참깨",
    "芝麻",
  ],
  // Common vegetables (often subject of personal aversions)
  potato: [
    "potato", "potatoes", "spud", "tater",
    "картофель", "картошка", "картошки",
    "pomme de terre", "patate",
    "papa", "patata",
    "kartoffel",
    "patata",
    "batata",
    "じゃがいも", "ポテト",
    "감자",
    "土豆", "马铃薯",
  ],
  cucumber: [
    "cucumber", "cucumbers",
    "огурец", "огурцы",
    "concombre",
    "pepino",
    "gurke",
    "cetriolo",
    "pepino",
    "きゅうり",
    "오이",
    "黄瓜",
  ],
  mushroom: [
    "mushroom", "mushrooms", "fungi",
    "гриб", "грибы",
    "champignon",
    "champiñón", "hongo",
    "pilz",
    "fungo",
    "cogumelo",
    "きのこ",
    "버섯",
    "蘑菇",
  ],
  cilantro: ["cilantro", "coriander", "кориандр", "香菜", "고수"],
};

// Reverse-lookup: every value → its canonical key. Built once.
const SYNONYM_TO_CANONICAL: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [canonical, synonyms] of Object.entries(SYNONYM_GROUPS)) {
    m.set(canonical, canonical);
    for (const syn of synonyms) {
      m.set(syn.toLowerCase(), canonical);
    }
  }
  return m;
})();

// Given any user-stated allergen, return every form that should be
// treated as equivalent for substring filtering against dish text.
// If the input doesn't map to any known group, just return the input
// itself (so unknown ingredients still filter, just without synonym
// expansion).
export function expandAllergenSynonyms(allergen: string): string[] {
  const a = allergen.toLowerCase().trim();
  const canonical = SYNONYM_TO_CANONICAL.get(a);
  if (canonical) return SYNONYM_GROUPS[canonical];
  return [a];
}

// Same idea but for a list — flattens the result.
export function expandAllergenList(allergens: string[]): string[] {
  const out = new Set<string>();
  for (const a of allergens) {
    for (const s of expandAllergenSynonyms(a)) out.add(s);
  }
  return Array.from(out);
}
