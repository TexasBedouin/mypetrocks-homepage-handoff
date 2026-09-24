import { Helmet } from 'react-helmet-async';
import { organizationSchema, websiteSchema } from '@/lib/seo/schema';

const DEFAULT_TITLE = 'MyPet.Rocks - Your Pet as Gallery Art, Free Preview First';
const DEFAULT_DESCRIPTION =
  'Turn a photo of your pet into gallery-quality art. See a free preview of your pet as a portrait in about 30 seconds before you pay, then order canvas, poster, or digital.';

/**
 * Site-wide SEO defaults + Organization/WebSite structured data. Rendered once near the
 * app root. A per-page <Seo> sets the real <title> (this is the defaultTitle fallback)
 * and overrides the description tag (Helmet dedupes), so
 * routes without their own <Seo> still get a sensible title, description, and the brand
 * + site schema on every page.
 */
export function SeoDefaults() {
  return (
    <Helmet defaultTitle={DEFAULT_TITLE}>
      <meta name="description" content={DEFAULT_DESCRIPTION} />
      <script type="application/ld+json">{JSON.stringify(organizationSchema())}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema())}</script>
    </Helmet>
  );
}
