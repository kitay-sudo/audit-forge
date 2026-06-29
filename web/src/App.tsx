import * as React from "react";
import {
  ShieldCheck, GitBranch, Bot, Boxes, Gauge, ScanLine, Lock, Database, Network,
  KeyRound, FileCode, Server, Eye, Workflow, Sparkles, ArrowRight, Copy, Check,
  Github, Menu, Terminal, ListChecks, FileDiff, CircleCheck, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Reveal } from "@/components/Reveal";

const REPO = "https://github.com/kitay-sudo/yata";
const RAW = "https://raw.githubusercontent.com/kitay-sudo/yata/main/YATA.md";
const PROMPT =
  "Скачай " + RAW + " и выполни его целиком на ЭТОМ репозитории. Создай в корне папку yata/ и сложи туда полный отчёт и по одному применяемому .diff-патчу на каждую уязвимость. Остальной код — только чтение; патчи не применяй, пока я не скажу.";

const NAV = [
  { href: "#start", label: "Запуск" },
  { href: "#features", label: "Возможности" },
  { href: "#stack", label: "Стек" },
  { href: "#phases", label: "17 фаз" },
  { href: "#faq", label: "FAQ" },
];

function useCopy() {
  const [copied, setCopied] = React.useState<string | null>(null);
  const copy = React.useCallback((text: string, id: string) => {
    const done = () => {
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1600);
    };
    navigator.clipboard?.writeText(text).then(done).catch(() => {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
      done();
    });
  }, []);
  return { copied, copy };
}

/* ----------------------------- data ----------------------------- */
const features = [
  { icon: ScanLine, title: "Понимает любой проект сам", desc: "Автоопределение стека по файлам-маркерам, карта точек входа, границ доверия и «crown jewels» — прежде чем что-то трогать." },
  { icon: FileDiff, title: "Фиксы как diff, а не советы", desc: "Каждая уязвимость закрывается минимальным unified-diff патчем под git apply — идиоматично коду, без поломки логики." },
  { icon: Bot, title: "AI / LLM безопасность", desc: "OWASP LLM Top 10 (2025): prompt injection, утечка system-prompt, excessive agency, RAG/vector, cost-DoS." },
  { icon: GitBranch, title: "Supply chain 2026", desc: "CVE, SBOM (CycloneDX/SPDX), SLSA-provenance, подпись артефактов, пиннинг зависимостей и actions по SHA." },
  { icon: Gauge, title: "Rate limit и нагрузка", desc: "Где нужны лимиты, защита от исчерпания ресурсов, таймауты — чтобы не упасть под нагрузкой и не словить утечку." },
  { icon: ShieldCheck, title: "Вердикт «можно ли в прод»", desc: "Финальный production-readiness gate: чёткое go / go-with-conditions / no-go по 18 пунктам." },
];

const phases = [
  { n: 0, t: "Recon & threat model", d: "Стек, точки входа, границы доверия, crown jewels", icon: ScanLine },
  { n: 1, t: "Зависимости", d: "CVE, supply chain, typosquatting, SBOM, SLSA", icon: Boxes },
  { n: 2, t: "Секреты и конфиг", d: "Утечки, небезопасные дефолты, заголовки, CORS, TLS", icon: KeyRound },
  { n: 3, t: "Роуты и поверхность", d: "Логика роутов, IDOR/BOLA, mass-assignment", icon: Network },
  { n: 4, t: "AuthN & AuthZ", d: "Пароли, сессии, JWT, OAuth, контроль доступа", icon: Lock },
  { n: 5, t: "Валидация и инъекции", d: "SQLi, XSS, SSRF, RCE, path traversal, SSTI", icon: FileCode },
  { n: 6, t: "Логические ошибки", d: "Race conditions, деньги, обход workflow", icon: Workflow },
  { n: 7, t: "База данных", d: "Запросы, least privilege, PII, шифрование", icon: Database },
  { n: 8, t: "Внешние выходы", d: "Почта, вебхуки, 3rd-party/LLM, утечки в логи", icon: Network },
  { n: 9, t: "Rate limit & DoS", d: "Лимиты, исчерпание ресурсов, устойчивость", icon: Gauge },
  { n: 10, t: "Криптография", d: "Хеши, шифрование, случайность, ключи", icon: KeyRound },
  { n: 11, t: "Файлы и storage", d: "Загрузки, валидация по содержимому, zip-slip, S3", icon: FileCode },
  { n: 12, t: "Frontend", d: "XSS, CSP, CSRF, хранение токенов, секреты в бандле", icon: FileCode },
  { n: 13, t: "Инфра / CI / IaC", d: "Контейнеры, Terraform/K8s, облачные права", icon: Server },
  { n: 14, t: "Observability", d: "Логи, мониторинг, audit trail, инциденты", icon: Eye },
  { n: 15, t: "AI / LLM / agentic", d: "OWASP LLM Top 10 (2025)", icon: Bot, cond: true },
  { n: 16, t: "Mobile / MASVS", d: "Хранение, сеть, платформа, устойчивость", icon: Boxes, cond: true },
  { n: 17, t: "Privacy & compliance", d: "PII, GDPR/PCI/HIPAA/SOC 2, retention", icon: ShieldCheck },
];

const stacks = [
  { v: "node", label: "Node.js", h: "Node.js / TypeScript", markers: ["package.json", "pnpm-lock.yaml"], fw: "express / nestjs / fastify", checks: ["npm/pnpm audit, osv-scanner", "инъекции в ORM / raw SQL", "prototype pollution, SSRF", "express-rate-limit + Redis"] },
  { v: "py", label: "Python", h: "Python", markers: ["pyproject.toml", "poetry.lock"], fw: "django / fastapi / flask", checks: ["pip-audit, bandit", "SQLi в raw queries", "pickle / yaml.load", "slowapi / django-ratelimit"] },
  { v: "go", label: "Go", h: "Go", markers: ["go.mod", "go.sum"], fw: "gin / echo / net/http", checks: ["govulncheck", "SQL injection, SSRF", "race conditions", "context timeouts, лимиты"] },
  { v: "php", label: "PHP", h: "PHP", markers: ["composer.json", "composer.lock"], fw: "laravel / symfony", checks: ["composer audit", "SQLi, XSS, LFI", "небезопасная десериализация", "throttle middleware"] },
  { v: "rust", label: "Rust", h: "Rust", markers: ["Cargo.toml", "Cargo.lock"], fw: "axum / actix", checks: ["cargo audit", "unsafe blocks", "инъекции в sqlx", "tower rate-limit"] },
];

const tools = [
  ["SCA / deps", "osv-scanner · trivy · grype"],
  ["SBOM", "syft · cdxgen · trivy sbom"],
  ["SAST", "semgrep · CodeQL · bandit"],
  ["Secrets", "gitleaks · trufflehog"],
  ["IaC / config", "checkov · tfsec · hadolint"],
  ["Containers", "trivy image · grype"],
  ["DAST", "OWASP ZAP · nuclei"],
  ["LLM / AI", "garak · promptfoo"],
  ["Mobile", "MobSF · apkleaks"],
];

const standards = [
  "OWASP Top 10", "OWASP API Top 10", "OWASP LLM Top 10 (2025)", "MASVS", "ASVS 5.0",
  "WSTG", "CWE Top 25", "CIS Benchmarks", "NIST SSDF", "SLSA", "MITRE ATT&CK",
];

const faqs = [
  { q: "Как это запустить?", a: "Открой свой проект в любом AI-агенте (Claude Code, Cursor, Codex…) и дай ему ссылку на YATA.md с просьбой выполнить плейбук. Агент сам всё скачает, проведёт аудит и создаст папку yata/ с отчётом и патчами. Копировать файлы в проект не нужно." },
  { q: "Какие агенты поддерживаются?", a: "Любые, которые умеют читать файлы репозитория и ходить в интернет за ссылкой. Если агент не умеет качать URL — открой raw-ссылку сам, вставь содержимое в чат и попроси выполнить плейбук." },
  { q: "Это безопасно для моего кода?", a: "Да. По умолчанию агент работает в режиме чтения и пишет результат только в папку yata/. Патчи он не применяет, пока ты явно не попросишь. Динамические тесты — только против сред, которыми ты владеешь." },
  { q: "Что именно я получу на выходе?", a: "Папку yata/ с индексом и вердиктом go/no-go, полным отчётом, находками по severity (с локацией, путём эксплуатации, CVSS, маппингом на OWASP/CWE) и готовыми .diff-патчами под git apply." },
  { q: "Это бесплатно?", a: "Да, проект открыт под лицензией MIT. Используй свободно, в том числе в коммерческих проектах." },
];

/* ----------------------------- sections ----------------------------- */
function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 font-display text-lg font-bold">
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-white via-brand to-brand/40 text-[10px] font-black text-background">鏡</span>
          <span className="font-jp">八咫</span> Yata
        </a>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">{n.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild className="hidden sm:inline-flex">
            <a href={REPO} target="_blank" rel="noopener"><Github /> GitHub</a>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden"><Menu /></Button>
            </SheetTrigger>
            <SheetContent>
              <div className="mt-8 flex flex-col gap-1">
                {NAV.map((n) => (
                  <SheetClose asChild key={n.href}>
                    <a href={n.href} className="rounded-lg px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">{n.label}</a>
                  </SheetClose>
                ))}
                <Button variant="secondary" asChild className="mt-4">
                  <a href={REPO} target="_blank" rel="noopener"><Github /> GitHub</a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Hero({ onCopy, copied }: { onCopy: (t: string, id: string) => void; copied: string | null }) {
  return (
    <section id="top" className="relative overflow-hidden pt-36 pb-20">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-b opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[560px] w-[820px] -translate-x-1/2 rounded-full bg-brand/20 blur-[130px]" />
      <div className="container grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <Reveal>
            <Badge variant="brand" className="px-4 py-1.5 text-[13px]">
              <span className="font-jp font-bold">八咫</span> · плейбук безопасности, который любят агенты
            </Badge>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Аудит безопасности<br />проекта —{" "}
              <span className="bg-gradient-to-r from-brand via-violet-400 to-sky-300 bg-clip-text text-transparent">одной ссылкой.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              <span className="font-semibold text-foreground">Yata</span> превращает любого кодового агента в дотошного аудитора. Он сам поймёт стек, пройдёт <span className="font-semibold text-foreground">17 фаз</span> проверки и закроет дыры <span className="font-semibold text-foreground">готовыми diff-фиксами</span>.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="brand" size="lg" asChild>
                <a href="#start"><Sparkles /> Запустить аудит</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href={REPO} target="_blank" rel="noopener"><Github /> Открыть на GitHub</a>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {[["17", "фаз аудита"], ["1", "ссылка для запуска"], ["∞", "языков и стеков"], ["MIT", "open source"]].map(([a, b]) => (
                <div key={b} className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-foreground">{a}</span>{b}
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* mirror visual */}
        <Reveal delay={160} className="flex justify-center">
          <div className="relative aspect-square w-[min(78vw,400px)] animate-float">
            <div className="absolute inset-0 rounded-full bg-brand/25 blur-[60px]" />
            <div className="absolute inset-0 animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,transparent,hsl(252_90%_66%/.5),transparent_35%,hsl(199_90%_60%/.4),transparent_70%)] opacity-70" />
            <div className="absolute inset-3 rounded-full border border-white/10 bg-background/40 backdrop-blur-sm" />
            <div className="absolute inset-0 rounded-full bg-grid mask-radial opacity-40" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-jp text-[88px] font-black text-foreground/90 drop-shadow-[0_0_30px_hsl(252_90%_66%/.5)]">八咫</span>
            </div>
          </div>
        </Reveal>
      </div>

      {/* bootstrap terminal */}
      <div id="start" className="container mt-20 scroll-mt-24">
        <Reveal>
          <Card className="mx-auto max-w-3xl overflow-hidden bg-card/80 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Terminal className="size-3.5" /> ваш проект — промпт для агента
              </span>
            </div>
            <CardContent className="space-y-1 p-6 font-mono text-[13.5px] leading-relaxed">
              <p className="text-muted-foreground/70"># вставь это любому AI-агенту внутри проекта</p>
              <p>
                <span className="text-brand">$</span> Скачай{" "}
                <span className="text-sky-300">{RAW}</span> и выполни его целиком на ЭТОМ репозитории. Создай в корне папку <span className="text-amber-300">yata/</span> и сложи туда полный отчёт и по одному применяемому <span className="text-emerald-300">.diff</span>-патчу на каждую уязвимость. Остальной код — только чтение; патчи не применяй, пока я не скажу.
              </p>
              <p className="text-muted-foreground/70"># агент сам всё скачает, проведёт аудит и создаст папку yata/</p>
            </CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
              <span className="font-mono text-xs text-muted-foreground">raw.githubusercontent.com/kitay-sudo/yata/main/YATA.md</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => onCopy(RAW, "url")}>
                  {copied === "url" ? <Check /> : <Copy />} Ссылка
                </Button>
                <Button size="sm" variant="brand" onClick={() => onCopy(PROMPT, "prompt")}>
                  {copied === "prompt" ? <Check /> : <Copy />} {copied === "prompt" ? "Скопировано" : "Копировать промпт"}
                </Button>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal><span className="font-display text-sm font-semibold text-brand">{eyebrow}</span></Reveal>
      <Reveal delay={60}><h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2></Reveal>
      {sub && <Reveal delay={120}><p className="mt-4 text-muted-foreground">{sub}</p></Reveal>}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="container scroll-mt-24 py-24">
      <SectionTitle eyebrow="Что внутри" title="Глубина уровня senior AppSec-инженера" sub="Не просто чеклист — операционное руководство, по которому агент работает как опытный пентестер." />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 70}>
            <Card className="group h-full transition-colors hover:border-brand/40 hover:bg-accent/40">
              <CardHeader>
                <div className="mb-2 grid size-11 place-items-center rounded-lg border border-border bg-secondary text-brand transition-colors group-hover:border-brand/40">
                  <f.icon className="size-5" />
                </div>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription className="pt-1 text-[15px]">{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function StackTabs() {
  return (
    <section id="stack" className="container scroll-mt-24 py-24">
      <SectionTitle eyebrow="Универсально" title="Работает с любым стеком" sub="Агент сам определяет язык и фреймворк по файлам-маркерам — и подбирает правильные проверки и инструменты." />
      <Reveal delay={120} className="mt-10">
        <Tabs defaultValue="node" className="flex flex-col items-center">
          <TabsList className="flex-wrap">
            {stacks.map((s) => <TabsTrigger key={s.v} value={s.v}>{s.label}</TabsTrigger>)}
          </TabsList>
          {stacks.map((s) => (
            <TabsContent key={s.v} value={s.v} className="w-full max-w-4xl">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-card/70">
                  <CardContent className="p-6 font-mono text-sm leading-relaxed">
                    <p className="text-muted-foreground/70"># обнаружено</p>
                    {s.markers.map((m) => <p key={m} className="text-foreground">{m}</p>)}
                    <p className="mt-3 text-muted-foreground/70"># фреймворк</p>
                    <p className="text-amber-300">{s.fw}</p>
                  </CardContent>
                </Card>
                <div>
                  <h3 className="font-display text-xl font-semibold">{s.h}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Маркеры {s.markers.join(" / ")}. Агент учитывает встроенную защиту фреймворка.</p>
                  <ul className="mt-4 space-y-2.5">
                    {s.checks.map((c) => (
                      <li key={c} className="flex items-start gap-2.5 text-[15px] text-muted-foreground">
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Reveal>
    </section>
  );
}

function Phases() {
  return (
    <section id="phases" className="container scroll-mt-24 py-24">
      <SectionTitle eyebrow="План аудита" title="17 фаз, по порядку" sub="Каждая фаза — цель, конкретные действия и exit-gate. Наведи на карточку для подсказки. Условные фазы (AI, Mobile) запускаются только если применимы." />
      <TooltipProvider delayDuration={120}>
        <div className="relative mt-12 overflow-hidden rounded-2xl border border-border bg-card/40 p-5 sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
          <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {phases.map((p, i) => (
              <Reveal key={p.n} delay={i * 25}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`group h-full cursor-default rounded-xl border bg-background/60 p-4 transition-all hover:-translate-y-1 hover:border-brand/50 ${p.cond ? "border-amber-500/30" : "border-border"}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-[11px] font-semibold ${p.cond ? "text-amber-400" : "text-brand"}`}>P{p.n}{p.cond ? "·усл" : ""}</span>
                        <p.icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                      </div>
                      <div className="mt-2 text-[13.5px] font-medium leading-snug">{p.t}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px]">{p.d}</TooltipContent>
                </Tooltip>
              </Reveal>
            ))}
          </div>
        </div>
      </TooltipProvider>
    </section>
  );
}

function Standards() {
  return (
    <section className="container py-24">
      <SectionTitle eyebrow="На чём основано" title="Лучшие практики 2026" sub="Свод признанных стандартов индустрии — с поправкой на актуальные угрозы." />
      <Reveal delay={120}>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {standards.map((s) => (
            <Badge key={s} variant="outline" className="border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">{s}</Badge>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function Tooling() {
  return (
    <section className="container py-24">
      <SectionTitle eyebrow="Инструменты" title="Матрица OSS-тулинга" sub="Агент использует то, что уже есть в проекте; иначе — этот бесплатный набор покрывает все слои." />
      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(([tl, tv], i) => (
          <Reveal key={tl} delay={i * 50}>
            <Card className="transition-colors hover:border-brand/40">
              <CardContent className="p-5">
                <div className="font-display text-xs font-semibold uppercase tracking-wide text-brand">{tl}</div>
                <div className="mt-1.5 font-mono text-[13.5px]">{tv}</div>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="container scroll-mt-24 py-24">
      <SectionTitle eyebrow="Вопросы" title="Частые вопросы" />
      <Reveal delay={120} className="mx-auto mt-10 max-w-3xl">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40 mask-radial" />
      <div className="container text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Поднеси зеркало<br />к своему коду.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
            Одна ссылка — и агент покажет всё, что прячет твой проект. Бесплатно, открыто, под MIT.
          </p>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button variant="brand" size="lg" asChild><a href="#start"><Sparkles /> Запустить аудит</a></Button>
            <Button variant="outline" size="lg" asChild><a href={REPO} target="_blank" rel="noopener"><Github /> Star на GitHub</a></Button>
            <Button variant="ghost" size="lg" asChild><a href={`${REPO}/blob/main/YATA.md`} target="_blank" rel="noopener"><BookOpen /> Читать плейбук</a></Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container flex flex-col items-center justify-between gap-6 sm:flex-row">
        <a href="#top" className="flex items-center gap-2.5 font-display font-bold">
          <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-white via-brand to-brand/40 text-[9px] font-black text-background">鏡</span>
          <span className="font-jp">八咫</span> Yata
        </a>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a className="hover:text-foreground" href={REPO} target="_blank" rel="noopener">GitHub</a>
          <a className="hover:text-foreground" href={`${REPO}/blob/main/YATA.md`} target="_blank" rel="noopener">Плейбук</a>
          <a className="hover:text-foreground" href={`${REPO}/blob/main/REPORT_TEMPLATE.md`} target="_blank" rel="noopener">Шаблон отчёта</a>
          <a className="hover:text-foreground" href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noopener">MIT</a>
        </div>
      </div>
      <p className="container mt-8 text-center text-xs text-muted-foreground/70">
        八咫 Yata · универсальный плейбук аудита безопасности для AI-агентов · сделано для эпохи AI-кодинга · 2026
      </p>
    </footer>
  );
}

export default function App() {
  const { copied, copy } = useCopy();
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main>
        <Hero onCopy={copy} copied={copied} />
        <Features />
        <StackTabs />
        <Phases />
        <Standards />
        <Tooling />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
