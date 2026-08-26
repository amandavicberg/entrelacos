import type { ComponentProps, ReactNode } from 'react';
import { getTokens, Input, Label, XStack, YStack } from 'tamagui';

type AppInputProps = ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
};

export function AppInput({ label, error, id, startAdornment, endAdornment, ...props }: AppInputProps) {
  const tokens = getTokens();
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;
  const hasAdornment = Boolean(startAdornment || endAdornment);

  return (
    <YStack gap="$2">
      <Label htmlFor={inputId} color="$color" fontWeight="600">
        {label}
      </Label>
      {hasAdornment ? (
        <XStack
          minH={50}
          items="center"
          gap="$2"
          px="$3"
          bg="$background"
          borderWidth={1}
          borderColor={error ? '$red10' : '$borderColor'}
          style={{ borderRadius: tokens.radius.$4.val }}
          focusWithinStyle={{ borderColor: '$brand', borderWidth: 2 }}
        >
          {startAdornment}
          <Input
            id={inputId}
            flex={1}
            px={0}
            bg="transparent"
            borderWidth={0}
            focusStyle={{ borderWidth: 0 }}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error)}
            {...props}
          />
          {endAdornment}
        </XStack>
      ) : (
        <Input
          id={inputId}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          borderColor={error ? '$red10' : '$borderColor'}
          {...props}
        />
      )}
      {error ? (
        <Label id={errorId} color="$red10" size="$2">
          {error}
        </Label>
      ) : null}
    </YStack>
  );
}
