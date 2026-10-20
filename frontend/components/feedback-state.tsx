import { Ionicons } from '@expo/vector-icons';
import { Paragraph, Spinner, SizableText, useTheme, YStack } from 'tamagui';

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
  const theme = useTheme();

  return (
    <YStack items="center" gap="$3" px="$3" py="$6" maxW={480} self="center" width="100%" role={status === 'error' ? 'alert' : 'status'}>
      <YStack width={56} height={56} rounded="$control" bg={status === 'error' ? '$declinedBackground' : '$soft'} items="center" justify="center">
        {status === 'loading' ? <Spinner color="$brand" size="small" /> :
          <Ionicons name={status === 'error' ? 'cloud-offline-outline' : 'leaf-outline'} size={25}
            color={status === 'error' ? theme.declinedColor.val : theme.brand.val} accessible={false} />}
      </YStack>
      <SizableText color={status === 'error' ? '$red10' : '$color'} size="$5" fontWeight="600" text="center">
        {title ?? content.title}
      </SizableText>
      <Paragraph color="$muted" text="center">
        {description ?? content.description}
      </Paragraph>
    </YStack>
  );
}
