export const metadata = { title: "Benu — QR Code Expired" };

export default function QrExpiredPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <p className="font-serif text-5xl text-neutral-900">Benu</p>
      <div className="mt-8 max-w-sm rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
          QR Code Expired
        </p>
        <p className="mt-3 font-serif text-2xl text-neutral-900">
          This code is no longer valid
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          For your security, table QR codes refresh every 15 minutes. Please
          scan the QR code on your table again to place an order.
        </p>
      </div>
    </div>
  );
}
