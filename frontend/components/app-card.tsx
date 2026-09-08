import type { ComponentProps } from 'react';
import { Card, YStack } from 'tamagui';

type AppCardProps = ComponentProps<typeof Card> & {
  title?: string;
};

export function AppCard({ title, children, ...props }: AppCardProps) {
  return (
    <Card borderWidth={1} background="$background" borderColor="$borderColor" p="$4" {...props}>
      <YStack gap="$3">
        {title ? <Card.Header>{title}</Card.Header> : null}
        {children}
      </YStack>
    </Card>
  );
}
