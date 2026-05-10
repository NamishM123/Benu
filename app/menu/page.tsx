import MenuPage from "@/components/MenuPage";
import { listMenuItems } from "@/lib/server-menu";
import { resolveDishPhotos } from "@/lib/unsplash";

// Staff edits to the menu must show up immediately, so don't cache the page.
export const dynamic = "force-dynamic";

export default async function Menu() {
  const items = await listMenuItems();
  const enriched = await resolveDishPhotos(items);
  return <MenuPage menu={enriched} />;
}
