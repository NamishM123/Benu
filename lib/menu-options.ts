import type { MenuItem } from "./menu";

export type OptionChoice = {
  id: string;
  label: string;
  priceModifier?: number;
  caloriesModifier?: number;
  warning?: string;
};

export type OptionGroup = {
  id: string;
  label: string;
  type: "single" | "multi";
  required?: boolean;
  defaultChoiceId?: string;
  choices: OptionChoice[];
};

const SPICE_LEVELS: OptionGroup = {
  id: "spice",
  label: "Spice Level",
  type: "single",
  required: true,
  defaultChoiceId: "default",
  choices: [
    { id: "mild", label: "Mild" },
    { id: "default", label: "Regular" },
    { id: "extra", label: "Extra Spicy" },
  ],
};

const PORTION: OptionGroup = {
  id: "portion",
  label: "Portion",
  type: "single",
  required: true,
  defaultChoiceId: "regular",
  choices: [
    { id: "regular", label: "Regular" },
    { id: "large", label: "Large", priceModifier: 3, caloriesModifier: 250 },
  ],
};

const NOODLE_ADDONS: OptionGroup = {
  id: "addons",
  label: "Add-ons",
  type: "multi",
  choices: [
    { id: "extra-noodles", label: "Extra Noodles", priceModifier: 3 },
    { id: "bok-choy", label: "Bok Choy", priceModifier: 2 },
    { id: "soft-egg", label: "Soft-Boiled Egg", priceModifier: 2, warning: "egg" },
    { id: "scallion", label: "Extra Scallion", priceModifier: 0.5 },
  ],
};

const RICE_ADDONS: OptionGroup = {
  id: "addons",
  label: "Add-ons",
  type: "multi",
  choices: [
    { id: "fried-egg", label: "Fried Egg", priceModifier: 2, warning: "egg" },
    { id: "extra-rice", label: "Extra Rice", priceModifier: 2 },
    { id: "bok-choy", label: "Bok Choy", priceModifier: 2 },
  ],
};

const APPETIZER_PORTION: OptionGroup = {
  id: "portion",
  label: "Portion",
  type: "single",
  required: true,
  defaultChoiceId: "regular",
  choices: [
    { id: "regular", label: "Regular" },
    { id: "large", label: "Large", priceModifier: 4, caloriesModifier: 200 },
  ],
};

const TEA_SWEETNESS: OptionGroup = {
  id: "sweetness",
  label: "Sweetness",
  type: "single",
  required: true,
  defaultChoiceId: "regular",
  choices: [
    { id: "none", label: "No Sugar" },
    { id: "less", label: "Less Sweet" },
    { id: "regular", label: "Regular" },
    { id: "extra", label: "Extra Sweet" },
  ],
};

const TEA_ICE: OptionGroup = {
  id: "ice",
  label: "Ice Level",
  type: "single",
  required: true,
  defaultChoiceId: "regular",
  choices: [
    { id: "none", label: "No Ice" },
    { id: "less", label: "Less Ice" },
    { id: "regular", label: "Regular Ice" },
  ],
};

const MILK_TEA_MILK: OptionGroup = {
  id: "milk",
  label: "Milk",
  type: "single",
  required: true,
  defaultChoiceId: "whole",
  choices: [
    { id: "whole", label: "Whole Milk", warning: "dairy" },
    { id: "oat", label: "Oat Milk", priceModifier: 1 },
    { id: "almond", label: "Almond Milk", priceModifier: 1, warning: "nuts" },
    { id: "skim", label: "Skim Milk", warning: "dairy" },
  ],
};

const TEA_ADDONS: OptionGroup = {
  id: "addons",
  label: "Add-ons",
  type: "multi",
  choices: [
    { id: "boba", label: "Tapioca Pearls", priceModifier: 1, caloriesModifier: 80 },
    { id: "lychee-jelly", label: "Lychee Jelly", priceModifier: 1, caloriesModifier: 40 },
    { id: "extra-shot", label: "Extra Espresso Shot", priceModifier: 1.5 },
  ],
};

const DRINK_SIZE: OptionGroup = {
  id: "size",
  label: "Size",
  type: "single",
  required: true,
  defaultChoiceId: "regular",
  choices: [
    { id: "regular", label: "Regular" },
    { id: "large", label: "Large", priceModifier: 1.5, caloriesModifier: 50 },
  ],
};

export function getOptionGroupsForItem(item: MenuItem): OptionGroup[] {
  const groups: OptionGroup[] = [];
  const isSpicy = item.tags.includes("spicy") || item.spiceLevel > 0;

  switch (item.category) {
    case "Dry Noodles":
    case "Noodle Soup":
      if (isSpicy) groups.push(SPICE_LEVELS);
      groups.push(PORTION);
      groups.push(NOODLE_ADDONS);
      break;
    case "Rice":
      groups.push(PORTION);
      groups.push(RICE_ADDONS);
      break;
    case "Appetizers":
      if (isSpicy) groups.push(SPICE_LEVELS);
      groups.push(APPETIZER_PORTION);
      break;
    case "Beverages": {
      const name = item.name.toLowerCase();
      const isSoda =
        name.includes("coke") ||
        name.includes("sprite") ||
        name.includes("sparkling");
      const hasMilk =
        name.includes("milk") || name.includes("latte") || name.includes("matcha");
      if (isSoda) {
        // sodas: just size
        groups.push(DRINK_SIZE);
      } else {
        groups.push(DRINK_SIZE);
        groups.push(TEA_ICE);
        if (hasMilk) groups.push(MILK_TEA_MILK);
        groups.push(TEA_SWEETNESS);
        groups.push(TEA_ADDONS);
      }
      break;
    }
    default:
      break;
  }

  return groups;
}
