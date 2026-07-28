import BorderedIcon from "@/components/ui/BorderedIcon";
import SplitText from "@/components/ui/SplitText";
import TransitionLink from "@/components/ui/TransitionLink";
import ColumnRow, { columnRowTypeNames } from "@/components/blocks/ColumnRow";
import WhatWeDoServiceHeader from "../WhatWeDoHeader";

export default function WhatWeDoServiceStrategy() {
  return (
    <div className="wwd-service">
      <WhatWeDoServiceHeader service="Strategy">
        <SplitText tag="p" animateOnScroll>
          Bij Nine ontwikkelen we merkstrategieën die richting geven, focus
          brengen en zorgen voor blijvend succes. Met diepgaand onderzoek, een
          heldere positionering en een concreet actieplan helpen we jouw merk
          groeien, relevant blijven en zich onderscheiden van de concurrentie.
        </SplitText>
      </WhatWeDoServiceHeader>
      <ColumnRow
        data={{
          columns: [
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/what-we-do/strategy.jpeg" },
              width: 100,
            },
          ],
        }}
      />
      <div className="wwd-service__strategy-text inner-width">
        <div>
          <SplitText tag="p" animateOnScroll>
            Geen dikke rapporten die in de la belanden, maar een strategie die
            meteen toepasbaar is en meetbaar resultaat oplevert. Zo bouw je
            vandaag aan de toekomst van jouw merk.
          </SplitText>
          <TransitionLink href="/service/strategy">
            <BorderedIcon text={"More about <strong>strategy</strong>"} />
          </TransitionLink>
        </div>
      </div>
    </div>
  );
}
