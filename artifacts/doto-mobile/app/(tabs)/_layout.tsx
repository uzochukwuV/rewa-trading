import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Txt } from '@/components/ui';

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'home',
  discover: 'search',
  trade: 'repeat',
  portfolio: 'briefcase',
};

const LABELS: Record<string, string> = {
  index: 'Home',
  discover: 'Markets',
  trade: 'Spot',
  portfolio: 'Portfolio',
};

interface DotoTabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string; params?: object }[];
  };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: object) => void;
  };
}

function DotoTabBar({ state, navigation }: DotoTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 10);
  return (
    <View
      style={[
        styles.bar,
        {
          bottom,
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const icon = ICONS[route.name] ?? 'circle';
        const color = active ? colors.foreground : colors.mutedForeground;
          const label = LABELS[route.name] ?? route.name;
        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            style={({ pressed }) => [
              styles.tab,
              active && { backgroundColor: colors.accent },
              route.name === 'trade' && styles.swapTab,
              pressed && { opacity: 0.72 },
            ]}
          >
            <Feather name={icon} size={route.name === 'trade' ? 21 : 19} color={color} />
            <Txt size={10} weight={active ? 'semibold' : 'medium'} color={color}>{label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  return (
    <Tabs
      tabBar={(props) => <DotoTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Markets' }} />
      <Tabs.Screen name="trade" options={{ title: 'Spot' }} />
      <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 22,
    right: 22,
    height: 62,
    paddingHorizontal: 8,
    borderRadius: 34,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 16,
  },
  tab: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 25,
  },
  swapTab: {
    marginHorizontal: 5,
  },
});
