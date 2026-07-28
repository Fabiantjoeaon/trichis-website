export const serviceMap = {
  identity: "Identity",
  webdesign: "Webdesign",
  "photo-video": "Photo & video",
  campaign: "Campaign",
  strategy: "Strategy",
};

export const SERVICE_IMAGE_URLS = {
  campaign: "/images/services/campaign.webp",
  identity: "/images/services/identity.webp",
  webdesign: "/images/services/web-design.webp",
  "photo-video": "/images/services/photo-video.webp",
  strategy: "/images/services/strategy.webp",
};

export const VIDEO_PLAYER_PLAY = "VideoPlayer:PLAY";
export const VIDEO_PLAYER_STOP = "VideoPlayer:STOP";

export const MEET_IMAGE_COUNT = 27;

export const QUICKSCAN_FORM = {
  title: "Wil je een gratis <strong>Quickscan?</strong>",
  subtitle: "Neem contact op en wij laten je zien waar de kansen liggen!",
  ctaText: "Verzenden",
  successTitle: "Bedankt voor je reactie",
  successMessage:
    "We komen zo snel mogelijk bij je terug. Kijk in de tussentijd voor meer inspiratie ;)",
  formName: "quickscan",
  formFields: [
    {
      label: "Naam",
      name: "naam",
      fieldType: "text",
      required: true,
      width: "half",
      placeholder: "Je volledige naam",
    },
    {
      label: "Bedrijfsnaam",
      name: "bedrijfsnaam",
      fieldType: "text",
      required: true,
      width: "half",
      placeholder: "Je bedrijfsnaam",
    },
    {
      label: "Emailadres",
      name: "email",
      fieldType: "email",
      required: true,
      width: "half",
      placeholder: "naam@bedrijf.nl",
    },
    {
      label: "Waar ben je naar op zoek?",
      name: "type",
      fieldType: "checkbox",
      required: true,
      width: "half",
      options:
        "Quickscan,Strategie,Brand Identity,Graphic Design,Beeld Visuals,Creatieve Campagne,Werving & Employer Branding,Online Marketing,Website,AI Oplossingen",
    },
    {
      label: "Bericht",
      name: "bericht",
      fieldType: "longtext",
      required: true,
      width: "full",
      placeholder: "Vertel ons meer over je project...",
    },
  ],
};
