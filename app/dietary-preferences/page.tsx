import DietaryPreferences from "@/components/DietaryPreferences";

export default function DietaryPreferencesPage() {
  const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "our restaurant";
  return <DietaryPreferences brand={brand} />;
}
