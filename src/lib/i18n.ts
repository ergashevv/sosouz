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
