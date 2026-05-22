import { MobileFrame } from "@/components/MobileFrame";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col p-6">{children}</div>
    </MobileFrame>
  );
}
