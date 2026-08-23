import type { PropsWithChildren } from 'react';
import { Card, YStack } from 'tamagui';

type AppCardProps = PropsWithChildren<{
  title?: string;
}>;

export function AppCard({ title, children }: AppCardProps) {
  return (
    <Card borderWidth={1} background="$background" borderColor="$borderColor" p="$4">
      <YStack gap="$3">
        {title ? <Card.Header>{title}</Card.Header> : null}
        {children}
      </YStack>
    </Card>
  );
}
