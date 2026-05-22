import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function MobileFrame({ children, className }: Props) {
  return (
    <div className="flex min-h-screen items-stretch justify-center bg-neutral-100 dark:bg-neutral-950 sm:py-6">
      <div
        className={cn(
          "relative flex w-full max-w-md flex-col bg-background shadow-xl sm:rounded-3xl sm:overflow-hidden sm:border",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
