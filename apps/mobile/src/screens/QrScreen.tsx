import { Image, Pressable, ScrollView, Text, View } from "react-native";
import type { MobileSession } from "../services";
import { ActionPill } from "../components/ui";
import { styles } from "../styles";
import { theme } from "../theme";

type QrScreenProps = {
  session: MobileSession | null;
  onBack: () => void;
};

export function QrScreen({ session, onBack }: QrScreenProps) {
  const code = session?.qrCodeId ?? "";
  const qrUrl = code ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(code)}` : "";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.profileSurface}>
        <Text style={styles.profilePoints}>QR</Text>
        <Text style={styles.profileTitle}>{session ? "QR kodun hazır" : "QR kod için giriş yap"}</Text>
        <Text style={styles.profileText}>
          {session
            ? session.isAnonymous
              ? "Bu kodu işletmeye göster; giriş yaptığında puan ve fırsat işlemleri hesabına bağlanır."
              : "Bu kodu işletmeye göster. İşletmeler QR puan işlemlerini bu kod üzerinden kaydeder."
            : "QR kodunu görmek için giriş yapman gerekiyor."}
        </Text>

        {session ? (
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Kod</Text>
            <View style={{ alignItems: "center", gap: 16 }}>
              {qrUrl ? (
                <Image
                  accessibilityLabel="Kişisel QR kod"
                  source={{ uri: qrUrl }}
                  style={{ width: 240, height: 240, borderRadius: 24, backgroundColor: theme.paper }}
                />
              ) : null}
              <Text style={[styles.profileText, { fontFamily: "monospace", textAlign: "center" }]}>{code}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Nasıl kullanılır</Text>
          <Text style={styles.profileText}>
            Müşteri, sağ üstteki QR ekranını açıp kodunu işletmeye gösterir. İşletme ise kendi panelinde QR işlem formuna bu kodu veya kullanıcı kimliğini girerek puan ekler ya da fırsat kullanımını kaydeder.
          </Text>
        </View>

        <ActionPill label="Geri dön" onPress={onBack} />
      </View>
    </ScrollView>
  );
}
