import type { ComponentProps } from 'react';
import { Card, SizableText, YStack } from 'tamagui';

type AppCardProps = ComponentProps<typeof Card> & {
  title?: string;
};

export function AppCard({ title, children, ...props }: AppCardProps) {
  return (
    <Card
      borderWidth={1}
      background="$surface"
      borderColor="$borderColor"
      rounded="$panel"
      p="$4"
      {...props}
    >
      <YStack gap="$3">
        {title ? <Card.Header><SizableText color="$color" fontWeight="700">{title}</SizableText></Card.Header> : null}
        {children}
      </YStack>
    </Card>
  );
}
