import {
  PrismaClient,
  RoleKey,
  ProductStatus,
  OrderStatus,
  OrderChannel,
  PaymentMethod,
  PaymentStatus,
  PostStatus,
  ReviewStatus,
  AppointmentStatus,
  BespokeStatus,
  MovementType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { products as storefrontProducts } from "../src/lib/products";

const prisma = new PrismaClient();

const CATEGORY_MAP: Record<string, string> = {
  suits: "suits",
  jackets: "outerwear",
  sweaters: "knitwear",
  shirts: "shirts",
  trousers: "trousers",
  jeans: "jeans",
  belts: "accessories",
  ties: "accessories",
  socks: "accessories",
};

async function main() {
  console.log("Seeding ELIJAYS from storefront catalogue…");

  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.alterationRequest.deleteMany();
  await prisma.return.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.postProduct.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.completeLookItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.navItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.pageSection.deleteMany();
  await prisma.page.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.giftCard.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.bespokeRequest.deleteMany();
  await prisma.fabricSwatch.deleteMany();
  await prisma.fabric.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.address.deleteMany();
  await prisma.privateListEntry.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.location.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  const ownerPasswordHash = await bcrypt.hash("Turuthi.Elijays", 10);
  const staffPasswordHash = await bcrypt.hash("elijays2026", 10);

  const nehemiah = await prisma.user.create({
    data: {
      email: "nehekamiah@gmail.com",
      name: "Nehemiah",
      passwordHash: ownerPasswordHash,
      role: RoleKey.OWNER,
    },
  });
  const eli = await prisma.user.create({
    data: {
      email: "eli@elijays.co.ke",
      name: "Eli",
      passwordHash: staffPasswordHash,
      role: RoleKey.EDITOR,
    },
  });
  const jay = await prisma.user.create({
    data: {
      email: "jay@elijays.co.ke",
      name: "Jay",
      passwordHash: staffPasswordHash,
      role: RoleKey.STOCK,
    },
  });
  const wanjiru = await prisma.user.create({
    data: {
      email: "wanjiru@elijays.co.ke",
      name: "Wanjiru",
      passwordHash: staffPasswordHash,
      role: RoleKey.SALES,
    },
  });

  const shop = await prisma.location.create({
    data: { code: "SHOP", name: "Muindi Mbingu Street shop" },
  });
  const web = await prisma.location.create({
    data: { code: "WEB", name: "Website" },
  });

  const mediaByUrl = new Map<string, string>();
  async function ensureMedia(url: string, alt: string) {
    if (mediaByUrl.has(url)) return mediaByUrl.get(url)!;
    const filename = url.split("/").pop() || "asset.webp";
    const m = await prisma.mediaAsset.create({
      data: {
        filename,
        url,
        alt,
        mimeType: url.endsWith(".webp") ? "image/webp" : "image/jpeg",
        usageCount: 1,
      },
    });
    mediaByUrl.set(url, m.id);
    return m.id;
  }

  const catDefs = [
    { name: "Suits", slug: "suits", sortOrder: 1 },
    { name: "Shirts", slug: "shirts", sortOrder: 2 },
    { name: "Outerwear", slug: "outerwear", sortOrder: 3 },
    { name: "Knitwear", slug: "knitwear", sortOrder: 4 },
    { name: "Trousers", slug: "trousers", sortOrder: 5 },
    { name: "Jeans", slug: "jeans", sortOrder: 6 },
    { name: "Accessories", slug: "accessories", sortOrder: 7 },
  ];
  const catIds: Record<string, string> = {};
  for (const c of catDefs) {
    const row = await prisma.category.create({ data: c });
    catIds[c.slug] = row.id;
  }

  const heroMedia = await ensureMedia(
    "/hero/hero-model.webp",
    "Man in a navy suit at ELIJAYS",
  );
  await prisma.category.update({
    where: { id: catIds.suits },
    data: {
      imageId: heroMedia,
      headline: "Be read before you speak.",
      subline: "A suit is the first sentence you say in any room.",
    },
  });

  let skuSeq = 1;
  for (const p of storefrontProducts) {
    // skip shirt family pseudo-products without price suits etc - all have prices
    if (!p.price || !p.slug) continue;
    const catSlug = CATEGORY_MAP[p.category] || "accessories";
    const sku = `EJ-${p.category.slice(0, 2).toUpperCase()}-${String(skuSeq++).padStart(3, "0")}`;
    const mediaId = await ensureMedia(p.image, p.name);
    const updatedAt = p.updatedAt ? new Date(p.updatedAt) : new Date();
    // Prefer recent updates so New tag is live for recent pieces
    const publishedAt = updatedAt;

    const product = await prisma.product.create({
      data: {
        sku,
        name: p.name,
        slug: p.slug,
        shortLine: p.subtitle,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        categoryId: catIds[catSlug],
        priceKes: p.price,
        badges: [
          ...(p.isBestseller ? ["Bestseller"] : []),
          ...(p.isBespoke ? ["Bespoke"] : []),
        ],
        occasions: p.occasion ?? [],
        fabric: p.fabric ? { composition: p.fabric } : undefined,
        isBestseller: !!p.isBestseller,
        isBespoke: !!p.isBespoke,
        publishedAt,
        createdAt: updatedAt,
        updatedAt,
      },
    });

    await prisma.productImage.create({
      data: { productId: product.id, mediaId, sortOrder: 0 },
    });

    const sizes = p.sizes?.length ? p.sizes : ["OS"];
    const colours = p.colours?.length ? p.colours : ["Default"];
    for (const colour of colours.slice(0, 2)) {
      for (const size of sizes.slice(0, 6)) {
        const vSku = `${sku}-${colour.slice(0, 3).toUpperCase()}-${size}`;
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: vSku.slice(0, 48),
            colour,
            size,
            priceKes: p.price,
          },
        });
        const shopQty = p.stockHint?.toLowerCase().includes("sold") ? 0 : 4;
        const webQty = shopQty > 0 ? 3 : 0;
        await prisma.stockLevel.create({
          data: {
            variantId: variant.id,
            locationId: shop.id,
            quantity: shopQty,
            alertAt: 2,
          },
        });
        await prisma.stockLevel.create({
          data: {
            variantId: variant.id,
            locationId: web.id,
            quantity: webQty,
            alertAt: 2,
          },
        });
      }
    }
  }

  // Touch a few key bestsellers to "today" so New + Sale are visible
  const recentSlugs = [
    "navy-double-breasted",
    "charcoal-suede-biker",
    "ivory-oxford",
    "grey-cable-knit",
    "dark-indigo-selvedge",
    "teal-velvet-paisley-tie",
    "belt-wallet-gift-set",
    "midnight-blue-two-piece",
  ];
  const now = new Date();
  for (const slug of recentSlugs) {
    await prisma.product.updateMany({
      where: { slug },
      data: { updatedAt: now, publishedAt: now },
    });
  }
  await prisma.product.updateMany({
    where: { slug: { in: ["midnight-blue-two-piece", "charcoal-two-piece", "ivory-oxford", "navy-tailored-trouser", "belt-wallet-gift-set"] } },
    data: { isBestseller: true },
  });

  const jMwangi = await prisma.customer.create({
    data: {
      firstName: "J.",
      lastName: "Mwangi",
      phone: "+254712000001",
      email: "j.mwangi@example.com",
      tags: ["INNER CIRCLE"],
      notes: "Prefers navy. Wedding in November.",
    },
  });
  const aOtieno = await prisma.customer.create({
    data: { firstName: "A.", lastName: "Otieno", phone: "+254712000002" },
  });
  const dOchieng = await prisma.customer.create({
    data: {
      firstName: "D.",
      lastName: "Ochieng",
      phone: "+254712000005",
      tags: ["BESPOKE"],
    },
  });

  await prisma.measurement.create({
    data: {
      customerId: jMwangi.id,
      jacket: "40R",
      shirt: "L",
      waist: "32",
      inseam: "32",
    },
  });

  const ivory = await prisma.product.findFirst({ where: { slug: "ivory-oxford" } });
  const midnight = await prisma.product.findFirst({
    where: { slug: "midnight-blue-two-piece" },
  });

  const order1042 = await prisma.order.create({
    data: {
      number: 1042,
      customerId: jMwangi.id,
      status: OrderStatus.PAID,
      channel: OrderChannel.WEBSITE,
      subtotalKes: 38000,
      totalKes: 38000,
      internalNote: "Client wants it for a court appearance Monday.",
      deliveryNotes: "Karen · Today before 6pm",
      items: {
        create: [
          { name: midnight?.name ?? "Midnight Two-Piece", size: "40R", qty: 1, unitKes: 33500 },
          { name: ivory?.name ?? "Ivory Oxford", size: "L", qty: 1, unitKes: 4500 },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.MPESA,
          status: PaymentStatus.PAID,
          amountKes: 38000,
          mpesaReceipt: "QGH7XXXXX",
          paidAt: now,
        },
      },
    },
  });

  await prisma.order.create({
    data: {
      number: 1041,
      customerId: aOtieno.id,
      status: OrderStatus.ALTERATION,
      channel: OrderChannel.SHOP,
      subtotalKes: 12500,
      totalKes: 12500,
      items: { create: [{ name: "Trouser", size: "32", qty: 1, unitKes: 12500 }] },
      payments: {
        create: {
          method: PaymentMethod.CASH,
          status: PaymentStatus.PAID,
          amountKes: 12500,
          paidAt: now,
        },
      },
      alterations: { create: [{ notes: "Hem 32" }] },
    },
  });

  await prisma.order.create({
    data: {
      number: 1040,
      customerId: jMwangi.id,
      status: OrderStatus.NEW,
      channel: OrderChannel.WHATSAPP,
      subtotalKes: 6500,
      totalKes: 6500,
      guestName: "K. Kamau",
      guestPhone: "+254712000003",
      items: { create: [{ name: "Gift set", qty: 1, unitKes: 6500 }] },
    },
  });

  // Sample abandoned lead (partial name)
  await prisma.order.create({
    data: {
      number: 1035,
      status: OrderStatus.ABANDONED,
      channel: OrderChannel.WEBSITE,
      subtotalKes: 4500,
      totalKes: 4500,
      guestName: "K",
      guestPhone: "+254700111222",
      guestEmail: null,
      checkoutToken: "seed-abandoned-demo",
      internalNote: "Abandoned after typing name K — follow up",
      items: {
        create: [{ name: ivory?.name ?? "Ivory Oxford", size: "L", qty: 1, unitKes: 4500 }],
      },
    },
  });

  void order1042;

  const at = (h: number, m = 0) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };

  await prisma.appointment.createMany({
    data: [
      {
        title: "Groom party (6)",
        startsAt: at(11),
        status: AppointmentStatus.CONFIRMED,
        customerId: jMwangi.id,
      },
      {
        title: "Bespoke suit, D. Ochieng",
        startsAt: at(14),
        status: AppointmentStatus.CONFIRMED,
        customerId: dOchieng.id,
      },
      {
        title: "Alteration collection",
        startsAt: at(16, 30),
        status: AppointmentStatus.CONFIRMED,
        customerId: aOtieno.id,
      },
    ],
  });

  await prisma.bespokeRequest.createMany({
    data: [
      {
        customerId: dOchieng.id,
        summary: "D. Ochieng · 2-piece, navy wool · Fri 14:00",
        status: BespokeStatus.DEPOSIT_PENDING,
        depositKes: 10000,
      },
      {
        customerId: jMwangi.id,
        summary: "Groom party · 6 suits · Wedding 22 Nov",
        status: BespokeStatus.DEPOSIT_PAID,
        depositKes: 60000,
      },
    ],
  });

  for (let i = 1; i <= 12; i++) {
    await prisma.fabricSwatch.create({
      data: {
        name: `Cloth ${i}`,
        code: `SW-${100 + i}`,
        colour: ["Navy", "Charcoal", "Black", "Grey"][i % 4],
        composition: "Wool blend",
      },
    });
  }

  await prisma.post.createMany({
    data: [
      {
        title: "How a suit should fit",
        slug: "how-a-suit-should-fit",
        status: PostStatus.DRAFT,
        category: "How to dress",
        authorId: eli.id,
        body: "A suit should skim the body, not grip it.",
        views: 0,
      },
      {
        title: "What to wear to a Kenyan wedding",
        slug: "what-to-wear-to-a-kenyan-wedding",
        status: PostStatus.PUBLISHED,
        category: "Wedding",
        authorId: eli.id,
        body: "Colour, cloth and the room you are walking into.",
        views: 1420,
        publishedAt: new Date("2026-09-01"),
      },
    ],
  });

  const home = await prisma.page.create({ data: { key: "home", title: "Homepage" } });
  await prisma.pageSection.createMany({
    data: [
      {
        pageId: home.id,
        key: "hero",
        title: "Hero",
        sortOrder: 1,
        content: {
          headline: "Command the room",
          secondLine: "before you speak.",
        },
        mediaId: heroMedia,
      },
      {
        pageId: home.id,
        key: "wardrobe",
        title: "The Wardrobe",
        sortOrder: 2,
        content: { tiles: 9 },
      },
    ],
  });

  await prisma.testimonial.createMany({
    data: [
      {
        quote: "The fit was right the first time. I walked into court and no one asked who made it.",
        role: "Advocate, Nairobi",
      },
      {
        quote: "The hem was done while I waited. That is the house.",
        role: "Director, Westlands",
      },
    ],
  });

  await prisma.announcement.createMany({
    data: [
      { message: "Free Nairobi delivery", sortOrder: 0 },
      { message: "Free in-store alterations", sortOrder: 1 },
      { message: "WhatsApp 0708 269209", sortOrder: 2 },
    ],
  });

  await prisma.discountCode.createMany({
    data: [
      { code: "WELCOME10", offer: "10% first order", percentOff: 10, usedCount: 34, status: "ACTIVE" },
      { code: "GROOM25", offer: "KES 2,500 off group", amountOff: 2500, usedCount: 6, status: "ACTIVE" },
    ],
  });

  if (ivory) {
    await prisma.review.create({
      data: {
        productId: ivory.id,
        customerId: jMwangi.id,
        authorName: "J. M.",
        rating: 5,
        body: "The fit was right the first time.",
        status: ReviewStatus.PENDING,
      },
    });
  }

  await prisma.setting.createMany({
    data: [
      {
        key: "shop",
        value: {
          address: "Muindi Mbingu Street, junction with Biashara Street, opposite Equity Bank, Nairobi CBD",
          hours: "Mon to Sat, 8am to 8pm",
          whatsapp: "0708269209",
        },
      },
      {
        key: "payments",
        value: { mpesaTill: true, card: true, payOnDelivery: true },
      },
      {
        key: "site",
        value: {
          url: "https://elijays-mens-wear.co.ke",
          metaFeed: "https://elijays-mens-wear.co.ke/meta-feeds.csv",
        },
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: jay.id,
        action: "Adjusted stock",
        entityType: "product",
        entityLabel: "Ivory Oxford",
      },
      {
        actorId: wanjiru.id,
        action: "Marked order Paid",
        entityType: "order",
        entityLabel: "Order #1042",
      },
      {
        actorId: nehemiah.id,
        action: "Seeded catalogue from storefront",
        entityType: "products",
        entityLabel: `${storefrontProducts.length} products`,
      },
    ],
  });

  // Mark low stock on one variant for dashboard realism
  const lowVariant = await prisma.productVariant.findFirst({
    where: { product: { slug: "charcoal-suede-biker" } },
  });
  if (lowVariant) {
    await prisma.stockLevel.updateMany({
      where: { variantId: lowVariant.id },
      data: { quantity: 1, alertAt: 3 },
    });
    await prisma.product.updateMany({
      where: { slug: "charcoal-suede-biker" },
      data: { status: ProductStatus.LOW_STOCK },
    });
    await prisma.stockMovement.create({
      data: {
        variantId: lowVariant.id,
        fromLocationId: web.id,
        quantity: -1,
        type: MovementType.SALE,
        reason: "Sale today",
        actorId: wanjiru.id,
      },
    });
  }

  const count = await prisma.product.count({ where: { deletedAt: null } });
  console.log(`Seed complete. ${count} products. Owner: Nehemiah.`);
  console.log("Admin login: nehekamiah@gmail.com / Turuthi.Elijays");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
