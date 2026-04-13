export type Language = 'en' | 'ru' | 'uz';

type InternalDict = {
  [key: string]: {
    en: string;
    ru: string;
    uz: string;
  };
};

export const translations: InternalDict = {
  // Navigation & Common
  "nav.home": { en: "Home", ru: "Главная", uz: "Bosh sahifa" },
  "nav.search": { en: "Search & Discover", ru: "Поиск", uz: "Qidiruv" },
  "nav.top": { en: "Top University", ru: "Топ Университеты", uz: "Top Universitetlar" },
  "nav.about": { en: "About Us", ru: "О Нас", uz: "Biz Haqimizda" },
  "nav.students": { en: "For Students", ru: "Студентам", uz: "Talabalar Uchun" },
  "nav.aiStudio": { en: "AI Studio", ru: "AI Studio", uz: "AI Studio" },
  "nav.terms": { en: "Terms of Service", ru: "Условия Использования", uz: "Foydalanish Shartlari" },
  "header.menu.navigation": { en: "Navigation", ru: "Навигация", uz: "Navigatsiya" },
  "header.menu.language": { en: "Language", ru: "Язык", uz: "Til" },
  "header.menu.account": { en: "Account", ru: "Аккаунт", uz: "Hisob" },

  "notfound.badge": { en: "Page not found", ru: "Страница не найдена", uz: "Sahifa topilmadi" },
  "notfound.title": { en: "Nothing lives at this address.", ru: "По этому адресу ничего нет.", uz: "Bu manzilda sahifa yoʻq." },
  "notfound.desc": {
    en: "The link may be broken or the page was removed. Go back home or open search to keep exploring universities.",
    ru: "Ссылка могла устареть или страница удалена. Вернитесь на главную или откройте поиск, чтобы продолжить.",
    uz: "Havola eskirgan yoki sahifa olib tashlangan boʻlishi mumkin. Bosh sahifaga qayting yoki qidiruvni oching.",
  },
  "notfound.home": { en: "Back to home", ru: "На главную", uz: "Bosh sahifa" },
  "notfound.search": { en: "Open search", ru: "Открыть поиск", uz: "Qidiruvni ochish" },

  // Home Page
  "home.hero.badge": { en: "Explore 25,000+ Universities Worldwide", ru: "Исследуйте 25,000+ Университетов", uz: "Jahon Bo'ylab 25,000+ Universitetlar" },
  "home.hero.title": { en: "Find the perfect university", ru: "Найдите идеальный университет", uz: "O'zingiz uchun mukammal universitetni toping" },
  "home.hero.subtitle": { en: "for your future.", ru: "для вашего будущего.", uz: "kelajagingiz uchun." },
  "home.hero.desc": { en: "Search through our verified global catalog to explore tuition fees, admission deadlines, and scholarship opportunities anywhere in the world.", ru: "Просматривайте наш глобальный проверенный каталог: стоимость обучения, сроки поступления и стипендии по всему миру.", uz: "Dunyo bo'ylab kontrakt narxlari, qabul muddatlari va grant imkoniyatlarini tasdiqlangan global katalogimiz orqali qidiring va o'rganing." },
  "home.search.placeholder": { en: "Select a university...", ru: "Выберите университет...", uz: "Universitetni tanlang..." },
  "home.search.selectUniversity": { en: "Select a university...", ru: "Выберите университет...", uz: "Universitetni tanlang..." },
  "home.search.loadingUniversities": { en: "Loading universities...", ru: "Загрузка университетов...", uz: "Universitetlar yuklanmoqda..." },
  "home.search.btn": { en: "Search", ru: "Искать", uz: "Izlash" },

  "home.stats.verified": { en: "Verified Universities", ru: "Проверенные Университеты", uz: "Tasdiqlangan Universitetlar" },
  "home.stats.countries": { en: "Countries", ru: "Страны", uz: "Davlatlar" },
  "home.stats.free": { en: "Free Platform", ru: "Бесплатная Платформа", uz: "Bepul Platforma" },
  
  "home.reg.uk": { en: "UK UNIVERSITIES", ru: "УНИВЕРСИТЕТЫ ВЕЛИКОБРИТАНИИ", uz: "BRITANIYA UNIVERSITETLARI" },
  "home.reg.us": { en: "US UNIVERSITIES", ru: "УНИВЕРСИТЕТЫ США", uz: "AQSH UNIVERSITETLARI" },
  "home.reg.de": { en: "GERMANY UNIVERSITIES", ru: "УНИВЕРСИТЕТЫ ГЕРМАНИИ", uz: "GERMANIYA UNIVERSITETLARI" },
  "home.reg.view": { en: "View All", ru: "Смотреть Все", uz: "Barchasini Ko'rish" },

  "aiStudio.productBreadcrumb": { en: "SOSO › AI Studio", ru: "SOSO › AI Studio", uz: "SOSO › AI Studio" },
  "aiStudio.heroTitle": {
    en: "Plan your next step with clear AI assistance",
    ru: "Спланируйте следующий шаг с понятной помощью ИИ",
    uz: "Keyingi qadamni aniq AI yordami bilan rejalashtiring",
  },
  "aiStudio.heroLead": {
    en: "Search the catalog, get an indexed shortlist that references real rows, then open official sites to verify deadlines and fees. No hype — structured flows and transparent limits.",
    ru: "Ищите в каталоге, получите индексированный shortlist по реальным строкам, затем откройте официальные сайты, чтобы проверить сроки и стоимость. Без лишних обещаний — понятные шаги и прозрачные ограничения.",
    uz: "Katalogdan qidiring, haqiqiy qatorlarga tayanadigan indeksli qisqa ro‘yxat oling, keyin muddat va narxlarni tekshirish uchun rasmiy saytlarni oching. Ortiqcha va’dalar yo‘q — tartibli qadamlar va ochiq cheklovlar.",
  },
  "aiStudio.heroCtaPrimary": { en: "Try AI Match", ru: "Попробовать AI Match", uz: "AI Matchni sinash" },
  "aiStudio.heroCtaSecondary": { en: "Browse catalog", ru: "Открыть каталог", uz: "Katalogni ko‘rish" },
  "aiStudio.howTitle": { en: "How it works", ru: "Как это устройено", uz: "Qanday ishlaydi" },
  "aiStudio.howStep1Title": { en: "Search & shortlist", ru: "Поиск и shortlist", uz: "Qidiruv va qisqa ro‘yxat" },
  "aiStudio.howStep1Body": {
    en: "Pick a country and describe your goals. AI Match only selects entries that already exist in the SOSO list for that country.",
    ru: "Выберите страну и опишите цели. AI Match выбирает только те записи, которые уже есть в списке SOSO для этой страны.",
    uz: "Mamlakatni tanlang va maqsadlarni yozing. AI Match faqat shu mamlakat uchun SOSO ro‘yxatida bor yozuvlarni tanlaydi.",
  },
  "aiStudio.howStep2Title": { en: "Advisor chat", ru: "Чат‑советник", uz: "Maslahatchi chat" },
  "aiStudio.howStep2Body": {
    en: "Ask about admissions and attach screenshots. Answers follow SOSO rules: no invented tuition or deadlines.",
    ru: "Спрашивайте о поступлении и прикрепляйте скриншоты. Ответы следуют правилам SOSO: без выдуманных сумм и дедлайнов.",
    uz: "Qabul haqida so‘rang va skrinshot yuboring. Javoblar SOSO qoidalariga bo‘ysunadi: o‘ylab topilgan narx va muddatlar yo‘q.",
  },
  "aiStudio.howStep3Title": { en: "Verify on the official site", ru: "Проверка на официальном сайте", uz: "Rasmiy saytda tekshirish" },
  "aiStudio.howStep3Body": {
    en: "Always confirm requirements, costs, and dates on the university’s own website before you apply.",
    ru: "Перед подачей всегда подтверждайте требования, стоимость и даты на официальном сайте университета.",
    uz: "Ariza yuborishdan oldin talablar, narx va sanalarni har doim universitetning o‘z saytida tasdiqlang.",
  },
  "aiStudio.trustTitle": { en: "How SOSO uses AI", ru: "Как SOSO использует ИИ", uz: "SOSO AI dan qanday foydalanadi" },
  "aiStudio.trust1": {
    en: "AI requests are handled on SOSO’s servers — not only inside your browser.",
    ru: "Запросы к ИИ обрабатываются на серверах SOSO — не только в браузере.",
    uz: "AI so‘rovlari SOSO serverlarida qayta ishlanadi — faqat brauzer ichida emas.",
  },
  "aiStudio.trust2": {
    en: "Shortlists reference numbered rows from the same catalog you see in Search — the model does not invent new universities.",
    ru: "Shortlist ссылается на нумерованные строки того же каталога, что в поиске — модель не придумывает новые университеты.",
    uz: "Qisqa ro‘yxat qidiruvdagi katalogning raqamli qatorlariga tayanadi — model yangi universitet “o‘ylab” qo‘ymaydi.",
  },
  "aiStudio.trust3": {
    en: "We do not use AI output as a source of truth for fees or deadlines — you verify those on official sites.",
    ru: "Мы не считаем вывод ИИ источником правды о стоимости и сроках — вы проверяете это на официальных сайтах.",
    uz: "Narx va muddatlar uchun AI javobini yakuniy manba deb hisoblamaymiz — ularni rasmiy saytlarda tekshirasiz.",
  },
  "aiStudio.trust4": {
    en: "Sign-in is required for AI Match so usage stays accountable and rate limits can protect the service.",
    ru: "Вход нужен для AI Match, чтобы ответственно учитывать использование и защищать сервис лимитами.",
    uz: "AI Match uchun kirish talab qilinadi — foydalanish hisobga olinadi va xizmat limitlar bilan himoyalanadi.",
  },
  "aiStudio.featuresTitle": { en: "What you can do here", ru: "Что здесь можно сделать", uz: "Bu yerda nima qilish mumkin" },
  "aiStudio.featureRankLink": { en: "View rankings", ru: "Рейтинги", uz: "Reytinglar" },
  "aiStudio.featureGridSearchTitle": { en: "Catalog search", ru: "Поиск в каталоге", uz: "Katalog bo‘yicha qidiruv" },
  "aiStudio.featureGridSearchBody": {
    en: "Same live list AI Match uses — filter by country, then open a profile.",
    ru: "Тот же актуальный список, что и у AI Match — фильтр по стране, затем профиль.",
    uz: "AI Match ishlatadigan jonli ro‘yxat — mamlakat bo‘yicha filtr, keyin profil.",
  },
  "aiStudio.featureGridRankBody": {
    en: "National and global ranking views to compare options before you commit.",
    ru: "Национальный и мировой рейтинги для сравнения перед выбором.",
    uz: "Tanlashdan oldin solishtirish uchun milliy va jahon reytinglari.",
  },

  "aiStudio.matchTitle": {
    en: "AI Match",
    ru: "AI Match",
    uz: "AI Match",
  },
  "aiStudio.matchSubtitle": {
    en: "Indexed shortlist from your goals. Same catalog as Search — picks are tied to real rows.",
    ru: "Индексированный shortlist по вашим целям. Тот же каталог, что в поиске — выбор привязан к реальным строкам.",
    uz: "Maqsadlaringiz bo‘yicha indeksli qisqa ro‘yxat. Qidiruvdagi katalog bilan bir xil — tanlov haqiqiy qatorlarga bog‘langan.",
  },
  "aiStudio.workflowTitle": {
    en: "Quick path",
    ru: "Короткий путь",
    uz: "Qisqa yo‘l",
  },
  "aiStudio.step1": {
    en: "Goals → indexed picks from the SOSO catalog for your country.",
    ru: "Цели → индексированный выбор из каталога SOSO для вашей страны.",
    uz: "Maqsadlar → mamlakatingiz uchun SOSO katalogidan indeksli tanlov.",
  },
  "aiStudio.step2": {
    en: "Profiles → AI advisor for documents and screenshots.",
    ru: "Профили → AI‑советник для документов и скриншотов.",
    uz: "Profillar → hujjat va skrinshotlar uchun AI maslahatchi.",
  },
  "aiStudio.step3": {
    en: "Official site → confirm fees and deadlines before applying.",
    ru: "Официальный сайт → подтвердите стоимость и сроки перед подачей.",
    uz: "Rasmiy sayt → ariza oldidan narx va muddatlarni tasdiqlang.",
  },

  "home.aiLayer.title": {
    en: "Clear tools, not just a landing page",
    ru: "Понятные инструменты, а не только лендинг",
    uz: "Faqat landing emas — tushunarli vositalar",
  },
  "home.aiLayer.subtitle": {
    en: "Search the catalog, run an indexed AI shortlist, then chat with the advisor — the same transparent rules everywhere.",
    ru: "Ищите в каталоге, получите индексированный AI‑shortlist, затем чат с советником — одни и те же прозрачные правила.",
    uz: "Katalogdan qidiring, indeksli AI qisqa ro‘yxat oling, keyin maslahatchi bilan suhbat — hamma joyda bir xil shaffof qoidalar.",
  },
  "home.aiLayer.cardMatchTitle": { en: "Indexed shortlist", ru: "Индексированный shortlist", uz: "Indeksli qisqa ro‘yxat" },
  "home.aiLayer.cardMatchBody": {
    en: "Goals and country → numbered picks from the live SOSO list.",
    ru: "Цели и страна → нумерованный выбор из актуального списка SOSO.",
    uz: "Maqsad va mamlakat → jonli SOSO ro‘yxatidan raqamli tanlov.",
  },
  "home.aiLayer.cardChatTitle": { en: "Advisor chat", ru: "Чат‑советник", uz: "Maslahatchi chat" },
  "home.aiLayer.cardChatBody": {
    en: "Admissions questions and screenshots, with rules against invented fees.",
    ru: "Вопросы о поступлении и скриншоты, с запретом на выдуманные суммы.",
    uz: "Qabul savollari va skrinshotlar — o‘ylab topilgan narxlar taqiqlangan.",
  },
  "home.aiLayer.cardRankTitle": { en: "Rankings & profiles", ru: "Рейтинги и профили", uz: "Reyting va profillar" },
  "home.aiLayer.cardRankBody": {
    en: "Context from rankings, then profiles with links you can verify.",
    ru: "Контекст из рейтингов, затем профили со ссылками для проверки.",
    uz: "Reytingdan kontekst, keyin tekshiriladigan havolalar bilan profillar.",
  },
  "home.aiLayer.cta": { en: "Open AI Studio", ru: "Открыть AI Studio", uz: "AI Studioni ochish" },

  "search.aiBanner.title": {
    en: "Prefer a shortlist before you scroll?",
    ru: "Сначала короткий список, а потом листать?",
    uz: "Avvalo qisqa ro‘yxat, keyin aylantirasizmi?",
  },
  "search.aiBanner.body": {
    en: "AI Studio builds an indexed shortlist from this same catalog. Sign in, describe your goals, then verify everything on official sites.",
    ru: "AI Studio делает индексированный shortlist из этого же каталога. Войдите, опишите цели, затем проверьте всё на официальных сайтах.",
    uz: "AI Studio shu katalogdan indeksli qisqa ro‘yxat tuzadi. Kiring, maqsadlarni yozing, keyin hammasini rasmiy saytlarda tasdiqlang.",
  },
  "search.aiBanner.cta": { en: "Open AI Studio", ru: "Открыть AI Studio", uz: "AI Studioni ochish" },

  // Search Results Page
  "search.header.country": { en: "Search Results For", ru: "Результаты поиска для", uz: "Qidiruv natijalari:" },
  "search.header.query": { en: "Query:", ru: "Запрос:", uz: "Qidiruv:" },
  "search.header.all": { en: "ALL UNIVERSITIES", ru: "ВСЕ УНИВЕРСИТЕТЫ", uz: "BARCHA UNIVERSITETLAR" },
  "search.header.live": { en: "Live Data Search", ru: "Поиск данных в реальном времени", uz: "Jonli qidiruv tizimi" },
  "search.header.browsing": { en: "Browsing verified academic directory", ru: "Просмотр проверенного каталога", uz: "Rasmiy akademik bazani ko'rish" },
  "search.panel.title": { en: "Search universities", ru: "Поиск университетов", uz: "Universitetlarni qidirish" },
  "search.countryWorldwide": { en: "Worldwide", ru: "По всему миру", uz: "Butun dunyo" },
  "search.countryUniversitiesWorldwide": {
    en: "Universities worldwide.",
    ru: "Университеты по всему миру.",
    uz: "Butun dunyo boʻylab universitetlar.",
  },
  "search.universityNamePlaceholderWorldwide": {
    en: "Type part of the university name…",
    ru: "Введите часть названия вуза…",
    uz: "Universitet nomining bir qismini yozing…",
  },
  "search.results.worldwideNeedQuery": {
    en: "For worldwide search, enter part of the university name above, then search. Loading every university at once is not supported.",
    ru: "Для поиска по всему миру введите часть названия университета и нажмите поиск. Полный список всех вузов сразу недоступен.",
    uz: "Butun dunyo boʻylab qidirish uchun universitet nomining bir qismini yozing va «Izlash»ni bosing. Barcha universitetlarni bir vaqtda yuklash qo‘llab-quvvatlanmaydi.",
  },
  "search.countryUniversities": {
    en: "{country} universities.",
    ru: "Университеты: {country}.",
    uz: "{country} universitetlari.",
  },
  "search.results.errorTitle": { en: "Could not load results", ru: "Не удалось загрузить результаты", uz: "Natijalar yuklanmadi" },
  "search.results.errorBody": {
    en: "Check your connection and try again.",
    ru: "Проверьте подключение и попробуйте снова.",
    uz: "Internet ulanishini tekshirib, qayta urinib ko'ring.",
  },
  "search.results.emptyTitle": { en: "No matches", ru: "Ничего не найдено", uz: "Hech narsa topilmadi" },
  "search.results.emptyBody": {
    en: "No universities match “{query}” in {country}.",
    ru: "Нет вузов по запросу «{query}» для {country}.",
    uz: "{country} uchun «{query}» bo‘yicha mos universitet yo‘q.",
  },
  "pagination.previous": { en: "Previous", ru: "Назад", uz: "Oldingi" },
  "pagination.next": { en: "Next", ru: "Вперёд", uz: "Keyingi" },
  "filters.label": { en: "Filters", ru: "Фильтры", uz: "Filtrlar" },
  "filters.reset": { en: "Reset", ru: "Сбросить", uz: "Tozalash" },
  "rankings.top100.badge": {
    en: "Global rankings pool",
    ru: "Глобальный рейтинг",
    uz: "Jahon reytingi (keng ro‘yxat)",
  },
  "rankings.topN": { en: "Top {n}", ru: "Топ‑{n}", uz: "Top {n}" },
  "rankings.poolUpgradeHint": {
    en: "The ranking cache has only {loaded} universities worldwide (full snapshot aims for {target}). Refresh rankings on the server so country lists can grow — use /api/rankings/sync with force if the month was already synced.",
    ru: "В кэше рейтинга сейчас только {loaded} университетов мира (полный снимок — до {target}). Обновите рейтинги на сервере (/api/rankings/sync с force, если месяц уже синхронизировали), чтобы по странам показывалось больше вузов.",
    uz: "Reyting keshida hozir dunyo boʻyicha {loaded} ta universitet bor (toʻliq roʻyxat — {target} gacha). Mamlakat filtri uchun kengroq natija berish uchun serverda reytingni yangilang — oy allaqachon sinxron boʻlgan boʻlsa /api/rankings/sync ni force bilan ishga tushiring.",
  },

  "chat.sectionEyebrow": { en: "SOSO assistant", ru: "Помощник SOSO", uz: "SOSO yordamchisi" },
  "chat.title": { en: "AI advisor", ru: "ИИ‑советник", uz: "AI maslahatchi" },
  "chat.subtitle": {
    en: "Universities, admissions, and next steps",
    ru: "Университеты, поступление и следующие шаги",
    uz: "Universitetlar, qabul va keyingi qadamlar",
  },
  "chat.focus": { en: "Focus", ru: "Фокус", uz: "Fokus" },
  "chat.regionLabel": {
    en: "Country for recommendations",
    ru: "Страна для подборки",
    uz: "Tavsiyalar uchun mamlakat",
  },
  "chat.regionHint": {
    en: "We only suggest universities that exist in SOSO’s directory for this country (rankings or Hipolabs). Pick another country here if you want a different list.",
    ru: "Мы советуем только те вузы, которые есть в каталоге SOSO для выбранной страны. Смените страну, если нужна другая подборка.",
    uz: "AI faqat SOSO katalogidagi shu mamlakat universitetlarini tavsiya qiladi (reyting yoki ochiq bazadan). Boshqa davlat boʻyicha roʻyxat kerak boʻlsa, shuni oʻzgartiring.",
  },
  "chat.regionInUse": {
    en: "Recommendations use the list for",
    ru: "Подборка по списку для",
    uz: "Tavsiyalar roʻyxati",
  },
  "chat.regionChange": { en: "Change country", ru: "Сменить страну", uz: "Mamlakatni almashtirish" },
  "chat.regionPlaceholder": {
    en: "e.g. United Kingdom",
    ru: "напр. United Kingdom",
    uz: "masalan, United Kingdom",
  },
  "chat.emptyHint": {
    en: "Ask about choosing a university, admissions, scholarships, or attach a screenshot for step-by-step help.",
    ru: "Спросите о выборе вуза, поступлении и стипендиях или прикрепите скриншот для подсказок по шагам.",
    uz: "Universitet tanlash, qabul va grantlar yoki ekran surati yuborib, qadam‑ba‑qadam yordam oling.",
  },
  "chat.newChat": { en: "New chat", ru: "Новый чат", uz: "Yangi suhbat" },
  "chat.sidebarTitle": { en: "Chats", ru: "Чаты", uz: "Suhbatlar" },
  "chat.thinking": { en: "Thinking…", ru: "Думаю…", uz: "Oʻylayapman…" },
  "chat.messagePlaceholder": { en: "Message…", ru: "Сообщение…", uz: "Xabar…" },
  "chat.dropImage": { en: "Drop an image to attach", ru: "Перетащите изображение", uz: "Rasmni bu yerga torting" },
  "chat.remove": { en: "Remove", ru: "Убрать", uz: "Olib tashlash" },
  "chat.noMessagesYet": { en: "No messages yet", ru: "Пока нет сообщений", uz: "Hozircha xabar yoʻq" },
  "chat.loadingWorkspace": { en: "Loading your AI workspace…", ru: "Загрузка чата…", uz: "Yuklanmoqda…" },
  "chat.navActive": { en: "AI Chat", ru: "ИИ‑чат", uz: "AI chat" },
  "chat.langShort": { en: "Lang", ru: "Яз.", uz: "Til" },
  "chat.youLabel": { en: "You", ru: "Вы", uz: "Siz" },
  "chat.threadsLabel": { en: "Threads", ru: "Темы", uz: "Mavzular" },
  "chat.searchChats": { en: "Search chats...", ru: "Поиск чатов...", uz: "Suhbatlardan qidirish..." },
  "chat.noChatsFound": { en: "No chats found.", ru: "Чаты не найдены.", uz: "Suhbat topilmadi." },
  "chat.reply": { en: "Reply", ru: "Ответить", uz: "Javob berish" },
  "chat.replyTo": { en: "Reply to", ru: "Ответ на", uz: "Javob" },
  "chat.replyingTo": { en: "Replying to", ru: "Ответ на", uz: "Javob yozilmoqda" },
  "chat.feedbackPrompt": { en: "Was this helpful?", ru: "Это было полезно?", uz: "Bu foydali bo'ldimi?" },
  "chat.feedbackHelpful": { en: "Helpful", ru: "Полезно", uz: "Foydali" },
  "chat.feedbackNotHelpful": { en: "Not helpful", ru: "Не полезно", uz: "Unchalik emas" },
  "chat.feedbackThanks": { en: "Thanks, feedback saved.", ru: "Спасибо, отзыв сохранён.", uz: "Rahmat, fikringiz saqlandi." },
  "chat.trustBanner": {
    en: "Recommendations are limited to universities available in SOSO for the selected country. Always verify deadlines, fees, and requirements on official university websites.",
    ru: "Рекомендации ограничены вузами из каталога SOSO для выбранной страны. Дедлайны, стоимость и требования всегда подтверждайте на официальных сайтах университетов.",
    uz: "Tavsiyalar tanlangan mamlakat bo'yicha SOSO katalogidagi universitetlar bilan cheklanadi. Muddat, to'lov va talablarni har doim universitetning rasmiy saytida tasdiqlang.",
  },

  "home.outcomes.title": { en: "Session outcomes", ru: "Результаты сессии", uz: "Sessiya natijalari" },
  "home.outcomes.subtitle": {
    en: "Simple funnel counters from your current visit",
    ru: "Простые счётчики воронки текущего визита",
    uz: "Joriy tashrif bo'yicha oddiy funnel ko'rsatkichlari",
  },
  "home.outcomes.discovery": { en: "Search started", ru: "Поиск начат", uz: "Qidiruv boshlandi" },
  "home.outcomes.profile": { en: "Profile opened", ru: "Профиль открыт", uz: "Profil ochildi" },
  "home.outcomes.chat": { en: "Advisor messages", ru: "Сообщения AI", uz: "AI xabarlari" },
  "home.outcomes.official": { en: "Official links opened", ru: "Открыты офиц. ссылки", uz: "Rasmiy havolalar ochildi" },

  "dataFreshness.badge": { en: "Data snapshot", ru: "Снимок данных", uz: "Maʼlumot holati" },
  "dataFreshness.profileBuilt": { en: "Profile built", ru: "Профиль собран", uz: "Profil tuzilgan" },
  "dataFreshness.snapshotPeriod": { en: "Ranking period", ru: "Период рейтинга", uz: "Reyting davri" },
  "dataFreshness.dbCached": { en: "Saved in catalog", ru: "Сохранено в каталоге", uz: "Katalogga yozilgan" },
  "dataFreshness.lastUpdated": { en: "Updated", ru: "Обновлено", uz: "Yangilangan" },
  "dataFreshness.yearFallback": {
    en: "Showing the latest saved ranking from the previous year while the current year snapshot is prepared.",
    ru: "Показан последний сохранённый рейтинг за прошлый год — снимок за текущий год ещё готовится.",
    uz: "Joriy yil uchun yangi reyting hali tayyorlanmoqda; avvalgi yilgi saqlangan roʻyxat koʻrsatilmoqda.",
  },

  // University Detail
  "uni.back": { en: "BACK TO SEARCH", ru: "НАЗАД К ПОИСКУ", uz: "QIDIRUVGA QAYTISH" },
  "uni.profile": { en: "University Profile", ru: "Профиль Университета", uz: "Universitet Profili" },
  "uni.verified": { en: "Verified Data", ru: "Проверенные Данные", uz: "Tasdiqlangan Ma'lumot" },
  "uni.summary": { en: "Executive Summary", ru: "Краткий Обзор", uz: "Qisqacha Xulosa" },
  "uni.overview": { en: "University Overview", ru: "Общая Информация", uz: "Umumiy Ma'lumot" },
  "uni.tuition": { en: "Tuition Fees", ru: "Стоимость Обучения", uz: "Kontrakt Narxi" },
  "uni.deadline": { en: "Admission Deadline", ru: "Сроки Подачи Заявок", uz: "Qabul Muddatlari" },
  "uni.scholarships": { en: "Verified Scholarships", ru: "Проверенные Стипендии", uz: "Tasdiqlangan Grantlar" },
  "uni.programs": { en: "Study Programs", ru: "Учебные Программы", uz: "Ta'lim Yo'nalishlari" },
  "uni.requirements": { en: "Admission Requirements", ru: "Требования к Поступлению", uz: "Qabul Talablari" },
  "uni.website": { en: "Official Website", ru: "Официальный Сайт", uz: "Rasmiy Veb-sayt" },
  "uni.visit": { en: "Visit Official Domain", ru: "Перейти на официальный домен", uz: "Rasmiy saytiga o'tish" },
  "uni.not_specified": { en: "Not specified", ru: "Не указано", uz: "Ko'rsatilmagan" },
  "uni.varies": { en: "Varies by program", ru: "Зависит от программы", uz: "Yo'nalishga qarab o'zgaradi" },
  "uni.last_updated": { en: "Last Updated", ru: "Последнее Обновление", uz: "Oxirgi Yangilanish" },
  "uni.next_refresh": { en: "Next Refresh", ru: "Следующее Обновление", uz: "Keyingi Yangilanish" },
  "uni.refresh_status": { en: "Status", ru: "Статус", uz: "Holat" },
  "uni.sources": { en: "Data Sources", ru: "Источники Данных", uz: "Ma'lumot Manbalari" },
  "uni.confidence": { en: "Confidence", ru: "Уверенность", uz: "Ishonchlilik" },
  "uni.important_links": { en: "Most Important Links", ru: "Самые Важные Ссылки", uz: "Eng Muhim Havolalar" },
  "uni.important_apply": { en: "Where to apply", ru: "Куда подавать документы", uz: "Qayerdan hujjat topshirish" },
  "uni.important_apply_desc": {
    en: "Official admissions page to submit your application documents.",
    ru: "Официальная страница приема, где подаются документы.",
    uz: "Ariza va hujjat topshirish uchun rasmiy qabul sahifasi.",
  },
  "uni.important_programs": { en: "Programs and majors", ru: "Программы и направления", uz: "Yo'nalishlar va dasturlar" },
  "uni.important_programs_desc": {
    en: "Read program pages and choose your exact study direction.",
    ru: "Изучите страницы программ и выберите нужное направление.",
    uz: "Yo'nalish sahifalarini ko'rib, aniq dasturingizni tanlang.",
  },
  "uni.important_tuition": { en: "Tuition and contract details", ru: "Стоимость и условия контракта", uz: "Kontrakt va to'lov tafsilotlari" },
  "uni.important_tuition_desc": {
    en: "Official fees, payment terms, and contract-related details.",
    ru: "Официальные цены, условия оплаты и детали контракта.",
    uz: "Rasmiy kontrakt narxi, to'lov shartlari va tegishli ma'lumotlar.",
  },
  "uni.youtube.title": {
    en: "Official YouTube channel",
    ru: "Официальный канал YouTube",
    uz: "Rasmiy YouTube kanali",
  },
  "uni.youtube.subtitle": {
    en: "Recent videos from the university’s channel (via YouTube).",
    ru: "Недавние видео с официального канала (YouTube).",
    uz: "Universitet kanalidagi so‘nggi videolar (YouTube orqali).",
  },
  "uni.youtube.watch": {
    en: "Watch on YouTube",
    ru: "Смотреть на YouTube",
    uz: "YouTubeda ko‘rish",
  },
  "uni.youtube.embedNote": {
    en: "Playing a video may load content from YouTube. See our terms for third-party services.",
    ru: "При воспроизведении может загружаться контент YouTube. Подробнее — в условиях об использовании.",
    uz: "Video ijrosi YouTube kontentini yuklashi mumkin. Uchinchi tomon xizmatlari haqida foydalanish shartlarimizda.",
  },

  "uni.hero_trust_verified": {
    en: "Summary from official sources",
    ru: "Сводка по официальным источникам",
    uz: "Rasmiy manbalar asosidagi xulosa",
  },
  "uni.hero_trust_review": {
    en: "Confirm details on the official site",
    ru: "Проверьте детали на официальном сайте",
    uz: "Batafsilni rasmiy saytda tekshiring",
  },
  "uni.hero_trust_incomplete": {
    en: "Some sections could not be filled",
    ru: "Часть разделов не удалось заполнить",
    uz: "Baʼzi boʻlimlar toʻldirilmadi",
  },
  "uni.hero_trust_pending": {
    en: "Profile is still being built",
    ru: "Профиль ещё формируется",
    uz: "Profil hali toʻldirilmoqda",
  },
  "uni.hero_trust_general": {
    en: "Overview from available data",
    ru: "Обзор по доступным данным",
    uz: "Mavjud maʼlumotlar boʻyicha umumiy qarash",
  },
  "uni.hero_read_full": {
    en: "Read full executive summary",
    ru: "Читать полный обзор",
    uz: "Toʻliq xulosani oʻqish",
  },
  "uni.hero_whats_below": {
    en: "On this page: executive summary, tuition and fees, application deadlines, programs we found, scholarships, and official links.",
    ru: "На странице: обзор, стоимость обучения, сроки подачи, найденные программы, стипендии и официальные ссылки.",
    uz: "Sahifada: qisqacha xulosa, oʻqish narxi, ariza muddatlari, topilgan yoʻnalishlar, grantlar va rasmiy havolalar.",
  },
  "uni.hero_programs_listed": {
    en: "programs in this profile",
    ru: "программ в профиле",
    uz: "profildagi yoʻnalishlar",
  },
  "uni.hero_more_below": {
    en: "Full executive summary and structured details are just below.",
    ru: "Полный обзор и структурированные детали — чуть ниже.",
    uz: "Toʻliq xulosa va tuzilgan tafsilotlar pastroqda.",
  },
  "uni.hero_at_a_glance": {
    en: "At a glance",
    ru: "Кратко",
    uz: "Qisqacha",
  },
  "uni.refresh_status_value_fresh": { en: "Up to date", ru: "Актуально", uz: "Dolzarb" },
  "uni.refresh_status_value_stale": { en: "May be outdated", ru: "Может устареть", uz: "Eskirgan boʻlishi mumkin" },
  "uni.refresh_status_value_partial": { en: "Partially filled", ru: "Заполнено частично", uz: "Qisman toʻldirilgan" },
  "uni.refresh_status_value_failed": { en: "Refresh failed", ru: "Обновление не удалось", uz: "Yangilanish muvaffaqiyatsiz" },
  "uni.refresh_status_value_unknown": { en: "Status", ru: "Статус", uz: "Holat" },
  "uni.overview_empty": {
    en: "No AI overview is saved for this university yet. Use the official website and the links below for accurate requirements and deadlines.",
    ru: "Для этого университета ещё нет сохранённого AI-обзора. Точные требования и сроки смотрите на официальном сайте и в ссылках ниже.",
    uz: "Bu universitet uchun hali AI xulosasi saqlanmagan. Aniq talablar va muddatlar uchun rasmiy sayt va pastdagi havolardan foydalaning.",
  },
  "uni.confidence_hint": {
    en: "Automated estimate of how complete this profile looks compared to the sources we found — not a legal guarantee.",
    ru: "Оценка полноты профиля по найденным источникам — не юридическая гарантия.",
    uz: "Topilgan manbalar bilan solishtirganda profil toʻliqligi boʻyicha avtomatik baho — bu yuridik kafolat emas.",
  },
  "uni.scholarship_tag": {
    en: "Scholarship",
    ru: "Стипендия",
    uz: "Grant / stipendiya",
  },
  "uni.scholarships_empty": {
    en: "No scholarships were linked in our last data refresh. Check the official site for current funding options.",
    ru: "В последнем обновлении стипендии не найдены. Актуальные варианты финансирования смотрите на официальном сайте.",
    uz: "Soʻnggi yangilanishda grantlar bogʻlanmagan. Dolzarb moliyaviy imkoniyatlarni rasmiy saytdan tekshiring.",
  },
  "uni.disclaimer_official": {
    en: "SOSO summarizes pages we could find. Always confirm programs, fees, and deadlines on the official university website before you apply.",
    ru: "SOSO обобщает найденные страницы. Перед подачей заявки всегда подтверждайте программы, оплату и сроки на официальном сайте вуза.",
    uz: "SOSO topilgan sahifalarni qisqacha beradi. Ariza topshirishdan oldin dastur, to‘lov va muddatlarni har doim universitetning rasmiy saytida tasdiqlang.",
  },

  "cookie.analytics.title": {
    en: "Analytics & measurement",
    ru: "Аналитика и измерение",
    uz: "Analitika va statistika",
  },
  "cookie.analytics.body": {
    en: "With your permission, we collect anonymous usage statistics to improve SOSO. You can decline; only cookies required for the site to work stay on.",
    ru: "С вашего согласия мы собираем обезличенную статистику, чтобы улучшать SOSO. Вы можете отказаться — останутся только cookies, необходимые для работы сайта.",
    uz: "Roziligingiz bilan SOSO’ni yaxshilash uchun anonim statistikani yozib olamiz. Rad etsangiz ham bo‘ladi — faqat sayt ishlashi uchun kerak bo‘lgan cookie’lar qoladi.",
  },
  "cookie.analytics.accept": { en: "Accept analytics", ru: "Разрешить аналитику", uz: "Analitikaga rozilik" },
  "cookie.analytics.reject": { en: "Essential only", ru: "Только необходимые", uz: "Faqat zarur" },
  "cookie.analytics.termsLink": { en: "Terms", ru: "Условия", uz: "Shartlar" },

  // Footer
  "footer.copyright": { en: "© 2026 SOSO Education", ru: "© 2026 SOSO Образование", uz: "© 2026 SOSO Ta'lim" },
  "footer.status": { en: "All systems operational", ru: "Все системы работают", uz: "Barcha tizimlar ishlamoqda" },

  // About Page
  "about.title": { en: "About Us", ru: "О Нас", uz: "Biz Haqimizda" },
  "about.subtitle": { en: "Building the most comprehensive verified academic resource for students worldwide.", ru: "Самый полный проверенный академический ресурс для студентов по всему миру.", uz: "Butun dunyo talabalari uchun eng toʻliq tasdiqlangan akademik resursni yaratish." },
  "about.desc1": { en: "SOSO is a university discovery platform that connects ambitious students with leading institutions worldwide. We combine official sources and careful verification so you get clear, up-to-date information across 195+ countries.", ru: "SOSO — платформа для поиска университетов: она помогает абитуриентам находить ведущие вузы по всему миру. Мы опираемся на официальные источники и проверку данных, чтобы вы видели актуальную информацию по 195+ странам.", uz: "SOSO — talabalarni dunyo boʻylab yetakchi oliygohlar bilan uchrashiradigan universitet qidiruv platformasi. Rasmiy manbalar va tekshiruvlar asosida 195+ mamlakat boʻyicha aniq, dolzarb maʼlumot beramiz." },
  "about.desc2": { en: "We believe in absolute transparency and accessibility in academic research. By standardizing diverse institutional registries into a single, high-performance interface, we eliminate the friction typically associated with researching international education.", ru: "Мы верим в абсолютную прозрачность и доступность академических исследований. Стандартизируя различные институциональные реестры в единый высокопроизводительный интерфейс, мы устраняем трения.", uz: "Biz akademik tadqiqotlarda mutlaq shaffoflik va ochiqlikka ishonamiz. Turli xil oliygohlar ma'lumotlarini yagona tizimga jamlash orqali biz xalqaro ta'limni o'rganishdagi barcha to'siqlarni olib tashlaymiz." },
  "about.back": { en: "Back to Home", ru: "На Главную", uz: "Bosh sahifaga qaytish" },
  "about.offerTitle": {
    en: "What you can do here",
    ru: "Что вы можете делать на платформе",
    uz: "Bu yerda nima qila olasiz",
  },
  "about.offer1Title": { en: "Search across countries", ru: "Поиск по странам", uz: "Mamlakatlar bo'yicha qidiruv" },
  "about.offer1Desc": {
    en: "Explore universities by country, compare options, and jump to full profiles with tuition context, deadlines, and verified links.",
    ru: "Ищите вузы по странам, сравнивайте варианты и открывайте полные карточки со стоимостью обучения, сроками и проверенными ссылками.",
    uz: "Mamlakat bo'yicha universitetlarni qidiring, variantlarni solishtiring va kontrakt, muddatlar va tasdiqlangan havolalar bilan toʻliq profillarga oʻting.",
  },
  "about.offer2Title": { en: "Trusted profile view", ru: "Понятный профиль вуза", uz: "Ishonchli profil ko'rinishi" },
  "about.offer2Desc": {
    en: "Each profile is built from official pages and structured sources where possible, with clear citations so you know where facts came from.",
    ru: "Карточка собирается из официальных страниц и структурированных источников с указанием ссылок — видно, откуда взяты сведения.",
    uz: "Har bir profil iloji boricha rasmiy sahifalar va tuzilgan manbalardan yigʻiladi; havolalar bilan qaysi fakt qayerdan olinganini koʻrasiz.",
  },
  "about.offer3Title": { en: "AI advisor in your language", ru: "ИИ‑советник на вашем языке", uz: "O‘zingiz tilingizdagi AI maslahatchi" },
  "about.offer3Desc": {
    en: "Use the SOSO assistant for practical next steps on admissions, programs, and paperwork — always double‑check critical details on the university’s own site.",
    ru: "Помощник SOSO подскажет практические шаги по поступлению и программам — ключевые детали всё равно сверяйте на официальном сайте вуза.",
    uz: "SOSO yordamchisi qabul, dasturlar va hujjatlar boʻyicha amaliy qadamlarni tushuntiradi — muhim jihatlarni universitetning rasmiy saytida yana bir bor tekshiring.",
  },
  "about.dataTitle": { en: "Data posture", ru: "Подход к данным", uz: "Maʼlumotlar yondashuvi" },
  "about.dataP1": {
    en: "We aggregate public university data and rankings snapshots to keep discovery fast. Freshness badges and “confirm on the official site” reminders are intentional — immigration rules, fees, and intakes change often.",
    ru: "Мы агрегируем открытые данные и снимки рейтингов, чтобы ускорить поиск. Бейджи свежести и напоминания «проверьте на официальном сайте» — не формальность: правила виз, оплаты и набор часто меняются.",
    uz: "Biz ochiq universitet maʼlumotlari va reyting suratlarini birlashtirib, qidiruvni tezlashtiramiz. Dolzarbilik belgilari va «rasmiy saytda tekshiring» eslatmalari tasodifiy emas — kontrakt, qoidalar va qabul tez-tez oʻzgarmoqda.",
  },
  "about.dataP2": {
    en: "SOSO is an independent discovery tool, not a government registry or a university. We welcome corrections when something looks wrong — that helps every student after you.",
    ru: "SOSO — независимый инструмент поиска, а не госреестр и не сам университет. Если заметили ошибку, напишите нам — это поможет следующим пользователям.",
    uz: "SOSO mustaqil qidiruv vositasi; davlat reyestri yoki universitet emas. Xato koʻrsangiz, bizga yozing — bu sizdan keyingi talabalarga ham yordam beradi.",
  },
  "about.faqTitle": { en: "FAQ", ru: "FAQ", uz: "Ko'p so'raladigan savollar" },
  "about.faqSubtitle": {
    en: "Short answers based on how SOSO works today.",
    ru: "Короткие ответы на основе текущей работы SOSO.",
    uz: "SOSO hozir qanday ishlashiga asoslangan qisqa javoblar.",
  },
  "about.faq1Q": {
    en: "How does SOSO choose university recommendations?",
    ru: "Как SOSO выбирает рекомендации по университетам?",
    uz: "SOSO universitet tavsiyalarini qanday tanlaydi?",
  },
  "about.faq1A": {
    en: "Recommendations are constrained to universities already available in SOSO for the selected country (rankings cache or open directory data).",
    ru: "Рекомендации ограничены вузами, которые уже есть в SOSO для выбранной страны (кэш рейтингов или открытый каталог).",
    uz: "Tavsiyalar tanlangan mamlakat bo'yicha SOSO bazasida bor universitetlar bilan cheklanadi (reyting keshi yoki ochiq katalog).",
  },
  "about.faq2Q": {
    en: "Where does data come from?",
    ru: "Откуда берутся данные?",
    uz: "Ma'lumotlar qayerdan olinadi?",
  },
  "about.faq2A": {
    en: "SOSO combines public university directories, ranking snapshots, and official university links. Profile pages also show source links and freshness hints when available.",
    ru: "SOSO объединяет открытые каталоги вузов, снимки рейтингов и официальные ссылки университетов. В профилях также показываются источники и метки свежести, если доступны.",
    uz: "SOSO ochiq universitet kataloglari, reyting snapshotlari va universitetlarning rasmiy havolalarini birlashtiradi. Profil sahifasida mavjud bo'lsa manbalar va dolzarblik belgisi ham ko'rsatiladi.",
  },
  "about.faq3Q": {
    en: "How often are rankings and details refreshed?",
    ru: "Как часто обновляются рейтинги и детали?",
    uz: "Reyting va ma'lumotlar qanchalik tez yangilanadi?",
  },
  "about.faq3A": {
    en: "Ranking snapshots are updated on a recurring cycle, and profile freshness is shown per university. If data is partial or stale, you should verify on official pages.",
    ru: "Снимки рейтингов обновляются циклично, а свежесть профиля показывается для каждого вуза. Если данные частичные или устаревшие, проверьте на официальных страницах.",
    uz: "Reyting snapshotlari davriy yangilanadi, profil dolzarbligi esa har universitet uchun ko'rsatiladi. Ma'lumot qisman yoki eskirgan bo'lsa, rasmiy sahifada tekshirish kerak.",
  },
  "about.faq4Q": {
    en: "Can I rely only on SOSO for application deadlines and tuition?",
    ru: "Можно ли полагаться только на SOSO по дедлайнам и оплате?",
    uz: "Ariza muddati va to'lov bo'yicha faqat SOSO'ga tayansam bo'ladimi?",
  },
  "about.faq4A": {
    en: "No. SOSO is a decision-support tool. Always confirm deadlines, fees, and admission requirements on the official university website before applying.",
    ru: "Нет. SOSO — инструмент поддержки решений. Перед подачей всегда подтверждайте сроки, стоимость и требования на официальном сайте университета.",
    uz: "Yo'q. SOSO qaror qabul qilishga yordam beruvchi vosita. Ariza topshirishdan oldin muddat, to'lov va talablarni universitetning rasmiy saytida tasdiqlang.",
  },
  "about.faq5Q": {
    en: "Is SOSO free to use?",
    ru: "SOSO бесплатный?",
    uz: "SOSO'dan foydalanish bepulmi?",
  },
  "about.faq5A": {
    en: "At the moment, core discovery and advisor flows are available without paid subscription in the product.",
    ru: "На данный момент основные сценарии поиска и AI‑советника доступны в продукте без платной подписки.",
    uz: "Hozircha mahsulotdagi asosiy qidiruv va AI maslahatchi oqimlari pullik obunasiz ishlaydi.",
  },
  "about.faq6Q": {
    en: "Which languages are supported?",
    ru: "Какие языки поддерживаются?",
    uz: "Qaysi tillar qo'llab-quvvatlanadi?",
  },
  "about.faq6A": {
    en: "SOSO UI and guidance support English, Uzbek, and Russian.",
    ru: "Интерфейс и подсказки SOSO поддерживают английский, узбекский и русский языки.",
    uz: "SOSO interfeysi va yo'l-yo'riqlari ingliz, o'zbek va rus tillarini qo'llab-quvvatlaydi.",
  },
  "about.contactTitle": { en: "Contact", ru: "Контакты", uz: "Aloqa" },
  "about.contactLead": {
    en: "Questions about the platform, partnerships, or data corrections — reach us by email.",
    ru: "Вопросы по платформе, сотрудничеству или исправлению данных — напишите на почту.",
    uz: "Platforma, hamkorlik yoki maʼlumotni tuzatish bo‘yicha savollar — elektron pochta orqali yozing.",
  },
  "about.contactEmailLabel": { en: "Email", ru: "Эл. почта", uz: "Email" },
  "about.contactWebLabel": { en: "Website", ru: "Сайт", uz: "Veb-sayt" },
  "about.contactHint": {
    en: "We read every message; please allow a few business days for a reply. For urgent decisions about an offer or visa, rely on official correspondence from the institution and authorities.",
    ru: "Мы читаем все письма; ответ может занять несколько рабочих дней. По срочным решениям (офер, виза) ориентируйтесь на официальные письма вуза и госорганов.",
    uz: "Har bir xabarni oʻqimiz; javob bir necha ish kuni suralishi mumkin. Kontrakt yoki viza boʻyicha shoshilinch qarorlar uchun rasmiy xat va hujjatlarga tayaning.",
  },
  "about.ctaSearch": { en: "Open search", ru: "Открыть поиск", uz: "Qidiruvni ochish" },
  "about.ctaStudents": { en: "Student hub", ru: "Раздел для студентов", uz: "Talabalar markazi" },
  "about.ctaChat": { en: "AI advisor", ru: "ИИ‑советник", uz: "AI maslahatchi" },

  // Students page
  "students.title": { en: "For Students.", ru: "Студентам.", uz: "Talabalar uchun." },
  "students.subtitle": {
    en: "Tools and resources designed to simplify your educational journey.",
    ru: "Инструменты и ресурсы, созданные для упрощения вашего образовательного пути.",
    uz: "Ta'lim yo'lingizni soddalashtirish uchun mo'ljallangan vositalar va resurslar.",
  },
  "students.p1": {
    en: "Welcome to the student hub. Our goal is to empower you with direct access to accurate information regarding tuition fees, scholarships, and admission procedures for universities around the globe.",
    ru: "Добро пожаловать в студенческий центр. Наша цель — дать вам прямой доступ к точной информации о стоимости обучения, стипендиях и процедурах поступления в университеты по всему миру.",
    uz: "Talabalar markaziga xush kelibsiz. Bizning maqsadimiz — dunyo bo'ylab universitetlar bo'yicha kontrakt narxlari, grantlar va qabul tartiblari haqidagi aniq ma'lumotlarga bevosita kirishingizni ta'minlash.",
  },
  "students.p2": {
    en: "We are adding features to help international students through complex application steps. Bookmark this page for updates on application tools, scholarship tracking, and richer university details.",
    ru: "Мы добавляем функции, чтобы помочь иностранным студентам пройти сложные этапы поступления. Добавьте страницу в закладки — появятся инструменты для заявок, отслеживание стипендий и больше деталей об университетах.",
    uz: "Xalqaro talabalarga murakkab ariza bosqichlarida yordam beradigan yangi imkoniyatlarni qoʻshmoqdamiz. Ariza vositalari, grantlarni kuzatish va universitetlar haqida chuqurroq maʼlumotlar uchun bu sahifani xatchoʻplarga qoʻying.",
  },
  "students.notice": { en: "Notice", ru: "Уведомление", uz: "Eslatma" },
  "students.noticeBody": {
    en: "More detailed student tracking tools and user accounts are currently under development. Stay tuned for the next major release of the SOSO platform.",
    ru: "Более подробные инструменты отслеживания для студентов и учётные записи пользователей сейчас в разработке. Следите за следующим крупным релизом платформы SOSO.",
    uz: "Talabalarni kuzatish bo'yicha batafsil vositalar va foydalanuvchi hisoblari hozirda ishlab chiqilmoqdadir. SOSO platformasining navbatdagi katta yangilanishini kuting.",
  },

  "uni.view": { en: "View Details", ru: "Подробнее", uz: "Batafsil" },
  "uni.verified_tag": { en: "Verified", ru: "Проверено", uz: "Tasdiqlangan" },
};

/** Localized label for Prisma `refresh_status` (fresh | stale | partial | failed). */
export function translateRefreshStatus(status: string | null | undefined, lang: Language): string {
  if (!status) return "";
  const s = status.toLowerCase().trim();
  const key =
    s === "fresh"
      ? "uni.refresh_status_value_fresh"
      : s === "stale"
        ? "uni.refresh_status_value_stale"
        : s === "partial"
          ? "uni.refresh_status_value_partial"
          : s === "failed"
            ? "uni.refresh_status_value_failed"
            : "uni.refresh_status_value_unknown";
  const entry = translations[key];
  const label = (entry?.[lang] || entry?.en || status).trim();
  if (key === "uni.refresh_status_value_unknown") {
    return `${label} (${status})`;
  }
  return label;
}
