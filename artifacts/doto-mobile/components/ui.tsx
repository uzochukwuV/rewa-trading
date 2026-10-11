import React, { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { MARKET_DATA, Market, money } from '@/data/market';

type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export function Txt({
  children,
  size = 15,
  weight = 'regular',
  color,
  style,
  ...props
}: TextProps & { children?: ReactNode; size?: number; weight?: FontWeight; color?: string }) {
  const colors = useColors();
  const family = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  }[weight];
  return (
    <Text
      {...props}
      style={[{ color: color ?? colors.foreground, fontSize: size, fontFamily: family }, style]}
    >
      {children}
    </Text>
  );
}

export function Page({
  children,
  contentStyle,
  scroll = true,
  edges = ['top'],
}: {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}) {
  const colors = useColors();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.pageContent,
            Platform.OS === 'web' && { paddingTop: 67, paddingBottom: 34 },
            contentStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[
          styles.pageContent,
          { flex: 1 },
          Platform.OS === 'web' && { paddingTop: 67, paddingBottom: 34 },
          contentStyle,
        ]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Brand({ small = false }: { small?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}>
        <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.brandHalf, { backgroundColor: colors.primary }]} />
      </View>
      <Txt size={small ? 19 : 24} weight="bold" color={colors.primary}>doto</Txt>
    </View>
  );
}

export function DemoBadge({ label = 'SIMULATED DATA' }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.demoBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
      <Txt size={10} weight="semibold" color={colors.mutedForeground}>{label}</Txt>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon,
  variant = 'green',
  disabled = false,
  testID,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  variant?: 'green' | 'white' | 'dark' | 'outline';
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const backgroundColor =
    variant === 'green' ? colors.primary :
    variant === 'white' ? colors.buttonLight :
        variant === 'outline' ? 'transparent' : colors.secondary;
  const foreground =
    variant === 'green' ? colors.primaryForeground :
      variant === 'white' ? colors.buttonLightText : colors.foreground;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor, borderColor: colors.border, borderWidth: variant === 'outline' ? 1 : 0 },
        disabled && { opacity: 0.45 },
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon ? <Feather name={icon} size={18} color={foreground} /> : null}
      <Txt size={15} weight="semibold" color={foreground}>{title}</Txt>
    </Pressable>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function SectionHeading({
  title,
  action,
  onAction,
  icon,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.inline}>
        {icon ? <Feather name={icon} color={colors.foreground} size={20} /> : null}
        <Txt size={19} weight="semibold">{title}</Txt>
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Txt size={13} weight="medium" color={colors.primary}>{action}</Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Txt size={13} weight="medium" color={colors.mutedForeground}>{label}</Txt>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        selectionColor={colors.primary}
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
      />
    </View>
  );
}

export function AssetMark({ market, size = 42 }: { market?: Market; size?: number }) {
  const colors = useColors();
  const markColor = market?.ticker === 'NVDA' ? colors.primary :
    market?.ticker === 'AAPL' ? colors.fxBlue :
      market?.ticker === 'TSLA' ? colors.destructive : colors.gold;
  return (
    <View style={[styles.assetMark, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${markColor}20` }]}>
      <Txt size={size * 0.4} weight="bold" color={markColor}>{market?.badge ?? '₿'}</Txt>
    </View>
  );
}

export function MarketRow({
  market,
  favorite,
  onPress,
  onFavorite,
  compact = false,
}: {
  market: Market;
  favorite?: boolean;
  onPress: () => void;
  onFavorite?: () => void;
  compact?: boolean;
}) {
  const colors = useColors();
  const isUp = market.referenceChange >= 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.marketRow, pressed && styles.pressed, compact && { paddingVertical: 10 }]}
    >
      <AssetMark market={market} size={compact ? 38 : 44} />
      <View style={{ flex: 1, gap: 3 }}>
        <Txt size={14} weight="semibold">{market.ticker} <Txt size={12} weight="medium" color={colors.mutedForeground}>· {market.provider}</Txt></Txt>
        <Txt size={12} color={colors.mutedForeground}>{market.name} · {market.symbol}</Txt>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <Txt size={13} weight="medium">{money(market.price)}</Txt>
        <Txt size={12} weight="medium" color={isUp ? colors.primary : colors.destructive}>
          {isUp ? '+' : ''}{market.referenceChange.toFixed(2)}% vs ref
        </Txt>
      </View>
      {onFavorite ? (
        <Pressable
          onPress={(event) => { event.stopPropagation(); onFavorite(); }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={favorite ? `Remove ${market.name} from favorites` : `Add ${market.name} to favorites`}
          style={{ paddingLeft: 12 }}
        >
          <Feather name={favorite ? 'star' : 'star'} size={17} color={favorite ? colors.primary : colors.mutedForeground} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export function MiniChart({
  height = 112,
  color,
}: {
  height?: number;
  color?: string;
}) {
  const colors = useColors();
  const stroke = color ?? colors.primary;
  return (
    <Svg viewBox="0 0 360 110" preserveAspectRatio="none" style={{ width: '100%', height }}>
      <Path d="M0 79 L18 74 L34 83 L53 72 L69 74 L88 59 L104 66 L123 55 L142 61 L157 44 L177 51 L194 41 L211 45 L230 27 L246 37 L263 21 L279 31 L296 18 L313 25 L333 12 L350 20 L360 6" stroke={stroke} strokeWidth="3" fill="none" />
      <Path d="M0 79 L18 74 L34 83 L53 72 L69 74 L88 59 L104 66 L123 55 L142 61 L157 44 L177 51 L194 41 L211 45 L230 27 L246 37 L263 21 L279 31 L296 18 L313 25 L333 12 L350 20 L360 6 L360 110 L0 110 Z" fill={stroke} opacity={0.09} />
    </Svg>
  );
}

export function PromoArt() {
  const colors = useColors();
  return (
    <Svg viewBox="0 0 150 145" style={{ width: 140, height: 132 }}>
      <Path d="M75 14 L137 50 L75 87 L13 50 Z" fill={colors.promoPurple} opacity={0.95} />
      <Path d="M13 50 L75 87 L75 134 L13 98 Z" fill={colors.promoLilac} />
      <Path d="M75 87 L137 50 L137 98 L75 134 Z" fill={colors.primary} />
      <Path d="M75 27 L107 46 L75 65 L43 46 Z" fill={colors.promoPale} />
      <Path d="M53 46 L75 59 L75 96 L53 83 Z" fill={colors.promoSoft} />
      <Path d="M75 59 L97 46 L97 83 L75 96 Z" fill={colors.promoMint} />
    </Svg>
  );
}

export function marketFor(symbol: string) {
  return MARKET_DATA.find((item) => item.symbol === symbol) ?? MARKET_DATA[0];
}

export function Hairline() {
  const colors = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

const styles = StyleSheet.create({
  pageContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 118, gap: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 29, height: 30, flexDirection: 'row', alignItems: 'center', gap: 3 },
  brandDot: { width: 12, height: 12, borderRadius: 8 },
  brandHalf: { width: 14, height: 28, borderTopRightRadius: 15, borderBottomRightRadius: 15 },
  demoBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 30, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 6 },
  primaryButton: { minHeight: 50, borderRadius: 28, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  panel: { padding: 16, borderRadius: 22, borderWidth: 1 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 27 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  input: { height: 50, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, fontSize: 15, fontFamily: 'Inter_500Medium' },
  assetMark: { alignItems: 'center', justifyContent: 'center' },
  marketRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12 },
});
