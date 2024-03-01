import { env } from '@typebot.io/env'
import got from 'got'

type Props = {
  mediaId: string
  systemUserAccessToken: string,
  baseUrl?: string
}

export const downloadMedia = async ({
  mediaId,
  systemUserAccessToken,
  baseUrl
}: Props): Promise<{ file: Buffer; mimeType: string }> => {

  const whatsAppCloudApiBaseUrl = baseUrl && baseUrl.trim() !== '' ? baseUrl : env.WHATSAPP_CLOUD_API_URL;

  const { body } = await got.get({
    url: `${whatsAppCloudApiBaseUrl}/v17.0/${mediaId}`,
    headers: {
      Authorization: `Bearer ${systemUserAccessToken}`,
    },
  })

  const parsedBody = JSON.parse(body) as { url: string; mime_type: string }

  return {
    file: await got(parsedBody.url, {
      headers: {
        Authorization: `Bearer ${systemUserAccessToken}`,
      },
    }).buffer(),
    mimeType: parsedBody.mime_type,
  }
}
