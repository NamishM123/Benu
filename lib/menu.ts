import { SUPPORTED_LANGS, type Lang } from "./i18n";

export type SpiceLevel = 0 | 1 | 2 | 3;

// Per-language dish translations. Stored as a nested map rather than flat
// `nameEs` / `nameVi` fields so the schema doesn't bloat as new languages
// land — a missing entry falls back to English via `localName`.
export type DishTranslation = {
  name?: string;
  description?: string;
};

export type MenuItem = {
  // Stable identifier for KV lookups. Optional in this static seed file —
  // the server seed code derives one from the item name when missing.
  id?: string;
  name: string;
  // Legacy Simplified Chinese fields. Kept as flat fields because the
  // existing KV data lives here; new locales go in `translations`.
  nameZh?: string;
  price: number;
  category: string;
  description: string;
  descriptionZh?: string;
  spiceLevel: SpiceLevel;
  tags: string[];
  image: string;
  available?: boolean;
  // Translations for every non-English locale except the legacy zh-Hans
  // (which is mirrored from nameZh/descriptionZh by `localName` /
  // `localDescription`).
  translations?: Partial<Record<Lang, DishTranslation>>;
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

// Cultural note: pork-containing dishes are explicitly called out in the
// Farsi descriptions (گوشت خوک / "pork meat") and in the Armenian copy
// (խոզի միս / "pork meat") so observant Muslim Iranian and Christian
// Armenian diners see the ingredient without relying on the meat filter.
// Beef/lamb dishes are also named explicitly so Hindu-leaning Tagalog/
// vegetarian Vietnamese readers can see at a glance.
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
    translations: {
      es: {
        name: "Pollo Crujiente Estilo Taiwanés",
        description:
          "Trocitos de pollo frito y crujiente con sal, pimienta y cinco especias taiwanesas; chile opcional.",
      },
      "zh-Hant": {
        name: "鹽酥雞",
        description:
          "酥脆小塊炸雞，撒上鹽、胡椒粉與台式五香粉，可選辣椒粉調味。",
      },
      tl: {
        name: "Taiwanese Popcorn Chicken",
        description:
          "Maliliit na piraso ng pritong manok na may asin, paminta at Taiwanese five-spice; opsyonal ang chili.",
      },
      vi: {
        name: "Gà Rán Đài Loan (Yán Sū Jī)",
        description:
          "Gà chiên giòn cắt miếng nhỏ tẩm muối, tiêu và ngũ vị hương Đài Loan; có thể thêm ớt bột.",
      },
      ko: {
        name: "대만식 팝콘 치킨 (鹽酥雞)",
        description:
          "한입 크기로 튀긴 닭고기에 소금, 후추, 대만식 오향분을 묻혔어요. 매콤한 시즈닝 선택 가능.",
      },
      ja: {
        name: "塩酥鶏（台湾風からあげ）",
        description:
          "一口大の唐揚げに、塩・こしょう・台湾の五香粉をまぶしました。チリ風味も選べます。",
      },
      fa: {
        name: "مرغ سوخاری به سبک تایوانی",
        description:
          "تکه‌های ریز مرغ سوخاری با نمک، فلفل سیاه و ادویه پنج‌گانه تایوانی؛ ادویه فلفل به‌دلخواه.",
      },
      hy: {
        name: "Տայվանյան ոճով տապակած հավի կտորներ",
        description:
          "Մանր կտորատված տապակած հավ՝ աղով, պղպեղով և տայվանյան հինգ-համեմունքով։ Կամովի՝ կծու համեմունք։",
      },
      ru: {
        name: "Курица-«попкорн» по-тайваньски",
        description:
          "Кусочки курицы во фритюре с солью, перцем и тайваньской смесью «пять специй»; по желанию — острая посыпка.",
      },
    },
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
    translations: {
      es: {
        name: "Pepino al Ajo",
        description:
          "Pepino machacado con ajo picado, salsa de soja, vinagre, aceite de sésamo y un toque de azúcar.",
      },
      "zh-Hant": {
        name: "蒜泥黃瓜",
        description: "拍黃瓜拌入蒜泥、醬油、香醋、麻油與少許糖。",
      },
      tl: {
        name: "Pipino sa Bawang",
        description:
          "Hinampas na pipino na may tinadtad na bawang, toyo, suka, sesame oil at konting asukal.",
      },
      vi: {
        name: "Dưa Leo Trộn Tỏi",
        description:
          "Dưa leo đập dập trộn tỏi băm, nước tương, giấm, dầu mè và chút đường.",
      },
      ko: {
        name: "마늘 오이무침",
        description:
          "두드려 으깬 오이를 다진 마늘, 간장, 식초, 참기름, 약간의 설탕에 무쳤어요.",
      },
      ja: {
        name: "叩ききゅうりのにんにく和え",
        description:
          "叩いたきゅうりに、おろしにんにく・しょうゆ・酢・ごま油・砂糖少々を絡めました。",
      },
      fa: {
        name: "خیار با سس سیر",
        description:
          "خیار له‌شده با سیر رنده‌شده، سس سویا، سرکه، روغن کنجد و کمی شکر.",
      },
      hy: {
        name: "Վարունգ սխտորով",
        description:
          "Հարված վարունգ՝ խառնված ճզմած սխտորի, սոյայի սոուսի, քացախի, քունջութի յուղի ու մի քիչ շաքարի հետ։",
      },
      ru: {
        name: "Битые огурцы с чесноком",
        description:
          "Битые огурцы с измельчённым чесноком, соевым соусом, уксусом, кунжутным маслом и щепоткой сахара.",
      },
    },
  },
  {
    name: "Chili Oil Potato Salad",
    nameZh: "红油土豆丝",
    price: 8.99,
    category: "Appetizers",
    description:
      "Shredded potato chilled and tossed with chili oil, garlic, vinegar, and scallion.",
    descriptionZh: "土豆丝冷拌红油、蒜末、香醋与葱花。",
    spiceLevel: 1,
    tags: ["vegetarian", "vegan", "dairy-free", "soy", "gluten-free", "spicy"],
    image: "/menu/chili-oil-potato-salad.jpg",
    translations: {
      es: {
        name: "Ensalada de Papa al Aceite de Chile",
        description:
          "Papa rallada fría con aceite de chile, ajo, vinagre y cebollín.",
      },
      "zh-Hant": {
        name: "紅油土豆絲",
        description: "土豆絲冷拌紅油、蒜末、香醋與蔥花。",
      },
      tl: {
        name: "Patatas na Hinog sa Chili Oil",
        description:
          "Niyebeng patatas na hinaluan ng chili oil, bawang, suka at sibuyas-na-mura.",
      },
      vi: {
        name: "Khoai Tây Sợi Trộn Dầu Ớt",
        description:
          "Khoai tây bào sợi để lạnh, trộn dầu ớt, tỏi băm, giấm và hành lá.",
      },
      ko: {
        name: "감자채 고추기름 무침",
        description:
          "차게 식힌 감자채를 고추기름, 마늘, 식초, 쪽파와 함께 버무렸어요.",
      },
      ja: {
        name: "じゃがいも千切りのラー油和え",
        description:
          "細切りじゃがいもを冷やし、ラー油・にんにく・酢・ねぎで和えた一品。",
      },
      fa: {
        name: "سالاد سیب‌زمینی با روغن فلفل",
        description:
          "سیب‌زمینی رنده‌شده و خنک با روغن فلفل تند، سیر، سرکه و تره.",
      },
      hy: {
        name: "Կարտոֆիլի աղցան կծու յուղով",
        description:
          "Քերած կարտոֆիլ՝ սառեցված և խառնված կծու յուղի, սխտորի, քացախի և կանաչ սոխի հետ։",
      },
      ru: {
        name: "Картофельная соломка в остром масле",
        description:
          "Холодная картофельная соломка с чили-маслом, чесноком, уксусом и зелёным луком.",
      },
    },
  },
  {
    name: "Yuba with Celery Salad",
    nameZh: "凉拌腐竹西芹",
    price: 8.99,
    category: "Appetizers",
    description:
      "Cold tofu skin (yuba) and celery tossed in soy sauce, sesame oil, and salt.",
    descriptionZh: "凉拌腐竹与西芹,调以酱油、麻油及少许盐。",
    spiceLevel: 0,
    tags: ["vegetarian", "vegan", "soy", "dairy-free"],
    image: "/menu/yuba-celery-salad.png",
    translations: {
      es: {
        name: "Ensalada de Yuba (Piel de Tofu) y Apio",
        description:
          "Piel de tofu (yuba) y apio fríos con salsa de soja, aceite de sésamo y una pizca de sal.",
      },
      "zh-Hant": {
        name: "涼拌腐竹西芹",
        description: "涼拌腐竹與西芹，調以醬油、麻油及少許鹽。",
      },
      tl: {
        name: "Cold Yuba (Tofu Skin) at Kintsay",
        description:
          "Malamig na yuba (balat ng tokwa) at kintsay na hinaluan ng toyo, sesame oil at konting asin.",
      },
      vi: {
        name: "Váng Đậu Trộn Cần Tây (Kiểu Lạnh)",
        description:
          "Váng đậu (yuba) và cần tây để lạnh, trộn nước tương, dầu mè và chút muối.",
      },
      ko: {
        name: "두부피와 셀러리 무침",
        description:
          "차게 식힌 두부피(유바)와 셀러리를 간장, 참기름, 소금으로 가볍게 무쳤어요.",
      },
      ja: {
        name: "湯葉とセロリの和え物",
        description:
          "冷やした湯葉とセロリを、しょうゆ・ごま油・少々の塩で和えました。",
      },
      fa: {
        name: "سالاد سرد یوبا (پوست توفو) با کرفس",
        description:
          "یوبا (پوست توفو) و کرفس سرد همراه با سس سویا، روغن کنجد و کمی نمک.",
      },
      hy: {
        name: "Սառը աղցան յուբայով (տոֆուի թաղանթ) և նեխուրով",
        description:
          "Սառեցված յուբա ու նեխուր՝ համեմված սոյայի սոուսով, քունջութի յուղով և մի քիչ աղով։",
      },
      ru: {
        name: "Холодный салат из юбы (соевой плёнки) и сельдерея",
        description:
          "Холодная юба (соевая плёнка) и сельдерей с соевым соусом, кунжутным маслом и щепоткой соли.",
      },
    },
  },
  {
    name: "Chili Oil Wontons (8 pc)",
    nameZh: "红油抄手 (8只)",
    price: 11.99,
    category: "Appetizers",
    description:
      "Pork-filled wontons in chili oil, soy sauce, garlic, vinegar, and Sichuan peppercorn.",
    descriptionZh: "猪肉馅抄手淋上红油、酱油、蒜末、香醋及花椒。",
    spiceLevel: 2,
    tags: ["pork", "meat", "gluten", "soy", "spicy"],
    image: "/menu/chili-oil-wontons.png",
    translations: {
      es: {
        name: "Wontones al Aceite de Chile (8 pzs)",
        description:
          "Wontones rellenos de cerdo bañados en aceite de chile, salsa de soja, ajo, vinagre y pimienta de Sichuan.",
      },
      "zh-Hant": {
        name: "紅油抄手（8隻）",
        description: "豬肉餡抄手淋上紅油、醬油、蒜末、香醋及花椒。",
      },
      tl: {
        name: "Chili Oil Wontons na Baboy (8 piraso)",
        description:
          "Wonton na may pamalit na karneng baboy at binuhusan ng chili oil, toyo, bawang, suka at Sichuan peppercorn.",
      },
      vi: {
        name: "Hoành Thánh Heo Sốt Dầu Ớt (8 cái)",
        description:
          "Hoành thánh nhân thịt heo rưới dầu ớt, nước tương, tỏi, giấm và tiêu Tứ Xuyên.",
      },
      ko: {
        name: "고추기름 돼지고기 훈툰 (8개)",
        description:
          "돼지고기 소를 넣은 훈툰에 고추기름, 간장, 마늘, 식초, 쓰촨 후추를 더했어요.",
      },
      ja: {
        name: "ラー油ワンタン（豚肉・8個）",
        description:
          "豚肉あんのワンタンを、ラー油・しょうゆ・にんにく・酢・花椒で仕上げました。",
      },
      fa: {
        name: "ووانتون با گوشت خوک در روغن فلفل (۸ عدد)",
        description:
          "ووانتون با مغز گوشت خوک، تزیین‌شده با روغن فلفل، سس سویا، سیر، سرکه و فلفل سیچوآن. ⚠️ حاوی گوشت خوک.",
      },
      hy: {
        name: "Կծու յուղով վոնտոն խոզի մսով (8 հատ)",
        description:
          "Խոզի մսով լցոնված վոնտոնները՝ կծու յուղով, սոյայի սոուսով, սխտորով, քացախով և սիչուանյան պղպեղով։",
      },
      ru: {
        name: "Вонтоны со свининой в чили-масле (8 шт.)",
        description:
          "Вонтоны с начинкой из свинины в чили-масле, с соевым соусом, чесноком, уксусом и сычуаньским перцем.",
      },
    },
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
    translations: {
      es: {
        name: "Dumplings Hervidos de Cerdo y Col China (12 pzs)",
        description:
          "Dumplings hechos a mano, rellenos de carne de cerdo molida, col napa, jengibre y cebollín.",
      },
      "zh-Hant": {
        name: "豬肉大白菜水餃（12隻）",
        description:
          "手工包製水餃，餡料含豬肉末、大白菜、薑與蔥花。",
      },
      tl: {
        name: "Boiled Dumplings na Baboy at Napa Cabbage (12 piraso)",
        description:
          "Hand-wrapped na dumplings na may pamalit na giniling na baboy, napa cabbage, luya at sibuyas-na-mura.",
      },
      vi: {
        name: "Sủi Cảo Heo Cải Thảo Luộc (12 cái)",
        description:
          "Sủi cảo gói tay với nhân thịt heo xay, cải thảo, gừng và hành lá.",
      },
      ko: {
        name: "돼지고기 배추 물만두 (12개)",
        description:
          "돼지고기, 배추, 생강, 쪽파를 넣고 손으로 빚은 물만두예요.",
      },
      ja: {
        name: "豚肉と白菜の水餃子（12個）",
        description:
          "豚ひき肉・白菜・しょうが・ねぎを包んだ、手作りの水餃子です。",
      },
      fa: {
        name: "دامپلینگ آب‌پز با گوشت خوک و کلم چینی (۱۲ عدد)",
        description:
          "دامپلینگ دست‌ساز با مغز گوشت خوک، کلم چینی (نَپا)، زنجبیل و تره. ⚠️ حاوی گوشت خوک.",
      },
      hy: {
        name: "Եփած դամփլինգներ խոզի մսով և չինական կաղամբով (12 հատ)",
        description:
          "Ձեռագործ դամփլինգներ՝ լցոնված խոզի աղացած մսով, նապա-կաղամբով, կոճապղպեղով և կանաչ սոխով։",
      },
      ru: {
        name: "Варёные пельмени со свининой и пекинской капустой (12 шт.)",
        description:
          "Пельмени ручной лепки с фаршем из свинины, пекинской капустой, имбирём и зелёным луком.",
      },
    },
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
    translations: {
      es: {
        name: "Rollo de Res de la Casa",
        description:
          "Tortita de cebollín crujiente enrollada con res estofada en lonchas, salsa hoisin, cebollín y cilantro.",
      },
      "zh-Hant": {
        name: "招牌牛肉捲餅",
        description:
          "酥脆蔥油餅捲入滷牛肉片、海鮮醬、蔥花與香菜。",
      },
      tl: {
        name: "House Beef Roll",
        description:
          "Malutong na scallion pancake na binalot sa hiniwang braised beef, hoisin sauce, sibuyas-na-mura at wansoy.",
      },
      vi: {
        name: "Bánh Cuốn Bò Đặc Biệt",
        description:
          "Bánh hành nướng giòn cuộn thịt bò kho thái lát, sốt hoisin, hành lá và ngò rí.",
      },
      ko: {
        name: "소고기 파전 롤 (하우스 시그니처)",
        description:
          "겹겹이 부친 파전에 간장 조림 소고기, 호이신 소스, 쪽파, 고수를 넣고 말았어요.",
      },
      ja: {
        name: "牛肉ロール（葱餅巻き）",
        description:
          "サクサクのねぎ餅に、煮込み牛肉のスライス・ホイシンソース・ねぎ・パクチーを巻きました。",
      },
      fa: {
        name: "رول گوشت گاو ویژه",
        description:
          "نان لایه‌ای ترد با تره، پیچیده دور گوشت گاو خورشتی برش‌خورده، سس هویسین، تره و گشنیز.",
      },
      hy: {
        name: "Տավարի մսով ֆիրմային ռոլ",
        description:
          "Շերտավոր կանաչ-սոխով նրբաբլիթի մեջ՝ շոգեխաշած տավարի կտորներ, հոյսին սոուս, կանաչ սոխ ու համեմ։",
      },
      ru: {
        name: "Фирменный ролл с говядиной",
        description:
          "Слоёная луковая лепёшка с томлёной говядиной, соусом хойсин, зелёным луком и кинзой.",
      },
    },
  },
  {
    name: "House Cold Cut Beef",
    nameZh: "招牌酱牛肉",
    price: 12.99,
    category: "Appetizers",
    description:
      "Thinly sliced soy-braised beef shank served cold with chili oil, garlic, and scallion.",
    descriptionZh: "卤牛腱薄切凉盘,佐红油、蒜末与葱花。",
    spiceLevel: 1,
    tags: ["beef", "meat", "soy", "spicy", "gluten-free"],
    image: "/menu/house-cold-cut-beef.jpg",
    translations: {
      es: {
        name: "Res Fría Estilo Casa",
        description:
          "Lonchas finas de morcillo de res estofado en soja, servidas frías con aceite de chile, ajo y cebollín.",
      },
      "zh-Hant": {
        name: "招牌醬牛肉",
        description: "滷牛腱薄切涼盤，佐紅油、蒜末與蔥花。",
      },
      tl: {
        name: "House Cold Cut Beef (Soy-Braised)",
        description:
          "Manipis na slice ng soy-braised beef shank na malamig, may chili oil, bawang at sibuyas-na-mura.",
      },
      vi: {
        name: "Bắp Bò Kho Thái Lát Lạnh",
        description:
          "Bắp bò kho nước tương, thái lát mỏng, dùng nguội với dầu ớt, tỏi và hành lá.",
      },
      ko: {
        name: "장조림 소고기 냉채",
        description:
          "간장에 졸인 소사태를 얇게 썰어 차게 내고, 고추기름·다진 마늘·쪽파를 올렸어요.",
      },
      ja: {
        name: "醤油煮込み牛すね肉の冷菜",
        description:
          "醤油で煮込んだ牛すね肉を薄切りにし、ラー油・にんにく・ねぎを添えて冷たく仕上げました。",
      },
      fa: {
        name: "گوشت گاو سرد به سبک ویژه",
        description:
          "ساق گاو پخته‌شده در سس سویا، برش‌های نازک به‌صورت سرد، همراه با روغن فلفل، سیر و تره.",
      },
      hy: {
        name: "Սառը տավարի միս՝ սոյայով եփած",
        description:
          "Սոյայի սոուսում շոգեխաշված տավարի սրունքը՝ բարակ կտրատված, մատուցվում է սառը՝ կծու յուղով, սխտորով և կանաչ սոխով։",
      },
      ru: {
        name: "Холодная говяжья голень в соевом маринаде",
        description:
          "Тонко нарезанная томлёная в соевом соусе говяжья голень, подаётся холодной с чили-маслом, чесноком и зелёным луком.",
      },
    },
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
    translations: {
      es: {
        name: "Fideos Anchos al Aceite de Chile con Res con Hueso",
        description:
          "Fideos anchos hechos a mano con aceite de chile, cebollín, ajo y res estofada con hueso.",
      },
      "zh-Hant": {
        name: "帶骨牛肉紅油寬麵",
        description:
          "手工寬麵淋上紅油、蔥花、蒜末，搭配帶骨滷牛肉。",
      },
      tl: {
        name: "Chili Oil Flat Noodles na may Beef Bone",
        description:
          "Hand-pulled na malapad na noodles na may chili oil, sibuyas-na-mura, bawang at braised beef na may buto.",
      },
      vi: {
        name: "Mì Bản Trộn Dầu Ớt với Bò Hầm Có Xương",
        description:
          "Mì bản kéo tay rưới dầu ớt, hành lá, tỏi cùng thịt bò hầm còn xương.",
      },
      ko: {
        name: "고추기름 칼국수 (뼈 있는 소고기)",
        description:
          "수타 칼국수에 고추기름·쪽파·마늘을 올리고, 뼈째 익힌 간장 조림 소고기를 얹었어요.",
      },
      ja: {
        name: "ラー油きしめん 骨付き牛肉のせ",
        description:
          "手延べの幅広麺に、ラー油・ねぎ・にんにく、そして骨付きの煮込み牛肉をのせました。",
      },
      fa: {
        name: "نودل پهن با روغن فلفل و گوشت گاو با استخوان",
        description:
          "نودل پهن دست‌کش با روغن فلفل، تره، سیر و گوشت گاو خورشتی با استخوان.",
      },
      hy: {
        name: "Լայն լապշա կծու յուղով՝ ոսկորով տավարի մսով",
        description:
          "Ձեռագործ լայն լապշա՝ կծու յուղով, կանաչ սոխով, սխտորով և ոսկորով շոգեխաշված տավարով։",
      },
      ru: {
        name: "Широкая лапша в чили-масле с говядиной на кости",
        description:
          "Широкая лапша ручной вытяжки с чили-маслом, зелёным луком, чесноком и томлёной говядиной на кости.",
      },
    },
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
    translations: {
      es: {
        name: "Fideos Anchos al Aceite de Chile",
        description:
          "Fideos anchos hechos a mano con aceite de chile, salsa de soja, ajo, cebollín y pimienta de Sichuan. Agrega huevo con tomate +$2, carne molida de cerdo +$3, res estofada +$4.",
      },
      "zh-Hant": {
        name: "紅油寬麵",
        description:
          "手工寬麵拌紅油、醬油、蒜末、蔥花與花椒。可加番茄雞蛋 +$2、肉末 +$3、滷牛肉 +$4。",
      },
      tl: {
        name: "Chili Oil Flat Noodles",
        description:
          "Hand-pulled na malapad na noodles na hinaluan ng chili oil, toyo, bawang, sibuyas-na-mura at Sichuan peppercorn. Dagdag: kamatis at itlog +$2, giniling na baboy +$3, braised beef +$4.",
      },
      vi: {
        name: "Mì Bản Trộn Dầu Ớt",
        description:
          "Mì bản kéo tay trộn dầu ớt, nước tương, tỏi, hành lá và tiêu Tứ Xuyên. Thêm trứng cà chua +$2, thịt heo xay +$3, bò kho +$4.",
      },
      ko: {
        name: "고추기름 칼국수 (기본)",
        description:
          "수타 칼국수를 고추기름, 간장, 마늘, 쪽파, 쓰촨 후추에 비볐어요. 토마토 계란 +$2, 다진 돼지고기 +$3, 간장 조림 소고기 +$4 추가 가능.",
      },
      ja: {
        name: "ラー油きしめん（基本）",
        description:
          "手延べの幅広麺を、ラー油・しょうゆ・にんにく・ねぎ・花椒で和えました。トマト卵 +$2、豚ひき肉 +$3、煮込み牛肉 +$4 をトッピングできます。",
      },
      fa: {
        name: "نودل پهن با روغن فلفل",
        description:
          "نودل پهن دست‌کش با روغن فلفل، سس سویا، سیر، تره و فلفل سیچوآن. می‌توانید اضافه کنید: گوجه و تخم‌مرغ ۲ دلار، گوشت چرخ‌کرده خوک ۳ دلار، گوشت گاو خورشتی ۴ دلار.",
      },
      hy: {
        name: "Լայն լապշա կծու յուղով",
        description:
          "Ձեռագործ լայն լապշա՝ կծու յուղով, սոյայի սոուսով, սխտորով, կանաչ սոխով և սիչուանյան պղպեղով։ Կարող եք ավելացնել՝ լոլիկ-ձու +$2, աղացած խոզի միս +$3, շոգեխաշած տավար +$4։",
      },
      ru: {
        name: "Широкая лапша в чили-масле",
        description:
          "Широкая лапша ручной вытяжки с чили-маслом, соевым соусом, чесноком, зелёным луком и сычуаньским перцем. Можно добавить: помидор с яйцом +$2, фарш из свинины +$3, томлёная говядина +$4.",
      },
    },
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
    translations: {
      es: {
        name: "Fideos Má Là con Cerdo Molido",
        description:
          "Fideos con carne de cerdo molida, aceite de chile, pimienta de Sichuan, ajo y cebollín (estilo má là).",
      },
      "zh-Hant": {
        name: "麻辣肉末麵",
        description:
          "麵條拌入肉末、紅油、花椒、蒜末與蔥花，麻辣風味。",
      },
      tl: {
        name: "Má Là Minced Pork Noodles",
        description:
          "Noodles na may giniling na baboy, chili oil, Sichuan peppercorn, bawang at sibuyas-na-mura (má là style — maanghang at numbing).",
      },
      vi: {
        name: "Mì Trộn Thịt Heo Bằm Má Là",
        description:
          "Mì trộn thịt heo bằm, dầu ớt, tiêu Tứ Xuyên, tỏi và hành lá — vị tê cay đặc trưng má là.",
      },
      ko: {
        name: "마라 다진 돼지고기 비빔면",
        description:
          "다진 돼지고기, 고추기름, 쓰촨 후추, 마늘, 쪽파를 면과 함께 비빈 얼얼하고 매콤한 마라 풍 비빔면.",
      },
      ja: {
        name: "麻辣ミンチ豚肉麺",
        description:
          "豚ひき肉・ラー油・花椒・にんにく・ねぎを麺に絡めた、しびれる辛さの麻辣風和え麺。",
      },
      fa: {
        name: "نودل گوشت خوک چرخ‌کرده مالا (تند و بی‌حس‌کننده)",
        description:
          "نودل با گوشت خوک چرخ‌کرده، روغن فلفل، فلفل سیچوآن، سیر و تره — به سبک مالا (تند و گزگز‌کننده). ⚠️ حاوی گوشت خوک.",
      },
      hy: {
        name: "Մալա ոճով կծու լապշա խոզի աղացածով",
        description:
          "Լապշայի հետ՝ խոզի աղացած միս, կծու յուղ, սիչուանյան պղպեղ, սխտոր ու կանաչ սոխ՝ բնորոշ մալայի թմրեցնող-կծու համով։",
      },
      ru: {
        name: "Лапша má là со свиным фаршем",
        description:
          "Лапша с фаршем из свинины, чили-маслом, сычуаньским перцем, чесноком и зелёным луком — фирменное жгуче-онемевающее má là.",
      },
    },
  },
  {
    name: "Braised Pork Belly Noodle",
    nameZh: "红烧五花肉面",
    price: 17.99,
    category: "Dry Noodles",
    description:
      "Noodles topped with soy-braised pork belly, scallions, and bok choy in a light sauce.",
    descriptionZh: "面条搭配红烧五花肉、葱花与青菜,轻汁拌面。",
    spiceLevel: 0,
    tags: ["pork", "meat", "gluten", "soy"],
    image: "/menu/braised-pork-belly-noodle.jpg",
    translations: {
      es: {
        name: "Fideos con Panceta Estofada",
        description:
          "Fideos coronados con panceta de cerdo estofada en soja, cebollín y bok choy en salsa ligera.",
      },
      "zh-Hant": {
        name: "紅燒五花肉麵",
        description:
          "麵條搭配紅燒五花肉、蔥花與青菜，輕汁拌麵。",
      },
      tl: {
        name: "Braised Pork Belly Noodles",
        description:
          "Noodles na may soy-braised pork belly, sibuyas-na-mura at bok choy sa magaang sauce.",
      },
      vi: {
        name: "Mì Thịt Ba Chỉ Kho Tàu",
        description:
          "Mì với thịt heo ba chỉ kho nước tương, hành lá và cải thìa, chan nhẹ nước sốt.",
      },
      ko: {
        name: "삼겹살 간장조림 비빔면",
        description:
          "간장에 졸인 삼겹살을 쪽파, 청경채와 함께 면 위에 얹고 가벼운 소스로 비볐어요.",
      },
      ja: {
        name: "豚バラ醤油煮込み麺",
        description:
          "醤油でじっくり煮込んだ豚バラ肉、ねぎ、青菜を麺にのせ、軽めのタレで仕上げました。",
      },
      fa: {
        name: "نودل با سینه‌پهلوی خوک خورشتی",
        description:
          "نودل با سینه‌پهلوی خوک خورشتی در سس سویا، تره و بوک‌چوی همراه با سس سبک. ⚠️ حاوی گوشت خوک.",
      },
      hy: {
        name: "Լապշա շոգեխաշած խոզի կողով",
        description:
          "Լապշայի վրա՝ սոյայի սոուսում շոգեխաշված խոզի կող, կանաչ սոխ ու բոկ չոյ, թեթև սոուսով։",
      },
      ru: {
        name: "Лапша с томлёной свиной грудинкой",
        description:
          "Лапша с томлёной в соевом соусе свиной грудинкой, зелёным луком и пекинской капустой бок-чой в лёгком соусе.",
      },
    },
  },
  {
    name: "Cumin Onion Lamb Stirred Noodle",
    nameZh: "孜然洋葱羊肉拌面",
    price: 19.99,
    category: "Dry Noodles",
    description:
      "Stir-fried noodles with sliced lamb, onions, cumin, chili, garlic, and scallion.",
    descriptionZh: "炒面配羊肉片、洋葱、孜然、辣椒、蒜末与葱花。",
    spiceLevel: 2,
    tags: ["lamb", "meat", "gluten", "soy", "spicy"],
    image: "/menu/cumin-onion-lamb-noodle.png",
    translations: {
      es: {
        name: "Fideos Salteados con Cordero, Comino y Cebolla",
        description:
          "Fideos salteados con cordero en lonchas, cebolla, comino, chile, ajo y cebollín.",
      },
      "zh-Hant": {
        name: "孜然洋蔥羊肉拌麵",
        description: "炒麵配羊肉片、洋蔥、孜然、辣椒、蒜末與蔥花。",
      },
      tl: {
        name: "Cumin Lamb Noodles (Stirred)",
        description:
          "Inihalong noodles na may slice ng tupa, sibuyas, cumin, chili, bawang at sibuyas-na-mura.",
      },
      vi: {
        name: "Mì Xào Cừu Thì Là Ai Cập (Cumin) và Hành Tây",
        description:
          "Mì xào thịt cừu thái lát, hành tây, cumin, ớt, tỏi và hành lá — phong vị Tân Cương.",
      },
      ko: {
        name: "쯔란 양고기 양파 비빔면 (신장식)",
        description:
          "양고기 슬라이스, 양파, 쯔란(커민), 고추, 마늘, 쪽파를 면과 함께 볶아낸 신장 스타일.",
      },
      ja: {
        name: "羊肉とクミン玉ねぎの和え麺（新疆風）",
        description:
          "羊肉のスライス・玉ねぎ・クミン・唐辛子・にんにく・ねぎを炒め、麺に絡めた新疆スタイル。",
      },
      fa: {
        name: "نودل تفت‌داده با گوسفند، زیره و پیاز",
        description:
          "نودل تفت‌داده با برش‌های گوسفند، پیاز، زیره، فلفل، سیر و تره — به سبک سینکیانگ.",
      },
      hy: {
        name: "Գառան մսով, չաման-պղպեղով և սոխով խառնված լապշա",
        description:
          "Տապակած լապշա՝ գառան մսով, սոխով, չաման-պղպեղով (քյումին), կծու պղպեղով, սխտորով և կանաչ սոխով։",
      },
      ru: {
        name: "Лапша с бараниной, зирой и луком (синьцзянская)",
        description:
          "Жареная лапша с тонко нарезанной бараниной, луком, зирой, чили, чесноком и зелёным луком в синьцзянском стиле.",
      },
    },
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
    translations: {
      es: {
        name: "Fideos con Pollo y Champiñones",
        description:
          "Fideos con pollo en cubitos, champiñones, ajo y cebollín en salsa de soja sabrosa.",
      },
      "zh-Hant": {
        name: "香菇雞丁拌麵",
        description:
          "拌麵搭配雞丁、香菇、蒜末與蔥花，佐醬油底鹹香醬汁。",
      },
      tl: {
        name: "Chicken at Mushroom Tossed Noodles",
        description:
          "Inihalong noodles na may dinikding manok, kabute, bawang at sibuyas-na-mura sa malasang toyo base.",
      },
      vi: {
        name: "Mì Trộn Gà Nấm Đông Cô",
        description:
          "Mì trộn thịt gà xắt hạt lựu, nấm đông cô, tỏi và hành lá trong sốt nước tương đậm vị.",
      },
      ko: {
        name: "표고버섯 닭고기 비빔면",
        description:
          "깍둑썬 닭고기, 표고버섯, 마늘, 쪽파를 간장 베이스 소스에 비빈 비빔면이에요.",
      },
      ja: {
        name: "鶏肉と椎茸の和え麺",
        description:
          "角切りの鶏肉と椎茸、にんにく、ねぎを醤油ベースの旨ダレで麺に和えました。",
      },
      fa: {
        name: "نودل با مرغ مکعبی و قارچ",
        description:
          "نودل مخلوط با مرغ خردشده، قارچ، سیر و تره در سس سویایی پر طعم.",
      },
      hy: {
        name: "Լապշա հավի մսով և սնկով",
        description:
          "Լապշայի մեջ՝ խորանարդիկներով հավի միս, սունկ, սխտոր ու կանաչ սոխ՝ սոյայի համեղ սոուսով։",
      },
      ru: {
        name: "Лапша с курицей и шиитаке",
        description:
          "Лапша с кубиками курицы, грибами шиитаке, чесноком и зелёным луком в насыщенном соевом соусе.",
      },
    },
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
    translations: {
      es: {
        name: "Fideos con Pollo Estofado y Papas",
        description:
          "Fideos coronados con pollo estofado y papas en una salsa fragante de jengibre y soja con cebollín.",
      },
      "zh-Hant": {
        name: "土豆雞塊麵",
        description:
          "麵條搭配燉雞塊與馬鈴薯，佐薑蔥醬油香汁。",
      },
      tl: {
        name: "Chicken at Patatas na Noodles (Big Plate Style)",
        description:
          "Noodles na may nilagang manok at patatas sa pampagana na sarsang luya-toyo at sibuyas-na-mura.",
      },
      vi: {
        name: "Mì Gà Khoai Tây Hầm",
        description:
          "Mì với gà và khoai tây hầm thơm, chan sốt gừng - nước tương và hành lá.",
      },
      ko: {
        name: "감자 닭조림 비빔면",
        description:
          "감자와 함께 졸인 닭고기에 생강 간장 소스와 쪽파를 얹어 면 위에 올렸어요.",
      },
      ja: {
        name: "じゃがいもと鶏肉の煮込み麺",
        description:
          "鶏肉とじゃがいもをじっくり煮込み、しょうがとしょうゆの香り高いタレで麺にのせました。",
      },
      fa: {
        name: "نودل با مرغ و سیب‌زمینی خورشتی",
        description:
          "نودل با مرغ و سیب‌زمینی خورشتی، در سس عطرآگین زنجبیل و سویا با تره.",
      },
      hy: {
        name: "Լապշա շոգեխաշած հավով և կարտոֆիլով",
        description:
          "Լապշայի վրա՝ շոգեխաշված հավ ու կարտոֆիլ՝ բուրավետ կոճապղպեղ-սոյայի սոուսով և կանաչ սոխով։",
      },
      ru: {
        name: "Лапша с тушёной курицей и картофелем",
        description:
          "Лапша с томлёной курицей и картофелем в ароматном соусе из имбиря и сои с зелёным луком.",
      },
    },
  },
  {
    name: "Stew Lamb and Carrots Noodle",
    nameZh: "胡萝卜炖羊肉面",
    price: 18.99,
    category: "Dry Noodles",
    description:
      "Tender stewed lamb with carrots over noodles, finished with ginger, garlic, and scallion.",
    descriptionZh: "炖羊肉与胡萝卜浇面,撒入姜、蒜末与葱花。",
    spiceLevel: 0,
    tags: ["lamb", "meat", "gluten", "soy"],
    image: "/menu/stew-lamb-carrots-noodle.jpg",
    translations: {
      es: {
        name: "Fideos con Cordero Estofado y Zanahoria",
        description:
          "Cordero estofado tierno con zanahoria sobre fideos, terminado con jengibre, ajo y cebollín.",
      },
      "zh-Hant": {
        name: "胡蘿蔔燉羊肉麵",
        description: "燉羊肉與胡蘿蔔澆麵，撒入薑、蒜末與蔥花。",
      },
      tl: {
        name: "Stewed Lamb at Carrots Noodles",
        description:
          "Malambot na nilagang tupa at karot sa ibabaw ng noodles, na may luya, bawang at sibuyas-na-mura.",
      },
      vi: {
        name: "Mì Cừu Hầm Cà Rốt",
        description:
          "Thịt cừu hầm mềm cùng cà rốt phủ trên mì, hoàn thiện với gừng, tỏi và hành lá.",
      },
      ko: {
        name: "당근 양고기 스튜 비빔면",
        description:
          "양고기와 당근을 푹 끓여 면 위에 얹고, 생강·마늘·쪽파로 마무리했어요.",
      },
      ja: {
        name: "ラム肉と人参の煮込み麺",
        description:
          "やわらかく煮込んだラム肉と人参を麺の上にのせ、しょうが・にんにく・ねぎで仕上げました。",
      },
      fa: {
        name: "نودل با خورش گوسفند و هویج",
        description:
          "گوشت گوسفند و هویج با حرارت ملایم خورشتی، روی نودل، در پایان با زنجبیل، سیر و تره معطر می‌شود.",
      },
      hy: {
        name: "Լապշա շոգեխաշած գառով և գազարով",
        description:
          "Մածուցիկ շոգեխաշված գառան միս՝ գազարով, լցված լապշայի վրա, համեմված կոճապղպեղով, սխտորով ու կանաչ սոխով։",
      },
      ru: {
        name: "Лапша с тушёной бараниной и морковью",
        description:
          "Нежная тушёная баранина с морковью поверх лапши, с имбирём, чесноком и зелёным луком.",
      },
    },
  },
  {
    name: "Tomato Egg Noodle",
    nameZh: "番茄鸡蛋面",
    price: 14.99,
    category: "Dry Noodles",
    description:
      "Noodles tossed with stir-fried tomato, scrambled egg, garlic, and scallion.",
    descriptionZh: "面条拌炒番茄、滑蛋、蒜末与葱花。",
    spiceLevel: 0,
    tags: ["vegetarian", "egg", "gluten", "soy", "dairy-free"],
    image: "/menu/tomato-egg-noodle.jpg",
    translations: {
      es: {
        name: "Fideos con Tomate y Huevo",
        description:
          "Fideos con tomate salteado, huevo revuelto, ajo y cebollín — clásico hogareño chino.",
      },
      "zh-Hant": {
        name: "番茄雞蛋麵",
        description: "麵條拌炒番茄、滑蛋、蒜末與蔥花。",
      },
      tl: {
        name: "Tomato Egg Noodles (Klasikong Pamilya)",
        description:
          "Noodles na hinaluan ng igniisang kamatis, scrambled egg, bawang at sibuyas-na-mura — pinaka-comfort food.",
      },
      vi: {
        name: "Mì Trộn Trứng Cà Chua",
        description:
          "Mì trộn cà chua xào, trứng bác, tỏi và hành lá — món gia đình quen thuộc.",
      },
      ko: {
        name: "토마토 계란 비빔면",
        description:
          "볶은 토마토, 부드러운 스크램블드에그, 마늘, 쪽파를 면과 비빈 중국식 가정식 별미.",
      },
      ja: {
        name: "トマトと卵の和え麺",
        description:
          "炒めたトマトとふんわり卵、にんにく、ねぎを麺に絡めた、中華の定番家庭料理。",
      },
      fa: {
        name: "نودل با گوجه و تخم‌مرغ",
        description:
          "نودل با گوجه تفت‌داده، تخم‌مرغ هم‌زده، سیر و تره — یک غذای خانگی محبوب چینی.",
      },
      hy: {
        name: "Լապշա լոլիկով և ձվով",
        description:
          "Լապշայի մեջ՝ տապակած լոլիկ, փափուկ ձու, սխտոր ու կանաչ սոխ — չինական տնային դասական։",
      },
      ru: {
        name: "Лапша с помидором и яичницей",
        description:
          "Лапша с обжаренными помидорами, нежной яичницей-болтуньей, чесноком и зелёным луком — китайский домашний классик.",
      },
    },
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
    translations: {
      es: {
        name: "Sopa de Fideos con Caldo de Hueso de Res (Especial de la Casa)",
        description:
          "Caldo de hueso de res cocido a fuego lento con fideos hechos a mano, res estofada, bok choy y cebollín.",
      },
      "zh-Hant": {
        name: "招牌牛骨湯麵",
        description:
          "慢燉牛骨高湯搭配手工拉麵、滷牛肉、青菜與蔥花。",
      },
      tl: {
        name: "House Special Beef Bone Noodle Soup",
        description:
          "Slow-cooked beef bone broth na may hand-pulled noodles, braised beef, bok choy at sibuyas-na-mura.",
      },
      vi: {
        name: "Mì Nước Xương Bò Đặc Biệt",
        description:
          "Nước dùng xương bò ninh chậm cùng mì kéo tay, thịt bò kho, cải thìa và hành lá.",
      },
      ko: {
        name: "사골 우육탕면 (시그니처)",
        description:
          "오랜 시간 우려낸 사골 육수에 수타면, 간장 조림 소고기, 청경채, 쪽파를 듬뿍.",
      },
      ja: {
        name: "牛骨スープ麺（看板メニュー）",
        description:
          "じっくり煮込んだ牛骨スープに、手延べ麺・煮込み牛肉・青菜・ねぎを合わせました。",
      },
      fa: {
        name: "سوپ نودل با عصاره استخوان گاو (ویژه)",
        description:
          "آب‌گوشت غلیظ از استخوان گاو با حرارت ملایم، همراه با نودل دست‌کش، گوشت گاو خورشتی، بوک‌چوی و تره.",
      },
      hy: {
        name: "Տավարի ոսկորների ապուր լապշայով (ֆիրմային)",
        description:
          "Երկար շոգեխաշված տավարի ոսկորների արգանակ՝ ձեռագործ լապշայով, շոգեխաշած տավարով, բոկ չոյով և կանաչ սոխով։",
      },
      ru: {
        name: "Фирменный суп-лапша на говяжьей кости",
        description:
          "Долго томлёный бульон на говяжьей кости с лапшой ручной вытяжки, томлёной говядиной, бок-чой и зелёным луком.",
      },
    },
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
    translations: {
      es: {
        name: "Sopa de Fideos con Res Estofada (Estilo Taiwanés)",
        description:
          "Res estofada en soja y fideos en caldo aromático con anís estrellado, jengibre y cebollín.",
      },
      "zh-Hant": {
        name: "紅燒牛肉麵",
        description:
          "紅燒牛肉與麵條共煮於濃郁高湯，加入八角、薑片與蔥花。",
      },
      tl: {
        name: "Braised Beef Noodle Soup (Taiwanese style)",
        description:
          "Soy-braised beef at noodles sa malasang aromatic broth na may star anise, luya at sibuyas-na-mura.",
      },
      vi: {
        name: "Mì Bò Kho (Hồng Sao Niu Rou Mian)",
        description:
          "Thịt bò kho nước tương cùng mì trong nước dùng thơm với hồi, gừng và hành lá — phong cách Đài Loan.",
      },
      ko: {
        name: "홍샤오 우육면 (간장 조림 소고기 국수)",
        description:
          "간장에 조린 소고기와 면이 진한 향신 육수(팔각·생강·쪽파) 속에 담긴 대만식 우육면.",
      },
      ja: {
        name: "紅焼牛肉麺（醤油煮込み牛肉麺）",
        description:
          "醤油で煮込んだ牛肉と麺を、八角・しょうが・ねぎの香り高い濃厚スープでいただく台湾風。",
      },
      fa: {
        name: "سوپ نودل با گوشت گاو خورشتی (هونگ‌شائو نیو رو میان)",
        description:
          "گوشت گاو خورشتی در سس سویا و نودل، در عصاره معطر با بادیان، زنجبیل و تره — به سبک تایوانی.",
      },
      hy: {
        name: "Շոգեխաշած տավարի ապուր լապշայով",
        description:
          "Սոյայով շոգեխաշված տավարի միս ու լապշա՝ բուրավետ արգանակում՝ աստղային անիսոնով, կոճապղպեղով և կանաչ սոխով։",
      },
      ru: {
        name: "Суп-лапша с томлёной говядиной (хун-шао)",
        description:
          "Томлёная в соевом соусе говядина и лапша в насыщенном ароматном бульоне со звёздчатым анисом, имбирём и зелёным луком.",
      },
    },
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
    translations: {
      es: {
        name: "Sopa de Fideos con Res y Mostaza Encurtida (Suan Cai)",
        description:
          "Res y fideos en un caldo ácido con verduras chinas encurtidas (suan cai), cebollín y chile.",
      },
      "zh-Hant": {
        name: "酸菜牛肉麵",
        description:
          "牛肉麵浸於酸菜高湯，佐蔥花與辣椒，酸辣開胃。",
      },
      tl: {
        name: "Suan Cai Beef Noodle Soup (Atsarang Mustasa)",
        description:
          "Karne ng baka at noodles sa maasim na sabaw na may Chinese pickled mustard greens (suan cai), sibuyas-na-mura at chili.",
      },
      vi: {
        name: "Mì Bò Dưa Cải Chua (Suan Cai)",
        description:
          "Thịt bò và mì trong nước dùng chua thanh với cải muối Trung Hoa (suan cai), hành lá và ớt.",
      },
      ko: {
        name: "쑤안차이 우육면 (중국식 묵은지 소고기 국수)",
        description:
          "쌉쌀한 산미가 도는 육수에 소고기와 면을 끓이고, 쑤안차이(중국식 갓김치), 쪽파, 고추를 더했어요.",
      },
      ja: {
        name: "酸菜（搾菜風）牛肉麺",
        description:
          "牛肉と麺を、中国の漬け菜（酸菜）と唐辛子の効いた酸味のあるスープで仕上げました。",
      },
      fa: {
        name: "سوپ نودل با گوشت گاو و سبزی ترش چینی (سوآن‌تسای)",
        description:
          "گوشت گاو و نودل در عصاره ترش با سبزی خردل ترشی چینی (سوآن‌تسای)، تره و فلفل — اشتهابرانگیز.",
      },
      hy: {
        name: "Տավարի ապուր թթու չինական մանանեխի կանաչիով (սուան-ցայ)",
        description:
          "Տավարի միս ու լապշա՝ թթվաշ արգանակում՝ չինական թթու դրած մանանեխի կանաչիով (սուան-ցայ), կանաչ սոխով ու կծու պղպեղով։",
      },
      ru: {
        name: "Суп-лапша с говядиной и квашеной горчичной зеленью (суань-цай)",
        description:
          "Говядина и лапша в кисловатом бульоне с китайской квашеной горчичной зеленью суань-цай, зелёным луком и чили.",
      },
    },
  },
  {
    name: "Tomato Beef Noodle Soup",
    nameZh: "番茄牛肉面",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Beef and noodles in a tomato-based broth with stewed tomatoes, ginger, and scallion.",
    descriptionZh: "牛肉面搭配番茄汤底,佐炖番茄、姜片与葱花。",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "/menu/tomato-beef-noodle-soup.jpg",
    translations: {
      es: {
        name: "Sopa de Fideos con Res y Tomate",
        description:
          "Res y fideos en un caldo de tomate con tomates estofados, jengibre y cebollín.",
      },
      "zh-Hant": {
        name: "番茄牛肉麵",
        description: "牛肉麵搭配番茄湯底，佐燉番茄、薑片與蔥花。",
      },
      tl: {
        name: "Tomato Beef Noodle Soup",
        description:
          "Karne ng baka at noodles sa tomato-based broth na may nilagang kamatis, luya at sibuyas-na-mura.",
      },
      vi: {
        name: "Mì Bò Cà Chua",
        description:
          "Thịt bò và mì trong nước dùng cà chua thanh ngọt với cà chua hầm, gừng và hành lá.",
      },
      ko: {
        name: "토마토 우육면",
        description:
          "토마토 베이스 육수에 소고기와 면을 끓이고, 졸인 토마토, 생강, 쪽파로 마무리한 별미.",
      },
      ja: {
        name: "トマト牛肉麺",
        description:
          "牛肉と麺をトマトベースのスープで煮込み、煮詰めたトマト、しょうが、ねぎを添えました。",
      },
      fa: {
        name: "سوپ نودل با گوشت گاو و گوجه‌فرنگی",
        description:
          "گوشت گاو و نودل در عصاره گوجه‌فرنگی با گوجه پخته‌شده، زنجبیل و تره.",
      },
      hy: {
        name: "Տավարի ապուր լոլիկով",
        description:
          "Տավարի միս ու լապշա՝ լոլիկի հիմքով արգանակում՝ շոգեխաշված լոլիկով, կոճապղպեղով ու կանաչ սոխով։",
      },
      ru: {
        name: "Суп-лапша с говядиной и томатами",
        description:
          "Говядина и лапша в томатном бульоне с тушёными помидорами, имбирём и зелёным луком.",
      },
    },
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
    translations: {
      es: {
        name: "Sopa de Fideos con Cordero en Caldo Dorado Agripicante",
        description:
          "Cordero y fideos en un caldo dorado de chiles encurtidos y ají amarillo, ajo y jengibre — agripicante.",
      },
      "zh-Hant": {
        name: "金湯酸辣羊肉麵",
        description:
          "羊肉麵浸於金湯，以泡椒、黃椒、蒜末與薑調味，酸辣鮮香。",
      },
      tl: {
        name: "Golden Sour & Spicy Lamb Noodle Soup",
        description:
          "Tupa at noodles sa kulay-gintong sabaw na may pickled peppers, dilaw na sili, bawang at luya — maasim at maanghang.",
      },
      vi: {
        name: "Mì Cừu Nước Vàng Chua Cay",
        description:
          "Thịt cừu và mì trong nước dùng vàng óng từ ớt muối, ớt vàng kiểu ají amarillo, tỏi và gừng — chua cay đậm đà.",
      },
      ko: {
        name: "황금 새콤매콤 양고기 국수 (진탕 양러우몐)",
        description:
          "노란빛 육수(절임 고추·노란 고추·마늘·생강)에 양고기와 면을 끓여 새콤하고 매콤하게.",
      },
      ja: {
        name: "黄金スープの酸辣ラム麺",
        description:
          "漬け唐辛子・黄色唐辛子・にんにく・しょうがの黄金スープで、ラム肉と麺を酸味と辛味豊かに仕立てました。",
      },
      fa: {
        name: "سوپ نودل گوسفند با عصاره طلایی ترش و تند",
        description:
          "گوسفند و نودل در عصاره طلایی با فلفل ترشی‌شده، فلفل زرد، سیر و زنجبیل — ترش و تند.",
      },
      hy: {
        name: "Ոսկեգույն թթու-կծու գառան ապուր",
        description:
          "Գառան միս ու լապշա՝ ոսկեգույն արգանակում՝ թթու դրած պղպեղով, դեղին պղպեղով, սխտորով ու կոճապղպեղով՝ թթու և կծու։",
      },
      ru: {
        name: "Кисло-острый суп с бараниной в «золотом» бульоне",
        description:
          "Баранина и лапша в золотистом бульоне с маринованным перцем, жёлтым перцем чили, чесноком и имбирём — кисло-остро.",
      },
    },
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
    translations: {
      es: {
        name: "Sopa de Fideos con Tofu Picante de Sichuan",
        description:
          "Tofu sedoso y fideos en caldo má là de Sichuan con aceite de chile, pimienta de Sichuan y cebollín.",
      },
      "zh-Hant": {
        name: "川味麻辣豆腐湯麵",
        description:
          "嫩豆腐與麵條在川式麻辣高湯中，佐紅油、花椒與蔥花。",
      },
      tl: {
        name: "Sichuan Spicy Tofu Noodle Soup",
        description:
          "Malambot na tokwa at noodles sa numbing Sichuan broth na may chili oil, Sichuan peppercorn at sibuyas-na-mura.",
      },
      vi: {
        name: "Mì Đậu Hũ Cay Tê Tứ Xuyên",
        description:
          "Đậu hũ mềm và mì trong nước dùng má là Tứ Xuyên với dầu ớt, tiêu Tứ Xuyên và hành lá.",
      },
      ko: {
        name: "쓰촨식 마라 두부 국수",
        description:
          "쓰촨 마라 육수에 부드러운 두부와 면을 담고 고추기름, 쓰촨 후추, 쪽파로 마무리.",
      },
      ja: {
        name: "四川風麻辣豆腐麺",
        description:
          "絹ごし豆腐と麺を、ラー油・花椒・ねぎを効かせた四川のしびれ辛いスープでいただきます。",
      },
      fa: {
        name: "سوپ نودل با توفو، تند و گزگزکننده به سبک سیچوآن",
        description:
          "توفو ابریشمی و نودل در عصاره مالای سیچوآن با روغن فلفل، فلفل سیچوآن و تره.",
      },
      hy: {
        name: "Սիչուանյան մալա ապուր մետաքսանման տոֆուով",
        description:
          "Մետաքսանման տոֆու ու լապշա՝ սիչուանյան մալա արգանակում՝ կծու յուղով, սիչուանյան պղպեղով և կանաչ սոխով։",
      },
      ru: {
        name: "Сычуаньский má là суп с тофу",
        description:
          "Шелковистый тофу и лапша в жгуче-онемевающем сычуаньском бульоне с чили-маслом, сычуаньским перцем и зелёным луком.",
      },
    },
  },

  {
    name: "Tomato Beef over White Rice",
    nameZh: "番茄牛肉饭",
    price: 16.99,
    category: "Rice",
    description:
      "Stewed beef and tomato over steamed white rice with scallion.",
    descriptionZh: "炖牛肉番茄浇白米饭,撒上葱花。",
    spiceLevel: 0,
    tags: ["beef", "meat", "soy", "gluten-free", "dairy-free"],
    image: "/menu/tomato-beef-rice.jpg",
    translations: {
      es: {
        name: "Arroz con Res y Tomate",
        description:
          "Res estofada con tomate sobre arroz blanco al vapor, terminado con cebollín.",
      },
      "zh-Hant": {
        name: "番茄牛肉飯",
        description: "燉牛肉番茄澆白米飯，撒上蔥花。",
      },
      tl: {
        name: "Tomato Beef sa Kanin",
        description:
          "Nilagang baka at kamatis sa ibabaw ng pinasingawang puting kanin, may sibuyas-na-mura.",
      },
      vi: {
        name: "Cơm Bò Sốt Cà Chua",
        description:
          "Thịt bò và cà chua hầm thơm phủ lên cơm trắng, rắc hành lá.",
      },
      ko: {
        name: "토마토 소고기 덮밥",
        description:
          "토마토와 소고기를 졸여 흰쌀밥 위에 얹고 쪽파를 뿌렸어요.",
      },
      ja: {
        name: "トマト牛肉のせご飯",
        description:
          "煮込んだ牛肉とトマトを白いご飯にのせ、ねぎを散らしました。",
      },
      fa: {
        name: "خورش گوشت گاو و گوجه با برنج سفید",
        description:
          "گوشت گاو و گوجه خورشتی روی برنج سفید بخارپز، تزیین‌شده با تره.",
      },
      hy: {
        name: "Տավարի շոգեխաշ լոլիկով՝ սպիտակ բրնձով",
        description:
          "Շոգեխաշված տավարի միս ու լոլիկ՝ գոլորշու սպիտակ բրնձի վրա, համեմված կանաչ սոխով։",
      },
      ru: {
        name: "Тушёная говядина с томатом на белом рисе",
        description:
          "Тушёная говядина с томатами на пропаренном белом рисе, посыпано зелёным луком.",
      },
    },
  },
  {
    name: "Braised Pork over White Rice",
    nameZh: "卤肉饭",
    price: 16.99,
    category: "Rice",
    description:
      "Soy-braised pork belly over steamed white rice, often with bok choy or pickled vegetables.",
    descriptionZh: "卤五花肉浇白米饭,常配青菜或腌菜。",
    spiceLevel: 0,
    tags: ["pork", "meat", "egg", "soy", "gluten-free", "dairy-free"],
    image: "/menu/braised-pork-rice.png",
    translations: {
      es: {
        name: "Lu Rou Fan — Cerdo Estofado sobre Arroz",
        description:
          "Panceta de cerdo estofada en soja sobre arroz blanco al vapor, a menudo con bok choy o verduras encurtidas.",
      },
      "zh-Hant": {
        name: "滷肉飯",
        description: "滷五花肉澆白米飯，常配青菜或醃菜。",
      },
      tl: {
        name: "Lu Rou Fan — Braised Pork sa Kanin",
        description:
          "Soy-braised pork belly sa ibabaw ng pinasingawang puting kanin, kasama ang bok choy o atchara.",
      },
      vi: {
        name: "Cơm Thịt Heo Kho Tàu (Lỗ Nhục Phạn)",
        description:
          "Thịt heo ba chỉ kho nước tương phủ lên cơm trắng, thường ăn kèm cải thìa hoặc dưa muối — phong vị Đài Loan.",
      },
      ko: {
        name: "루러우판 — 간장 조림 돼지고기 덮밥 (대만식)",
        description:
          "간장에 조린 삼겹살을 흰쌀밥 위에 얹고 청경채나 절임 채소를 곁들인 대만 대표 가정식.",
      },
      ja: {
        name: "魯肉飯（豚バラ醤油煮込みご飯）",
        description:
          "醤油でじっくり煮込んだ豚バラを白いご飯にのせ、青菜や漬物を添えた台湾の定番。",
      },
      fa: {
        name: "لو رو فان — برنج با خورش سینه‌پهلوی خوک",
        description:
          "سینه‌پهلوی خوک خورشتی در سس سویا روی برنج سفید بخارپز، معمولاً همراه با بوک‌چوی یا سبزی‌های ترشی — به سبک تایوانی. ⚠️ حاوی گوشت خوک.",
      },
      hy: {
        name: "Լու-ռոու-ֆան — շոգեխաշած խոզի կող բրնձով",
        description:
          "Սոյայի սոուսում շոգեխաշված խոզի կողը՝ սպիտակ բրնձի վրա, սովորաբար բոկ չոյով կամ թթու դրած բանջարեղենով՝ տայվանյան դասական։",
      },
      ru: {
        name: "Лу-жоу-фань — томлёная свиная грудинка с рисом",
        description:
          "Свиная грудинка, томлёная в соевом соусе, на пропаренном белом рисе — обычно с бок-чой или маринованными овощами. Тайваньский классик.",
      },
    },
  },

  {
    name: "Coffee Meets Milk Tea",
    nameZh: "鸳鸯奶茶",
    price: 6.99,
    category: "Beverages",
    description:
      "Hong Kong–style yuanyang: brewed coffee, black tea, and sweetened condensed or evaporated milk.",
    descriptionZh: "港式鸳鸯:咖啡与红茶相融,加入炼乳或淡奶。",
    spiceLevel: 0,
    tags: ["dairy", "vegetarian", "gluten-free"],
    image: "/menu/coffee-milk-tea.jpg",
    translations: {
      es: {
        name: "Yuanyang — Café con Té con Leche (Estilo Hong Kong)",
        description:
          "Yuanyang al estilo de Hong Kong: café recién hecho, té negro y leche condensada o evaporada.",
      },
      "zh-Hant": {
        name: "鴛鴦奶茶",
        description: "港式鴛鴦：咖啡與紅茶相融，加入煉乳或淡奶。",
      },
      tl: {
        name: "Yuanyang — Coffee Meets Milk Tea (Hong Kong)",
        description:
          "Hong Kong–style yuanyang: kape, itim na tsaa at condensed o evaporated milk.",
      },
      vi: {
        name: "Yuanyang — Cà Phê Hoà Trà Sữa (Hồng Kông)",
        description:
          "Yuanyang kiểu Hồng Kông: cà phê pha, hồng trà và sữa đặc hoặc sữa tươi cô đặc.",
      },
      ko: {
        name: "위안양 — 커피와 밀크티의 만남 (홍콩식)",
        description:
          "홍콩식 위안양: 진하게 우린 커피와 홍차, 그리고 연유 또는 무가당 연유로 부드럽게.",
      },
      ja: {
        name: "鴛鴦茶（香港式コーヒー × ミルクティー）",
        description:
          "香港式の鴛鴦：抽出したコーヒーと紅茶を合わせ、コンデンスミルクまたはエバミルクで仕上げました。",
      },
      fa: {
        name: "یوآن‌یانگ — قهوه و چای شیر هنگ‌کنگی",
        description:
          "یوآن‌یانگ به سبک هنگ‌کنگ: قهوه دم‌کشیده و چای سیاه با شیر سرشار یا تبخیرشده.",
      },
      hy: {
        name: "Յուանյանգ — սուրճ ու կաթնային թեյ (Հոնկոնգյան ոճ)",
        description:
          "Հոնկոնգյան յուանյանգ՝ թարմ եփած սուրճ, սև թեյ և քաղցրացված կամ եռացրած կաթ։",
      },
      ru: {
        name: "Юаньян — кофе с молочным чаем (Гонконг)",
        description:
          "Гонконгский юаньян: свежесваренный кофе, чёрный чай и сгущённое или концентрированное молоко.",
      },
    },
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
    translations: {
      es: {
        name: "Té de Limón Aromático (Hecho a Mano)",
        description:
          "Limón fresco con té de jazmín o té verde y un toque de miel o azúcar.",
      },
      "zh-Hant": {
        name: "手作香水檸檬茶",
        description:
          "鮮檸檬搭配茉莉或綠茶，加入少許蜂蜜或糖調味。",
      },
      tl: {
        name: "Handmade Fragrance Lemon Tea",
        description:
          "Sariwang lemon na sinaluhan ng jasmine o green tea, may konting pulot o asukal.",
      },
      vi: {
        name: "Trà Chanh Hương Thơm (Pha Tay)",
        description:
          "Chanh tươi cùng trà nhài hoặc trà xanh, thêm chút mật ong hoặc đường.",
      },
      ko: {
        name: "수제 레몬티 (자스민/녹차 베이스)",
        description:
          "신선한 레몬에 자스민 또는 녹차를 더하고, 꿀이나 설탕을 약간 가미했어요.",
      },
      ja: {
        name: "手作りレモンティー",
        description:
          "フレッシュレモンに、ジャスミン茶または緑茶を合わせ、はちみつや砂糖を少々。",
      },
      fa: {
        name: "چای لیمو معطر (دست‌ساز)",
        description:
          "لیمو تازه با چای یاس یا چای سبز و کمی عسل یا شکر.",
      },
      hy: {
        name: "Ձեռագործ կիտրոնի թեյ (բուրավետ)",
        description:
          "Թարմ կիտրոն՝ զուգակցված հասմիկի կամ կանաչ թեյի հետ, մի քիչ մեղրով կամ շաքարով։",
      },
      ru: {
        name: "Ароматный лимонный чай (ручной)",
        description:
          "Свежий лимон с жасминовым или зелёным чаем и каплей мёда или сахара.",
      },
    },
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
    translations: {
      es: {
        name: "Agua Mineral con Durazno",
        description: "Agua mineral con sabor a durazno, ligeramente dulce.",
      },
      "zh-Hant": {
        name: "蜜桃氣泡水",
        description: "蜜桃風味氣泡水，清淡微甜。",
      },
      tl: {
        name: "Peach Sparkling Water",
        description:
          "Sparkling water na may konting tamis at amoy ng peach.",
      },
      vi: {
        name: "Nước Có Gas Vị Đào",
        description: "Nước có gas vị đào nhẹ, hơi ngọt thanh.",
      },
      ko: {
        name: "복숭아 스파클링 워터",
        description: "은은한 단맛과 복숭아 향이 어우러진 탄산수.",
      },
      ja: {
        name: "ピーチ・スパークリングウォーター",
        description: "ほんのり甘いピーチ風味の炭酸水。",
      },
      fa: {
        name: "نوشیدنی گازدار با طعم هلو",
        description: "نوشیدنی گازدار با طعم ملایم هلو و کمی شیرینی.",
      },
      hy: {
        name: "Դեղձի համով գազավորված ջուր",
        description: "Թեթևակի քաղցր գազավորված ջուր՝ դեղձի համով։",
      },
      ru: {
        name: "Газированная вода с персиком",
        description: "Газированная вода со слегка сладким персиковым вкусом.",
      },
    },
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
    translations: {
      es: {
        name: "Coca-Cola",
        description: "Coca-Cola clásica, servida bien fría.",
      },
      "zh-Hant": {
        name: "可樂",
        description: "經典可口可樂，冰鎮供應。",
      },
      tl: {
        name: "Coke",
        description: "Klasikong Coca-Cola, malamig na ihinahain.",
      },
      vi: {
        name: "Coca-Cola",
        description: "Coca-Cola cổ điển, phục vụ lạnh.",
      },
      ko: {
        name: "코카콜라",
        description: "차갑게 서빙되는 클래식 코카콜라.",
      },
      ja: {
        name: "コカ・コーラ",
        description: "よく冷えたクラシックなコカ・コーラ。",
      },
      fa: {
        name: "کوکاکولا",
        description: "کوکاکولای کلاسیک، خنک سرو می‌شود.",
      },
      hy: {
        name: "Կոկա-Կոլա",
        description: "Դասական Կոկա-Կոլա՝ սառեցված մատուցումով։",
      },
      ru: {
        name: "Кока-Кола",
        description: "Классическая Coca-Cola, охлаждённая.",
      },
    },
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
    translations: {
      es: {
        name: "Coca-Cola Light",
        description: "Diet Coke sin azúcar, servida bien fría.",
      },
      "zh-Hant": {
        name: "健怡可樂",
        description: "無糖健怡可樂，冰鎮供應。",
      },
      tl: {
        name: "Diet Coke",
        description: "Zero-sugar Diet Coke, malamig na ihinahain.",
      },
      vi: {
        name: "Coca-Cola Diet",
        description: "Diet Coke không đường, phục vụ lạnh.",
      },
      ko: {
        name: "다이어트 코크",
        description: "무가당 다이어트 코크, 차갑게 서빙.",
      },
      ja: {
        name: "ダイエットコーク",
        description: "ノンシュガーのダイエットコーク、よく冷やしてご提供。",
      },
      fa: {
        name: "کوکای رژیمی (دایت کوک)",
        description: "کوکای بدون شکر، خنک سرو می‌شود.",
      },
      hy: {
        name: "Diet Coke (առանց շաքարի)",
        description: "Առանց շաքարի Diet Coke՝ սառեցված։",
      },
      ru: {
        name: "Diet Coke",
        description: "Диетическая Coca-Cola без сахара, охлаждённая.",
      },
    },
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
    translations: {
      es: {
        name: "Sprite",
        description: "Refresco de lima-limón, servido bien frío.",
      },
      "zh-Hant": {
        name: "雪碧",
        description: "清爽檸檬汽水，冰鎮供應。",
      },
      tl: {
        name: "Sprite",
        description: "Sariwang lemon-lime soda, malamig na ihinahain.",
      },
      vi: {
        name: "Sprite",
        description: "Nước ngọt vị chanh-lime, phục vụ lạnh.",
      },
      ko: {
        name: "스프라이트",
        description: "상쾌한 레몬-라임 탄산음료, 차갑게 서빙.",
      },
      ja: {
        name: "スプライト",
        description: "爽やかなレモン・ライム炭酸、よく冷やして。",
      },
      fa: {
        name: "اسپرایت",
        description: "نوشابه گازدار با طعم لیمو-لایم، خنک سرو می‌شود.",
      },
      hy: {
        name: "Sprite",
        description: "Թարմացնող կիտրոնի-լայմի գազավորված ըմպելիք՝ սառեցված։",
      },
      ru: {
        name: "Sprite",
        description: "Освежающая лимонно-лаймовая газировка, охлаждённая.",
      },
    },
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
  lang: Lang,
  autoMap?: Record<string, string>,
): string {
  if (lang === "en") return item.name;
  if (lang === "zh-Hans") {
    if (item.nameZh) return item.nameZh;
    if (item.translations?.["zh-Hans"]?.name)
      return item.translations["zh-Hans"].name as string;
    if (autoMap && autoMap[item.name]) return autoMap[item.name];
    return item.name;
  }
  const tr = item.translations?.[lang]?.name;
  if (tr) return tr;
  if (autoMap && autoMap[item.name]) return autoMap[item.name];
  return item.name;
}

/** Snapshot every translated dish name into a flat map keyed by Lang.
 *  Used at addToCart time so a saved cart line carries its own
 *  translations and doesn't need a menu lookup to render in another
 *  language. */
export function itemNamesForLocales(
  item: MenuItem,
): Partial<Record<Lang, string>> {
  const out: Partial<Record<Lang, string>> = {};
  for (const lang of SUPPORTED_LANGS) {
    if (lang === "en") continue;
    const name = localName(item, lang);
    if (name && name !== item.name) out[lang] = name;
  }
  return out;
}

export function localDescription(
  item: MenuItem,
  lang: Lang,
  autoMap?: Record<string, string>,
): string {
  if (lang === "en") return item.description;
  if (lang === "zh-Hans") {
    if (item.descriptionZh) return item.descriptionZh;
    if (item.translations?.["zh-Hans"]?.description)
      return item.translations["zh-Hans"].description as string;
    if (autoMap && autoMap[item.description]) return autoMap[item.description];
    return item.description;
  }
  const tr = item.translations?.[lang]?.description;
  if (tr) return tr;
  if (autoMap && autoMap[item.description]) return autoMap[item.description];
  return item.description;
}
