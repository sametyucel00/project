import { t, type Locale } from "@nar/core";
import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../styles";

type LegalKind = "privacy" | "terms";

type LegalProps = {
  locale: Locale;
  kind: LegalKind;
  onBack: () => void;
};

const legalCopy = {
  tr: {
    privacy: {
      title: "Gizlilik ve veri kullanımı",
      intro: "Nar Rehberi, konum, tercih ve hesap verilerini yalnızca uygulama deneyimi için kullanır.",
      points: [
        "Konum izni, yakın mekan ve harita yönlendirmeleri için kullanılır.",
        "Dil, tema ve bildirim tercihleri cihazda ve izinli olduğunda bulutta saklanabilir.",
        "QR ve puan işlemleri kullanıcı hesabına bağlıdır.",
        "İstediğinde hesabını kapatabilir ve yerel ayarlarını sıfırlayabilirsin."
      ]
    },
    terms: {
      title: "Kullanım koşulları",
      intro: "Uygulamayı kullanarak aşağıdaki temel kuralları kabul etmiş olursun.",
      points: [
        "Veri doğruluğu kullanıcı, işletme ve yönetim girdilerine dayanır.",
        "Kötüye kullanım, otomasyon veya yetkisiz erişim engellenebilir.",
        "Harita, yönlendirme ve üçüncü taraf servisler kendi kurallarına tabidir.",
        "Giriş yöntemleri hesap oluşturma ve rol bazlı yönlendirme amacıyla kullanılır."
      ]
    }
  },
  en: {
    privacy: {
      title: "Privacy and data use",
      intro: "Nar Rehberi uses location, preference and account data only to power the app experience.",
      points: [
        "Location permission is used for nearby places and map directions.",
        "Language, theme and notification preferences may be stored locally and, when allowed, in the cloud.",
        "QR and points operations are tied to the user account.",
        "You can sign out and reset local settings at any time."
      ]
    },
    terms: {
      title: "Terms of use",
      intro: "By using the app you agree to these core rules.",
      points: [
        "Data accuracy depends on user, business and admin inputs.",
        "Misuse, automation or unauthorized access may be blocked.",
        "Map, routing and third-party services follow their own policies.",
        "Login methods are used for account creation and role-based routing."
      ]
    }
  },
  ru: {
    privacy: {
      title: "Конфиденциальность и данные",
      intro: "Nar Rehberi использует данные о местоположении, предпочтениях и аккаунте только для работы приложения.",
      points: [
        "Разрешение на геолокацию используется для ближайших мест и маршрутов.",
        "Язык, тема и уведомления могут храниться локально и, если разрешено, в облаке.",
        "Операции QR и баллов привязаны к аккаунту пользователя.",
        "Можно выйти из аккаунта и сбросить локальные настройки в любое время."
      ]
    },
    terms: {
      title: "Условия использования",
      intro: "Используя приложение, вы соглашаетесь с основными правилами.",
      points: [
        "Точность данных зависит от ввода пользователей, бизнеса и админов.",
        "Злоупотребления, автоматизация и несанкционированный доступ могут быть заблокированы.",
        "Карты, маршруты и сторонние сервисы подчиняются своим правилам.",
        "Способы входа используются для создания аккаунта и маршрутизации по ролям."
      ]
    }
  },
  de: {
    privacy: {
      title: "Datenschutz und Datenverwendung",
      intro: "Nar Rehberi nutzt Standort-, Präferenz- und Kontodaten nur für das App-Erlebnis.",
      points: [
        "Standort wird für nahe Orte und Kartenwege verwendet.",
        "Sprache, Thema und Benachrichtigungen können lokal und bei Erlaubnis in der Cloud gespeichert werden.",
        "QR- und Punkteaktionen sind an das Benutzerkonto gebunden.",
        "Du kannst dich abmelden und lokale Einstellungen zurücksetzen."
      ]
    },
    terms: {
      title: "Nutzungsbedingungen",
      intro: "Mit der Nutzung der App akzeptierst du diese Grundregeln.",
      points: [
        "Datenqualität hängt von Nutzer-, Geschäfts- und Admin-Eingaben ab.",
        "Missbrauch, Automatisierung und unbefugter Zugriff können blockiert werden.",
        "Karten-, Routen- und Drittanbieterdienste folgen ihren eigenen Regeln.",
        "Login-Methoden dienen der Kontoerstellung und rollenbasierten Weiterleitung."
      ]
    }
  }
} as const;

export function LegalScreen({ locale, kind, onBack }: LegalProps) {
  const c = legalCopy[locale]?.[kind] ?? legalCopy.tr[kind];
  return (
    <View style={styles.startupScreen}>
      <ScrollView style={styles.startupScroll} contentContainerStyle={styles.startupContent} showsVerticalScrollIndicator={false}>
        <View style={styles.onboardingCard}>
          <Text style={styles.onboardingSectionTitle}>{t(locale, "appName")}</Text>
          <Text style={styles.onboardingTitle}>{c.title}</Text>
          <Text style={styles.onboardingText}>{c.intro}</Text>
          <View style={{ gap: 10 }}>
            {c.points.map((point) => (
              <View key={point} style={styles.onboardingListItem}>
                <Text style={styles.onboardingListText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.onboardingCard}>
          <Text style={styles.onboardingText}>Bu ekrandaki metinler uygulama içi bilgilendirme amaçlıdır.</Text>
          <Text style={styles.onboardingText}>Ayarlar üzerinden dilediğin zaman hesabını yönetebilir, yerel verini sıfırlayabilirsin.</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={onBack} style={styles.onboardingAction}>
          <Text style={styles.onboardingActionText}>{locale === "en" ? "Back" : locale === "ru" ? "Назад" : locale === "de" ? "Zurück" : "Geri"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
