import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const PHONE = "+7 977 875 76 87";
const EMAIL = "termin.info@yandex.ru";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-6">
          <Link to="/" className="font-mono text-sm uppercase tracking-widest">
            Термин
          </Link>
          <nav className="flex gap-4 font-mono text-xs uppercase text-muted-foreground">
            <Link to="/offer" className="transition-colors hover:text-foreground">
              Публичная оферта
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Политика конфиденциальности
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <div className="font-mono text-xs uppercase text-muted-foreground">Дата редакции: {updated}</div>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight">{title}</h1>
        <div className="mt-8 grid gap-8 text-sm leading-relaxed">{children}</div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-3xl flex-wrap justify-between gap-4 px-5 py-6 font-mono text-xs text-muted-foreground">
          <span>© Компания Термин, 2011–2026</span>
          <a href={`tel:${PHONE}`}>{PHONE}</a>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-accent">{heading}</h2>
      <div className="grid gap-3 text-muted-foreground">{children}</div>
    </section>
  );
}
