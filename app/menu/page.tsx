import MenuPage from "@/components/MenuPage";
import { MENU } from "@/lib/menu";
import { resolveDishPhotos } from "@/lib/unsplash";

export const revalidate = 60 * 60 * 24 * 7; // 7 days

export default async function Menu() {
  const enriched = await resolveDishPhotos(MENU);
  return <MenuPage menu={enriched} />;
}
