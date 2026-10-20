import { forwardRef, type ComponentProps, type ComponentRef } from 'react';
import { Button } from 'tamagui';

/** Shared secondary action: touch size, keyboard focus and labels that can wrap. */
export const AppButton = forwardRef<ComponentRef<typeof Button>, ComponentProps<typeof Button>>(
  function AppButton({ textProps, ...props }, ref) {
    return <Button ref={ref} minH="$touchTarget" height="auto" py="$2" rounded="$pill"
      ellipsis={false} noTextWrap={false}
      textProps={{ numberOfLines: 0, shrink: 1, text: 'center', ...textProps }}
      disabledStyle={{ opacity: 0.55 }}
      focusVisibleStyle={{ outlineWidth: 2, outlineColor: '$outlineColor', outlineStyle: 'solid' }}
      {...props} />;
  },
);
