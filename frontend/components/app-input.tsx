import { useState, type ComponentProps, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { getTokens, Input, Label, XStack, YStack } from 'tamagui';

type AppInputProps = ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  appearance?: 'default' | 'outlined';
};

export function AppInput({
  label, error, id, startAdornment, endAdornment,
  appearance = 'default', onFocus, onBlur, ...props
}: AppInputProps) {
  const tokens = getTokens();
  const [focused, setFocused] = useState(false);
  const { fontScale } = useWindowDimensions();
  const outlined = appearance === 'outlined';
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;
  const hasAdornment = Boolean(startAdornment || endAdornment);
  const borderColor = error ? '$red10'
    : outlined ? (focused ? '$borderColorFocus' : '$inputBorder') : '$borderColor';

  return (
    <YStack gap="$2">
      <Label htmlFor={inputId} color="$color" fontFamily="$body" fontWeight="600">
        {label}
      </Label>
      {hasAdornment || outlined ? (
        <XStack
          minH={outlined ? '$control' : 50}
          items="center"
          gap="$2"
          px="$3"
          flexWrap={outlined ? 'wrap' : 'nowrap'}
          bg={outlined ? '$surface' : '$background'}
          borderWidth={outlined ? 2 : 1}
          borderColor={borderColor}
          style={{ borderRadius: outlined ? tokens.radius.control.val : tokens.radius.$4.val }}
          focusWithinStyle={outlined ? undefined : { borderColor: '$brand', borderWidth: 2 }}
        >
          {startAdornment}
          <Input
            id={inputId}
            flex={1}
            {...(outlined ? { minW: 80, minH: '$touchTarget', height: 'auto', py: '$2', color: '$color', placeholderTextColor: '$muted' } as const : {})}
            px={0}
            bg="transparent"
            borderWidth={0}
            focusStyle={{ borderWidth: 0 }}
            fontFamily="$body"
            aria-label={label}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error)}
            {...props}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
          />
          {outlined && endAdornment && fontScale > 1.3 ? (
            <XStack width="100%" justify="flex-end" pb="$1">{endAdornment}</XStack>
          ) : endAdornment}
        </XStack>
      ) : (
        <Input
          id={inputId}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          borderColor={error ? '$red10' : '$borderColor'}
          fontFamily="$body"
          aria-label={label}
          {...props}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )}
      {error ? (
        <Label id={errorId} color="$red10" fontFamily="$body" size="$2" role="alert">
          {error}
        </Label>
      ) : null}
    </YStack>
  );
}
