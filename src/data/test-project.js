import { assignAnchors } from "../lib/normalize.js";

// Standalone preview content. This does not enter the live CMS project lists.
const photo = (url, width, height, alt) => ({ url, width, height, alt, isVideo: false });
const media = {
  hero: photo("/images/about-us/collage.jpeg", 2000, 1125, "Voorbeeldcollage voor het testproject"),
  portrait: photo("/images/about-us/rotterdam.jpeg", 1600, 2000, "Voorbeeld van een staande foto"),
  identity: photo("/images/what-we-do/identity1.jpeg", 2000, 2000, "Voorbeeld van visuele identiteit"),
  campaign: photo("/images/what-we-do/campaigns.jpeg", 2000, 1125, "Voorbeeld van een campagnebeeld"),
  photography: photo("/images/what-we-do/photo.jpeg", 2000, 1429, "Voorbeeld van fotografie"),
  web: photo("/images/what-we-do/webdesign1.jpeg", 2000, 1429, "Voorbeeld van een website"),
  video: { url: "/video/showreel.mp4", width: 1920, height: 1080, isVideo: true, alt: "Voorbeeldvideo" },
  mobileVideo: { url: "/video/showreel_mobile.mp4", width: 1080, height: 1920, isVideo: true, alt: "Voorbeeldvideo voor mobiel" },
};
const image = (asset, width = 100, mobileWidth = 100) => ({
  __typename: "ImagecolumnRecord", image: asset, width, mobileWidth,
});
const empty = (width) => ({ __typename: "EmptycolumnRecord", width, mobileWidth: 0 });
const text = (html, width = 100, options = {}) => ({
  __typename: "TextcolumnRecord", text: html, width, mobileWidth: 100, align: "center", ...options,
});
const row = (columns, glyphs = []) => ({ __typename: "ColumnrowRecord", columns, glyphs });
const section = (title) => ({ __typename: "SectionlineRecord", title });
const seo = { noindex: true, description: "Testproject met fictieve inhoud en voorbeelden van alle projectblokken." };

const content = [
  {
    __typename: "ProjectheaderRecord", sectionTitle: "Testproject · De vraag",
    bigTitle: "Een verhaal dat je bijblijft",
    paragraph: "<p>Dit is een testproject met fictieve tekst en bestaande beelden als voorbeeldmateriaal. Hier kun je alle projectblokken, animaties en interactieve onderdelen bekijken.</p><p>Van een eerste idee naar een herkenbare identiteit: we geven Studio Morgen een verhaal dat mensen begrijpen, onthouden en doorvertellen.</p>",
  },
  row([image(media.identity)]),
  section("Ons werk"),
  row([
    text("<h3>Van eerste vraag naar helder verhaal</h3><p>We beginnen met luisteren. Wat maakt deze organisatie bijzonder? En wat moet het publiek voelen, weten of doen?</p><p>Daar maken we een <strong>helder verhaal</strong> van. Met ruimte voor <em>karakter</em>, uitgesproken keuzes en een herkenbare visuele stijl.</p>", 48, { align: "top" }),
    empty(52),
  ]),
  row([empty(25), image(media.campaign, 75)], [
    { variant: "services", column: 0, x: 4, y: 45, width: 30, rotation: 0, layer: "above", mobileX: 4, mobileY: 5, mobileWidth: 24 },
  ]),
  section("Het resultaat"),
  row([image(media.hero)]),
  row([
    image(media.portrait, 42),
    text("<h3>Eén herkenbare uitstraling</h3><p>Een sterke identiteit werkt overal: op papier, in een campagne en op je website. We maken de vertaling naar elk contactmoment.</p><ul><li>Een herkenbare visuele identiteit</li><li>Een helder verhaal voor de juiste doelgroep</li><li>Een samenhangende campagne, online en offline</li></ul>", 58, {
      cta: { text: "Bekijk de vragen", url: "#accordion", isExternal: false },
    }),
  ], [
    { variant: "question", column: 2, x: 90, y: 8, width: 12, rotation: 12, layer: "above", hideOnMobile: true },
  ]),
  section("Beeld naast beeld"),
  row([image(media.photography, 50), image(media.web, 50)], [
    { variant: "work-left", column: 0, x: 49, y: 2, width: 24, rotation: -15, flip: true, layer: "behind", mobileX: 88, mobileY: 49, mobileWidth: 25 },
  ]),
  section("Verhalen in beweging"),
  row([image(media.video)]),
  {
    __typename: "AccordionRecord", title: "Wat vragen?", media: media.portrait,
    items: [
      { question: "Hebben jullie alleen de identiteit ontworpen?", answer: "<p>In dit fictieve project loopt alles door: van strategie en verhaal tot ontwerp, fotografie en de vertaling naar een campagne.</p><p>Zo voelt elk onderdeel als één geheel.</p>" },
      { question: "Moeten wij alle teksten zelf aanleveren?", answer: "<p>Dat hoeft niet. We kunnen samen de inhoud bepalen en de teksten schrijven of aanscherpen.</p><ul><li>Een kennismaking met het team</li><li>Een heldere inhoudelijke richting</li><li>Teksten die passen bij het merk</li></ul>" },
      { question: "Wat als we nog geen idee hebben wat erin moet?", answer: "<p>Dan beginnen we bij de vraag achter de vraag. Samen maken we duidelijk wat je wilt vertellen en aan wie.</p><p><a href=\"#project-numbers\">Bekijk de voorbeeldresultaten.</a></p>" },
      { question: "Kunnen jullie ook na de lancering helpen?", answer: "<p>Zeker. In dit voorbeeld blijven we meedenken over nieuwe middelen, campagnes en verdere ontwikkeling.</p>" },
    ],
  },
  section("Hun woorden"),
  row([
    empty(20),
    text('<blockquote style="text-align: center"><p>“Ze stelden precies de vragen die we zelf nog niet hadden gesteld. Nu hebben we een verhaal dat echt bij ons past.”</p><cite>Robin de Vries — fictieve opdrachtgever, Studio Morgen</cite></blockquote>', 60),
    empty(20),
  ], [
    { variant: "work-right", column: 0, x: 94, y: 3, width: 35, layer: "above", mobileX: 96, mobileY: 0, mobileWidth: 22 },
  ]),
  row([image(media.campaign)]),
  section("Ruimte voor tekst"),
  row([empty(15), text('<h3 style="text-align: center">Een verhaal met ruimte</h3><p style="text-align: center">Deze tekst staat in het midden van de pagina. Je kunt hier een korte introductie, een conclusie of een persoonlijke boodschap plaatsen.</p><p style="text-align: center"><strong>Een helder idee verdient een heldere vorm.</strong></p>', 70), empty(15)]),
  row([
    text("<h3>Links</h3><p>Een korte tekst die links uitlijnt. Compact, helder en to the point.</p>", 34, { textAlign: "left", align: "top" }),
    text("<h3>Midden</h3><p>Een korte tekst met een centrale plaats in het verhaal.</p>", 33, { textAlign: "center", align: "top" }),
    text("<h3>Rechts</h3><p>Een korte tekst die rechts uitlijnt, als tegenwicht in de compositie.</p>", 33, { textAlign: "right", align: "top" }),
  ]),
  section("Een losse alinea"),
  {
    __typename: "ParagraphRecord",
    content: "<p>Niet elke gedachte heeft een groot beeld nodig. Soms is een alinea genoeg om het verhaal verder te brengen.</p><p>Deze fictieve case laat zien hoe korte en langere teksten naast beeld kunnen bestaan, zonder het ritme van de pagina te verliezen.</p>",
  },
  {
    __typename: "ProjectnumberRecord", sectionTitle: "Voorbeeldresultaten · fictieve cijfers",
    titleLeft: "Een verhaal dat werkt.", titleRight: "Van idee naar impact.",
    numbers: [
      { number: "120%", text: "Meer aandacht voor het verhaal — een fictief resultaat om deze weergave te testen." },
      { number: "3", text: "Verschillende middelen, met één herkenbare uitstraling." },
      { number: "1", text: "Gezamenlijk verhaal dat richting geeft aan alle communicatie." },
    ],
  },
  { __typename: "CtasectionRecord", title: "Tijd voor koffie?", ctaText: "Terug naar het begin", ctaLink: "/project/test-project/#project-header" },
];

export const testProject = {
  id: "demo-project", slug: "test-project", title: "Testproject — alle onderdelen", year: "2026",
  coverImage: media.hero, mobileCoverImage: media.portrait, seo,
  deliverables: ["Branding", "Copy", "Print", "Social"].map((title, i) => ({ id: `demo-${i}`, title })),
  content: assignAnchors(content),
};

export const companionProjects = [
  { id: "demo-image", slug: "test-project/image", title: "Testproject — beeld", coverImage: media.campaign, mobileCoverImage: media.portrait },
  { id: "demo-video", slug: "test-project/video", title: "Testproject — video", coverImage: media.video, mobileCoverImage: media.mobileVideo },
].map((project) => ({
  ...project, year: "2026", seo, deliverables: [{ title: "Voorbeeldproject" }],
  content: assignAnchors([
    { __typename: "ProjectheaderRecord", sectionTitle: "Testproject", bigTitle: project.title, paragraph: "<p>Dit is een fictief vervolgproject om de projectnavigatie en media te testen. Op mobiel wordt de mobiele cover gebruikt.</p>" },
    row([image(project.coverImage)]),
    { __typename: "CtasectionRecord", title: "Verder testen?", ctaText: "Terug naar alle onderdelen", ctaLink: "/project/test-project/" },
  ]),
}));
