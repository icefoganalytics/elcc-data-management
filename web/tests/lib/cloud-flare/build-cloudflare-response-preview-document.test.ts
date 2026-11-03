import buildCloudflareResponsePreviewDocument from "@/lib/cloud-flare/build-cloudflare-response-preview-document"

describe("web/src/lib/cloud-flare/build-cloudflare-response-preview-document.ts", () => {
  describe("buildCloudflareResponsePreviewDocument", () => {
    describe("sanitized document", () => {
      test("when response html contains active markup, preserves only inert presentation content", () => {
        // Arrange
        const responseHtml = `
        <h1 onclick="stealCredentials()">Browser check</h1>
        <p id="untrusted" class="untrusted" style="color: red" onmouseover="runCommand()">
          Read <strong>the response</strong>
        </p>
        <a href="https://attacker.example/">Open the support page</a>
        <img src="https://attacker.example/image.png" onerror="runCommand()">
        <form action="https://attacker.example/">
          <input name="password">
          <button>Sign in</button>
        </form>
        <iframe src="https://attacker.example/" srcdoc="<script>runCommand()</script>"></iframe>
        <script>runCommand()</script>
        <style>body { background: url(https://attacker.example/) }</style>
        <meta http-equiv="refresh" content="0;url=https://attacker.example/">
        <svg onload="runCommand()"><script>runCommand()</script></svg>
        <table><thead><tr><th scope="col" onclick="runCommand()">Status</th></tr></thead></table>
      `

        // Act
        const previewDocument = buildCloudflareResponsePreviewDocument(responseHtml)
        const parsedDocument = new DOMParser().parseFromString(previewDocument, "text/html")

        // Assert
        expect(
          parsedDocument.querySelectorAll(
            "script, body style, iframe, frame, object, embed, audio, video, img, source, track, svg, math, form, input, button, select, textarea, a, base, meta[http-equiv=refresh], link, [onclick], [onmouseover], [onerror], [onload], [style], [href], [src], [srcdoc], [action]"
          )
        ).toHaveLength(0)
      })

      test("when a diagnostic table cell spans rows and columns, preserves its layout", () => {
        // Arrange
        const responseHtml = '<table><tr><td colspan="2" rowspan="3">Blocked</td></tr></table>'

        // Act
        const previewDocument = buildCloudflareResponsePreviewDocument(responseHtml)
        const parsedDocument = new DOMParser().parseFromString(previewDocument, "text/html")

        // Assert
        expect(parsedDocument.querySelector("td")).toMatchObject({
          colSpan: 2,
          rowSpan: 3,
        })
      })

      test("when links and forms imitate support controls, removes their persuasive labels with them", () => {
        // Arrange
        const responseHtml =
          '<h1>Diagnostic remains</h1><a href="https://attacker.example">Contact fake support</a><form><button>Enter credentials</button><p>Copy this command</p></form>'

        // Act
        const previewDocument = buildCloudflareResponsePreviewDocument(responseHtml)
        const parsedDocument = new DOMParser().parseFromString(previewDocument, "text/html")

        // Assert
        expect(parsedDocument.body.textContent?.trim()).toBe("Diagnostic remains")
      })

      test("when a button contains a hidden input, removes the entire control label", () => {
        // Arrange
        const responseHtml =
          '<h1>Diagnostic remains</h1><button><input type="hidden">Contact fake support</button>'

        // Act
        const previewDocument = buildCloudflareResponsePreviewDocument(responseHtml)
        const parsedDocument = new DOMParser().parseFromString(previewDocument, "text/html")

        // Assert
        expect(parsedDocument.body.textContent?.trim()).toBe("Diagnostic remains")
      })

      test("when response HTML includes metadata and hidden containers, preserves only rendered diagnostic text", () => {
        // Arrange
        const responseHtml =
          "<!doctype html><html><head><title>Hidden page title</title></head><body><h1>Diagnostic remains</h1><template>Hidden template content</template><iframe>Hidden fallback content</iframe></body></html>"

        // Act
        const previewDocument = buildCloudflareResponsePreviewDocument(responseHtml)
        const parsedDocument = new DOMParser().parseFromString(previewDocument, "text/html")

        // Assert
        expect(parsedDocument.body.textContent?.trim()).toBe("Diagnostic remains")
      })

      test("when an element is hidden, removes its entire subtree rather than revealing its text", () => {
        // Arrange
        const responseHtml =
          "<h1>Diagnostic remains</h1><div hidden><p>Hidden instructions</p></div>"

        // Act
        const previewDocument = buildCloudflareResponsePreviewDocument(responseHtml)
        const parsedDocument = new DOMParser().parseFromString(previewDocument, "text/html")

        // Assert
        expect(parsedDocument.body.textContent?.trim()).toBe("Diagnostic remains")
      })

      test("when iframe fallback text contains a control, removes its hidden label", () => {
        // Arrange
        const responseHtml =
          '<h1>Diagnostic remains</h1><iframe><button><input type="hidden">Contact fake support</button></iframe>'

        // Act
        const previewDocument = buildCloudflareResponsePreviewDocument(responseHtml)
        const parsedDocument = new DOMParser().parseFromString(previewDocument, "text/html")

        // Assert
        expect(parsedDocument.body.textContent?.trim()).toBe("Diagnostic remains")
      })

      test.each(["audio", "video", "svg", "math", "object"])(
        "when a disallowed %s container contains fallback text, removes its hidden content",
        (tag) => {
          // Arrange
          const responseHtml = `<h1>Diagnostic remains</h1><${tag}>Hidden instructions</${tag}>`

          // Act
          const previewDocument = buildCloudflareResponsePreviewDocument(responseHtml)
          const parsedDocument = new DOMParser().parseFromString(previewDocument, "text/html")

          // Assert
          expect(parsedDocument.body.textContent?.trim()).toBe("Diagnostic remains")
        }
      )
    })
  })
})
