import type { PropsWithChildren } from 'react';
import { Card, SizableText, YStack } from 'tamagui';

type AppCardProps = PropsWithChildren<{
  title?: string;
}>;

export function AppCard({ title, children }: AppCardProps) {
  return (
    <Card borderWidth={1} background="$background" borderColor="$borderColor" p="$4">
      <YStack gap="$3">
        {title ? <Card.Header><SizableText color="$color" fontWeight="700">{title}</SizableText></Card.Header> : null}
        {children}
      </YStack>
    </Card>
  );
}
