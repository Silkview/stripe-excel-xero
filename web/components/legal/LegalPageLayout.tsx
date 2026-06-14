import type { ReactNode } from 'react';
import LandingNav from '@/components/landing/LandingNav';
import Footer from '@/components/landing/Footer';

export type LegalTocItem = {
  href: string;
  label: string;
};

type Props = {
  title: string;
  meta: string;
  toc: LegalTocItem[];
  children: ReactNode;
  eyebrow?: string;
};

export const legalContentClass =
  'legal-content text-[15px] leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pt-12 [&_h2]:border-t [&_h2]:border-rule [&_h2:first-child]:mt-0 [&_h2:first-child]:pt-0 [&_h2:first-child]:border-t-0 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-6 [&_h3]:mb-2.5 [&_p]:text-ink-2 [&_p]:mb-3.5 [&_p]:leading-[1.75] [&_ul]:text-ink-2 [&_ul]:pl-5 [&_ul]:mb-3.5 [&_ol]:text-ink-2 [&_ol]:pl-5 [&_ol]:mb-3.5 [&_li]:mb-1.5 [&_li]:leading-[1.7] [&_a]:text-accent [&_a]:no-underline hover:[&_a]:underline [&_strong]:text-ink [&_strong]:font-medium [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent';

export function LegalWarnBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-[#FDE68A] bg-amber-light px-[22px] py-[18px] mb-5 [&_p]:text-[#7C4A00] [&_p]:mb-0 [&_p]:text-sm [&_p]:leading-snug [&_strong]:text-[#5C3308]">
      {children}
    </div>
  );
}

export function LegalImportantBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-[#FECACA] bg-red-light px-[22px] py-[18px] mb-5 [&_p]:text-[#991B1B] [&_p]:mb-0 [&_p]:text-sm [&_p]:leading-snug">
      {children}
    </div>
  );
}

export function LegalHighlightBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-accent/20 bg-accent-light px-[22px] py-[18px] mb-5 [&_p]:text-ink [&_p]:mb-0 [&_p]:text-sm [&_strong]:text-accent">
      {children}
    </div>
  );
}

export function LegalTable({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'data';
}) {
  return (
    <div className="mb-5 overflow-x-auto">
      <table
        className={`w-full border-collapse text-sm ${
          variant === 'data'
            ? '[&_td]:leading-snug'
            : '[&_tr:hover_td]:bg-bg'
        } [&_th]:bg-bg [&_th]:px-3.5 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-ink-3 [&_th]:border-b [&_th]:border-rule [&_td]:px-3.5 [&_td]:py-3 [&_td]:border-b [&_td]:border-rule [&_td]:text-ink-2 [&_td]:align-top [&_tr:last-child_td]:border-b-0`}
      >
        {children}
      </table>
    </div>
  );
}

export default function LegalPageLayout({
  title,
  meta,
  toc,
  children,
  eyebrow = 'Legal',
}: Props) {
  return (
    <>
      <LandingNav />
      <section className="bg-navy px-5 py-12 text-center sm:px-12 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-white/45 mb-3.5">
          {eyebrow}
        </p>
        <h1 className="text-[clamp(28px,4vw,42px)] font-semibold text-white tracking-tight mb-3">
          {title}
        </h1>
        <p className="text-[13.5px] text-white/50">{meta}</p>
      </section>
      <div className="mx-auto grid max-w-[1040px] grid-cols-1 gap-0 px-5 py-8 sm:px-12 sm:py-14 md:grid-cols-[220px_1fr] md:gap-12">
        <nav
          className="hidden md:block sticky top-20 self-start"
          aria-label="Table of contents"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-3">
            On this page
          </p>
          <div className="space-y-0">
            {toc.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block border-l-2 border-rule py-1.5 pl-3 text-[13px] leading-snug text-ink-3 no-underline transition-colors hover:border-accent hover:text-accent"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
        <div className={legalContentClass}>{children}</div>
      </div>
      <Footer />
    </>
  );
}
