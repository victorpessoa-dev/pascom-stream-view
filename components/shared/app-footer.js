import BrandLogo from "@/components/shared/brand-logo";
import { cn } from "@/lib/utils/cn";

export default function AppFooter({ className }) {
  return (
    <footer className={cn("border-t border-border px-6 py-6", className)}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-3 text-center text-xs text-muted-foreground/70 sm:text-sm">
        <BrandLogo markOnly className="h-7 w-7 shrink-0" />
        <span className="leading-relaxed opacity-80">
          © {new Date().getFullYear()} Virtus PlayCast. Todos os direitos
          reservados.
        </span>
      </div>
    </footer>
  );
}
