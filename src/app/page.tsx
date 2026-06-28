import Image from "next/image";
import { CurrentYear } from "./current-year";
import { NoiseBackground } from "./noise-background";

type LinkItem = {
  label: string;
  href: string;
};

const socialLinks: LinkItem[] = [
  { label: "bsky.app", href: "https://bsky.app/profile/itxryx" },
  { label: "instagram", href: "https://instagram.com/itxryx" },
  { label: "github.com", href: "https://github.com/itxryx" },
  { label: "x.com", href: "https://x.com/itxryx" },
];

function LinkSection({ title, items }: { title: string; items: LinkItem[] }) {
  return (
    <section className="space-y-3 text-center">
      <h2 className="text-lg font-medium">{title}</h2>
      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-base font-medium">
        {items.map((item) => (
          <li key={item.href}>
            <a
              className="relative text-white transition hover:text-white after:absolute after:left-0 after:top-[calc(50%+0.08em)] after:h-px after:w-full after:origin-left after:-translate-y-1/2 after:scale-x-0 after:bg-white after:transition-transform hover:after:scale-x-100"
              href={item.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Profile() {
  return (
    <>
      <Image
        alt="komatsu ryo / itxryx"
        className="size-[clamp(10rem,32vw,14rem)] rounded-full object-cover"
        height={500}
        priority
        sizes="(min-width: 768px) 14rem, 32vw"
        src="/me.jpeg"
        width={500}
      />

      <div className="space-y-2 text-center">
        <p className="text-2xl font-medium text-white">komatsu ryo / itxryx</p>
        <p className="text-base font-normal text-white">Web Engineer</p>
      </div>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="relative z-10 text-center text-xs font-normal text-white/60">
      © <CurrentYear /> komatsu ryo
    </footer>
  );
}

export default function Home() {
  return (
    <main className="isolate relative grid min-h-screen grid-rows-[auto_1fr_auto] justify-items-center bg-[#333] px-6 py-12 text-white">
      <NoiseBackground />

      <h1 className="relative z-10 text-center text-3xl font-bold tracking-wide text-white/95">
        <a href="/">itxryx.com</a>
      </h1>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center justify-center gap-12 py-12">
        <Profile />

        <div className="space-y-10">
          <LinkSection items={socialLinks} title="Social" />
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
