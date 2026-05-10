import MenuAdmin from "@/components/MenuAdmin";
import { listMenuItems } from "@/lib/server-menu";

export const metadata = {
  title: "Benu — Menu editor",
};

export const dynamic = "force-dynamic";

export default async function MenuAdminPage() {
  const items = await listMenuItems();
  return <MenuAdmin initialItems={items} />;
}
