"use client";

import { useEffect, useState } from "react";

export type Lang = "en" | "zh";

const STORAGE_KEY = "benu.lang";
const EVENT_NAME = "benu:lang-changed";

const TRANSLATIONS = {
  // App shell / header
  filters: { en: "Filters", zh: "筛选" },
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

  // Cart
  yourCart: { en: "Your cart", zh: "您的购物车" },
  emptyCart: {
    en: "Your cart is empty. Pick something tasty from the menu.",
    zh: "购物车是空的。请从菜单中选购美味菜品。",
  },
  subtotal: { en: "Subtotal", zh: "小计" },
  checkout: { en: "Checkout", zh: "结账" },
  remove: { en: "Remove", zh: "移除" },
  cancel: { en: "Cancel", zh: "取消" },
  removeTitle: { en: "Remove this item?", zh: "确定移除该菜品？" },
  removeQuestion: {
    en: "Are you sure you want to remove",
    zh: "您确定要从购物车移除",
  },
  fromCart: { en: "from your cart?", zh: "吗？" },
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
  choice_extra: { en: "Extra Spicy", zh: "特辣" },
  choice_large: { en: "Large", zh: "大份" },
  "choice_extra-noodles": { en: "Extra Noodles", zh: "加面" },
  "choice_bok-choy": { en: "Bok Choy", zh: "青菜" },
  "choice_soft-egg": { en: "Soft-Boiled Egg", zh: "溏心蛋" },
  choice_scallion: { en: "Extra Scallion", zh: "加葱" },
  "choice_fried-egg": { en: "Fried Egg", zh: "煎蛋" },
  "choice_extra-rice": { en: "Extra Rice", zh: "加饭" },
  choice_none: { en: "No Sugar", zh: "无糖" },
  choice_less: { en: "Less Sweet", zh: "少甜" },
  choice_iceNone: { en: "No Ice", zh: "去冰" },
  choice_iceLess: { en: "Less Ice", zh: "少冰" },
  choice_iceRegular: { en: "Regular Ice", zh: "正常冰" },
  choice_extraSweet: { en: "Extra Sweet", zh: "多甜" },
  choice_whole: { en: "Whole Milk", zh: "全脂奶" },
  choice_oat: { en: "Oat Milk", zh: "燕麦奶" },
  choice_almond: { en: "Almond Milk", zh: "杏仁奶" },
  choice_skim: { en: "Skim Milk", zh: "脱脂奶" },
  choice_boba: { en: "Tapioca Pearls", zh: "珍珠" },
  "choice_lychee-jelly": { en: "Lychee Jelly", zh: "荔枝果冻" },
  "choice_extra-shot": { en: "Extra Espresso Shot", zh: "加浓缩咖啡" },
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
