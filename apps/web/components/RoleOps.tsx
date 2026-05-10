"use client";

import { badges, localizeText, userTasks, type UserRole } from "@nar/core";
import { Languages, Medal, QrCode, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { listAdminUsers, setUserDisabled, updateUserRole, useQrTransaction, type AdminUserSummary } from "@/lib/panel-actions";

const assignableRoles: UserRole[] = ["individual", "business", "theater", "admin"];
const roleLabels: Record<UserRole, string> = {
  individual: "Bireysel",
  business: "İşletme",
  theater: "Tiyatro",
  admin: "Yönetici"
};

export function RoleOps({ role }: { role: UserRole }) {
  if (role === "business") {
    return (
      <section className="role-ops">
        <QrCode size={22} />
        <h2>QR İşlemleri</h2>
        <p>Kullanıcı QR kodu okutulduğunda puan ekleme, puan düşme veya kampanya kullanımı buradan kaydedilir.</p>
        <div className="role-flow">
          {["QR oku", "Mekan seç", "Puanı işle", "Geçmişe kaydet"].map((item) => <span key={item}>{item}</span>)}
        </div>
        <BusinessQrManager />
      </section>
    );
  }

  if (role === "theater") {
    return (
      <section className="role-ops">
        <Languages size={22} />
        <h2>Sinopsis Çevirisi</h2>
        <p>Türkçe sinopsis, diğer diller için taslak metne dönüştürülür; yayınlamadan önce düzenlenebilir.</p>
        <div className="role-flow">
          {["Türkçe metin", "Taslak çeviri", "Önizleme", "Yayın onayı"].map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>
    );
  }

  if (role === "individual") {
    return (
      <section className="role-ops">
        <Medal size={22} />
        <h2>Görev ve Rozetler</h2>
        <p>Görevler tamamlandıkça puan ve rozet kazanımı hesaba işlenir.</p>
        <div className="compact-list">
          {userTasks.map((task) => {
            const badge = badges.find((item) => item.id === task.badgeId);
            return (
              <article key={task.id}>
                <strong>{localizeText(task.title, "tr")}</strong>
                <span>{task.rewardPoints} puan · {badge ? localizeText(badge.title, "tr") : "Rozet yok"}</span>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return <AdminRoleManager />;
}

function BusinessQrManager() {
  const [qrUserId, setQrUserId] = useState("");
  const [placeId, setPlaceId] = useState("harbor-coffee");
  const [offerId, setOfferId] = useState("");
  const [pointsDelta, setPointsDelta] = useState(75);
  const [status, setStatus] = useState("QR işlemi bekliyor.");

  async function submitQrTransaction() {
    if (!qrUserId.trim()) {
      setStatus("QR işlemi için kullanıcı kimliği gerekli.");
      return;
    }
    setStatus("QR işlemi kaydediliyor.");
    try {
      const result = await useQrTransaction({
        userId: qrUserId.trim(),
        placeId: placeId.trim(),
        offerId: offerId.trim() || null,
        pointsDelta,
        scanId: `web-${qrUserId.trim()}-${placeId.trim()}-${Date.now()}`,
        note: offerId.trim() ? "Panel kampanya doğrulaması" : "Panel puan hareketi"
      });
      setStatus(`İşlem kaydedildi. Yeni bakiye: ${result.data.balanceAfter}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "QR işlemi kaydedilemedi.");
    }
  }

  return (
    <div className="mini-form">
      <label>
        Kullanıcı kimliği
        <input value={qrUserId} onChange={(event) => setQrUserId(event.target.value)} placeholder="Kullanıcı ID veya QR ID" />
      </label>
      <label>
        Mekan kimliği
        <input value={placeId} onChange={(event) => setPlaceId(event.target.value)} />
      </label>
      <label>
        Kampanya kimliği
        <input value={offerId} onChange={(event) => setOfferId(event.target.value)} placeholder="Opsiyonel" />
      </label>
      <label>
        Puan hareketi
        <input type="number" value={pointsDelta} onChange={(event) => setPointsDelta(Number(event.target.value))} />
      </label>
      <button className="secondary" onClick={submitQrTransaction}>QR işlemini kaydet</button>
      <p className="meta" aria-live="polite">{status}</p>
    </div>
  );
}

function AdminRoleManager() {
  const [userId, setUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("business");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [status, setStatus] = useState("Üye ve rol yönetimi hazır.");

  async function refreshUsers() {
    setStatus("Üye listesi alınıyor.");
    try {
      const result = await listAdminUsers({ search, role: roleFilter, limit: 25 });
      setUsers(result.data.users);
      setStatus(`${result.data.users.length} üye listelendi.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Üyeler listelenemedi.");
    }
  }

  useEffect(() => {
    void refreshUsers();
  }, []);

  async function submitRoleUpdate() {
    if (!userId.trim()) {
      setStatus("Rol güncellemek için kullanıcı kimliği gerekli.");
      return;
    }
    setStatus("Rol güncelleniyor.");
    try {
      await updateUserRole({ userId: userId.trim(), role: selectedRole });
      setStatus("Rol güncellendi.");
      await refreshUsers();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Rol güncellenemedi.");
    }
  }

  async function toggleUserDisabled(user: AdminUserSummary) {
    setStatus(`${user.displayName} hesabı güncelleniyor.`);
    try {
      await setUserDisabled({ userId: user.id, disabled: !user.disabled });
      setStatus(user.disabled ? "Hesap aktifleştirildi." : "Hesap pasifleştirildi.");
      await refreshUsers();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Hesap durumu güncellenemedi.");
    }
  }

  return (
    <section className="role-ops" aria-labelledby="admin-role-manager-title">
      <Users size={22} />
      <h2 id="admin-role-manager-title">Üye ve Rol Yönetimi</h2>
      <p>Roller, hesap durumu ve kullanıcı erişimleri buradan düzenlenir.</p>
      <div className="mini-form">
        <label>
          Üye arama
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ad, e-posta, şehir veya kullanıcı ID" />
        </label>
        <label>
          Rol filtresi
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "all")}>
            <option value="all">Tümü</option>
            {assignableRoles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}
          </select>
        </label>
        <button className="secondary" onClick={refreshUsers}><Search size={16} /> Üyeleri listele</button>
        <label>
          Kullanıcı kimliği
          <input value={userId} onChange={(event) => setUserId(event.target.value)} />
        </label>
        <label>
          Rol
          <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as UserRole)}>
            {assignableRoles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}
          </select>
        </label>
        <button className="secondary" onClick={submitRoleUpdate}>Rolü güncelle</button>
        <p className="meta" aria-live="polite">{status}</p>
      </div>
      <div className="compact-list" aria-label="Üye listesi">
        {users.length === 0 ? (
          <article>
            <strong>Üye bulunamadı</strong>
            <span>Arama veya rol filtresini değiştirerek tekrar deneyin.</span>
          </article>
        ) : users.map((user) => (
          <article key={user.id}>
            <div>
              <strong>{user.displayName}</strong>
              <span>{user.email || "E-posta belirtilmemiş"} · {user.city} · {user.points} puan</span>
              <span>{user.id}</span>
            </div>
            <div className="role-flow">
              <span>{roleLabels[user.role] ?? user.role}</span>
              <span>{user.disabled ? "Pasif" : "Aktif"}</span>
              <button className="secondary" onClick={() => {
                setUserId(user.id);
                setSelectedRole(user.role);
              }}>Seç</button>
              <button className="secondary" onClick={() => toggleUserDisabled(user)}>
                {user.disabled ? "Aktifleştir" : "Pasifleştir"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
