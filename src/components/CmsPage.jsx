import DynamicContent from "@/components/blocks/DynamicContent";

/**
 * Renders a CMS page: whatever blocks the editor stacked, in their order.
 * `projects` is forwarded to the blocks that list projects.
 */
export default function CmsPage({ content = [], projects = [] }) {
  return <DynamicContent content={content} page={{ projects }} />;
}
