import HomeHero from "./HomeHero";
import HomeWhoWeAre from "./HomeWhoWeAre";
import HomeWhatWeDo from "./HomeWhatWeDo";
import HowWeDoIt from "./HowWeDoIt";
import HomeMore from "./HomeMore";
import HomeWhatWeveCreated from "./HomeWhatWeveCreated";
import HomeShowReel from "./HomeShowReel";
import FormSection from "@/components/blocks/FormSection";
import { NiceToMeetYou } from "@/components/NiceToMeetYou";
import { QUICKSCAN_FORM } from "@/lib/constants";

export default function HomePage({ projects = [], howWeDoItCards = [] }) {
  return (
    <>
      <HomeHero />
      <HomeWhoWeAre />
      <HomeWhatWeDo />
      <HowWeDoIt cards={howWeDoItCards} />
      <HomeMore />
      <HomeWhatWeveCreated projects={projects} />
      <HomeShowReel />
      <FormSection data={QUICKSCAN_FORM} />
      <NiceToMeetYou />
    </>
  );
}
