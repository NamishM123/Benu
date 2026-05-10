import StaffLoginForm from "@/components/StaffLoginForm";

export const metadata = {
  title: "Benu — Staff sign in",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function StaffLoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return <StaffLoginForm next={next ?? "/kitchen"} />;
}
