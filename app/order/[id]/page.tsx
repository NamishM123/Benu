import OrderStatus from "@/components/OrderStatus";

export const metadata = {
  title: "Benu — Your order",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  return <OrderStatus id={id} />;
}
