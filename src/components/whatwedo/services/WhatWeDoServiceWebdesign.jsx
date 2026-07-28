import BorderedIcon from "@/components/ui/BorderedIcon";
import SplitText from "@/components/ui/SplitText";
import TransitionLink from "@/components/ui/TransitionLink";
import ColumnRow, { columnRowTypeNames } from "@/components/blocks/ColumnRow";
import WhatWeDoServiceHeader from "../WhatWeDoHeader";

export default function WhatWeDoServiceWebdesign() {
  return (
    <div className="wwd-service">
      <WhatWeDoServiceHeader
        fullServiceName="Webdesign"
        service="Web-"
        serviceBottom="design"
      >
        <div>
          <SplitText tag="p" animateOnScroll>
            Een professionele website is meer dan een mooi plaatje – het is een
            krachtig middel om klanten te overtuigen. Bij Nine draait webdesign
            om strategie, gebruiksgemak en een uitstraling die perfect past bij
            jouw merk.
          </SplitText>
          <SplitText tag="p" animateOnScroll>
            Een goed ontwerp vergroot betrokkenheid, verhoogt conversies en
            versterkt je merk. Met de juiste structuur en visuele impact wordt
            jouw site een basis voor groei en online succes.
          </SplitText>
        </div>
        <TransitionLink href="/service/webdesign">
          <BorderedIcon text={"More about <strong>webdesign</strong>"} />
        </TransitionLink>
      </WhatWeDoServiceHeader>
      <ColumnRow
        data={{
          columns: [
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/what-we-do/webdesign1.jpeg" },
              width: 70,
            },
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/what-we-do/webdesign2.jpeg" },
              width: 30,
            },
          ],
        }}
      />
      <ColumnRow
        data={{
          columns: [
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/what-we-do/webdesign3.mp4" },
              width: 100,
            },
          ],
        }}
      />
    </div>
  );
}
