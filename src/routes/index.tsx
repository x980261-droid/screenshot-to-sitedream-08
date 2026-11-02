import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { DraftingCompass, FolderOpen, Stamp } from "lucide-react";
import { HeroBuilding } from "@/components/HeroBuilding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Термин — строительный контроль и технический аудит" },
      { name: "description", content: "Независимый строительный контроль, технический аудит и экспертиза объектов по СП и ГОСТ с 2011 года." },
      { property: "og:title", content: "Термин — строительный контроль и технический аудит" },
      { property: "og:description", content: "Независимый строительный контроль и аудит по СП и ГОСТ. Оптимизация затрат заказчика." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PHONE = "+7-495-648-62-98";
const EMAIL = "info@termin-audit.ru";

const nav = [
  ["Главная", "#top"],
  ["О компании", "#about"],
  ["Услуги", "#directions"],
  ["Кейсы", "#cases"],
  ["Контакты", "#contacts"],
];

const services = [
  ["Строительный контроль (ИСК 1 категории)", "Постоянное присутствие инженеров на объекте, контроль соответствия проекту, СП и ГОСТ."],
  ["Аудит внутренних инженерных систем (ВИС / ОВиК)", "Проверка вентиляции, отопления, водоснабжения и кондиционирования на всех стадиях."],
  ["Проверка сметной документации и объемов", "Выявление завышений, двойного учета и необоснованных расценок в сметах."],
  ["Инструментальный неразрушающий контроль", "Ультразвуковая проверка бетона, контроль армирования, сварных швов и толщин."],
  ["Судебная строительно-техническая экспертиза", "Заключения для арбитражных и гражданских споров с защитой позиции в суде."],
  ["Приемка в эксплуатацию складов и промзон", "Комплексная оценка готовности объекта и перечень замечаний для подрядчика."],
  ["Проверка исполнительной документации (КС-2, КС-3, КС-14)", "Сверка актов с фактически выполненными объемами и исключение приписок."],
  ["Аудит качества строительно-монтажных работ", "Независимая оценка качества СМР с фотофиксацией и протоколами испытаний."],
  ["Юридическое сопровождение и консалтинг", "Претензионная работа, сопровождение договоров подряда и споров."],
];

const directions = [
  { id: "dir-docs", title: "Верификация строительной документации", text: "Камеральный и финансово-технический анализ смет, договоров подряда и исполнительных актов для подтверждения соответствия фактических и предъявленных объемов строительно-монтажных работ.", items: ["Экспертиза сметной стоимости", "Проверка актов выполненных работ (КС-2, КС-3, КС-14)"] },
  { id: "dir-flats", title: "Экспертиза квартир", text: "Приборный контроль качества отделки, геометрии помещений и инженерных сетей в новостройках перед приемкой.", items: ["Замер отклонений лазерным тахеометром", "Ультразвуковой поиск пустот в монолите", "Инспекция вентиляции и электрики"] },
  { id: "dir-commercial", title: "Инспекция встроенных коммерческих помещений", text: "Технический аудит торговых и офисных площадей на первых этажах зданий и в ТЦ перед покупкой или арендой под ритейл.", items: ["Экспертиза прочности конструктива", "Аудит систем ОВиК и ВИС", "Проверка на соответствие требованиям МЧС"] },
  { id: "dir-houses", title: "Аудит жилых объектов", text: "Технадзор и инструментальный контроль качества строительства коттеджей и загородных домов премиум-класса.", items: ["Инспекция фундаментов и несущих стен", "Тепловизионный аудит", "Проверка кровельных систем"] },
];

const stage0 = [
  {
    icon: DraftingCompass,
    title: "Экспертиза стадии «П» (проектная документация)",
    text: "Проверка на строгое соответствие требованиям Постановления Правительства РФ №87, градостроительным регламентам и техническим условиям.",
  },
  {
    icon: FolderOpen,
    title: "Верификация рабочей документации (РД)",
    text: "Анализ детализированных чертежей, спецификаций и смет на предмет технологических ошибок, завышения объемов СМР и нестыковок между разделами.",
  },
  {
    icon: Stamp,
    title: "Аудит исполнительной документации и актов скрытых работ",
    text: "Сквозная проверка актов освидетельствования скрытых работ (АОСР), результатов лабораторных испытаний материалов и паспортов оборудования, обязательных к передаче заказчику.",
  },
];


const metrics = [
  ["Более 25 лет", "Опыт ведущих инженеров"],
  ["35+", "Инженеров в штате"],
  ["10 000+", "Выявленных строительных дефектов"],
  ["Топ-100", "Крупнейших экспертных компаний"],
];

const clients = [
  ["Розничная логистика", "Распределительные центры и склады класса A", "до 9% экономии бюджета СМР"],
  ["Гидроэнергетика", "ГЭС, гидротехнические сооружения, плотины", "0 аварийных замечаний при приемке"],
  ["Промышленная инфраструктура", "Заводы, производственные корпуса, технопарки", "−12% к итоговой смете"],
];

const cases = [
  ["Экономия 14 млн рублей на аудите трубопровода", "Магистральный трубопровод, Московская обл.", "Выявлено завышение объемов изоляционных работ и замена материалов на неравнозначные аналоги."],
  ["Выявление пустот в несущих пилонах до заливки", "Жилой комплекс, 24 этажа", "Ультразвуковой контроль позволил устранить дефекты армирования до бетонирования перекрытий."],
  ["Исключение приписок в актах КС-2 на 18%", "Логистический комплекс, 62 000 м²", "Сверка исполнительной документации с фактическими объемами по результатам инструментальной съемки."],
];

const news = [
  ["14.10.2026", "Приказ МЧС", "Обновлены требования к системам противодымной вентиляции на складах высотного хранения."],
  ["02.10.2026", "Изменения СП", "Вступила в силу новая редакция СП 70.13330 «Несущие и ограждающие конструкции»."],
  ["21.09.2026", "Поправки ГОСТ", "Уточнены методы ультразвукового контроля прочности бетона по ГОСТ 17624."],
];

function SectionHead({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-10 flex items-end gap-4 border-b pb-4">
      <span className="font-mono text-sm text-primary">{index}</span>
      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
    </div>
  );
}

const btn = "inline-flex items-center justify-center bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/85";

function Index() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div id="top" className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4">
          <a href="#top" className="leading-none">
            <div className="text-xl font-bold tracking-[0.2em]">ТЕРМИН</div>
          </a>


          <nav className="hidden gap-6 text-sm lg:flex">
            {nav.map(([l, h]) => (
              <a key={h} href={h} className="text-muted-foreground transition-colors hover:text-foreground">{l}</a>
            ))}
          </nav>
          <div className="hidden text-right font-mono text-xs xl:block">
            <a href={`tel:${PHONE}`} className="block text-foreground">{PHONE}</a>
            <a href={`mailto:${EMAIL}`} className="block text-muted-foreground">{EMAIL}</a>
          </div>
          <a href="#request" className={btn}>Оставить заявку</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-blueprint">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <HeroBuilding />
        </div>
        <div className="pointer-events-none relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <div style={{ transform: "translateY(-73px)" }} className="mb-6 inline-flex items-center gap-2 border border-safe/40 px-3 py-1 font-mono text-xs text-safe">
              ● НЕЗАВИСИМЫЙ ИНЖЕНЕРНЫЙ КОНТРОЛЬ
            </div>
            <h1 style={{ transform: "translateY(-85px)" }} className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Технический аудит и строительный контроль
            </h1>
            <div style={{ transform: "translate(901px, 192px)" }} className="pointer-events-auto mt-8 flex flex-wrap gap-4">
              <a href="#request" className={btn}>Заказать услугу</a>
              <a href="#directions" className="inline-flex items-center border px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors hover:border-foreground">
                Все услуги
              </a>
            </div>
            <p style={{ transform: "translateY(100%)" }} className="mt-6 max-w-xl text-lg text-muted-foreground">
              Контролируем каждый этап строительства на соответствие СП и ГОСТ, исключаем скрытые дефекты и
              оптимизируем затраты заказчика без потери качества.
            </p>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
          {metrics.map(([v, l]) => (
            <div key={l} className="border-r p-8 last:border-r-0">
              <div className="text-4xl font-bold tracking-tight md:text-5xl">{v}</div>
              <div className="mt-2 text-sm text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-7xl px-5 py-24">
        <SectionHead index="01" title="О компании" />
        <div className="grid gap-10 md:grid-cols-2">
          <p className="text-2xl font-medium leading-snug">
            «Термин» — независимая группа технического надзора, которая защищает интересы заказчиков
            на объектах промышленного, складского и гражданского строительства.
          </p>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Мы не связаны с подрядчиками и проектировщиками, поэтому наши заключения объективны. Инженеры компании
              проводят ультразвуковой контроль бетона, проверяют армирование, сварные соединения и геометрию конструкций.
            </p>
            <p>
              Отдельное направление — верификация инженерных и механических систем: от вентиляции и отопления до
              технологических трубопроводов. Каждое замечание подтверждается протоколом и фотофиксацией.
            </p>
          </div>
        </div>
      </section>


      {/* Directions */}
      <section id="directions" className="scroll-mt-20 border-t bg-blueprint">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <SectionHead index="02" title="Основные направления деятельности" />
          <div className="mb-8 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-safe">
            <span className="inline-block h-2 w-2 bg-safe" />
            Проверки до начала инструментального контроля
          </div>
          <div className="mb-16">
            <div className="border bg-card">
              <div className="border-b px-8 py-8">
                <p className="mb-3 text-lg font-bold leading-tight tracking-tight md:text-[22.5px]">
                  Этап 0 — Предварительная экспертиза и верификация исходных данных
                </p>
                <h3 className="max-w-3xl text-lg font-bold leading-tight tracking-tight md:text-[22.5px]">
                  Входной аудит и экспертиза проектно-сметной документации
                </h3>
                <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
                  До выезда инженеров на объект эксперты компании «Термин» проводят детальный анализ
                  исходно-разрешительной и технической документации, которую застройщик обязан предоставить заказчику.
                </p>
              </div>
              <div className="grid md:grid-cols-3">
                {stage0.map((s, i) => (
                  <div key={s.title} className="relative border-b px-8 py-8 md:border-r md:border-b-0 md:last:border-r-0">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center border border-safe/40 text-safe">
                        <s.icon size={22} strokeWidth={1.5} />
                      </div>
                      <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h4 className="mt-6 text-lg font-semibold leading-snug">{s.title}</h4>
                    <p className="mt-3 text-sm text-muted-foreground">{s.text}</p>
                  </div>
                ))}
              </div>
              <a href="#directions" className="group flex items-center justify-between border-t px-8 py-5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-safe">
                <span>Результат этапа 0 — основа для выбора направления контроля</span>
                <span className="transition-transform group-hover:translate-x-1">К четырем направлениям →</span>
              </a>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {directions.map((d, i) => (
              <article key={d.id} id={d.id} className="relative flex scroll-mt-24 flex-col border bg-card p-8 transition-colors hover:border-safe/60">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-safe shadow-safe" />
                <div className="font-mono text-sm text-safe">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-5 text-2xl font-bold leading-tight">{d.title}</h3>
                <p className="mt-4 text-sm text-muted-foreground">{d.text}</p>
                <ul className="mt-6 space-y-3 border-t pt-6 text-sm">
                  {d.items.map((it) => (
                    <li key={it} className="flex gap-3"><span className="text-safe">—</span><span>{it}</span></li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-t bg-card">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <SectionHead index="03" title="Специализированные экспертные практики" />
          <div className="grid border-l border-t sm:grid-cols-2 lg:grid-cols-3">
            {services.map(([t, d], i) => (
              <div key={t} className="group border-b border-r p-8 transition-colors hover:bg-muted">
                <div className="font-mono text-sm text-primary">[{String(i + 1).padStart(2, "0")}]</div>
                <h3 className="mt-4 text-lg font-semibold leading-snug">{t}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request */}
      <section id="request" className="border-t bg-blueprint">
        <div className="mx-auto max-w-2xl px-5 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Оставить заявку</h2>
          <p className="mt-4 text-muted-foreground">Инженер свяжется с вами в течение рабочего дня и предложит формат проверки.</p>
          {sent ? (
            <div className="mt-10 border-2 border-safe p-8 shadow-safe">
              <div className="font-semibold">Запрос принят.</div>
              <div className="mt-1 text-sm text-muted-foreground">Мы свяжемся с вами в ближайшее время.</div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-10 grid gap-4 text-left">
              {[
                ["name", "Имя", "text"],
                ["phone", "Телефон", "tel"],
                ["object", "Объект", "text"],
              ].map(([n, l, type]) => (
                <label key={n} className="block">
                  <span className="mb-2 block font-mono text-xs uppercase text-muted-foreground">{l}</span>
                  <input required name={n} type={type} maxLength={120}
                    className="w-full border bg-card px-4 py-3 outline-none transition-colors focus:border-safe" />
                </label>
              ))}
              <button type="submit" className={`${btn} mt-2 w-full`}>Отправить запрос</button>
            </form>
          )}
        </div>
      </section>

      {/* Clients */}
      <section className="mx-auto max-w-7xl px-5 py-24">
        <SectionHead index="04" title="Клиенты и доверие" />
        <div className="grid gap-px border bg-border md:grid-cols-3">
          {clients.map(([t, d, f]) => (
            <div key={t} className="bg-background p-8">
              <h3 className="text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              <div className="mt-6 border-t pt-4 font-mono text-sm text-safe">{f}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cases */}
      <section id="cases" className="border-t bg-card">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <SectionHead index="05" title="Кейсы и проекты" />
          <div className="grid gap-6 md:grid-cols-3">
            {cases.map(([t, o, d]) => (
              <article key={t} className="flex flex-col border bg-background p-8">
                <div className="font-mono text-xs uppercase text-muted-foreground">{o}</div>
                <h3 className="mt-4 text-2xl font-bold leading-tight">{t}</h3>
                <p className="mt-4 text-sm text-muted-foreground">{d}</p>
                <div className="mt-auto pt-6"><div className="h-0.5 w-12 bg-primary" /></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className="mx-auto max-w-7xl px-5 py-24">
        <SectionHead index="06" title="Отраслевые новости" />
        <div className="grid gap-6 md:grid-cols-3">
          {news.map(([date, tag, t]) => (
            <article key={t} className="border-t-2 border-foreground pt-6">
              <div className="flex justify-between font-mono text-xs text-muted-foreground">
                <span>{date}</span><span className="text-primary">{tag}</span>
              </div>
              <p className="mt-4 font-medium leading-snug">{t}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="contacts" className="border-t bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-4">
          <div>
            <div className="text-xl font-bold tracking-[0.2em]">ТЕРМИН</div>
            <div className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">Строительный контроль и аудит</div>
          </div>
          <div className="text-sm">
            <div className="mb-3 font-mono text-xs uppercase text-muted-foreground">Разделы</div>
            {nav.map(([l, h]) => <a key={h} href={h} className="block py-1 hover:text-safe">{l}</a>)}
          </div>
          <div className="text-sm">
            <div className="mb-3 font-mono text-xs uppercase text-muted-foreground">Контакты</div>
            <a href={`tel:${PHONE}`} className="block py-1">{PHONE}</a>
            <a href={`mailto:${EMAIL}`} className="block py-1">{EMAIL}</a>
            <div className="py-1 text-muted-foreground">Москва, Пн–Пт 9:00–19:00</div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="mb-3 font-mono text-xs uppercase">Сведения</div>
            <p>Член СРО в области строительного контроля. Аккредитованная испытательная лаборатория.</p>
          </div>
        </div>
        <div className="border-t">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-5 py-6 font-mono text-xs text-muted-foreground">
            <span>© Компания Термин, 2011–2026</span>
            <span>Политика конфиденциальности · Согласие на обработку персональных данных</span>
            <span>Информация на сайте не является публичной офертой</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
