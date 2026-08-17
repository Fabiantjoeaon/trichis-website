import ServicePageHero from "@/components/service/ServicePageHero";
import DynamicContent from "@/components/blocks/DynamicContent";
import HomeWhatWeDo from "@/components/home/HomeWhatWeDo";

export default function ServicePage({ service, servicesNav }) {
  if (!service) return null;

  return (
    <>
      <ServicePageHero
        title={service.title}
        header={service.header?.headertext}
        paragraph={service.header?.paragraph}
        cta={service.header?.cta}
      />
      <DynamicContent
        content={service.content}
        page={{ ...service, __typename: "ServiceRecord" }}
      />
      {servicesNav && (
        <HomeWhatWeDo data={servicesNav} currentService={service.slug} />
      )}
    </>
  );
}
