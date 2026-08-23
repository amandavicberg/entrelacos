import { Paragraph, Spinner, SizableText, YStack } from 'tamagui';

type FeedbackStateProps = {
  status: 'loading' | 'empty' | 'error';
  title?: string;
  description?: string;
};

const defaultContent = {
  loading: {
    title: 'Carregando',
    description: 'Aguarde um momento.',
  },
  empty: {
    title: 'Nada por aqui ainda',
    description: 'Quando houver informações, elas aparecerão nesta área.',
  },
  error: {
    title: 'Não foi possível carregar',
    description: 'Tente novamente em alguns instantes.',
  },
} as const;

export function FeedbackState({ status, title, description }: FeedbackStateProps) {
  const content = defaultContent[status];

  return (
    <YStack items="center" gap="$2" p="$5">
      {status === 'loading' ? <Spinner color="$brand" size="large" /> : null}
      <SizableText color={status === 'error' ? '$red10' : '$color'} size="$5" fontWeight="600">
        {title ?? content.title}
      </SizableText>
      <Paragraph color="$muted" text="center">
        {description ?? content.description}
      </Paragraph>
    </YStack>
  );
}
