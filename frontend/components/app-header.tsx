import { H2, Paragraph, YStack } from 'tamagui';

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function AppHeader({ eyebrow, title, description }: AppHeaderProps) {
  return (
    <YStack gap="$2">
      {eyebrow ? (
        <Paragraph color="$brand" fontWeight="700" letterSpacing={1} size="$2">
          {eyebrow}
        </Paragraph>
      ) : null}
      <H2 color="$color">{title}</H2>
      {description ? <Paragraph color="$muted">{description}</Paragraph> : null}
    </YStack>
  );
}
