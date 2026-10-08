import { Ionicons } from '@expo/vector-icons';
import { Button, Paragraph, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { dateKey, monthDays, moveMonth } from '@/lib/calendar';

const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function MonthCalendar({ month, selected, marks, onMonthChange, onSelect, minMonth, maxMonth, minDay, maxDay, markDescription, markedDayLabel = 'com consultas' }: {
  month: string;
  selected: string;
  marks: Record<string, number>;
  onMonthChange: (month: string) => void;
  onSelect: (day: string) => void;
  minMonth?: string;
  maxMonth?: string;
  minDay?: string;
  maxDay?: string;
  markDescription?: string;
  markedDayLabel?: string;
}) {
  const theme = useTheme();
  const today = dateKey(new Date());
  const days = monthDays(month);
  const rows = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7));
  const [year, monthNumber] = month.split('-').map(Number);
  const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const title = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  return (
    <YStack gap="$3" width="100%" maxW={440} self="center" accessibilityLabel="Calendário mensal">
      <XStack items="center" justify="space-between" gap="$2">
        <Button chromeless minW="$touchTarget" minH="$touchTarget" aria-label="Mês anterior"
          disabled={Boolean(minMonth && month <= minMonth)} onPress={() => onMonthChange(moveMonth(month, -1))}>
          <Ionicons name="chevron-back" size={20} color={theme.brand.val} accessible={false} />
        </Button>
        <SizableText color="$color" fontFamily="$heading" fontWeight="700">
          {title}
        </SizableText>
        <Button chromeless minW="$touchTarget" minH="$touchTarget" aria-label="Próximo mês"
          disabled={Boolean(maxMonth && month >= maxMonth)} onPress={() => onMonthChange(moveMonth(month, 1))}>
          <Ionicons name="chevron-forward" size={20} color={theme.brand.val} accessible={false} />
        </Button>
      </XStack>
      <YStack width="100%" gap="$1">
          <XStack gap={2}>
            {weekdayLabels.map((label) => (
              <Paragraph key={label} flex={1} minW={0} text="center" color="$muted" size="$2">{label}</Paragraph>
            ))}
          </XStack>
          {rows.map((row, rowIndex) => (
            <XStack key={rowIndex} gap={2}>
              {Array.from({ length: 7 }, (_, dayIndex) => {
              const day = row[dayIndex];
              if (!day) return <YStack key={dayIndex} flex={1} minW={0} minH={48} />;
              const marked = (marks[day] ?? 0) > 0;
              const chosen = day === selected;
              const unavailable = Boolean((minDay && day < minDay) || (maxDay && day > maxDay));
              return (
                <Button key={day} unstyled role="button" flex={1} minW={0} minH={48}
                  aria-label={`${new Date(`${day}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}${marked ? `, ${markedDayLabel}` : ''}`}
                  aria-pressed={chosen} disabled={unavailable} onPress={() => onSelect(day)}
                  rounded="$control" bg={chosen ? '$brand' : day === today ? '$soft' : 'transparent'}
                  borderWidth={day === today && !chosen ? 1 : 0} borderColor="$brand"
                  hoverStyle={{ background: chosen ? '$brand' : '$soft' }}
                  pressStyle={{ opacity: 0.7 }}
                  focusVisibleStyle={{ outlineWidth: 2, outlineColor: '$brand', outlineStyle: 'solid' }}>
                  <YStack items="center" justify="center" gap={3}>
                    <SizableText color={chosen ? '$brandContrast' : unavailable ? '$muted' : '$color'} size="$3" fontWeight={chosen ? '700' : '500'}>
                      {Number(day.slice(-2))}
                    </SizableText>
                    <YStack width={5} height={5} rounded="$12" bg={marked ? chosen ? '$brandContrast' : '$accent' : 'transparent'} />
                  </YStack>
                </Button>
              );
              })}
            </XStack>
          ))}
      </YStack>
      <Paragraph color="$muted" size="$2">{markDescription ?? 'Os pontos indicam dias com consultas.'}</Paragraph>
    </YStack>
  );
}
