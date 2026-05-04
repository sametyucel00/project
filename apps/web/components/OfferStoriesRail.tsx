"use client";

import { offerStories } from "@nar/core";
import { localizeText } from "./DiscoveryList";
import { useLocale } from "./LocaleProvider";

export function OfferStoriesRail() {
  const { locale, t } = useLocale();

  return (
    <div className="stories-rail" aria-label={t("offers.stories")}>
      {offerStories.map((story) => (
        <a className="story-chip" href={`/firsatlar/${story.offerId}`} key={story.id}>
          <span className="story-ring" style={{ backgroundImage: `url(${story.image}?auto=format&fit=crop&w=220&q=80)` }} />
          <small>{localizeText(story.title, locale)}</small>
        </a>
      ))}
    </div>
  );
}
