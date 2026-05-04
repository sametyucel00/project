"use client";

import { MapSurface } from "@/components/DiscoveryList";
import { db } from "@/lib/firebase";
import { ancientGuideStops, touristSurvivalKit, type AncientGuideStop, type SurvivalKitItem } from "@nar/core";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { Ambulance, Building2, MapPinned } from "lucide-react";
import { useEffect, useState } from "react";

const iconByCategory = {
  emergency: Ambulance,
  consulate: Building2,
  hospital: Ambulance,
  pharmacy: Ambulance,
  transport: MapPinned,
  touristInfo: MapPinned
};

export function LiveTouristSurvivalKit() {
  const [items, setItems] = useState<SurvivalKitItem[]>(touristSurvivalKit);
  const [status, setStatus] = useState("Varsayılan turist destek bilgileri gösteriliyor.");

  useEffect(() => {
    let active = true;

    async function loadItems() {
      try {
        const snapshot = await getDocs(query(
          collection(db, "touristSurvivalKit"),
          where("status", "==", "published"),
          limit(48)
        ));
        if (!active) return;
        const liveItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as SurvivalKitItem);
        setItems(liveItems.length ? liveItems : touristSurvivalKit);
        setStatus(liveItems.length ? "Güncel turist destek bilgileri gösteriliyor." : "Varsayılan turist destek bilgileri gösteriliyor.");
      } catch (error) {
        if (!active) return;
        setItems(touristSurvivalKit);
        setStatus(error instanceof Error ? error.message : "Turist destek bilgileri yüklenemedi.");
      }
    }

    void loadItems();

    return () => {
      active = false;
    };
  }, []);

  const categories = [...new Set(items.map((item) => item.category))];

  return (
    <>
      <p className="meta" aria-live="polite">{status}</p>
      <div className="role-flow" aria-label="Turist destek kategorileri">
        {categories.map((category) => <span key={category}>{category}</span>)}
      </div>
      <div className="survival-grid">
        {items.map((item) => {
          const Icon = iconByCategory[item.category];
          return (
            <article key={item.id}>
              <Icon size={22} />
              <span className="meta">{item.category}</span>
              <h2>{item.title.tr}</h2>
              <p>{item.description.tr}</p>
              {item.phone ? <a href={`tel:${item.phone}`}>{item.phone}</a> : null}
            </article>
          );
        })}
      </div>
    </>
  );
}

export function LiveAncientGuide() {
  const [stops, setStops] = useState<AncientGuideStop[]>(ancientGuideStops);
  const [status, setStatus] = useState("Varsayılan Antik Rehber içerikleri gösteriliyor.");

  useEffect(() => {
    let active = true;

    async function loadStops() {
      try {
        const snapshot = await getDocs(query(
          collection(db, "ancientGuideStops"),
          where("status", "==", "published"),
          orderBy("district", "asc"),
          limit(48)
        ));
        if (!active) return;
        const liveStops = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AncientGuideStop);
        setStops(liveStops.length ? liveStops : ancientGuideStops);
        setStatus(liveStops.length ? "Güncel Antik Rehber içerikleri gösteriliyor." : "Varsayılan Antik Rehber içerikleri gösteriliyor.");
      } catch (error) {
        if (!active) return;
        setStops(ancientGuideStops);
        setStatus(error instanceof Error ? error.message : "Antik Rehber içerikleri yüklenemedi.");
      }
    }

    void loadStops();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <p className="meta" aria-live="polite">{status}</p>
      <div className="metric-strip" aria-label="Antik rota özeti">
        <div className="metric"><span>Durak</span><strong>{stops.length}</strong></div>
        <div className="metric"><span>İlçe</span><strong>{[...new Set(stops.map((stop) => stop.district))].length}</strong></div>
        <div className="metric"><span>Modül</span><strong>Mini keşif</strong></div>
      </div>
      <div className="ancient-list">
        {stops.map((stop, index) => (
          <article key={stop.id}>
            <div className="place-image" style={{ backgroundImage: `url(${stop.image}?auto=format&fit=crop&w=900&q=80)` }} />
            <span className="meta">Durak {index + 1} · {stop.district} · {stop.era}</span>
            <h2>{stop.title.tr}</h2>
            <p>{stop.description.tr}</p>
            <MapSurface title={stop.title.tr} address={stop.district} location={stop.location} />
          </article>
        ))}
      </div>
    </>
  );
}
