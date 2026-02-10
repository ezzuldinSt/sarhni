/**
 * PERFORMANCE: Resource hints for faster loading
 *
 * Preconnect: Establish early connections to critical origins
 * Preload: Load critical resources early
 * DNS-Prefetch: Resolve DNS for external domains
 */
export function ResourceHints() {
  return (
    <>
      {/* Preconnect to Vercel Blob storage for images */}
      <link rel="preconnect" href="https://sarhni.zhrworld.com" />
      <link rel="preconnect" href="https://pub-*.blob.vercel-storage.com" crossOrigin="anonymous" />

      {/* DNS prefetch for potential external resources */}
      <link rel="dns-prefetch" href="https://sarhni.zhrworld.com" />
    </>
  );
}
