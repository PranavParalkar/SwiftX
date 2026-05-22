import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      <BottomNav />
    </MobileFrame>
  );
}
