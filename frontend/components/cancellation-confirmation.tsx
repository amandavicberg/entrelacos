import { Button, Paragraph, XStack, YStack } from 'tamagui';

type Props = { busy: boolean; onKeep: () => void; onConfirm: () => void };

export function CancellationConfirmation({ busy, onKeep, onConfirm }: Props) {
  return (
    <YStack gap="$3" p="$3" rounded="$control" bg="$declinedBackground">
      <Paragraph color="$declinedColor" role="alert">Cancelar esta consulta? O cancelamento ficará registrado no acompanhamento.</Paragraph>
      <XStack gap="$2" flexWrap="wrap">
        <Button minH="$touchTarget" disabled={busy} onPress={onKeep}>Manter consulta</Button>
        <Button minH="$touchTarget" bg="$declinedBackground" color="$declinedColor" disabled={busy} onPress={onConfirm}>{busy ? 'Cancelando…' : 'Confirmar cancelamento'}</Button>
      </XStack>
    </YStack>
  );
}
