import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://shrawn-five.vercel.app/';
const PUBLIC_PATHS = ['/', '/login', '/register'];

export function SeoMetadata() {
  const { pathname } = useLocation();
  if (!PUBLIC_PATHS.includes(pathname)) return null;

  const canonicalUrl = new URL(pathname, SITE_URL).href;

  return (
    <>
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
    </>
  );
}
