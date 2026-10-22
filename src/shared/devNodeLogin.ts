import type { NodeLoginDataInterface } from 'src/stores/node';

export function getDevNodeLogin(): NodeLoginDataInterface | null {
  if (!import.meta.env.DEV) {
    return null;
  }

  const apiKey = String(import.meta.env.TYPESENSE_API_KEY || process.env.TYPESENSE_API_KEY || '').trim();
  const host = String(import.meta.env.TYPESENSE_HOST || process.env.TYPESENSE_HOST || '').trim();
  if (!apiKey || !host) {
    return null;
  }

  const protocol = String(
    import.meta.env.TYPESENSE_PROTOCOL || process.env.TYPESENSE_PROTOCOL || 'https',
  ).trim();
  const port =
    Number(import.meta.env.TYPESENSE_PORT || process.env.TYPESENSE_PORT) ||
    (protocol === 'https' ? 443 : 8108);

  return {
    apiKey,
    node: {
      host,
      port,
      protocol,
      path: '',
      tls: true,
    },
  };
}
