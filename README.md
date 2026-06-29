<h1 align="center">🛡️ AuditForge</h1>

<p align="center">
  <strong>Универсальный плейбук аудита безопасности для AI-агентов.</strong><br>
  Один <code>.md</code>-файл, который превращает любого кодового агента в дотошного аудитора безопасности.
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0-2ea44f">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="Made for AI agents" src="https://img.shields.io/badge/made%20for-AI%20agents-7c3aed">
  <img alt="Best practices 2026" src="https://img.shields.io/badge/best%20practices-2026-orange">
  <img alt="OWASP Top 10" src="https://img.shields.io/badge/OWASP-Top%2010%20%2B%20API%20Top%2010-d83b01">
  <img alt="OWASP LLM Top 10" src="https://img.shields.io/badge/OWASP-LLM%20Top%2010%20(2025)-9b59b6">
  <img alt="Stack agnostic" src="https://img.shields.io/badge/stack-agnostic-555">
  <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen">
</p>

---

## 💡 Что это

**AuditForge** — это один самодостаточный файл-инструкция [`AUDITFORGE.md`](./AUDITFORGE.md), который вы
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

### Вариант 1. Положить файл в репозиторий проекта (рекомендуется)

1. Скопируйте [`AUDITFORGE.md`](./AUDITFORGE.md) и [`REPORT_TEMPLATE.md`](./REPORT_TEMPLATE.md) в корень
   проекта, который нужно проверить.
2. Откройте проект в своём AI-агенте и дайте ему такой промпт:

   > *Прочитай `AUDITFORGE.md` в этом репозитории и выполни его от начала до конца. Начни с Phase 0 (разведка
   > и threat model), иди по фазам по порядку. До полного понимания системы — только чтение, без правок.
   > Оформи findings по шаблону `REPORT_TEMPLATE.md`, отсортируй по severity, к каждому — точное место,
   > путь эксплуатации и минимальный фикс в виде unified diff. Не запускай динамические тесты против
   > систем, которыми я не владею; спрашивай меня перед любым действием, выходящим за пределы репозитория.
   > Заверши production-readiness gate (§20). Будь дотошным, но минимизируй false positives — у каждого
   > findings должен быть реальный достижимый путь эксплуатации.*

3. Получите `SECURITY_AUDIT_REPORT.md` с уязвимостями и diff-патчами. Применяйте фиксы по приоритету.

### Вариант 2. Без копирования в проект

Откройте проект агентом, вставьте содержимое `AUDITFORGE.md` прямо в чат и добавьте промпт из §21 плейбука
(блок **Quick-start prompt**).

### Вариант 3. Быстрый частичный аудит

Если времени мало — попросите агента пройти только высокоприоритетный набор фаз:
**0 → 1 → 2 → 4 → 5 → 9** (разведка, зависимости, секреты, авторизация, инъекции, rate limit). Агент
обязан явно указать в отчёте, что остальное вне scope.

---

## 🗺️ Что проверяет план (14 фаз)

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

Агент формирует отчёт по [`REPORT_TEMPLATE.md`](./REPORT_TEMPLATE.md):

- executive summary + счётчик находок по severity;
- system overview + честный **coverage** (что проверено, что нет);
- findings, отсортированные по severity, каждый с локацией, путём эксплуатации, severity (+ CVSS для
  High/Critical), маппингом на OWASP/CWE и **готовым `diff`-патчем**;
- приоритизированный план починки (effort × impact);
- финальный production-readiness gate.

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

<sub>AuditForge — это чеклист и навигатор для агента, а не гарантия. Результат аудита — экспертный вход для
решения человека, а не финальный приговор о безопасности.</sub>
