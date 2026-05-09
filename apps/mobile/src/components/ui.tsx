import { Ionicons } from "@expo/vector-icons";
import { t } from "@nar/core";
import { memo, type ReactNode } from "react";
import { ImageBackground, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { getMobileLocale } from "../locale";
import { styles } from "../styles";
import { theme } from "../theme";

const fallbackCoverImage =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600" fill="none">
    <rect width="900" height="600" rx="48" fill="#F7F1EA"/>
    <path d="M0 420C120 360 250 320 360 340C470 360 560 440 675 450C780 460 840 420 900 390V600H0V420Z" fill="#D6E2D8"/>
    <circle cx="690" cy="150" r="92" fill="#C63F2E" fill-opacity="0.16"/>
    <circle cx="140" cy="140" r="64" fill="#276B73" fill-opacity="0.12"/>
    <rect x="120" y="220" width="240" height="18" rx="9" fill="#171412" fill-opacity="0.12"/>
    <rect x="120" y="254" width="180" height="18" rx="9" fill="#171412" fill-opacity="0.08"/>
    <rect x="120" y="320" width="260" height="12" rx="6" fill="#171412" fill-opacity="0.08"/>
    <rect x="120" y="346" width="210" height="12" rx="6" fill="#171412" fill-opacity="0.08"/>
    <rect x="564" y="214" width="174" height="174" rx="34" fill="#FFFFFF" fill-opacity="0.42"/>
    <path d="M610 320L656 274L694 312L732 284V358H610V320Z" fill="#C63F2E" fill-opacity="0.38"/>
    <circle cx="664" cy="280" r="16" fill="#276B73" fill-opacity="0.38"/>
  </svg>
  `);

function resolveImageSource(image?: string) {
  if (!image?.trim()) return fallbackCoverImage;
  if (image.startsWith("data:image")) return image;
  return `${image}?auto=format&fit=crop&w=720&q=82`;
}

export function SearchBar({ value, onChangeText, placeholder = "Mekan, etkinlik, fırsat ara" }: { value: string; onChangeText: (value: string) => void; placeholder?: string }) {
  const locale = getMobileLocale();
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={theme.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder === "Mekan, etkinlik, fırsat ara" ? t(locale, "searchPlaceholder") : placeholder}
        placeholderTextColor={theme.muted}
        style={styles.searchInput}
        returnKeyType="search"
      />
    </View>
  );
}

export function FilterRow({ filters, activeFilter, onSelect }: { filters: string[]; activeFilter?: string; onSelect?: (filter: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {filters.map((filter) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: activeFilter === filter }}
          onPress={() => onSelect?.(filter)}
          style={[styles.filterChipButton, activeFilter === filter && styles.filterChipButtonActive]}
          key={filter}
        >
          <Text style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}>{filter}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export const WideItem = memo(function WideItem({ image, title, meta, onPress, disableImage = false }: { image: string; title: string; meta: string; onPress?: () => void; disableImage?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.wideItem}>
      {disableImage ? <View style={[styles.wideImageBox, styles.wideImagePlaceholder]} /> : <ImageBackground source={{ uri: resolveImageSource(image) }} imageStyle={styles.wideImage} style={styles.wideImageBox} />}
      <View style={styles.wideCopy}>
        <Text style={styles.wideTitle}>{title}</Text>
        <Text style={styles.wideMeta}>{meta}</Text>
      </View>
    </Pressable>
  );
});

export function Mini({ title, subtitle, icon, onPress }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.mini}>
      <Ionicons name={icon} size={22} color={theme.sea} />
      <Text style={styles.miniTitle}>{title}</Text>
      <Text style={styles.miniSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export function StoryRail({ offers, activeStory, onSelect }: { offers: Array<{ id: string; discountLabel: string }>; activeStory?: string; onSelect?: (story: string) => void }) {
  const locale = getMobileLocale();
  const storyCopy = storyLabels[locale] ?? storyLabels.tr;
  const staticStories = [
    { key: "Tiyatro", label: storyCopy.theater, icon: "musical-notes-outline" as const },
    { key: "Kahve", label: storyCopy.coffee, icon: "cafe-outline" as const },
    { key: "Antik", label: storyCopy.ancient, icon: "library-outline" as const },
    { key: "Acil", label: storyCopy.emergency, icon: "alert-circle-outline" as const }
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRail}>
      {offers.map((offer) => (
        <Pressable accessibilityRole="button" onPress={() => onSelect?.(offer.id)} style={styles.story} key={offer.id}>
          <View style={[styles.storyRing, activeStory === offer.id && styles.storyRingActive]}>
            <Text style={styles.storyDiscount}>{offer.discountLabel}</Text>
          </View>
          <Text style={[styles.storyText, activeStory === offer.id && styles.storyTextActive]}>{storyCopy.featured}</Text>
        </Pressable>
      ))}
      {staticStories.map((item) => (
        <Pressable accessibilityRole="button" onPress={() => onSelect?.(item.key)} style={styles.story} key={item.key}>
          <View style={[styles.storyRing, activeStory === item.key && styles.storyRingActive]}>
            <Ionicons name={item.icon} size={18} color={theme.coloredText} />
          </View>
          <Text style={[styles.storyText, activeStory === item.key && styles.storyTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const storyLabels = {
  tr: { featured: "Öne çıkan", theater: "Tiyatro", coffee: "Kahve", ancient: "Antik", emergency: "Acil" },
  en: { featured: "Featured", theater: "Theater", coffee: "Coffee", ancient: "Ancient", emergency: "Help" },
  ru: { featured: "Избранное", theater: "Театр", coffee: "Кофе", ancient: "Античность", emergency: "Помощь" },
  de: { featured: "Empfohlen", theater: "Theater", coffee: "Kaffee", ancient: "Antike", emergency: "Hilfe" }
} as const;

export const OfferItem = memo(function OfferItem({ title, discount, meta, onPress }: { title: string; discount: string; meta: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.offerItem}>
      <Text style={styles.offerDiscount}>{discount}</Text>
      <View style={styles.wideCopy}>
        <Text style={styles.wideTitle}>{title}</Text>
        <Text style={styles.wideMeta}>{meta}</Text>
      </View>
    </Pressable>
  );
});

export function DetailLinkRow({
  icon,
  label,
  value,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.detailLinkRow}>
      <View style={styles.detailLinkLabelWrap}>
        <Ionicons name={icon} size={16} color={theme.nar} />
        <Text style={styles.detailLinkLabel}>{label}</Text>
      </View>
      <Text style={styles.detailLinkValue}>{value}</Text>
    </Pressable>
  );
}

export function ActionPill({ label, onPress, variant = "primary", disabled = false }: { label: string; onPress?: () => void; variant?: "primary" | "secondary"; disabled?: boolean }) {
  const secondary = variant === "secondary";
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={disabled ? undefined : onPress} style={[styles.actionPill, secondary && styles.actionPillSecondary, disabled && { opacity: 0.62 }]}>
      <Text style={secondary ? styles.actionPillTextSecondary : styles.actionPillText}>{label}</Text>
    </Pressable>
  );
}

export function ActionRow({ children }: { children: ReactNode }) {
  return <View style={styles.actionRow}>{children}</View>;
}

export function DetailPreview({ title, rows, onRowPress }: { title: string; rows: Array<[string, string]>; onRowPress?: (index: number) => void }) {
  return (
    <View style={styles.detailPreview}>
      <Text style={styles.detailPreviewTitle}>{title}</Text>
      {rows.map(([label, value], index) => {
        const content = (
          <>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
          </>
        );
        return onRowPress ? (
          <Pressable key={`${label}-${index}`} accessibilityRole="button" onPress={() => onRowPress(index)} style={({ pressed }) => [styles.detailRow, pressed && { opacity: 0.72 }]}>
            {content}
          </Pressable>
        ) : (
          <View style={styles.detailRow} key={`${label}-${index}`}>
            {content}
          </View>
        );
      })}
    </View>
  );
}

export function DetailHeroCard({ image, eyebrow, title, subtitle }: { image: string; eyebrow: string; title: string; subtitle?: string }) {
  return (
    <ImageBackground source={{ uri: resolveImageSource(image) }} imageStyle={styles.detailHeroImage} style={styles.detailHeroCard}>
      <View style={styles.detailHeroOverlay}>
        <Text style={styles.detailHeroEyebrow}>{eyebrow}</Text>
        <Text style={styles.detailHeroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.detailHeroSubtitle}>{subtitle}</Text> : null}
      </View>
    </ImageBackground>
  );
}

export function StatStrip({ items }: { items: Array<[string, string]> }) {
  return (
    <View style={styles.statStrip}>
      {items.map(([label, value]) => (
        <View style={styles.statItem} key={label}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export function SubsectionGrid({ items }: { items: string[] }) {
  return (
    <View style={styles.subsectionGrid}>
      {items.map((item) => <Text style={styles.subsectionChip} key={item}>{item}</Text>)}
    </View>
  );
}
