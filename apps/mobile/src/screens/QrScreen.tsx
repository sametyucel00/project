import { Image, ScrollView, Text, View } from "react-native";
import type { MobileSession } from "../services";
import { ActionPill } from "../components/ui";
import { styles } from "../styles";
import { theme } from "../theme";

type QrLocale = "tr" | "en" | "ru" | "de";

type QrScreenProps = {
  session: MobileSession | null;
  locale: QrLocale;
  onBack: () => void;
};

const qrCopy = {
  tr: {
    ready: "QR kodun hazır",
    login: "QR kod için giriş yap",
    private: "Bu kodu işletmeye göster; giriş yaptığında puan ve fırsat işlemleri hesabına bağlanır.",
    business: "Bu kodu işletmeye göster. İşletmeler QR puan işlemlerini bu kod üzerinden kaydeder.",
    loginHint: "QR kodunu görmek için giriş yapman gerekiyor.",
    codeTitle: "Kod",
    accessibility: "Kişisel QR kod",
    howTitle: "Nasıl kullanılır",
    howText:
      "Müşteri, sağ üstteki QR ekranını açıp kodunu işletmeye gösterir. İşletme ise kendi panelinde QR işlem formuna bu kodu veya kullanıcı kimliğini girerek puan ekler ya da fırsat kullanımını kaydeder.",
    back: "Geri dön"
  },
  en: {
    ready: "Your QR code is ready",
    login: "Sign in to view your QR code",
    private: "Show this code to the business; once signed in, point and offer actions are linked to your account.",
    business: "Show this code to the business. Businesses record QR point actions through this code.",
    loginHint: "You need to sign in to see your QR code.",
    codeTitle: "Code",
    accessibility: "Personal QR code",
    howTitle: "How to use it",
    howText:
      "The customer opens the QR screen at the top right and shows the code to the business. The business enters this code or the user ID into its QR action form to add points or record offer usage.",
    back: "Back"
  },
  ru: {
    ready: "Ваш QR-код готов",
    login: "Войдите, чтобы увидеть QR-код",
    private: "Покажите этот код бизнесу; после входа операции с баллами и предложениями будут связаны с вашим аккаунтом.",
    business: "Покажите этот код бизнесу. Бизнес фиксирует QR-операции с баллами через этот код.",
    loginHint: "Чтобы увидеть QR-код, нужно войти в аккаунт.",
    codeTitle: "Код",
    accessibility: "Личный QR-код",
    howTitle: "Как использовать",
    howText:
      "Клиент открывает QR-экран в правом верхнем углу и показывает код бизнесу. Бизнес вводит этот код или идентификатор пользователя в форму QR-операции, чтобы начислить баллы или отметить использование предложения.",
    back: "Назад"
  },
  de: {
    ready: "Dein QR-Code ist bereit",
    login: "Anmelden, um den QR-Code zu sehen",
    private: "Zeige diesen Code dem Geschäft; nach der Anmeldung werden Punkte- und Angebotsaktionen deinem Konto zugeordnet.",
    business: "Zeige diesen Code dem Geschäft. Unternehmen erfassen QR-Punkteaktionen über diesen Code.",
    loginHint: "Du musst dich anmelden, um deinen QR-Code zu sehen.",
    codeTitle: "Code",
    accessibility: "Persönlicher QR-Code",
    howTitle: "So funktioniert es",
    howText:
      "Der Kunde öffnet oben rechts den QR-Bildschirm und zeigt den Code dem Geschäft. Das Geschäft gibt diesen Code oder die Nutzer-ID in das QR-Formular ein, um Punkte zu gutschreiben oder die Angebotsnutzung zu erfassen.",
    back: "Zurück"
  }
} as const;

export function QrScreen({ session, locale, onBack }: QrScreenProps) {
  const copy = qrCopy[locale] ?? qrCopy.tr;
  const code = session?.qrCodeId ?? "";
  const qrUrl = code ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(code)}` : "";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.profileSurface}>
        <Text style={styles.profilePoints}>QR</Text>
        <Text style={styles.profileTitle}>{session ? copy.ready : copy.login}</Text>
        <Text style={styles.profileText}>
          {session
            ? session.isAnonymous
              ? copy.private
              : copy.business
            : copy.loginHint}
        </Text>

        {session ? (
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>{copy.codeTitle}</Text>
            <View style={{ alignItems: "center", gap: 16 }}>
              {qrUrl ? (
                <Image
                  accessibilityLabel={copy.accessibility}
                  source={{ uri: qrUrl }}
                  style={{ width: 240, height: 240, borderRadius: 24, backgroundColor: theme.paper }}
                />
              ) : null}
              <Text style={[styles.profileText, { fontFamily: "monospace", textAlign: "center" }]}>{code}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{copy.howTitle}</Text>
          <Text style={styles.profileText}>{copy.howText}</Text>
        </View>

        <ActionPill label={copy.back} onPress={onBack} />
      </View>
    </ScrollView>
  );
}
