import type { Locale } from "@/i18n/config";

export type ServiceIcon =
  | "building" | "roof" | "solar" | "cctv" | "facade" | "layout" | "office" | "electric" | "network";

type Copy = {
  title: string;
  /** Title in the other language, shown as secondary line (bilingual brand feel). */
  short: string;
  intro: string;
  features: string[];
  benefits: { title: string; text: string }[];
  seoTitle: string;
  seoDescription: string;
};

export type Service = {
  slug: string;
  icon: ServiceIcon;
  image: string;
  imageAlt: Record<Locale, string>;
  ar: Copy & { title: string };
  fr: Copy & { title: string };
  keywords: Record<Locale, string[]>;
};

/**
 * Source of truth: the services presentation supplied by the company.
 * Descriptions are drafted from that presentation without adding certifications,
 * figures, brands or references. Review the wording before going live.
 */
export const services: Service[] = [
  {
    slug: "construction-batiment",
    icon: "building",
    image: "/images/services/construction.webp",
    imageAlt: { ar: "ورشة بناء بهيكل خرساني وسقالات وعمال", fr: "Chantier de construction avec ossature béton et échafaudages" },
    ar: {
      title: "أشغال البناء",
      short: "إنجاز مختلف أشغال البناء والمشاريع، من الأساسات إلى التسليم النهائي «مفتاح في اليد».",
      intro:
        "نتكفّل بإنجاز أشغال البناء بمختلف أنواعها لفائدة الخواص والمؤسسات: من الدراسة والأشغال الكبرى إلى التشطيبات والتسليم النهائي، مع متابعة المشروع في كل مرحلة وتنسيق بين مختلف الحرف لضمان تناسق الإنجاز.",
      features: [
        "إنجاز مختلف أشغال البناء والمشاريع",
        "من الأساسات إلى التسليم النهائي «مفتاح في اليد»",
        "الأشغال الكبرى (الهيكل) ثم التشطيبات والطلاء",
        "متابعة المشروع من البداية إلى غاية التسليم",
      ],
      benefits: [
        { title: "مخاطب واحد", text: "جهة واحدة تتكفّل بالمشروع من الفكرة إلى التسليم." },
        { title: "تناسق في الإنجاز", text: "ربط الأشغال بالتجهيزات لتفادي التعارض بين الحرف." },
        { title: "التزام بالآجال", text: "تخطيط واضح للمراحل واحترام للمواعيد المتفق عليها." },
      ],
      seoTitle: "أشغال البناء في تقرت والجزائر | شركة كات متعددة الخدمات",
      seoDescription:
        "شركة أشغال البناء في تقرت: إنجاز مختلف أشغال البناء والمشاريع السكنية والمهنية، من الأساسات إلى التسليم مفتاح في اليد. اطلبوا عرض سعر.",
    },
    fr: {
      title: "Construction Bâtiment",
      short: "Réalisation de tous travaux de bâtiment, du gros œuvre à la livraison clé en main.",
      intro:
        "Nous réalisons vos travaux de bâtiment pour particuliers et professionnels : de l'étude et du gros œuvre aux finitions et à la livraison, avec un suivi à chaque étape et une coordination des différents corps de métier pour une réalisation cohérente.",
      features: [
        "Réalisation de tous travaux de bâtiment",
        "Du gros œuvre à la livraison clé en main",
        "Gros œuvre, puis finitions et peinture",
        "Suivi du projet de A à Z",
      ],
      benefits: [
        { title: "Un seul interlocuteur", text: "Un partenaire unique, de l'idée à la livraison." },
        { title: "Réalisation cohérente", text: "Construction et équipements pensés ensemble." },
        { title: "Respect des délais", text: "Planification claire des étapes et respect des échéances convenues." },
      ],
      seoTitle: "Travaux de bâtiment à Touggourt | Construction en Algérie - KMS",
      seoDescription:
        "Entreprise de construction à Touggourt : tous travaux de bâtiment résidentiels et professionnels, du gros œuvre à la livraison clé en main. Demandez un devis.",
    },
    keywords: {
      ar: ["شركة أشغال البناء في تقرت", "شركات البناء في الجزائر", "أشغال البناء", "مقاول بناء تقرت"],
      fr: ["Entreprise de construction en Algérie", "Travaux de bâtiment à Touggourt", "construction bâtiment Algérie"],
    },
  },
  {
    slug: "etancheite-toiture",
    icon: "roof",
    image: "/images/services/waterproofing.webp",
    imageAlt: { ar: "عامل يطبّق عزلاً مائياً على سطح بالشعلة", fr: "Ouvrier réalisant l'étanchéité d'une toiture au chalumeau" },
    ar: {
      title: "عزل الأسطح",
      short: "عزل مائي وحراري للأسطح بمواصفات وجودة عالية.",
      intro:
        "نقدّم أشغال العزل المائي والحراري للأسطح بمواصفات وجودة عالية، لحماية البناية من التسربات والرطوبة وتحسين الراحة الحرارية داخلها، سواء في المنازل أو في المباني المهنية.",
      features: [
        "عزل مائي للأسطح (Étanchéité)",
        "عزل حراري للأسطح",
        "أشغال وفق المعايير وبجودة عالية",
        "للمنازل والمباني السكنية والمهنية",
      ],
      benefits: [
        { title: "حماية البناية", text: "الحدّ من تسرّب المياه والرطوبة عبر السطح." },
        { title: "راحة حرارية", text: "عزل حراري يساهم في تحسين الراحة داخل المبنى." },
        { title: "متانة الأشغال", text: "اختيار دقيق للمواد وتنفيذ حسب أصول المهنة." },
      ],
      seoTitle: "عزل الأسطح في الجزائر وتقرت | عزل مائي وحراري - KMS",
      seoDescription:
        "عزل الأسطح مائياً وحرارياً بجودة عالية في تقرت وعبر الجزائر. شركة كات متعددة الخدمات تنجز أشغال العزل للمنازل والمباني المهنية. اطلبوا عرض سعر.",
    },
    fr: {
      title: "Étanchéité Toiture",
      short: "Étanchéité et isolation thermique de toitures, selon les normes et avec une haute qualité.",
      intro:
        "Nous réalisons l'étanchéité et l'isolation thermique de vos toitures selon les normes et avec une haute qualité, pour protéger le bâtiment des infiltrations et de l'humidité et améliorer le confort thermique, pour les maisons comme pour les bâtiments professionnels.",
      features: [
        "Étanchéité de toitures",
        "Isolation thermique de toitures",
        "Travaux selon les normes et haute qualité",
        "Pour habitations et bâtiments professionnels",
      ],
      benefits: [
        { title: "Bâtiment protégé", text: "Limiter les infiltrations d'eau et l'humidité par la toiture." },
        { title: "Confort thermique", text: "Une isolation qui contribue au confort à l'intérieur du bâtiment." },
        { title: "Travaux durables", text: "Choix rigoureux des matériaux et mise en œuvre dans les règles de l'art." },
      ],
      seoTitle: "Étanchéité toiture en Algérie et à Touggourt | KMS",
      seoDescription:
        "Étanchéité et isolation thermique de toiture à Touggourt et en Algérie. KMS réalise vos travaux d'étanchéité pour maisons et bâtiments professionnels. Devis gratuit.",
    },
    keywords: {
      ar: ["عزل الأسطح", "عزل مائي", "عزل حراري", "عزل الأسطح في الجزائر"],
      fr: ["Étanchéité toiture", "isolation thermique toiture", "étanchéité toiture Algérie"],
    },
  },
  {
    slug: "energie-solaire",
    icon: "solar",
    image: "/images/services/solar.webp",
    imageAlt: { ar: "ألواح شمسية مركّبة على سطح", fr: "Panneaux solaires installés en toiture" },
    ar: {
      title: "الطاقة الشمسية والمزارع الذكية",
      short: "دراسة وتوريد وتركيب منظومات الطاقة الشمسية للمنازل والمؤسسات والمشاريع، بما فيها المزارع الذكية.",
      intro:
        "نرافقكم في مشاريع الطاقة الشمسية من الدراسة إلى التوريد والتركيب، سواء لمنزل أو مؤسسة أو مشروع فلاحي. نبحث معكم عن الحل المناسب لاحتياجاتكم ومحيط مشروعكم، بما في ذلك حلول المزارع الذكية.",
      features: [
        "دراسة الاحتياجات وتصميم المنظومة",
        "توريد وتركيب منظومات الطاقة الشمسية",
        "للمنازل والمؤسسات والمشاريع",
        "حلول مخصصة للمزارع والمشاريع الفلاحية الذكية",
      ],
      benefits: [
        { title: "طاقة متجددة", text: "الاعتماد على الشمس كمصدر نظيف للطاقة." },
        { title: "حلول حسب الطلب", text: "منظومة مصممة وفق احتياجات كل مشروع." },
        { title: "من الدراسة إلى التشغيل", text: "مرافقة كاملة في كل مراحل المشروع." },
      ],
      seoTitle: "الطاقة الشمسية في الجزائر | تركيب الألواح الشمسية وتقرت - KMS",
      seoDescription:
        "الطاقة الشمسية في الجزائر: دراسة وتوريد وتركيب منظومات الألواح الشمسية للمنازل والمؤسسات والمزارع الذكية مع شركة كات متعددة الخدمات بتقرت.",
    },
    fr: {
      title: "Énergie Solaire et Fermes Intelligentes",
      short: "Étude, fourniture et installation de solutions solaires pour maisons, entreprises et projets, y compris fermes intelligentes.",
      intro:
        "Nous vous accompagnons dans vos projets solaires, de l'étude à la fourniture et à l'installation, que ce soit pour une maison, une entreprise ou un projet agricole. Nous cherchons avec vous la solution adaptée à vos besoins, y compris pour les fermes intelligentes.",
      features: [
        "Étude des besoins et conception de l'installation",
        "Fourniture et installation de systèmes solaires",
        "Pour maisons, entreprises et projets",
        "Solutions adaptées aux fermes et projets agricoles intelligents",
      ],
      benefits: [
        { title: "Énergie renouvelable", text: "S'appuyer sur le soleil comme source d'énergie propre." },
        { title: "Solutions sur mesure", text: "Une installation conçue selon les besoins de chaque projet." },
        { title: "De l'étude à la mise en service", text: "Un accompagnement à chaque étape." },
      ],
      seoTitle: "Installation énergie solaire en Algérie | Fermes intelligentes - KMS",
      seoDescription:
        "Installation d'énergie solaire en Algérie : étude, fourniture et pose pour maisons, entreprises et fermes intelligentes. KMS, Touggourt. Demandez un devis.",
    },
    keywords: {
      ar: ["الطاقة الشمسية في الجزائر", "تركيب الألواح الشمسية", "المزارع الذكية"],
      fr: ["Installation énergie solaire", "énergie solaire Algérie", "fermes intelligentes"],
    },
  },
  {
    slug: "securite-videosurveillance",
    icon: "cctv",
    image: "/images/services/cctv.webp",
    imageAlt: { ar: "كاميرا مراقبة مثبّتة على واجهة مبنى", fr: "Caméra de vidéosurveillance fixée sur une façade" },
    ar: {
      title: "أنظمة الأمن والمراقبة",
      short: "تركيب كاميرات المراقبة (CCTV) وحلول أمنية متكاملة للمؤسسات والمنازل.",
      intro:
        "نصمّم ونركّب أنظمة المراقبة بالفيديو والحلول الأمنية المتكاملة للمؤسسات والمنازل، لتأمين المحيط ومتابعته بطريقة واضحة وعملية، مع تركيب منظّم وتهيئة للتجهيزات.",
      features: [
        "تركيب كاميرات المراقبة (CCTV)",
        "أنظمة المراقبة بالفيديو",
        "حلول أمنية متكاملة للمؤسسات والمنازل",
        "تركيب منظّم وتهيئة التجهيزات",
      ],
      benefits: [
        { title: "أمان أكبر", text: "مراقبة المداخل والمحيط للمؤسسات والمنازل." },
        { title: "حل متكامل", text: "تجهيزات وتركيب وتهيئة ضمن مشروع واحد." },
        { title: "مرافقة بعد التركيب", text: "دعم ومتابعة مستمرة." },
      ],
      seoTitle: "تركيب كاميرات المراقبة في الجزائر وتقرت | أنظمة أمنية - KMS",
      seoDescription:
        "تركيب كاميرات المراقبة CCTV وأنظمة الأمن في الجزائر وتقرت للمنازل والمؤسسات. شركة كات متعددة الخدمات: حلول أمنية متكاملة. اطلبوا عرض سعر.",
    },
    fr: {
      title: "Sécurité et Vidéosurveillance",
      short: "Installation de caméras (CCTV) et solutions de sécurité complètes pour entreprises et habitations.",
      intro:
        "Nous concevons et installons des systèmes de vidéosurveillance et des solutions de sécurité complètes pour les entreprises et les habitations, afin de sécuriser et suivre vos lieux de façon claire et pratique, avec une installation soignée et un paramétrage des équipements.",
      features: [
        "Installation de caméras de surveillance (CCTV)",
        "Systèmes de vidéosurveillance",
        "Solutions de sécurité complètes pour entreprises et habitations",
        "Installation soignée et configuration des équipements",
      ],
      benefits: [
        { title: "Plus de sécurité", text: "Surveillance des accès et des abords des entreprises et habitations." },
        { title: "Solution complète", text: "Équipements, pose et configuration dans un même projet." },
        { title: "Accompagnement après installation", text: "Support et suivi continus." },
      ],
      seoTitle: "Installation vidéosurveillance en Algérie et à Touggourt | KMS",
      seoDescription:
        "Installation de caméras de vidéosurveillance CCTV et systèmes de sécurité en Algérie et à Touggourt pour entreprises et habitations. KMS. Devis gratuit.",
    },
    keywords: {
      ar: ["تركيب كاميرات المراقبة", "كاميرات مراقبة تقرت", "أنظمة الأمن والمراقبة"],
      fr: ["Installation vidéosurveillance Algérie", "caméras CCTV", "sécurité vidéosurveillance"],
    },
  },
  {
    slug: "alucobond-facades",
    icon: "facade",
    image: "/images/services/alucobond.webp",
    imageAlt: { ar: "واجهة مبنى حديثة مكسوّة بالألوكوبوند", fr: "Façade moderne habillée en Alucobond" },
    ar: {
      title: "الألمنيوم وواجهات المباني",
      short: "تركيب واجهات الألوكوبوند الحديثة بتصميم عصري ومتانة عالية.",
      intro:
        "نقوم بتركيب واجهات الألوكوبوند وتكسية واجهات المباني بتصميم عصري ومتانة عالية، لمنح مبناكم مظهراً حديثاً وراقياً سواء كان مسكناً أو مقراً مهنياً أو تجارياً.",
      features: [
        "تركيب واجهات الألوكوبوند (Alucobond)",
        "تكسية واجهات المباني (Habillage de façade)",
        "تصميم عصري ومتانة عالية",
        "للمباني السكنية والتجارية والمهنية",
      ],
      benefits: [
        { title: "مظهر عصري", text: "واجهات تمنح المبنى هوية معمارية حديثة." },
        { title: "متانة", text: "مواد وتركيب مصممان لتدوم." },
        { title: "تنفيذ دقيق", text: "عناية بالتفاصيل والتشطيبات." },
      ],
      seoTitle: "واجهات الألوكوبوند وتكسية المباني في الجزائر | KMS تقرت",
      seoDescription:
        "تركيب واجهات الألوكوبوند وتكسية واجهات المباني بتصميم عصري ومتانة عالية في الجزائر وتقرت. شركة كات متعددة الخدمات. اطلبوا عرض سعر.",
    },
    fr: {
      title: "Alucobond – Habillage de Façade",
      short: "Pose de façades en Alucobond, au design moderne et d'une grande durabilité.",
      intro:
        "Nous réalisons la pose de façades en Alucobond et l'habillage de façades de bâtiments, avec un design moderne et une grande durabilité, pour donner à votre bâtiment, résidentiel, commercial ou professionnel, une image contemporaine et soignée.",
      features: [
        "Pose de façades en Alucobond",
        "Habillage de façade de bâtiments",
        "Design moderne et grande durabilité",
        "Pour bâtiments résidentiels, commerciaux et professionnels",
      ],
      benefits: [
        { title: "Image moderne", text: "Des façades qui donnent une identité architecturale contemporaine." },
        { title: "Durabilité", text: "Matériaux et pose pensés pour durer." },
        { title: "Exécution soignée", text: "Attention portée aux détails et aux finitions." },
      ],
      seoTitle: "Alucobond et habillage de façade en Algérie | KMS Touggourt",
      seoDescription:
        "Pose d'Alucobond et habillage de façade au design moderne et durable en Algérie et à Touggourt. SARL KAT Multi Services. Demandez un devis.",
    },
    keywords: {
      ar: ["الألوكوبوند", "واجهات المباني", "تكسية الواجهات"],
      fr: ["Alucobond", "habillage de façade", "façade Alucobond Algérie"],
    },
  },
  {
    slug: "amenagement-espaces-residentiels",
    icon: "layout",
    image: "/images/services/space-planning.webp",
    imageAlt: { ar: "مسكن قيد التجديد والتهيئة الداخلية", fr: "Logement en cours de rénovation et d'aménagement intérieur" },
    ar: {
      title: "تقسيم المساحات السكنية",
      short: "تهيئة وتقسيم المساحات السكنية وأشغال التجديد والديكور الداخلي.",
      intro:
        "نساعدكم على استغلال مساحة مسكنكم بأفضل شكل عبر تقسيم وتهيئة المساحات السكنية، مع أشغال التجديد والتهيئة والديكور الداخلي للمساحات السكنية والمهنية.",
      features: [
        "تقسيم وتهيئة المساحات السكنية",
        "أشغال التجديد والتهيئة",
        "الديكور الداخلي",
        "للمساحات السكنية والمهنية",
      ],
      benefits: [
        { title: "استغلال أمثل للمساحة", text: "تنظيم الفضاءات حسب طريقة استعمالها." },
        { title: "تجديد شامل", text: "أشغال تجديد وتشطيب وطلاء ضمن مشروع واحد." },
        { title: "مظهر متناسق", text: "ديكور منسجم مع طابع المكان." },
      ],
      seoTitle: "تقسيم المساحات السكنية والتجديد والديكور في تقرت | KMS",
      seoDescription:
        "تقسيم وتهيئة المساحات السكنية، أشغال التجديد والديكور الداخلي في تقرت والجزائر مع شركة كات متعددة الخدمات. اطلبوا عرض سعر.",
    },
    fr: {
      title: "Aménagement des espaces résidentiels",
      short: "Aménagement et agencement d'espaces résidentiels, travaux de rénovation et décoration intérieure.",
      intro:
        "Nous vous aidons à tirer le meilleur parti de votre logement grâce à l'aménagement et à la répartition des espaces résidentiels, avec des travaux de rénovation, d'aménagement et de décoration intérieure pour espaces résidentiels et professionnels.",
      features: [
        "Aménagement et répartition des espaces résidentiels",
        "Travaux de rénovation et d'aménagement",
        "Décoration intérieure",
        "Pour espaces résidentiels et professionnels",
      ],
      benefits: [
        { title: "Espace optimisé", text: "Des volumes organisés selon vos usages." },
        { title: "Rénovation complète", text: "Rénovation, finitions et peinture dans un même projet." },
        { title: "Rendu harmonieux", text: "Une décoration cohérente avec le caractère des lieux." },
      ],
      seoTitle: "Aménagement d'espaces résidentiels, rénovation et décoration à Touggourt | KMS",
      seoDescription:
        "Aménagement des espaces résidentiels, rénovation et décoration intérieure à Touggourt et en Algérie. SARL KAT Multi Services. Demandez un devis.",
    },
    keywords: {
      ar: ["تقسيم المساحات السكنية", "تجديد المساكن", "الديكور الداخلي"],
      fr: ["Aménagement des espaces résidentiels", "rénovation Algérie", "décoration intérieure"],
    },
  },
  {
    slug: "bureaux-logements",
    icon: "office",
    image: "/images/services/office-furnishing.webp",
    imageAlt: { ar: "مكتب مجهّز بمكاتب وكراسي ونوافذ مضيئة", fr: "Bureau équipé de postes de travail et de fenêtres lumineuses" },
    ar: {
      title: "توريد وتجهيز المكاتب والسكنات",
      short: "توريد وتجهيز المكاتب والسكنات لتصبح جاهزة للاستعمال.",
      intro:
        "نوفّر لكم توريد وتجهيز المكاتب والسكنات، لتنتقلوا من مرحلة الإنجاز إلى مرحلة الاستعمال بسهولة، مع تناسق بين البناء والتجهيز ومرافقة من البداية إلى التسليم.",
      features: [
        "توريد وتجهيز المكاتب",
        "توريد وتجهيز السكنات",
        "تهيئة فضاءات العمل والإقامة",
        "تناسق بين البناء والتجهيز",
      ],
      benefits: [
        { title: "جاهزية للاستعمال", text: "تسليم فضاءات مجهّزة وجاهزة للعمل أو السكن." },
        { title: "تناسق شامل", text: "تجهيز منسجم مع أشغال البناء والتهيئة." },
        { title: "متابعة من الألف إلى الياء", text: "مرافقة في كل مراحل المشروع." },
      ],
      seoTitle: "تجهيز المكاتب والسكنات في الجزائر وتقرت | KMS",
      seoDescription:
        "توريد وتجهيز المكاتب والسكنات في تقرت والجزائر. شركة كات متعددة الخدمات: مرافقة من البناء إلى التجهيز. اطلبوا عرض سعر.",
    },
    fr: {
      title: "Fourniture et aménagement de bureaux et logements",
      short: "Fourniture et aménagement de bureaux et de logements, prêts à l'emploi.",
      intro:
        "Nous assurons la fourniture et l'aménagement de vos bureaux et logements, pour passer facilement de la réalisation à l'usage, avec une cohérence entre construction et équipement et un accompagnement jusqu'à la livraison.",
      features: [
        "Fourniture et aménagement de bureaux",
        "Fourniture et aménagement de logements",
        "Aménagement d'espaces de travail et d'habitation",
        "Cohérence entre construction et équipement",
      ],
      benefits: [
        { title: "Prêt à l'emploi", text: "Des espaces livrés équipés, prêts à travailler ou à habiter." },
        { title: "Cohérence globale", text: "Un équipement en phase avec les travaux de construction et d'aménagement." },
        { title: "Suivi de A à Z", text: "Un accompagnement à toutes les étapes du projet." },
      ],
      seoTitle: "Aménagement de bureaux et logements en Algérie et à Touggourt | KMS",
      seoDescription:
        "Fourniture et aménagement de bureaux et de logements à Touggourt et en Algérie. KMS vous accompagne de la construction à l'équipement. Devis gratuit.",
    },
    keywords: {
      ar: ["تجهيز المكاتب", "توريد وتجهيز المكاتب والسكنات", "تجهيز السكنات"],
      fr: ["aménagement de bureaux", "fourniture bureaux et logements", "équipement bureaux Algérie"],
    },
  },
  {
    slug: "electricite-installation",
    icon: "electric",
    image: "/images/services/electrical.webp",
    imageAlt: { ar: "لوحة كهربائية بأسلاك ملوّنة ومنظّمة", fr: "Tableau électrique avec câblage coloré et organisé" },
    ar: {
      title: "الكهرباء والتركيبات",
      short: "تركيبات كهربائية عامة وصناعية مطابقة لمعايير السلامة.",
      intro:
        "ننجز التركيبات الكهربائية العامة والصناعية بما يتوافق مع معايير السلامة، للمنازل والمؤسسات والمشاريع، من تجهيز اللوحات الكهربائية إلى توزيع التمديدات.",
      features: [
        "تركيبات كهربائية عامة",
        "تركيبات كهربائية صناعية",
        "مطابقة لمعايير السلامة",
        "للمنازل والمؤسسات والمشاريع",
      ],
      benefits: [
        { title: "سلامة أولاً", text: "أشغال تحترم معايير السلامة الكهربائية." },
        { title: "تنظيم ووضوح", text: "تمديدات ولوحات منظّمة وسهلة الصيانة." },
        { title: "متعددة الاستعمال", text: "حلول للسكن وللمشاريع المهنية والصناعية." },
      ],
      seoTitle: "تركيب الكهرباء في الجزائر وتقرت | تركيبات كهربائية عامة وصناعية - KMS",
      seoDescription:
        "تركيب الكهرباء والتركيبات الكهربائية العامة والصناعية بمعايير السلامة في تقرت والجزائر. شركة كات متعددة الخدمات. اطلبوا عرض سعر.",
    },
    fr: {
      title: "Électricité – Installation",
      short: "Installations électriques générales et industrielles, selon les normes de sécurité.",
      intro:
        "Nous réalisons des installations électriques générales et industrielles dans le respect des normes de sécurité, pour habitations, entreprises et projets, de la mise en place des tableaux électriques à la distribution des réseaux.",
      features: [
        "Installations électriques générales",
        "Installations électriques industrielles",
        "Selon les normes de sécurité",
        "Pour habitations, entreprises et projets",
      ],
      benefits: [
        { title: "La sécurité d'abord", text: "Des travaux qui respectent les normes de sécurité électrique." },
        { title: "Organisation et clarté", text: "Réseaux et tableaux ordonnés, faciles à maintenir." },
        { title: "Polyvalence", text: "Des solutions pour le résidentiel, le professionnel et l'industriel." },
      ],
      seoTitle: "Installation électrique en Algérie et à Touggourt | KMS",
      seoDescription:
        "Installation électrique générale et industrielle selon les normes de sécurité à Touggourt et en Algérie. SARL KAT Multi Services. Demandez un devis.",
    },
    keywords: {
      ar: ["تركيب الكهرباء", "تركيبات كهربائية", "كهرباء صناعية"],
      fr: ["Installation électrique", "électricité industrielle", "installation électrique Touggourt"],
    },
  },
  {
    slug: "reseaux-informatiques",
    icon: "network",
    image: "/images/services/networks.webp",
    imageAlt: { ar: "خزانة شبكات بكابلات زرقاء منظّمة", fr: "Baie de brassage réseau avec câbles bleus organisés" },
    ar: {
      title: "شبكات المعلومات",
      short: "تركيب وتهيئة شبكات المعلومات والاتصال للشركات والمؤسسات.",
      intro:
        "نقوم بتركيب وتهيئة شبكات المعلومات والاتصال للشركات والمؤسسات، من تمديد الكابلات وتنظيم خزائن الشبكات إلى ضبط التجهيزات، لضمان بنية شبكية منظّمة وموثوقة.",
      features: [
        "تركيب شبكات المعلومات والاتصال",
        "تهيئة وضبط الشبكات (IT)",
        "تمديد الكابلات وتنظيم خزائن الشبكات",
        "للشركات والمؤسسات",
      ],
      benefits: [
        { title: "بنية منظّمة", text: "كابلات وخزائن مرتبة وسهلة الصيانة." },
        { title: "موثوقية", text: "شبكة مهيأة لدعم نشاط المؤسسة." },
        { title: "مرافقة", text: "دعم ومتابعة بعد التركيب." },
      ],
      seoTitle: "شبكات المعلومات وتركيب الشبكات للشركات في الجزائر | KMS تقرت",
      seoDescription:
        "تركيب وتهيئة شبكات المعلومات والاتصال للشركات والمؤسسات في تقرت والجزائر. شركة كات متعددة الخدمات. اطلبوا عرض سعر.",
    },
    fr: {
      title: "Réseaux Informatiques",
      short: "Installation et configuration de réseaux IT pour entreprises et institutions.",
      intro:
        "Nous installons et configurons les réseaux informatiques et de communication des entreprises et institutions, du câblage à l'organisation des baies de brassage et au paramétrage des équipements, pour une infrastructure réseau ordonnée et fiable.",
      features: [
        "Installation de réseaux informatiques et de communication",
        "Configuration des réseaux IT",
        "Câblage et organisation des baies de brassage",
        "Pour entreprises et institutions",
      ],
      benefits: [
        { title: "Infrastructure ordonnée", text: "Câbles et baies rangés, faciles à maintenir." },
        { title: "Fiabilité", text: "Un réseau configuré pour soutenir l'activité de l'entreprise." },
        { title: "Accompagnement", text: "Support et suivi après l'installation." },
      ],
      seoTitle: "Réseaux informatiques en Algérie et à Touggourt | KMS",
      seoDescription:
        "Installation et configuration de réseaux informatiques pour entreprises et institutions à Touggourt et en Algérie. KMS. Demandez un devis.",
    },
    keywords: {
      ar: ["شبكات المعلومات", "تركيب الشبكات", "شبكات الشركات"],
      fr: ["Réseaux informatiques", "installation réseau entreprise", "configuration réseau IT"],
    },
  },
];

export const serviceSlugs = services.map((s) => s.slug);

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}

export function serviceCopy(s: Service, locale: Locale) {
  return s[locale];
}
