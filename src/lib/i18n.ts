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
  "home.search.placeholder": { en: "Ask for a university...", ru: "Найти университет...", uz: "Universitet nomini qidiring..." },
  "home.search.btn": { en: "Search", ru: "Искать", uz: "Izlash" },

  "home.stats.verified": { en: "Verified Universities", ru: "Проверенные Университеты", uz: "Tasdiqlangan Universitetlar" },
  "home.stats.countries": { en: "Countries", ru: "Страны", uz: "Davlatlar" },
  "home.stats.free": { en: "Free Platform", ru: "Бесплатная Платформа", uz: "Bepul Platforma" },
  
  "home.reg.uk": { en: "UK UNIVERSITIES", ru: "УНИВЕРСИТЕТЫ ВЕЛИКОБРИТАНИИ", uz: "BRITANIYA UNIVERSITETLARI" },
  "home.reg.us": { en: "US UNIVERSITIES", ru: "УНИВЕРСИТЕТЫ США", uz: "AQSH UNIVERSITETLARI" },
  "home.reg.de": { en: "GERMANY UNIVERSITIES", ru: "УНИВЕРСИТЕТЫ ГЕРМАНИИ", uz: "GERMANIYA UNIVERSITETLARI" },
  "home.reg.view": { en: "View All", ru: "Смотреть Все", uz: "Barchasini Ko'rish" },

  // Search Results Page
  "search.header.country": { en: "Search Results For", ru: "Результаты поиска для", uz: "Qidiruv natijalari:" },
  "search.header.query": { en: "Query:", ru: "Запрос:", uz: "Qidiruv:" },
  "search.header.all": { en: "ALL UNIVERSITIES", ru: "ВСЕ УНИВЕРСИТЕТЫ", uz: "BARCHA UNIVERSITETLAR" },
  "search.header.live": { en: "Live Data Search", ru: "Поиск данных в реальном времени", uz: "Jonli qidiruv tizimi" },
  "search.header.browsing": { en: "Browsing verified academic directory", ru: "Просмотр проверенного каталога", uz: "Rasmiy akademik bazani ko'rish" },
  "search.panel.title": { en: "Search universities", ru: "Поиск университетов", uz: "Universitetlarni qidirish" },
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

  "chat.title": { en: "AI advisor", ru: "ИИ‑советник", uz: "AI maslahatchi" },
  "chat.subtitle": {
    en: "Universities, admissions, and next steps",
    ru: "Университеты, поступление и следующие шаги",
    uz: "Universitetlar, qabul va keyingi qadamlar",
  },
  "chat.focus": { en: "Focus", ru: "Фокус", uz: "Fokus" },
  "chat.regionLabel": { en: "List region", ru: "Страна списка", uz: "Roʻyxat mamlakati" },
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
  
  // Footer
  "footer.copyright": { en: "© 2026 SOSO Education", ru: "© 2026 SOSO Образование", uz: "© 2026 SOSO Ta'lim" },
  "footer.status": { en: "All systems operational", ru: "Все системы работают", uz: "Barcha tizimlar ishlamoqda" },

  // About Page
  "about.title": { en: "About Us", ru: "О Нас", uz: "Biz Haqimizda" },
  "about.subtitle": { en: "Building the most comprehensive verified academic resource for students worldwide.", ru: "Самый полный проверенный академический ресурс для студентов по всему миру.", uz: "Butun dunyo talabalari uchun eng toʻliq tasdiqlangan akademik resursni yaratish." },
  "about.desc1": { en: "SOSO is a university discovery platform that connects ambitious students with leading institutions worldwide. We combine official sources and careful verification so you get clear, up-to-date information across 195+ countries.", ru: "SOSO — платформа для поиска университетов: она помогает абитуриентам находить ведущие вузы по всему миру. Мы опираемся на официальные источники и проверку данных, чтобы вы видели актуальную информацию по 195+ странам.", uz: "SOSO — talabalarni dunyo boʻylab yetakchi oliygohlar bilan uchrashiradigan universitet qidiruv platformasi. Rasmiy manbalar va tekshiruvlar asosida 195+ mamlakat boʻyicha aniq, dolzarb maʼlumot beramiz." },
  "about.desc2": { en: "We believe in absolute transparency and accessibility in academic research. By standardizing diverse institutional registries into a single, high-performance interface, we eliminate the friction typically associated with researching international education.", ru: "Мы верим в абсолютную прозрачность и доступность академических исследований. Стандартизируя различные институциональные реестры в единый высокопроизводительный интерфейс, мы устраняем трения.", uz: "Biz akademik tadqiqotlarda mutlaq shaffoflik va ochiqlikka ishonamiz. Turli xil oliygohlar ma'lumotlarini yagona tizimga jamlash orqali biz xalqaro ta'limni o'rganishdagi barcha to'siqlarni olib tashlaymiz." },
  "about.back": { en: "Back to Home", ru: "На Главную", uz: "Bosh sahifaga qaytish" },

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
