import { Text, View } from 'react-native';

import { useBreakpoint } from '@/hooks/use-breakpoint';

export type WorkflowStep = {
  n: number;
  title: string;
  detail: string;
  active?: boolean;
  done?: boolean;
};

type Props = {
  title?: string;
  steps: WorkflowStep[];
  tone?: 'picker' | 'admin';
};

/**
 * How-it-works strip. Horizontal on desktop so orders keep the full width below.
 */
export function WorkflowSteps({ title = 'How this works', steps, tone = 'picker' }: Props) {
  const { isDesktop } = useBreakpoint();
  const activeBg = tone === 'admin' ? 'bg-teal-600' : 'bg-orange-500';
  const doneBg = 'bg-emerald-500';

  return (
    <View className="card mb-4 p-3.5">
      <Text className="label">{title}</Text>
      <View className={isDesktop ? 'mt-3 flex-row gap-3' : 'mt-3 gap-3'}>
        {steps.map((step) => {
          const badge = step.done ? doneBg : step.active ? activeBg : 'bg-slate-300 dark:bg-slate-600';
          return (
            <View
              key={step.n}
              className={`flex-row items-start ${isDesktop ? 'min-w-0 flex-1' : ''}`}>
              <View className={`mt-0.5 h-7 w-7 items-center justify-center rounded-full ${badge}`}>
                <Text className="font-bold text-xs text-white">{step.n}</Text>
              </View>
              <View className="ml-2.5 min-w-0 flex-1">
                <Text
                  className={`font-semibold text-sm ${
                    step.active
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                  numberOfLines={isDesktop ? 2 : undefined}>
                  {step.title}
                </Text>
                {!isDesktop ? (
                  <Text className="muted mt-0.5 text-xs leading-4">{step.detail}</Text>
                ) : (
                  <Text className="muted mt-0.5 text-xs leading-4" numberOfLines={2}>
                    {step.detail}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
