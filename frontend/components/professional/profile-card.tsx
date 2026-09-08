import { Paragraph, SizableText, XStack, YStack } from 'tamagui';

import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import type { useProfessionalProfile } from '@/hooks/use-professional-profile';
import { Panel } from './dashboard-sections';
import { InitialsAvatar } from './professional-screen';

export function ProfileCard({ state }: { state: ReturnType<typeof useProfessionalProfile> }) {
  return (
    <Panel>
      {state.status === 'loading' ? (
        <XStack gap="$4" items="center" aria-label="Carregando seu perfil" aria-busy>
          <YStack width={64} height={64} rounded="$12" bg="$soft" />
          <YStack gap="$3" flex={1}><YStack height={22} width="80%" rounded="$4" bg="$soft" /><YStack height={16} width="60%" rounded="$4" bg="$soft" /></YStack>
        </XStack>
      ) : state.status === 'error' || !state.profile ? (
        <YStack gap="$2">
          <FeedbackState status="error" title="Não foi possível carregar seu perfil" description="Confira sua conexão e tente novamente." />
          <BrandButton minH={44} height="auto" py="$3" onPress={state.retry}>Tentar novamente</BrandButton>
        </YStack>
      ) : (
        <XStack gap="$4" items="center" flexWrap="wrap">
          <InitialsAvatar name={state.profile.name} large />
          <YStack flex={1} minW={160} gap="$1">
            <SizableText color="$brand" size="$2" fontWeight="600" letterSpacing={1}>SEU PERFIL PROFISSIONAL</SizableText>
            <SizableText color="$color" fontFamily="$heading" size="$6">{state.profile.name}</SizableText>
            {state.profile.specialty ? <Paragraph color="$muted">{state.profile.specialty}</Paragraph> : null}
            {state.profile.registration ? <SizableText color="$muted" size="$3">{state.profile.registration}</SizableText> : null}
          </YStack>
        </XStack>
      )}
    </Panel>
  );
}
