import BorderedIcon from "@/components/ui/BorderedIcon";
import SplitText from "@/components/ui/SplitText";
import TransitionLink from "@/components/ui/TransitionLink";
import ColumnRow, { columnRowTypeNames } from "@/components/blocks/ColumnRow";
import WhatWeDoServiceHeader from "../WhatWeDoHeader";

export default function WhatWeDoServiceCampaign() {
  return (
    <div className="wwd-service">
      <WhatWeDoServiceHeader service="Campaigns">
        <div>
          <SplitText tag="p" animateOnScroll>
            Bij Nine ontwikkelen we creatieve marketingcampagnes die opvallen,
            raken en resultaat opleveren. Met een sterke strategie,
            onderscheidende concepten en doelgerichte uitvoering vergroten we
            jouw zichtbaarheid, versterken we je merk en zorgen we voor meetbaar
            succes. Geen losse ideeën, maar campagnes die de juiste snaar raken
            en jouw doelen dichterbij brengen.
          </SplitText>
          <SplitText tag="p" animateOnScroll>
            Zo laten we jouw merk niet alleen opvallen, maar écht impact maken.
          </SplitText>
        </div>
        <TransitionLink href="/service/campaign">
          <BorderedIcon text={"More about <strong>campaigns</strong>"} />
        </TransitionLink>
      </WhatWeDoServiceHeader>
      <ColumnRow
        data={{
          columns: [
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/what-we-do/campaigns.jpeg" },
              width: 100,
            },
          ],
        }}
      />
    </div>
  );
}
