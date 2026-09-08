import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, H1, Paragraph, SizableText, Spinner, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppScreen } from '@/components/app-screen';
import { BrandButton } from '@/components/brand-button';
import { useAuth } from '@/contexts/auth-context';
import { approvePendingRelationship, generateProfessionalInvite, listPendingRelationships, type PendingRelationship, type ProfessionalInvitation } from '@/lib/api';

export default function ProfessionalPlaceholderScreen() {
  const { session, signOut } = useAuth();
  const [invitation, setInvitation] = useState<ProfessionalInvitation | null>(null);
  const [pendingRelationships, setPendingRelationships] = useState<PendingRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;
    void loadPendingRelationships(session.access_token);
  }, [session?.access_token]);

  async function loadPendingRelationships(accessToken: string) {
    try {
      setPendingRelationships(await listPendingRelationships(accessToken));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível carregar as solicitações.');
    }
  }

  async function handleGenerateInvite() {
    if (!session?.access_token || loading) return;
    setLoading(true);
    setFeedback('');
    try {
      setInvitation(await generateProfessionalInvite(session.access_token));
      setCopied(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível gerar o código.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCode() {
    if (!invitation) return;
    await Clipboard.setStringAsync(invitation.code);
    setCopied(true);
  }

  async function handleApprove(relationshipId: string) {
    if (!session?.access_token || approvingId) return;
    setApprovingId(relationshipId);
    setFeedback('');
    try {
      await approvePendingRelationship(session.access_token, relationshipId);
      await loadPendingRelationships(session.access_token);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível aprovar a solicitação.');
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      <YStack gap="$4" maxW={520} width="100%" self="center">
        <SizableText size="$3" color="$brand" fontWeight="700" letterSpacing={1}>
          ÁREA DO PROFISSIONAL
        </SizableText>
        <H1 color="$color">Acompanhamento organizado para cada paciente.</H1>
        <Paragraph color="$muted" size="$5">
          Esta tela é um ponto de partida para o painel do profissional.
        </Paragraph>
        <AppCard title="Convite de teste">
          <Paragraph color="$muted">
            Gere um código para o paciente informar no primeiro acesso. O código expira em 7 dias.
          </Paragraph>
          <BrandButton disabled={loading} onPress={handleGenerateInvite}>
            {loading ? <XStack items="center" gap="$2"><Spinner color="$brandContrast" size="small" /><SizableText color="$brandContrast">Gerando...</SizableText></XStack> : 'Gerar código de acesso'}
          </BrandButton>
          {invitation ? (
            <YStack gap="$2" p="$3" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor">
              <SizableText color="$muted" size="$2">Código para compartilhar</SizableText>
              <SizableText color="$brand" fontSize={24} letterSpacing={3} fontWeight="800" style={{ textAlign: 'center' }}>
                {invitation.code}
              </SizableText>
              <Button onPress={handleCopyCode} accessibilityLabel="Copiar código de acesso">
                {copied ? 'Código copiado' : 'Copiar código'}
              </Button>
              <Paragraph color="$muted" size="$2">
                Válido até {new Date(invitation.expiresAt).toLocaleString('pt-BR')}.
              </Paragraph>
            </YStack>
          ) : null}
        </AppCard>
        <AppCard title="Solicitações pendentes">
          {pendingRelationships.length === 0 ? (
            <Paragraph color="$muted">Nenhum paciente informou um código ainda.</Paragraph>
          ) : pendingRelationships.map((relationship) => (
            <XStack key={relationship.id} items="center" justify="space-between" gap="$3">
              <Paragraph color="$muted" flex={1}>
                Solicitação recebida em {new Date(relationship.requestedAt).toLocaleString('pt-BR')}.
              </Paragraph>
              <Button disabled={approvingId !== null} onPress={() => handleApprove(relationship.id)}>
                {approvingId === relationship.id ? 'Aprovando...' : 'Aprovar'}
              </Button>
            </XStack>
          ))}
        </AppCard>
        {feedback ? <Paragraph color="$red10" accessibilityRole="alert">{feedback}</Paragraph> : null}
        <BrandButton onPress={signOut}>Sair</BrandButton>
      </YStack>
      </ScrollView>
    </AppScreen>
  );
}
