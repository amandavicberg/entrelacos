import { SizableText, Paragraph, XStack, YStack } from 'tamagui';
import { useScreenLayout } from '@/hooks/use-screen-layout';

type AppHeaderProps = { eyebrow?: string; title: string; description?: string };

export function AppHeader({ eyebrow, title, description }: AppHeaderProps) {
  const { compact } = useScreenLayout();
  return (
    <YStack gap="$2" shrink={1} minW={0} maxW={720}>
      {eyebrow ? <XStack items="center" gap="$2">
        <YStack width={18} height={2} bg="$accent" />
        <SizableText color="$accentText" fontWeight="600" letterSpacing={1.5} size="$2" shrink={1}>{eyebrow}</SizableText>
      </XStack> : null}
      <SizableText role="heading" color="$color" fontFamily="$heading" fontSize={compact ? 29 : 38}
        lineHeight={compact ? 39 : 49} letterSpacing={-1}>{title}</SizableText>
      {description ? <Paragraph color="$muted" size="$4" lineHeight={26}>{description}</Paragraph> : null}
    </YStack>
  );
}
