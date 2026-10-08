// Local UI verification only. Never deployed; no Supabase credentials or real submissions.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve(process.env.UI_DIST_DIR || 'dist');
const receipts = new Map();
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1:4178");
    res.setHeader("Cache-Control", "no-store");
    if (url.pathname.startsWith("/api/")) {
      let body = "";
      for await (const chunk of req) body += chunk;
      const data = body ? JSON.parse(body) : {};
      res.setHeader("Content-Type", "application/json");
      if (url.pathname === '/api/girlhood/status') return res.end(JSON.stringify({state:'open'}));
      if (url.pathname === '/api/programs') {
        const slug = url.searchParams.get('slug');
        const program = { id: 1, title: 'Girlhood Should Be Hers', slug: slug || 'girlhood', page_template: 'girlhood', short_description: 'Share your voice.', content: {}, reports: [], status: 'upcoming', category: 'campaign', featured: true, display_order: 0 };
        if (slug === 'missing') { res.statusCode = 404; return res.end('{}'); }
        return res.end(JSON.stringify(slug ? program : [program]));
      }
      if (['/api/site-content','/api/site-images'].includes(url.pathname)) return res.end('{}');
      if (['/api/slideshow','/api/partners','/api/bureau'].includes(url.pathname)) return res.end('[]');
      if (url.pathname.endsWith("/stats"))
        return res.end(
          JSON.stringify({
            publicVoices: 25,
            girls: 15,
            youngWomen: 8,
            women: 1,
            allies: 1,
          }),
        );
      if (url.pathname.endsWith("/wall")) {
        const second = url.searchParams.get("cursor") === "fixture-next" || url.searchParams.get("page") === "2";
        return res.end(
          JSON.stringify({
            page: second ? 2 : 1,
            hasMore: !second,
            nextCursor: second ? null : 'fixture-next',
            responses: [
              {
                public_reference: second ? "fixture-two" : "fixture-one",
                public_category: "girl",
                language: second ? "fr" : "en",
                public_girlhood_response: second
                  ? "Un monde plein de découvertes."
                  : "A childhood full of questions and possibilities.",
                public_future_response: second
                  ? "Un avenir choisi librement."
                  : "Anything she can imagine, with space to learn.",
                public_support_response: null,
                safe_display_name: "Anonymous",
                safe_country: null,
                safe_city: null,
                featured: true,
                created_at: new Date().toISOString(),
              },
            ],
          }),
        );
      }
      if (url.pathname.endsWith("/submit")) {
        let receipt = receipts.get(data.requestToken);
        if (!receipt && data.recoverOnly) {
          res.statusCode = 404;
          return res.end(
            JSON.stringify({
              error: "No saved contribution was found for this attempt.",
            }),
          );
        }
        if (!receipt) {
          res.statusCode = 201;
          receipt = {
            publicReference:
              "GSH-" + String(receipts.size + 1).padStart(16, "0"),
            withdrawalCode: "local1-local2-local3-local4",
            publicationRequested: data.age >= 13 && data.consentPublic,
            withdrawn: false,
          };
          receipts.set(data.requestToken, receipt);
        }
        return res.end(JSON.stringify(receipt));
      }
      if (url.pathname.endsWith("/withdraw")) {
        for (const receipt of receipts.values())
          if (receipt.publicReference === data.publicReference)
            receipt.withdrawn = true;
        return res.end(
          JSON.stringify({
            message:
              data.language === "fr"
                ? "Votre contribution a été retirée."
                : "Your contribution has been withdrawn.",
          }),
        );
      }
      res.statusCode = 404;
      return res.end("{}");
    }
    const requested = resolve(root, "." + decodeURIComponent(url.pathname));
    if (!requested.startsWith(root)) {
      res.statusCode = 403;
      return res.end();
    }
    const file = extname(requested) ? requested : resolve(root, "index.html");
    const mime = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".ico": "image/x-icon",
    };
    res.setHeader(
      "Content-Type",
      mime[extname(file)] || "application/octet-stream",
    );
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});
server.listen(4178, "127.0.0.1", () =>
  console.log("UI fixture preview: http://127.0.0.1:4178/girlhood"),
);

