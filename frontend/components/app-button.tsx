import { forwardRef, type ComponentProps, type ComponentRef } from 'react';
import { Button } from 'tamagui';

/** Shared secondary action: touch size, keyboard focus and labels that can wrap. */
export const AppButton = forwardRef<ComponentRef<typeof Button>, ComponentProps<typeof Button>>(
  function AppButton({ textProps, 'aria-disabled': ariaDisabled, ...props }, ref) {
    // Tamagui's disabled CSS matches [aria-disabled], even when its value is false.
    return <Button ref={ref} minH="$touchTarget" height="auto" py="$2" rounded="$pill"
      aria-disabled={ariaDisabled === false ? undefined : ariaDisabled}
      ellipsis={false} noTextWrap={false}
      textProps={{ numberOfLines: 0, shrink: 1, text: 'center', ...textProps }}
      disabledStyle={{ opacity: 0.55 }}
      focusVisibleStyle={{ outlineWidth: 2, outlineColor: '$outlineColor', outlineStyle: 'solid' }}
      {...props} />;
  },
);
