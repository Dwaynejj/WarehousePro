import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBreakpoint } from '@/hooks/use-breakpoint';

export default function OnboardingScreen() {
  const router = useRouter();
  const { isDesktop } = useBreakpoint();

  return (
    <View className="flex-1 bg-slate-900">
      <StatusBar style="light" />
      {isDesktop ? (
        <View pointerEvents="none" className="absolute inset-0 bg-slate-950" />
      ) : null}
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: isDesktop ? 'center' : 'flex-start',
            paddingVertical: isDesktop ? 48 : 0,
            paddingHorizontal: isDesktop ? 24 : 0,
          }}
          showsVerticalScrollIndicator={false}>
          <View
            className={
              isDesktop
                ? 'mx-auto w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-soft'
                : 'flex-1'
            }
            style={isDesktop ? { maxWidth: 520 } : undefined}>
            <View className={isDesktop ? 'px-10 pb-4 pt-10' : 'px-8 pb-6 pt-10'}>
              <View className="items-center">
                <View className="h-20 w-20 items-center justify-center rounded-3xl bg-orange-500">
                  <MaterialCommunityIcons name="warehouse" size={44} color="#ffffff" />
                </View>
                <Text className="font-display mt-6 text-center text-4xl tracking-tight text-white">
                  WarehousePro
                </Text>
                <Text className="mt-2 text-center font-sans text-base text-slate-400">
                  Plan the shortest path through the warehouse, then pick bin by bin.
                </Text>
              </View>

              <Text className="mt-10 font-semibold text-xs uppercase tracking-wide text-slate-500">
                How it works
              </Text>
              <View className="mt-3 gap-3">
                <FlowRow
                  n="1"
                  title="Open your pick queue"
                  detail="Assigned orders show up here when they are ready."
                />
                <FlowRow
                  n="2"
                  title="Get an optimized route"
                  detail="The app computes visit order and total distance for the trip."
                />
                <FlowRow
                  n="3"
                  title="Confirm each pick"
                  detail="Walk to the highlighted bin, confirm, then move to the next stop."
                />
                <FlowRow
                  n="4"
                  title="Complete the order"
                  detail="When every bin is picked, mark the order done and return to the queue."
                />
              </View>
            </View>

            <View className={`gap-3 pb-10 ${isDesktop ? 'px-10 pt-4' : 'px-8'}`}>
              <Pressable
                onPress={() => router.push('/(auth)/signup')}
                className="h-14 items-center justify-center rounded-full bg-orange-500 active:bg-orange-600">
                <Text className="font-semibold text-lg text-white">Create account</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(auth)/signin')}
                className="h-14 items-center justify-center rounded-full border border-slate-600 active:bg-slate-800">
                <Text className="font-semibold text-lg text-white">Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FlowRow({ n, title, detail }: { n: string; title: string; detail: string }) {
  return (
    <View className="flex-row items-start rounded-2xl border border-slate-700 bg-slate-800/60 p-3.5">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-orange-500">
        <Text className="font-bold text-xs text-white">{n}</Text>
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-sm text-white">{title}</Text>
        <Text className="mt-0.5 text-xs leading-4 text-slate-400">{detail}</Text>
      </View>
    </View>
  );
}
