import ServicePageHero from "@/components/service/ServicePageHero";
import WhatWeDoExpertises from "@/components/whatwedo/WhatWeDoExpertises";
import WhatWeDoServiceIdentity from "@/components/whatwedo/services/WhatWeDoServiceIdentity";
import WhatWeDoServiceStrategy from "@/components/whatwedo/services/WhatWeDoServiceStrategy";
import WhatWeDoServiceWebdesign from "@/components/whatwedo/services/WhatWeDoServiceWebdesign";
import WhatWeDoServicePhotoVideo from "@/components/whatwedo/services/WhatWeDoServicePhotoVideo";
import WhatWeDoServiceCampaign from "@/components/whatwedo/services/WhatWeDoServiceCampaign";
import HowWeDoIt from "@/components/home/HowWeDoIt";
import HomeMore from "@/components/home/HomeMore";

export default function WhatWeDoPage({ howWeDoItCards = [] }) {
  return (
    <>
      <ServicePageHero
        title="What we do"
        header="Merkidentiteit ontwikkelen - jouw merk, jouw fundament."
        paragraph={`
          **Waarom blijven klanten terugkomen? Door een merk dat indruk maakt.**
          Wil jij dat jouw merk opvalt en impact maakt? Ontdek hoe een sterke merkidentiteit deuren opent naar meer klanten, vertrouwen en groei.
        `}
        cta={{ text: "Contact", href: "mailto:info@trichis.nl" }}
      />
      <WhatWeDoExpertises />
      <WhatWeDoServiceIdentity />
      <WhatWeDoServiceStrategy />
      <WhatWeDoServiceWebdesign />
      <WhatWeDoServicePhotoVideo />
      <WhatWeDoServiceCampaign />
      <HowWeDoIt cards={howWeDoItCards} />
      <HomeMore />
    </>
  );
}
