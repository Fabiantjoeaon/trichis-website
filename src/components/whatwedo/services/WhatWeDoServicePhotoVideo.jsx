import BorderedIcon from "@/components/ui/BorderedIcon";
import SplitText from "@/components/ui/SplitText";
import TransitionLink from "@/components/ui/TransitionLink";
import ColumnRow, { columnRowTypeNames } from "@/components/blocks/ColumnRow";
import WhatWeDoServiceHeader from "../WhatWeDoHeader";

export default function WhatWeDoServicePhotoVideo() {
  return (
    <div className="wwd-service">
      <WhatWeDoServiceHeader
        fullServiceName="Photo / Video"
        service="Photo /"
        serviceBottom="video"
      >
        <div>
          <SplitText tag="p" animateOnScroll>
            Sterke foto’s en video’s maken jouw merk herkenbaar, betrouwbaar en
            onvergetelijk. Bij Nine draait visuele content om beelden die emotie
            oproepen, overtuigen en jouw verhaal tot leven brengen.
          </SplitText>
          <SplitText tag="p" animateOnScroll>
            Professionele visuals vergroten aandacht, bouwen vertrouwen op en
            versterken je merk. Met strategisch ontworpen en perfect afgewerkte
            content zorgen we dat jouw boodschap blijft hangen.
          </SplitText>
          <SplitText tag="p" animateOnScroll>
            Zo maken we van jouw merk een visueel verhaal dat raakt én resultaat
            oplevert.
          </SplitText>
        </div>
        <TransitionLink href="/service/photo-video">
          <BorderedIcon text={"More about <strong>photo / video</strong>"} />
        </TransitionLink>
      </WhatWeDoServiceHeader>
      <ColumnRow
        data={{
          columns: [
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/what-we-do/photo.jpeg" },
              width: 100,
            },
          ],
        }}
      />
      <ColumnRow
        data={{
          columns: [
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/what-we-do/photo2.mp4" },
              width: 100,
            },
          ],
        }}
      />
    </div>
  );
}
