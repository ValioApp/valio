import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fotos del inmueble pesan hasta 6 MB; el límite por defecto de los
      // Server Actions es 1 MB. Con headroom para la sobrecarga del multipart.
      // La subida en el cliente va por-archivo, así cada request lleva 1 foto.
      bodySizeLimit: '8mb',
    },
  },
};

export default withNextIntl(nextConfig);
