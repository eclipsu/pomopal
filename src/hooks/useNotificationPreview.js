import { useMemo } from "react";
import { hasPreviewContent, renderTemplate } from "@/utils/renderTemplate";

const DEFAULT_CONTEXT = () => ({
  streak: 7,
  daysAway: 5,
  today: new Date().toISOString().slice(0, 10),
});

export function buildLocalPreview({
  templateId,
  templates = [],
  title = "",
  body = "",
  type = "announcement",
  context = {},
  fallbackTitle = "Notification",
  fallbackBody = "",
}) {
  const ctx = { ...DEFAULT_CONTEXT(), ...context };

  if (templateId) {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return null;
    return {
      title: renderTemplate(t.title, ctx),
      body: renderTemplate(t.body, ctx),
      type: t.type,
      imageUrl: t.image_url,
    };
  }

  const renderedTitle = renderTemplate(title.trim() || fallbackTitle, ctx);
  const renderedBody = renderTemplate(body || fallbackBody, ctx);

  if (!hasPreviewContent(renderedTitle, renderedBody)) return null;

  return {
    title: renderedTitle,
    body: renderedBody,
    type,
    imageUrl: undefined,
  };
}

export function useLocalNotificationPreview(options) {
  const {
    templateId,
    templates,
    title,
    body,
    type,
    context,
    fallbackTitle,
    fallbackBody,
  } = options;

  return useMemo(
    () =>
      buildLocalPreview({
        templateId,
        templates,
        title,
        body,
        type,
        context,
        fallbackTitle,
        fallbackBody,
      }),
    [
      templateId,
      templates,
      title,
      body,
      type,
      fallbackTitle,
      fallbackBody,
      context?.streak,
      context?.daysAway,
      context?.today,
    ],
  );
}

export function resolvePreviewImage({ selectedImageKey, libraryImages, templateImageUrl }) {
  if (selectedImageKey) {
    const fromLibrary = libraryImages?.find((img) => img.key === selectedImageKey);
    if (fromLibrary?.url) return fromLibrary.url;
    return selectedImageKey;
  }
  return templateImageUrl ?? null;
}
