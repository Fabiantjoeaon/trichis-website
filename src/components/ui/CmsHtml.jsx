import SplitText from "@/components/ui/SplitText";
import { convertMultiParagraphToNineFormat } from "@/lib/cms";

export default function CmsHtml({
  text,
  animateOnScroll = true,
  className = "",
}) {
  const formatted = convertMultiParagraphToNineFormat(text);
  if (!formatted.length) return null;

  return formatted.map((block, i) => {
    if (block.static) {
      return (
        <div
          key={i}
          className={`cms-html cms-html--${block.tag} ${className}`.trim()}
          style={block.textAlign ? { textAlign: block.textAlign } : undefined}
          dangerouslySetInnerHTML={{
            __html: `<${block.tag}>${block.text}</${block.tag}>`,
          }}
        />
      );
    }

    return (
      <SplitText
        key={i}
        tag={block.tag}
        className={className}
        {...(block.textAlign ? { style: { textAlign: block.textAlign } } : {})}
        animateOnScroll={animateOnScroll}
        dangerouslySetInnerHTML={block.html ? { __html: block.text } : false}
      >
        {block.html ? null : block.text}
      </SplitText>
    );
  });
}
