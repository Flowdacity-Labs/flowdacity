import { authenticatedProcedure } from '@/helpers/server/trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { startSession } from '@typebot.io/bot-engine/startSession'
import { env } from '@typebot.io/env'
import { HTTPError } from 'got'
import prisma from '@typebot.io/lib/prisma'
import { saveStateToDatabase } from '@typebot.io/bot-engine/saveStateToDatabase'
import { restartSession } from '@typebot.io/bot-engine/queries/restartSession'
import { sendChatReplyToWhatsApp } from '@typebot.io/bot-engine/whatsapp/sendChatReplyToWhatsApp'
import { sendWhatsAppMessage } from '@typebot.io/bot-engine/whatsapp/sendWhatsAppMessage'
import { isReadTypebotForbidden } from '../typebot/helpers/isReadTypebotForbidden'
import { SessionState, startFromSchema, Settings } from '@typebot.io/schemas'

export const startWhatsAppPreview = authenticatedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/v1/typebots/{typebotId}/whatsapp/start-preview',
      summary: 'Start preview',
      tags: ['WhatsApp'],
      protect: true,
    },
  })
  .input(
    z.object({
      to: z
        .string()
        .min(1)
        .transform((value) =>
          value.replace(/\s/g, '').replace(/\+/g, '').replace(/-/g, '')
        ),
      typebotId: z.string(),
      startFrom: startFromSchema.optional(),
    })
  )
  .output(
    z.object({
      message: z.string(),
    })
  )
  .mutation(async ({ input: { to, typebotId, startFrom }, ctx: { user } }) => {
    const existingTypebot = await prisma.typebot.findFirst({
      where: {
        id: typebotId,
      },
      select: {
        id: true,
        settings: true,
        workspace: {
          select: {
            isSuspended: true,
            isPastDue: true,
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
        collaborators: {
          select: {
            userId: true,
          },
        },
      },
    })
    if (
      !existingTypebot?.id ||
      (await isReadTypebotForbidden(existingTypebot, user))
    )
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Typebot not found' })

    const whatsAppPreviewPhoneNumberId = (existingTypebot.settings as Settings)
      ?.whatsAppCloudApi?.isEnabled
      ? (existingTypebot.settings as Settings)?.whatsAppCloudApi
          ?.previewPhoneNumber
      : env.WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID

    const whatsAppSystemUserToken = (existingTypebot.settings as Settings)
      ?.whatsAppCloudApi?.isEnabled
      ? (existingTypebot.settings as Settings)?.whatsAppCloudApi
          ?.systemUserAccessToken
      : env.META_SYSTEM_USER_TOKEN

    const whatsAppPreviewTemplateName = (existingTypebot.settings as Settings)
      ?.whatsAppCloudApi?.isEnabled
      ? 'hello_world'
      : env.WHATSAPP_PREVIEW_TEMPLATE_NAME

    const whatsAppCloudApiBaseUrl = (existingTypebot.settings as Settings)
      ?.whatsAppCloudApi?.isEnabled
      ? (existingTypebot.settings as Settings)?.whatsAppCloudApi?.baseUrl
      : env.WHATSAPP_CLOUD_API_URL

    if (
      !whatsAppPreviewPhoneNumberId ||
      !whatsAppSystemUserToken ||
      !whatsAppPreviewTemplateName
    )
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'Missing required settings for WhatsApp Cloud API. Please check your settings.',
      })

    const sessionId = `wa-preview-${to}`

    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
      },
      select: {
        updatedAt: true,
        state: true,
      },
    })

    // For users that did not interact with the bot in the last 24 hours, we need to send a template message.
    const canSendDirectMessagesToUser =
      (existingSession?.updatedAt.getTime() ?? 0) >
      Date.now() - 24 * 60 * 60 * 1000

    const {
      newSessionState,
      messages,
      input,
      clientSideActions,
      logs,
      visitedEdges,
    } = await startSession({
      version: 2,
      message: undefined,
      startParams: {
        isOnlyRegistering: !canSendDirectMessagesToUser,
        type: 'preview',
        typebotId,
        startFrom,
        userId: user.id,
      },
      initialSessionState: {
        whatsApp: (existingSession?.state as SessionState | undefined)
          ?.whatsApp,
      },
    })

    if (canSendDirectMessagesToUser) {
      await sendChatReplyToWhatsApp({
        to,
        typingEmulation: newSessionState.typingEmulation,
        messages,
        input,
        clientSideActions,
        isFirstChatChunk: true,
        credentials: {
          phoneNumberId: whatsAppPreviewPhoneNumberId,
          systemUserAccessToken: whatsAppSystemUserToken,
          baseUrl: whatsAppCloudApiBaseUrl,
        },
        state: newSessionState,
      })
      await saveStateToDatabase({
        clientSideActions: [],
        input,
        logs,
        session: {
          id: sessionId,
          state: newSessionState,
        },
        visitedEdges,
      })
    } else {
      await restartSession({
        state: newSessionState,
        id: sessionId,
      })
      try {
        await sendWhatsAppMessage({
          to,
          message: {
            type: 'template',
            template: {
              language: {
                code: env.WHATSAPP_PREVIEW_TEMPLATE_LANG,
              },
              name: whatsAppPreviewTemplateName,
            },
          },
          credentials: {
            phoneNumberId: whatsAppPreviewPhoneNumberId,
            systemUserAccessToken: whatsAppSystemUserToken,
          },
          baseUrl: whatsAppCloudApiBaseUrl,
        })
      } catch (err) {
        if (err instanceof HTTPError) console.log(err.response.body)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Request to Meta to send preview message failed',
          cause: err,
        })
      }
    }
    return {
      message: 'success',
    }
  })
