import {
  Alert,
  AlertDescription,
  Box,
  FormControl,
  FormLabel,
  Stack,
  Input,
  InputGroup,
  FormHelperText,
} from '@chakra-ui/react'
import { Textarea } from '@/components/inputs'
import { Settings } from '@typebot.io/schemas'
import React from 'react'
import { MoreInfoTooltip } from '@/components/MoreInfoTooltip'

type Props = {
  whatsAppCloudApi: Settings['whatsAppCloudApi']
  onUpdate: (whatsAppCloudApi: Settings['whatsAppCloudApi']) => void
}

export const WhatsappCloudProviderForm = ({
  whatsAppCloudApi,
  onUpdate,
}: Props) => {
  const handleWhatsAppCloudApiChange = (baseUrl: string) =>
    onUpdate({ ...whatsAppCloudApi, baseUrl })
  const handleWhatsAppPreviewPhoneNumberChange = (previewPhoneNumber: string) =>
    onUpdate({ ...whatsAppCloudApi, previewPhoneNumber })
  const handleSystemUserAccessTokenChange = (systemUserAccessToken: string) =>
    onUpdate({ ...whatsAppCloudApi, systemUserAccessToken })

  return (
    <Stack spacing={6}>
      <Alert status="warning">
        <Box>
          <AlertDescription>
            Do not change this setting unless you know what you are doing.
          </AlertDescription>
        </Box>
      </Alert>

      <FormControl>
        <FormLabel display="flex" flexShrink={0} gap="1" mr="0" mb="4">
          Whatsapp Cloud Provider
          <MoreInfoTooltip>
            Base URL of the cloud provider that will be used to send Whatsapp
          </MoreInfoTooltip>
        </FormLabel>
        <InputGroup>
          <Input
            type={'text'}
            pr="16"
            value={whatsAppCloudApi?.baseUrl ?? ''}
            onChange={(event) =>
              handleWhatsAppCloudApiChange(event.target.value)
            }
          />
        </InputGroup>
      </FormControl>

      <FormControl>
        <FormLabel display="flex" flexShrink={0} gap="1" mr="0" mb="4">
          Whatsapp Preview Phone Number
          <MoreInfoTooltip>
            The phone number/ID from which the message will be sent during
            testing
          </MoreInfoTooltip>
        </FormLabel>
        <InputGroup>
          <Input
            type={'text'}
            pr="16"
            value={whatsAppCloudApi?.previewPhoneNumber ?? ''}
            onChange={(event) =>
              handleWhatsAppPreviewPhoneNumberChange(event.target.value)
            }
          />
        </InputGroup>
        <FormHelperText>Used during Preview (Testing).</FormHelperText>
      </FormControl>

      <Textarea
        onChange={handleSystemUserAccessTokenChange}
        defaultValue={whatsAppCloudApi?.systemUserAccessToken ?? ''}
        helperText="Depending on the provider, this might be call System token"
        label="Authorization Token"
        moreInfoTooltip="The system user token used to send WhatsApp messages"
        withVariableButton={false}
      />
    </Stack>
  )
}
