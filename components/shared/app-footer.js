import { cn } from "@/lib/utils/cn";

export default function AppFooter({ className }) {
  return (
    <footer className={cn("border-t border-border px-6 py-6", className)}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-3 text-center text-xs text-muted-foreground/70 sm:text-sm">
        <img
          src="/brand/virtus-sistemas-emblema.png"
          alt="Virtus Sistemas"
          className="h-7 w-7 shrink-0 object-contain invert dark:invert-0"
        />
        <span className="leading-relaxed opacity-80">
          © {new Date().getFullYear()} <span className="font-brand font-extrabold">vPlayCast</span>. Desenvolvido por Virtus
          Sistemas.
        </span>
      </div>
    </footer>
  );
}
