import ServicePageHero from "@/components/service/ServicePageHero";
import DynamicContent from "@/components/blocks/DynamicContent";
import HomeWhatWeDo from "@/components/home/HomeWhatWeDo";
import CTAFooter from "@/components/layout/CTAFooter";
import { NiceToMeetYou } from "@/components/NiceToMeetYou";
import { serviceMap } from "@/lib/constants";

export default function ServicePage({ service }) {
  if (!service) return null;

  return (
    <>
      <ServicePageHero
        title={serviceMap[service.slug] || service.title}
        header={service.header?.headertext}
        paragraph={service.header?.paragraph}
        cta={service.header?.cta}
      />
      <DynamicContent
        content={service.content}
        page={{ ...service, __typename: "ServiceRecord" }}
      />
      <HomeWhatWeDo currentService={service.slug} />
      <CTAFooter />
      <NiceToMeetYou />
    </>
  );
}
