export const CLOUDFLARE_IMAGES_CONFIG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  apiToken: process.env.CLOUDFLARE_IMAGES_API_TOKEN!,
  accountHash: process.env.CLOUDFLARE_ACCOUNT_HASH!,
};

export async function uploadToCloudflare(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_IMAGES_CONFIG.accountId}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_IMAGES_CONFIG.apiToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload image: ${error}`);
  }

  const data = await response.json();
  return data.result.id;
}

export function getImageUrl(imageId: string, variant: string = 'public'): string {
  return `https://imagedelivery.net/${CLOUDFLARE_IMAGES_CONFIG.accountHash}/${imageId}/${variant}`;
}