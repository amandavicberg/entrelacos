import type { ComponentProps } from 'react';
import { Input, Label, YStack } from 'tamagui';

type AppInputProps = ComponentProps<typeof Input> & {
  label: string;
  error?: string;
};

export function AppInput({ label, error, id, ...props }: AppInputProps) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/\\s+/g, '-')}`;

  return (
    <YStack gap="$2">
      <Label htmlFor={inputId} color="$color" fontWeight="600">
        {label}
      </Label>
      <Input id={inputId} borderColor={error ? "$red10" : "$borderColor"} {...props} />
      {error ? (
        <Label color="$red10" size="$2">
          {error}
        </Label>
      ) : null}
    </YStack>
  );
}
