"use client";

import { useEffect, useState } from "react";

export type Lang = "en" | "zh";

const STORAGE_KEY = "benu.lang";
const EVENT_NAME = "benu:lang-changed";

const TRANSLATIONS = {
  // App shell / header
  filters: { en: "Filter", zh: "筛选" },
  dietaryFilter: { en: "Dietary Filter", zh: "饮食筛选" },
  flaggingItems: { en: "Flagging items containing", zh: "标记含有" },
  backToStart: { en: "Back to start of menu", zh: "返回菜单开头" },
  language: { en: "Language", zh: "语言" },

  // Categories
  cat_Appetizers: { en: "Appetizers", zh: "前菜" },
  "cat_Dry Noodles": { en: "Dry Noodles", zh: "干拌面" },
  "cat_Noodle Soup": { en: "Noodle Soup", zh: "汤面" },
  cat_Rice: { en: "Rice", zh: "饭" },
  cat_Beverages: { en: "Beverages", zh: "饮品" },

  // Filter sheet
  filterMenuTitle: { en: "Filter menu", zh: "筛选菜单" },
  filterMenuSubtitle: {
    en: "Items containing what you avoid will be flagged.",
    zh: "含有您所规避成分的菜品将被标记。",
  },
  clear: { en: "Clear", zh: "清除" },
  apply: { en: "Apply", zh: "应用" },

  // Allergen / dietary options
  Dairy: { en: "Dairy", zh: "乳制品" },
  Fish: { en: "Fish", zh: "鱼" },
  Gluten: { en: "Gluten", zh: "麸质" },
  Meat: { en: "Meat", zh: "肉类" },
  Nuts: { en: "Nuts", zh: "坚果" },
  Soy: { en: "Soy", zh: "大豆" },

  // Filter option subtitles
  Dairy_desc: { en: "Milk, butter, cheese, cream", zh: "牛奶、黄油、奶酪、奶油" },
  Fish_desc: { en: "Fish and shellfish", zh: "鱼类与贝类" },
  Gluten_desc: { en: "Wheat, barley, rye", zh: "小麦、大麦、黑麦" },
  Meat_desc: { en: "Beef, pork, lamb, poultry", zh: "牛肉、猪肉、羊肉、禽肉" },
  Nuts_desc: { en: "Tree nuts and peanuts", zh: "坚果与花生" },
  Soy_desc: { en: "Soybeans, tofu, soy sauce", zh: "大豆、豆腐、酱油" },

  // Cart
  yourCart: { en: "Your cart", zh: "您的购物车" },
  viewCartCountOne: { en: "View cart · {n} Item", zh: "查看购物车 · {n} 件" },
  viewCartCount: { en: "View cart · {n} Items", zh: "查看购物车 · {n} 件" },
  yourCartEmpty: {
    en: "Your cart is safe...\nCause it's empty",
    zh: "您的购物车很安全…\n因为是空的",
  },
  emptyCart: {
    en: "Add something tasty",
    zh: "来点好吃的吧",
  },
  subtotal: { en: "Subtotal", zh: "小计" },
  total: { en: "Total", zh: "总计" },
  checkout: { en: "Checkout", zh: "结账" },
  remove: { en: "Remove", zh: "移除" },
  cancel: { en: "Cancel", zh: "取消" },
  removeTitle: { en: "Remove this item?", zh: "确定移除该菜品？" },
  removeQuestion: {
    en: "Are you sure you want to remove",
    zh: "您确定要从购物车移除",
  },
  fromCart: { en: "from your cart?", zh: "吗？" },
  selectAll: { en: "Select all", zh: "全选" },
  reset: { en: "Reset", zh: "重置" },
  clearCartTitle: { en: "Clear your cart?", zh: "清空购物车？" },
  clearCartQuestion: {
    en: "This will remove all items from your cart. This can't be undone.",
    zh: "这会清空所有菜品,且无法撤销。",
  },
  clearAll: { en: "Clear all", zh: "全部清空" },
  decreaseQty: { en: "Decrease quantity", zh: "减少数量" },
  increaseQty: { en: "Increase quantity", zh: "增加数量" },
  checkoutComingSoon: {
    en: "Checkout flow coming soon.",
    zh: "结账功能即将推出。",
  },
  sendToKitchen: { en: "Send to kitchen", zh: "送至厨房" },
  orderSent: { en: "Order sent ✓", zh: "订单已送出 ✓" },

  // Kitchen display
  kitchenTitle: { en: "Kitchen — Floor View", zh: "厨房 — 餐厅平面图" },
  noOrders: {
    en: "No orders yet. New orders will appear here.",
    zh: "暂无订单。新订单将显示在这里。",
  },
  tableEmpty: { en: "No active orders", zh: "暂无订单" },
  estTime: { en: "Est.", zh: "预计" },
  floorWindow: { en: "Window", zh: "窗户" },
  floorKitchen: { en: "Kitchen", zh: "厨房" },
  floorEntrance: { en: "Entrance", zh: "入口" },
  dish: { en: "dish", zh: "道菜" },
  dishes: { en: "dishes", zh: "道菜" },
  orderNumber: { en: "Order", zh: "订单" },
  placedAt: { en: "Placed", zh: "下单时间" },
  preferencesLabel: { en: "Customer avoids", zh: "顾客忌口" },
  noteLabel: { en: "Note", zh: "备注" },
  etaLabel: { en: "Est. time (min)", zh: "预计时间（分钟）" },
  etaOverrideLabel: {
    en: "Override ETA (min)",
    zh: "覆盖预计时间（分钟）",
  },
  tableLabel: { en: "Table", zh: "桌号" },
  tableShort: { en: "Tbl", zh: "桌" },
  tableRequired: {
    en: "Please select your table number.",
    zh: "请选择您的桌号。",
  },
  setEta: { en: "Set ETA", zh: "设定时间" },
  statusNew: { en: "New", zh: "新订单" },
  statusCooking: { en: "Cooking", zh: "制作中" },
  statusReady: { en: "Ready", zh: "已完成" },
  startCooking: { en: "Start cooking", zh: "开始制作" },
  markReady: { en: "Mark ready", zh: "标记完成" },
  clearOrder: { en: "Clear", zh: "清除" },
  priorityBadge: { en: "Priority", zh: "优先" },
  waitedShort: { en: "{n}m", zh: "{n}分" },
  waitedMinutes: { en: "Waited {n} minutes", zh: "已等候 {n} 分钟" },
  markPriority: { en: "Mark as priority", zh: "标为优先" },
  unmarkPriority: { en: "Remove priority", zh: "取消优先" },
  busyTimes: { en: "Busy times", zh: "繁忙时段" },
  busyTimesTitle: {
    en: "When are we busiest?",
    zh: "什么时候最繁忙？",
  },
  busyTimesSubtitle: {
    en: "Based on {n} orders in the kitchen archive.",
    zh: "基于厨房归档中的 {n} 笔订单。",
  },
  busyTimesEmpty: {
    en: "No order history yet. Add test data below to see the heatmap in action.",
    zh: "暂无订单历史。可在下方添加测试数据以查看热力图效果。",
  },
  includesTestData: {
    en: "Includes {n} simulated.",
    zh: "包含 {n} 笔模拟订单。",
  },
  addTestData: { en: "Add test data", zh: "添加测试数据" },
  clearTestData: { en: "Clear test data", zh: "清除测试数据" },
  simulating: { en: "Generating…", zh: "生成中…" },
  clearing: { en: "Clearing…", zh: "清除中…" },
  loading: { en: "Loading…", zh: "加载中…" },
  legendLess: { en: "Less", zh: "较少" },
  legendMore: { en: "More", zh: "较多" },
  slotOrderCount: {
    en: "{n} orders in this hour",
    zh: "此时段订单数：{n}",
  },
  slotTopItems: { en: "Top items", zh: "热门菜品" },
  slotNoItemBreakdown: {
    en: "No item breakdown is available for these orders.",
    zh: "此时段订单暂无菜品明细。",
  },
  qty: { en: "Qty", zh: "数量" },
  staffKitchen: { en: "Staff · Kitchen", zh: "员工 · 厨房" },

  // Customer order status page
  orderConfirmedTitle: { en: "Order received!", zh: "订单已收到！" },
  orderConfirmedSubtitle: {
    en: "We've sent it to the kitchen.",
    zh: "已送至厨房。",
  },
  waitingForEta: {
    en: "Waiting for the kitchen to confirm prep time…",
    zh: "正在等待厨房确认制作时间…",
  },
  estimatedReady: { en: "Estimated ready in", zh: "预计完成时间" },
  minutesShort: { en: "min", zh: "分钟" },
  yourOrder: { en: "Your order", zh: "您的订单" },
  orderReadyHeadline: { en: "Your order is ready!", zh: "您的订单已完成！" },
  orderCookingHeadline: {
    en: "The kitchen is on it.",
    zh: "厨房正在制作。",
  },
  orderNotFound: {
    en: "We couldn't find that order on this device.",
    zh: "在此设备上找不到该订单。",
  },
  backToMenu: { en: "Back to menu", zh: "返回菜单" },
  orderAnother: { en: "Order something else", zh: "再来一份" },

  // My orders portal (customer-facing)
  myOrdersTitle: { en: "My orders", zh: "我的订单" },
  myOrdersSubtitle: {
    en: "Orders you've sent to the kitchen from this device.",
    zh: "您从此设备送至厨房的订单。",
  },
  myOrdersEmpty: {
    en: "You haven't sent any orders yet.",
    zh: "您还没有下过订单。",
  },
  viewMyOrders: { en: "View my orders", zh: "查看我的订单" },
  itemsCount_one: { en: "item", zh: "件" },
  itemsCount_other: { en: "items", zh: "件" },
  viewOrder: { en: "View order", zh: "查看订单" },

  // Item detail sheet
  addToCart: { en: "Add to cart", zh: "加入购物车" },
  added: { en: "Added ✓", zh: "已加入 ✓" },
  quantity: { en: "Quantity", zh: "数量" },
  required: { en: "Required", zh: "必选" },
  close: { en: "Close", zh: "关闭" },
  headsUp: {
    en: "Heads up: this item contains",
    zh: "提示：此菜品含有",
  },
  inYourPrefs: {
    en: "which is in your preferences.",
    zh: "属于您的过滤项。",
  },
  containsAllergen: { en: "allergy", zh: "过敏" },
  filteredBadge: { en: "Filtered", zh: "已过滤" },

  // Nutrition & ingredients
  nutrition: { en: "Nutrition", zh: "营养信息" },
  nutritionAndIngredients: {
    en: "Nutrition & Ingredients",
    zh: "营养与原料",
  },
  calories: { en: "Calories", zh: "热量" },
  caloriesUnit: { en: "cal", zh: "千卡" },
  protein: { en: "Protein", zh: "蛋白质" },
  carbs: { en: "Carbs", zh: "碳水" },
  fat: { en: "Fat", zh: "脂肪" },
  sodium: { en: "Sodium", zh: "钠" },
  gramsUnit: { en: "g", zh: "克" },
  milligramsUnit: { en: "mg", zh: "毫克" },
  ingredients: { en: "Ingredients", zh: "原料" },
  nutritionDisclaimer: {
    en: "Estimated values for a regular portion. Add-ons not included.",
    zh: "为正常份量的估算值，不含加料。",
  },

  specialRequest: { en: "Special Request", zh: "特别要求" },
  optional: { en: "Optional", zh: "选填" },
  specialRequestPlaceholder: {
    en: "Allergies, sauce on the side, less salt, etc.",
    zh: "过敏、酱汁单独装、少盐等。",
  },
  inappropriateLanguage: {
    en: "Please remove inappropriate language before adding to cart.",
    zh: "请移除不当用语后再加入购物车。",
  },
  viewCart: { en: "View cart →", zh: "查看购物车 →" },

  // Spice level badges
  mildlySpicy: { en: "Mildly Spicy", zh: "微辣" },
  spicy: { en: "Spicy", zh: "辣" },
  verySpicy: { en: "Very Spicy", zh: "特辣" },

  // Option group labels
  group_spice: { en: "Spice Level", zh: "辣度" },
  group_portion: { en: "Portion", zh: "份量" },
  group_addons: { en: "Add-ons", zh: "加料" },
  group_sweetness: { en: "Sweetness", zh: "甜度" },
  group_ice: { en: "Ice Level", zh: "冰量" },
  group_milk: { en: "Milk", zh: "奶类" },
  group_size: { en: "Size", zh: "大小" },

  // Option choices
  choice_mild: { en: "Mild", zh: "微辣" },
  choice_regular: { en: "Regular", zh: "正常" },
  choice_default: { en: "Regular", zh: "正常" },
  choice_extra: { en: "Extra Spicy", zh: "特辣" },
  choice_large: { en: "Large", zh: "大份" },
  "choice_extra-noodles": { en: "Extra Noodles", zh: "加面" },
  "choice_bok-choy": { en: "Bok Choy", zh: "青菜" },
  "choice_soft-egg": { en: "Soft-Boiled Egg", zh: "溏心蛋" },
  choice_scallion: { en: "Extra Scallion", zh: "加葱" },
  "choice_fried-egg": { en: "Fried Egg", zh: "煎蛋" },
  "choice_extra-rice": { en: "Extra Rice", zh: "加饭" },
  choice_sweetNone: { en: "No Sugar", zh: "无糖" },
  choice_sweetLess: { en: "Less Sweet", zh: "少糖" },
  choice_sweetRegular: { en: "Regular", zh: "标准糖" },
  choice_sweetExtra: { en: "Extra Sweet", zh: "多糖" },
  choice_iceNone: { en: "No Ice", zh: "去冰" },
  choice_iceLess: { en: "Less Ice", zh: "少冰" },
  choice_iceRegular: { en: "Regular Ice", zh: "正常冰" },
  choice_whole: { en: "Whole Milk", zh: "全脂奶" },
  choice_oat: { en: "Oat Milk", zh: "燕麦奶" },
  choice_almond: { en: "Almond Milk", zh: "杏仁奶" },
  choice_skim: { en: "Skim Milk", zh: "脱脂奶" },
  choice_boba: { en: "Tapioca Pearls", zh: "珍珠" },
  "choice_lychee-jelly": { en: "Lychee Jelly", zh: "荔枝果冻" },
  "choice_extra-shot": { en: "Extra Espresso Shot", zh: "加浓缩咖啡" },

  // Cart drawer — pairing suggestions
  pairOneBowl: { en: "Pair a drink with your bowl", zh: "为您的餐点搭配一杯饮品" },
  pairManyBowls: {
    en: "Pair drinks with your {n} bowls",
    zh: "为您的 {n} 份餐点搭配饮品",
  },
  pairCoolsHeat: {
    en: "Cools the heat in your noodles.",
    zh: "为您的辣味餐点降温解辣。",
  },
  pairCrispRefreshing: {
    en: "Crisp and refreshing alongside the meal.",
    zh: "清爽宜人，搭配餐点正合适。",
  },
  pairRoundsOut: {
    en: "Rounds out the meal nicely.",
    zh: "圆满地搭配整顿餐。",
  },
  pairGoesWell: {
    en: "Goes well with what you've picked.",
    zh: "与您所选的菜品很相配。",
  },

  // Cart drawer — totals & errors
  taxLabel: { en: "Tax (9.25%)", zh: "税费 (9.25%)" },
  notePrefix: { en: "Note", zh: "备注" },
  orderSendError: {
    en: "Couldn't reach the kitchen — please try again.",
    zh: "无法连接到厨房 — 请重试。",
  },

  // Menu cards
  soldOutBadge: { en: "Sold out today", zh: "今日售罄" },
  hiddenByFilter: {
    en: "Hidden by your filter: contains",
    zh: "已被您的筛选隐藏：含有",
  },

  // Chat widget
  chatHeaderPrefix: { en: "Ask Benu In", zh: "用任何语言询问 Benu" },
  chatHeaderHighlight: { en: "Any Language", zh: "" },
  chatGreeting: {
    en: "Hi, I'm Benu. Tell me what you are craving, what you avoid, or how hungry you are. I'll help you find the right dish.",
    zh: "您好，我是 Benu。请告诉我您想吃什么、忌口什么、或是有多饿，我会帮您找到合适的菜品。",
  },
  chatProfanity: {
    en: "Let's keep things respectful. Please rephrase your question without slurs or offensive language.",
    zh: "请文明用语。请去除不当或冒犯性语言后重新提问。",
  },
  chatAvoiding: { en: "Avoiding", zh: "忌口" },
  chatContains: { en: "contains", zh: "含有" },
  chatPlaceholder: {
    en: "Let's Find Something You'll Love",
    zh: "为您找到喜爱的菜品",
  },
  chatThinking: { en: "Thinking…", zh: "思考中…" },
  chatSend: { en: "Send", zh: "发送" },
  chatOpenAria: { en: "Open menu assistant", zh: "打开菜单助手" },
  chatHideAria: { en: "Hide chat", zh: "隐藏聊天" },
  chatPanelAria: { en: "Menu assistant", zh: "菜单助手" },
  chatInputAria: { en: "Ask the menu assistant", zh: "向菜单助手提问" },
  chatSendAria: { en: "Send message", zh: "发送消息" },

  // Medical emergency / harm-report response. Covers active distress
  // and incident reports — both demand immediate human escalation.
  // The server picks a localized version based on the message language;
  // these are the EN/ZH variants used as fallback when the client UI
  // language is set explicitly.
  emergencyMessage: {
    en: "🚨 STOP — if there is any medical emergency right now, call 911 (or your local emergency number) immediately. If you or someone with you has had an allergic reaction, get a Shake Shake Fresh Noodle staff member or manager NOW. If an EpiPen is available, use it. Do not eat or drink anything else.\n\nI'm Benu, only a menu assistant — I cannot handle medical situations or incident reports. Please contact emergency services and restaurant management directly.",
    zh: "🚨 请立即停止 — 如果有任何医疗紧急情况，请立刻拨打 120（中国）/ 911（美国）或当地急救电话。如果您或同行人出现过敏反应，请立即找到 Shake Shake Fresh Noodle 工作人员或经理。如有肾上腺素自动注射器（EpiPen），请立即使用。请勿再进食或饮水。\n\n我是 Benu，只是一个菜单助手 — 无法处理医疗情况或事故报告。请直接联系急救服务和餐厅管理人员。",
  },

  // Order-placed confirmation (in cart drawer after sending)
  orderPlacedTitle: { en: "Order placed!", zh: "订单已下！" },
  orderPlacedSubtitle: {
    en: "Show this to your server if needed",
    zh: "如有需要，请向服务员出示此信息",
  },
  orderIdLabel: { en: "Order ID", zh: "订单编号" },
} as const satisfies Record<string, { en: string; zh: string }>;

type TranslationKey = keyof typeof TRANSLATIONS;

let currentLang: Lang = "en";
if (typeof window !== "undefined") {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh") currentLang = saved;
  } catch {
    /* ignore */
  }
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(l: Lang): void {
  currentLang = l;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: l }));
  }
}

export function t(key: TranslationKey | string, lang?: Lang): string {
  const useLang = lang ?? currentLang;
  const entry = (TRANSLATIONS as Record<string, { en: string; zh: string }>)[
    key
  ];
  if (!entry) return key;
  return entry[useLang];
}

const GROUP_LABEL_KEYS: Record<string, string> = {
  "Spice Level": "group_spice",
  Portion: "group_portion",
  "Add-ons": "group_addons",
  Sweetness: "group_sweetness",
  "Ice Level": "group_ice",
  Milk: "group_milk",
  Size: "group_size",
};

const CHOICE_LABEL_KEYS: Record<string, string> = {
  Mild: "choice_mild",
  "Extra Spicy": "choice_extra",
  Large: "choice_large",
  "Extra Noodles": "choice_extra-noodles",
  "Bok Choy": "choice_bok-choy",
  "Soft-Boiled Egg": "choice_soft-egg",
  "Extra Scallion": "choice_scallion",
  "Fried Egg": "choice_fried-egg",
  "Extra Rice": "choice_extra-rice",
  "No Sugar": "choice_sweetNone",
  "Less Sweet": "choice_sweetLess",
  "Extra Sweet": "choice_sweetExtra",
  "No Ice": "choice_iceNone",
  "Less Ice": "choice_iceLess",
  "Regular Ice": "choice_iceRegular",
  "Whole Milk": "choice_whole",
  "Oat Milk": "choice_oat",
  "Almond Milk": "choice_almond",
  "Skim Milk": "choice_skim",
  "Tapioca Pearls": "choice_boba",
  "Lychee Jelly": "choice_lychee-jelly",
  "Extra Espresso Shot": "choice_extra-shot",
};

export function translateGroupLabel(label: string, lang?: Lang): string {
  const key = GROUP_LABEL_KEYS[label];
  return key ? t(key, lang) : label;
}

export function translateChoiceLabel(
  label: string,
  groupLabel: string,
  lang?: Lang,
): string {
  if (label === "Regular") {
    return groupLabel === "Sweetness"
      ? t("choice_sweetRegular", lang)
      : t("choice_regular", lang);
  }
  const key = CHOICE_LABEL_KEYS[label];
  return key ? t(key, lang) : label;
}

/** React hook — returns { t, lang, setLang } and re-renders on language change. */
export function useTranslation() {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(currentLang);
    function onChange(e: Event) {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail === "en" || detail === "zh") setLangState(detail);
    }
    window.addEventListener(EVENT_NAME, onChange);
    return () => window.removeEventListener(EVENT_NAME, onChange);
  }, []);

  return {
    lang,
    t: (key: TranslationKey | string) => t(key, lang),
    setLang: (l: Lang) => setLang(l),
  };
}
