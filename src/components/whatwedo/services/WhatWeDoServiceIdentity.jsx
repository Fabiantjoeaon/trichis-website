import BorderedIcon from "@/components/ui/BorderedIcon";
import SplitText from "@/components/ui/SplitText";
import ColumnRow, { columnRowTypeNames } from "@/components/blocks/ColumnRow";
import WhatWeDoServiceHeader from "../WhatWeDoHeader";

export default function WhatWeDoServiceIdentity() {
  return (
    <div className="wwd-service">
      <WhatWeDoServiceHeader service="Identity">
        <SplitText tag="p" animateOnScroll>
          Een sterke merkidentiteit is het fundament voor zichtbaarheid,
          vertrouwen en groei. Bij Nine draait branding om een uniek, consistent
          en authentiek verhaal dat klanten aantrekt én behoudt. Een krachtige
          identiteit zorgt voor meer klanten, loyaliteit, herkenning en een
          sterke marktpositie. Met de juiste uitstraling wordt jouw merk
          onvergetelijk.
        </SplitText>
        <BorderedIcon
          text={"More about <strong>identities</strong>"}
          href="/service/identity"
        />
      </WhatWeDoServiceHeader>
      <ColumnRow
        data={{
          columns: [
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/what-we-do/identity1.jpeg" },
              width: 50,
            },
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/what-we-do/identity2.webp" },
              width: 50,
            },
          ],
        }}
      />
    </div>
  );
}
