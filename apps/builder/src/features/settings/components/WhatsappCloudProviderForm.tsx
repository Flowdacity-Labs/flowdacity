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
  const handlewhatsAppCloudApiChange = (baseUrl: string) =>
    onUpdate({ ...whatsAppCloudApi, baseUrl })

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
              handlewhatsAppCloudApiChange(event.target.value)
            }
          />
        </InputGroup>
        <FormHelperText>
          Used when interacting with the Typebot API.
        </FormHelperText>
      </FormControl>
    </Stack>
  )
}
