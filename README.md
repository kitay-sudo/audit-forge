<h1 align="center">🪞 八咫 · Yata</h1>

<p align="center">
  <strong>Универсальный плейбук аудита безопасности для AI-агентов.</strong><br>
  Один <code>.md</code>-файл, который превращает любого кодового агента в дотошного аудитора безопасности.
</p>

<p align="center"><em>Назван в честь <b>Ята-но-Кагами</b> (八咫鏡) — священного зеркала из японской мифологии,
являющего истину. Yata подносит зеркало к твоему коду и показывает, что он скрывает.</em></p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.1-2ea44f">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="Made for AI agents" src="https://img.shields.io/badge/made%20for-AI%20agents-7c3aed">
  <img alt="Best practices 2026" src="https://img.shields.io/badge/best%20practices-2026-orange">
  <img alt="OWASP Top 10" src="https://img.shields.io/badge/OWASP-Top%2010%20%2B%20API%20Top%2010-d83b01">
  <img alt="OWASP LLM Top 10" src="https://img.shields.io/badge/OWASP-LLM%20Top%2010%20(2025)-9b59b6">
  <img alt="Stack agnostic" src="https://img.shields.io/badge/stack-agnostic-555">
  <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen">
</p>

<p align="center">
  <a href="https://kitay-sudo.github.io/yata/"><img alt="Live landing page" src="https://img.shields.io/badge/%F0%9F%AA%9E%20%D0%BB%D0%B5%D0%BD%D0%B4%D0%B8%D0%BD%D0%B3-kitay--sudo.github.io%2Fyata-8b5cf6?style=for-the-badge"></a>
</p>

<p align="center"><b>🪞 Лендинг с анимациями и быстрым стартом → <a href="https://kitay-sudo.github.io/yata/">kitay-sudo.github.io/yata</a></b></p>

---

## 💡 Что это

**Yata** — это один самодостаточный файл-инструкция [`YATA.md`](./YATA.md), который вы
«скармливаете» любому кодовому агенту (Claude Code, Cursor, Codex, Aider, кастомный LLM-харнесс).
Прочитав его, агент последовательно понимает:

- **что за проект** перед ним и **какой стек** он использует (определяется автоматически по файлам-маркерам);
- **как правильно его проверять** и **в каком порядке** идти;
- **какой план аудита** выполнить — от разведки до финального вердикта «можно ли в прод»;
- **что именно искать** — уязвимости по роутам, логические ошибки, валидация входных данных, инъекции,
  работа с БД, подозрительные внешние выходы (почта/вебхуки/3rd-party), уязвимые пакеты и библиотеки,
  утечки секретов, где нужен **rate limit** и устойчивость под нагрузкой;
- **как оформить результат** — отчёт с findings по severity и **готовыми `diff`-патчами** на закрытие
  каждой дыры.

Цель: после одного полного прохода проект может работать в проде без страха быть взломанным, словить утечку
или упасть под нагрузкой.

> ⚠️ **Только для авторизованного аудита.** Файл предназначен для защитной проверки кода, который вам
> разрешено аудитировать (свой проект, проект работодателя, клиент с договором, CTF, исследование с
> разрешением). Подробнее — блок «AUTHORIZATION & SCOPE» в начале плейбука.

---

## 🚀 Как пользоваться

### ⚡ Вариант 1. Боотстрап одной ссылкой (ничего копировать не надо) — рекомендуется

Находясь **внутри проекта**, который нужно проверить, дайте агенту такой промпт:

> *Скачай `https://raw.githubusercontent.com/kitay-sudo/yata/main/YATA.md` и выполни его
> целиком на ЭТОМ репозитории. Создай в корне проекта папку `yata/` и сложи туда полный отчёт и по
> одному применяемому `.diff`-патчу на каждую уязвимость. Остальной репозиторий — только чтение; патчи не
> применяй, пока я не скажу. Спрашивай перед любым действием, выходящим за пределы репозитория.*

Агент сам прочитает плейбук, поймёт стек, проведёт аудит и создаст **самодостаточную папку**:

```
yata/
├── README.md                 ← начни отсюда: вердикт + счётчик severity + ссылки + как применять фиксы
├── SECURITY_AUDIT_REPORT.md  ← полный отчёт
├── findings/                 ← по файлу на каждую проблему
├── fixes/                    ← по .diff на каждую проблему (git apply)
├── route-inventory.md
└── appendix/                 ← сырой вывод инструментов
```

Применить фиксы, когда будете готовы (сначала просмотрите каждый дифф):

```bash
git apply --check yata/fixes/CRIT-01-*.diff   # проверить
git apply yata/fixes/CRIT-01-<slug>.diff       # применить один
```

> Если агент **не умеет качать URL** — откройте raw-ссылку сами, вставьте текст в чат и добавьте:
> *«Выполни этот плейбук на репозитории, результат — в `yata/`.»*

### Вариант 2. Положить файлы в репозиторий проекта

1. Скопируйте [`YATA.md`](./YATA.md) и [`REPORT_TEMPLATE.md`](./REPORT_TEMPLATE.md) в корень
   проекта.
2. Дайте агенту промпт из §24 плейбука (**Quick-start prompt**) — он создаст ту же папку `yata/`.

### Вариант 3. Быстрый частичный аудит

Если времени мало — попросите агента пройти только высокоприоритетный набор фаз:
**0 → 1 → 2 → 4 → 5 → 9** (разведка, зависимости, секреты, авторизация, инъекции, rate limit). Агент
обязан явно указать в отчёте, что остальное вне scope.

---

## 🗺️ Что проверяет план (17 фаз)

| # | Фаза | О чём |
|---|------|-------|
| 0 | Recon & threat model | Что за проект, стек, точки входа, границы доверия, «crown jewels» |
| 1 | Dependencies / supply chain | Уязвимые и вредоносные пакеты, lockfile, typosquatting |
| 2 | Secrets & configuration | Утёкшие секреты, небезопасные дефолты, заголовки, CORS, TLS |
| 3 | Routes & attack surface | Инвентаризация всех точек входа + логические ошибки по роутам, IDOR/BOLA |
| 4 | AuthN & AuthZ | Пароли, сессии, JWT, OAuth, контроль доступа, эскалация привилегий |
| 5 | Input validation & injection | SQLi, XSS, SSRF, RCE, path traversal, десериализация, SSTI, XXE |
| 6 | Business / logic flaws | Race conditions, деньги/количества, обход workflow, идемпотентность |
| 7 | Database layer | Безопасность запросов, least privilege, PII, шифрование, миграции |
| 8 | Data egress / outputs | Почта, вебхуки, 3rd-party/LLM, логи как канал утечки, экспорт данных |
| 9 | Rate limiting & DoS | Где нужны лимиты, защита от исчерпания ресурсов, устойчивость под нагрузкой |
| 10 | Crypto & secrets mgmt | Хеширование, шифрование, случайность, управление ключами |
| 11 | Files & storage | Загрузки, валидация по содержимому, object storage, zip-slip |
| 12 | Client / frontend | XSS, CSP, CSRF, хранение токенов, секреты в бандле |
| 13 | Infra / CI-CD / IaC | Контейнеры, пайплайны, Terraform/K8s, облачные права, сеть |
| 14 | Observability & IR | Логирование безопасности, мониторинг, audit trail, готовность к инцидентам |
| 15 | AI / LLM / agentic *(усл.)* | Prompt injection, RAG/vector, excessive agency, утечка system prompt, cost-DoS — **OWASP LLM Top 10 (2025)** |
| 16 | Mobile *(усл.)* | OWASP MASVS: хранение, сеть, платформа, устойчивость, приватность |
| 17 | Privacy & compliance | Карта потоков PII, retention/удаление, маппинг GDPR / PCI DSS / HIPAA / SOC 2 |

**Условные фазы 15 и 16** запускаются только если в проекте есть AI/LLM/агенты или мобильный клиент.
Каждая фаза имеет цель, конкретные действия и **exit gate**. Финал — **production-readiness gate**:
чёткий вердикт go / go-with-conditions / no-go.

Дополнительно плейбук углубляет supply-chain (SBOM CycloneDX/SPDX, SLSA-provenance, подпись артефактов
через Sigstore/cosign, пиннинг зависимостей и GitHub Actions по SHA) и включает **матрицу OSS-инструментов**
(Semgrep, CodeQL, Trivy, Grype, Gitleaks, TruffleHog, ZAP, Nuclei, Checkov, garak, MobSF).

---

## 📄 Формат вывода

Весь результат складывается в одну папку **`yata/`** в корне проверяемого проекта (остальной
репозиторий агент не трогает). Внутри — отчёт по [`REPORT_TEMPLATE.md`](./REPORT_TEMPLATE.md) и применяемые
патчи:

- `README.md` — индекс: вердикт go/no-go, счётчик находок по severity, таблица «находка → дифф», как применить;
- `SECURITY_AUDIT_REPORT.md` — executive summary, system overview + честный **coverage** (что проверено, что нет);
- `findings/` — findings по severity, каждый с локацией, путём эксплуатации, CVSS (для High/Critical) и
  маппингом на OWASP/CWE;
- `fixes/` — по одному **`.diff`-патчу** на проблему (`git apply`), с единым ID (`CRIT-01`, `HIGH-01`, …);
- `route-inventory.md` + `appendix/` — карта атак-поверхности и сырой вывод инструментов;
- финальный production-readiness gate с приоритизированным планом починки (effort × impact).

---

## 🧰 Поддерживаемые стеки

Файл **стек-агностичный**. Автоопределение и подсказки по инструментам есть для:
Node.js/TS, Python, Go, Java/Kotlin, Ruby/Rails, PHP/Laravel, .NET/C#, Rust, а также Docker/K8s/Terraform.
SCA-сканеры предлагаются под каждую экосистему (`npm audit`, `pip-audit`, `govulncheck`, `osv-scanner`,
`trivy` и др.).

---

## 📚 На чём основан

OWASP Top 10 (2021), OWASP API Security Top 10 (2023), **OWASP Top 10 for LLM Applications (2025)**,
OWASP MASVS (mobile), OWASP ASVS 5.0, OWASP WSTG, Proactive Controls & Cheat Sheets, CWE Top 25,
CIS Benchmarks, NIST SSDF, SLSA (supply chain), MITRE ATT&CK — с поправкой на практики 2026 года.

---

## 🤝 Вклад

PR и идеи приветствуются: новые классы уязвимостей, подсказки под фреймворки, улучшения промптов.
Главное правило — плейбук остаётся **универсальным и читаемым любым агентом**.

---

## 📜 Лицензия

[MIT](./LICENSE) — используйте свободно, в том числе в коммерческих проектах.

<sub>Yata — это чеклист и навигатор для агента, а не гарантия. Результат аудита — экспертный вход для
решения человека, а не финальный приговор о безопасности.</sub>
