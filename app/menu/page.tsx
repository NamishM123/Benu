import MenuPage from "@/components/MenuPage";
import { MENU } from "@/lib/menu";
import { resolveDishPhotos } from "@/lib/unsplash";

export const revalidate = 604800; // 7 days, in seconds

export default async function Menu() {
  const enriched = await resolveDishPhotos(MENU);
  return <MenuPage menu={enriched} />;
}
