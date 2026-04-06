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
  "nav.search": { en: "Search & Discover", ru: "Поиск", uz: "Qidiruv" },
  "nav.about": { en: "About Us", ru: "О Нас", uz: "Biz Haqimizda" },
  "nav.students": { en: "For Students", ru: "Студентам", uz: "Talabalar Uchun" },
  "nav.terms": { en: "Terms of Service", ru: "Условия Использования", uz: "Foydalanish Shartlari" },
  
  // Home Page
  "home.hero.badge": { en: "Explore 25,000+ Universities Worldwide", ru: "Исследуйте 25,000+ Университетов", uz: "Jahon Bo'ylab 25,000+ Universitetlar" },
  "home.hero.title": { en: "Find the perfect university", ru: "Найдите идеальный университет", uz: "O'zingiz uchun mukammal universitetni toping" },
  "home.hero.subtitle": { en: "for your future.", ru: "для вашего будущего.", uz: "kelajagingiz uchun." },
  "home.hero.desc": { en: "Search through our verified global database to explore tuition fees, admission deadlines, and scholarship opportunities anywhere in the world.", ru: "Используйте нашу глобальную базу данных для поиска стоимости обучения, сроков поступления и стипендий.", uz: "Dunyo bo'ylab kontrakt narxlari, qabul muddatlari va grant imkoniyatlarini rasmiy bazamiz orqali qidiring va o'rganing." },
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
  "about.subtitle": { en: "Building the most comprehensive and verified academic database for students globally.", ru: "Создание наиболее полной и проверенной базы данных для студентов по всему миру.", uz: "Butun dunyo talabalari uchun eng to'liq va tasdiqlangan akademik ma'lumotlar bazasini yaratish." },
  "about.desc1": { en: "SOSO is a sophisticated university discovery platform designed to connect ambitious students with top-tier global institutions. Our verified data pipeline integrates directly with international institutional metadata to provide accurate, real-time insights into academic nodes across 195+ countries.", ru: "SOSO — это сложная платформа для поиска университетов, созданная для связи амбициозных студентов с ведущими мировыми институтами.", uz: "SOSO - bu intiluvchan talabalarni dunyoning eng nufuzli oliygohlari bilan bog'lash uchun mo'ljallangan zamonaviy universitet qidiruv platformasi." },
  "about.desc2": { en: "We believe in absolute transparency and accessibility in academic research. By standardizing diverse institutional registries into a single, high-performance interface, we eliminate the friction typically associated with researching international education.", ru: "Мы верим в абсолютную прозрачность и доступность академических исследований. Стандартизируя различные институциональные реестры в единый высокопроизводительный интерфейс, мы устраняем трения.", uz: "Biz akademik tadqiqotlarda mutlaq shaffoflik va ochiqlikka ishonamiz. Turli xil oliygohlar ma'lumotlarini yagona tizimga jamlash orqali biz xalqaro ta'limni o'rganishdagi barcha to'siqlarni olib tashlaymiz." },
  "about.back": { en: "Back to Home", ru: "На Главную", uz: "Bosh sahifaga qaytish" },
  "uni.view": { en: "View Details", ru: "Подробнее", uz: "Batafsil" },
  "uni.verified_tag": { en: "Verified", ru: "Проверено", uz: "Tasdiqlangan" },
};
