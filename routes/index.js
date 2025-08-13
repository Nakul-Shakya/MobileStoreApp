// routes/index.js
import express from "express";
import productModel from "../models/product.js";

const router = express.Router();

// raw mapping (keep as before)
const brandLogosRaw = {
  samsung:
    "https://1000logos.net/wp-content/uploads/2017/06/Font-Samsung-Logo.jpg",
  apple:
    "https://www.freepnglogos.com/uploads/apple-logo-png/apple-logo-png-index-content-uploads-10.png",
  vivo: "https://download.logo.wine/logo/Vivo_(technology_company)/Vivo_(technology_company)-Logo.wine.png",
  oppo: "https://download.logo.wine/logo/Oppo/Oppo-Logo.wine.png",
  realme:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Realme_logo.png/1200px-Realme_logo.png",
  xiaomi:
    "https://images.seeklogo.com/logo-png/40/2/xiaomi-new-2021-logo-png_seeklogo-400999.png",
  oneplus:
    "https://i.pinimg.com/736x/a8/3b/5d/a83b5ddfc044104f35356c1a843e6d36.jpg",
  nothing:
    "https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/nothing-logo.png",
  google:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZY2dHbZJIMhXaf2hvCT_o6NAYyAdRBHhpYA&s",
  motorola:
    "https://1000logos.net/wp-content/uploads/2017/04/Emblem-Motorola.jpg",
};

// helper: normalize keys (lowercase, remove non-alnum)
const normalizeKey = (str) =>
  (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// prepare processed map for fast lookup
const processedBrandLogos = {};
Object.entries(brandLogosRaw).forEach(([k, v]) => {
  processedBrandLogos[normalizeKey(k)] = v;
});

function findLogoForBrand(brandName) {
  if (!brandName) return "/images/default-logo.png";
  const key = normalizeKey(brandName);

  // 1) exact normalized match
  if (processedBrandLogos[key]) return processedBrandLogos[key];

  // 2) partial match: some DB brand values may be "Google Pixel"
  for (const bk of Object.keys(processedBrandLogos)) {
    if (bk.includes(key) || key.includes(bk)) return processedBrandLogos[bk];
  }

  // 3) match first token (e.g., "googlepixel" -> "google")
  const firstToken = key.split(/[^a-z0-9]+/)[0];
  for (const bk of Object.keys(processedBrandLogos)) {
    if (bk.includes(firstToken)) return processedBrandLogos[bk];
  }

  // 4) try local file (public/images/<normalized>.png) as fallback (may 404)
  return `/images/${key}.png`;
}

// Homepage – All Brands (with images attached)
router.get("/", async (req, res) => {
  try {
    const brands = await productModel.aggregate([
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const unmatched = [];
    const brandsWithImages = brands.map((b) => {
      const rawName = b._id || "Unknown";
      const img = findLogoForBrand(rawName);

      // detect if we ended up with fallback local filename or default
      const norm = normalizeKey(rawName);
      const usedDefault = img === "/images/default-logo.png";
      const usedLocalFallback = img === `/images/${norm}.png`;

      if (usedDefault || usedLocalFallback)
        unmatched.push({ name: rawName, image: img });

      return {
        name: rawName,
        count: b.count,
        image: img,
      };
    });

    // helpful debug log (remove in production)
    if (unmatched.length) {
      console.log(
        "⚠️  Brands missing remote logo mapping (will use local/default):",
        unmatched
      );
    }

    res.render("index", { brands: brandsWithImages });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Brand-specific Page
router.get("/brand/:brandName", async (req, res) => {
  try {
    const brandName = req.params.brandName;
    const products = await productModel.find({ brand: brandName });
    res.render("brand", { brand: brandName, products });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// nav name pages .ejs ko render karega

router.get("/brands", (req, res) => {
  res.render("brands");
});

router.get("/product-detail", (req, res) => {
  res.render("product-detail");
});

router.get("/about", (req, res) => {
  res.render("about");
});

router.get("/contact", (req, res) => {
  res.render("contact");
});

export default router;
