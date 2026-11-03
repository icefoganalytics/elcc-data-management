import sanitizeHtml, { type IOptions } from "sanitize-html"

const ALLOWED_TAGS = [
  "address",
  "article",
  "blockquote",
  "br",
  "caption",
  "code",
  "dd",
  "div",
  "dl",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]

// Preserve the previous sanitizer's discarded subtrees, except explicitly allowlisted tags.
const DISCARDED_CONTENT_TAGS = [
  "a",
  "annotation-xml",
  "audio",
  "button",
  "colgroup",
  "desc",
  "foreignobject",
  "form",
  "head",
  "iframe",
  "label",
  "math",
  "mi",
  "mn",
  "mo",
  "ms",
  "mtext",
  "noembed",
  "noframes",
  "noscript",
  "object",
  "option",
  "plaintext",
  "script",
  "select",
  "selectedcontent",
  "style",
  "svg",
  "template",
  "textarea",
  "title",
  "video",
  "xmp",
]
const DISCARDED_CONTENT_SELECTOR = DISCARDED_CONTENT_TAGS.join(", ")

const TRUSTED_STYLES =
  "body{color:#1f2937;font-family:Arial,sans-serif;line-height:1.5;margin:1rem}table{border-collapse:collapse;max-width:100%}th,td{border:1px solid #6b7280;padding:.25rem .5rem;text-align:left}pre{max-width:100%;overflow-wrap:anywhere;white-space:pre-wrap}"

const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "base-uri 'none'",
  "child-src 'none'",
  "connect-src 'none'",
  "font-src 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "img-src 'none'",
  "manifest-src 'none'",
  "media-src 'none'",
  "object-src 'none'",
  "script-src 'none'",
  "style-src 'sha256-zYcMA6eYaO1uOYCbrfsThhfE9COVCUumE5aaPiq52nk='",
  "worker-src 'none'",
].join("; ")

const SANITIZER_CONFIG: IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    "*": ["colspan", "rowspan", "scope"],
  },
  nonTextTags: DISCARDED_CONTENT_TAGS,
  parseStyleAttributes: false,
}

export function buildCloudflareResponsePreviewDocument(html: string): string {
  // Browser parsing preserves whole control and raw-text subtrees that htmlparser2 can split.
  const template = document.createElement("template")
  template.innerHTML = html
  template.content
    .querySelectorAll(`${DISCARDED_CONTENT_SELECTOR}, [hidden]`)
    .forEach((element) => {
      element.remove()
    })

  const sanitizedHtml = sanitizeHtml(template.innerHTML, SANITIZER_CONFIG)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">
    <meta name="referrer" content="no-referrer">
    <style>${TRUSTED_STYLES}</style>
  </head>
  <body>${sanitizedHtml}</body>
</html>`
}

export default buildCloudflareResponsePreviewDocument
