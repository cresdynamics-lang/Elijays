import { BRAND } from "@/lib/constants";
import { getEnabledCategories } from "@/lib/navigation";

export function StructuredData() {
  const categories = getEnabledCategories();

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.fullName,
    url: "https://elijays.co.ke",
    logo: "https://elijays.co.ke/brand/elijays-logo-nav.png",
    sameAs: [BRAND.instagram],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+${BRAND.phoneE164}`,
      contactType: "customer service",
      areaServed: "KE",
      availableLanguage: ["English", "Swahili"],
    },
  };

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "MensClothingStore",
    name: BRAND.fullName,
    image: "https://elijays.co.ke/hero/hero-elijays.jpg",
    url: "https://elijays.co.ke",
    telephone: `+${BRAND.phoneE164}`,
    priceRange: "KES",
    address: {
      "@type": "PostalAddress",
      streetAddress: `${BRAND.address.street}, ${BRAND.address.landmark}`,
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -1.2833,
      longitude: 36.8219,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "20:00",
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "ELIJAYS wardrobe",
      itemListElement: categories.map((c) => ({
        "@type": "OfferCatalog",
        name: c.label,
        url: `https://elijays.co.ke${c.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
    </>
  );
}
