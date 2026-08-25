import re
import random
from decimal import Decimal
from django.db.models import Q
from .models import Category, Product


# Deterministic high-quality metadata for catalog products
PRODUCT_METADATA_ENRICHMENT = {
    "prod_1": {
        "rating": 4.8,
        "rating_count": 124,
        "colors": ["Maroon", "Gold", "Royal Blue"],
        "sizes": ["S", "M", "L", "XL"],
        "fabric": "Silk & Georgette with Mirror Work",
        "occasion": ["Wedding", "Festive", "Sangeet"],
        "discount_percent": 15,
        "highlights": ["Intricate mirror & zari work", "Includes flared lehenga, choli & net dupatta", "Dry clean only"],
    },
    "prod_2": {
        "rating": 4.9,
        "rating_count": 89,
        "colors": ["Crimson Red", "Emerald Green", "Mustard Gold"],
        "sizes": ["Free Size (6.3m with blouse)"],
        "fabric": "Pure Banarasi Katan Silk",
        "occasion": ["Wedding", "Bridal", "Festive"],
        "discount_percent": 10,
        "highlights": ["Handwoven kadwa zari weave", "Includes unstitched blouse piece", "Authentic silk mark"],
    },
    "prod_3": {
        "rating": 4.6,
        "rating_count": 210,
        "colors": ["Teal", "Mustard", "Navy Blue"],
        "sizes": ["M", "L", "XL", "XXL"],
        "fabric": "Chanderi Silk Blend",
        "occasion": ["Festive", "Family Gathering", "Puja"],
        "discount_percent": 20,
        "highlights": ["Mandarin collar with thread embroidery", "Includes matching churidar pants", "Soft breathable lining"],
    },
    "prod_4": {
        "rating": 4.5,
        "rating_count": 340,
        "colors": ["White", "Sky Blue", "Olive Green"],
        "sizes": ["S", "M", "L", "XL"],
        "fabric": "100% Premium Combed Cotton",
        "occasion": ["Daily Wear", "Office", "Casual"],
        "discount_percent": 10,
        "highlights": ["Pre-shrunk breathable fabric", "Classic spread collar", "Machine washable"],
    },
    "prod_5": {
        "rating": 4.4,
        "rating_count": 512,
        "colors": ["Black", "Charcoal Grey", "Off-White", "Sage Green"],
        "sizes": ["XS", "S", "M", "L", "XL"],
        "fabric": "100% Organic Cotton (220 GSM)",
        "occasion": ["Daily Wear", "College", "Loungewear"],
        "discount_percent": 15,
        "highlights": ["Heavyweight drop-shoulder fit", "Anti-fading bio-wash", "Ribbed crew neck"],
    },
    "prod_6": {
        "rating": 4.7,
        "rating_count": 178,
        "colors": ["Beige", "Navy Blue", "Khaki"],
        "sizes": ["30", "32", "34", "36"],
        "fabric": "Linen-Cotton Blend",
        "occasion": ["Work", "Casual Outing", "Brunch"],
        "discount_percent": 12,
        "highlights": ["Relaxed tapered fit", "Elastic back waistband for all-day comfort", "Deep side pockets"],
    },
    "prod_7": {
        "rating": 4.8,
        "rating_count": 420,
        "colors": ["Matte Black", "Pearl White"],
        "sizes": ["One Size"],
        "fabric": "ABS Plastic + Silicone Tips",
        "occasion": ["Daily Commute", "Gym", "Work Calls"],
        "discount_percent": 25,
        "highlights": ["Active Noise Cancellation (ANC)", "36-hour total battery life with case", "IPX5 water & sweat resistance"],
    },
    "prod_8": {
        "rating": 4.6,
        "rating_count": 295,
        "colors": ["Black", "Midnight Blue"],
        "sizes": ["Adjustable Strap"],
        "fabric": "Silicone Strap + AMOLED Display",
        "occasion": ["Fitness", "Daily Wear", "Sports"],
        "discount_percent": 18,
        "highlights": ["Heart rate & SpO2 blood oxygen tracking", "14-day battery life", "50+ sports workout modes"],
    },
    "prod_9": {
        "rating": 4.7,
        "rating_count": 115,
        "colors": ["Ivory & Cobalt", "Emerald & Gold"],
        "sizes": ["12-Piece Set (4 dinner plates, 4 bowls, 4 side plates)"],
        "fabric": "Fine Glazed Stoneware Ceramic",
        "occasion": ["Dining", "Housewarming Gift", "Hosting"],
        "discount_percent": 15,
        "highlights": ["Microwave & dishwasher safe", "Chip-resistant lead-free glaze", "Artisanal hand-painted rim"],
    },
    "prod_10": {
        "rating": 4.6,
        "rating_count": 164,
        "colors": ["Warm Gold & White Shade", "Matte Black & Linen"],
        "sizes": ["Height 45cm"],
        "fabric": "Brushed Metal Base + Fabric Shade",
        "occasion": ["Home Decor", "Bedside Reading", "Living Room"],
        "discount_percent": 10,
        "highlights": ["Warm 3000K LED bulb included", "3-level touch dimming switch", "Non-slip weighted base"],
    },
    "prod_11": {
        "rating": 4.8,
        "rating_count": 138,
        "colors": ["Blush Pink", "Mint Green", "Mustard Yellow"],
        "sizes": ["S", "M", "L", "XL"],
        "fabric": "Chanderi Silk with Cotton Lining",
        "occasion": ["Wedding", "Festive", "Engagement"],
        "discount_percent": 15,
        "highlights": ["Delicate gota patti & zari hand embroidery", "Flared kalidar silhouette (4.5m ghera)", "Includes organza dupatta"],
    },
    "prod_12": {
        "rating": 4.5,
        "rating_count": 230,
        "colors": ["Indigo Blue", "Rani Pink", "Rust Orange"],
        "sizes": ["2.4 Meters"],
        "fabric": "100% Mulmul Cotton",
        "occasion": ["Daily Ethnic", "College", "Festive"],
        "discount_percent": 10,
        "highlights": ["Authentic hand block printed motifs", "Lightweight and ultra-soft drape", "Tassel edge detailing"],
    },
    "prod_13": {
        "rating": 4.6,
        "rating_count": 182,
        "colors": ["Natural Linen", "Powder Blue", "Olive"],
        "sizes": ["S", "M", "L", "XL"],
        "fabric": "100% Pure Flax Linen",
        "occasion": ["Summer Daily", "Vacation", "Smart Casual"],
        "discount_percent": 12,
        "highlights": ["Naturally breathable and moisture-wicking", "Relaxed oversized cut", "Shell buttons"],
    },
    "prod_14": {
        "rating": 4.5,
        "rating_count": 310,
        "colors": ["White", "Black", "Navy"],
        "sizes": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"],
        "fabric": "Heavy Canvas Upper + Vulcanized Rubber Sole",
        "occasion": ["Daily College", "Walking", "Casual Commute"],
        "discount_percent": 15,
        "highlights": ["Dual-density memory foam insole", "Flexible anti-slip rubber outsole", "Reinforced heel support"],
    },
    "prod_15": {
        "rating": 4.7,
        "rating_count": 275,
        "colors": ["Midnight Black", "Forest Green"],
        "sizes": ["Compact (8.5 x 8.5 x 11 cm)"],
        "fabric": "Rubberized Rugged Mesh",
        "occasion": ["Party", "Travel", "Outdoor"],
        "discount_percent": 20,
        "highlights": ["15W deep bass audio output", "12-hour continuous playback", "IPX7 waterproof rating"],
    },
    "prod_16": {
        "rating": 4.6,
        "rating_count": 390,
        "colors": ["Matte Black", "Space Grey"],
        "sizes": ["10,000 mAh"],
        "fabric": "Anodized Aluminum Alloy",
        "occasion": ["Travel", "Daily Carry", "College"],
        "discount_percent": 10,
        "highlights": ["22.5W Power Delivery (PD 3.0)", "Dual USB-A and USB-C output", "Flight approved safety protection"],
    },
    "prod_17": {
        "rating": 4.6,
        "rating_count": 140,
        "colors": ["Natural Jute & White", "Grey & Cream"],
        "sizes": ["Medium (35cm diameter x 30cm height)"],
        "fabric": "100% Braided Cotton Rope & Natural Jute",
        "occasion": ["Home Organization", "Living Room", "Plant Holder"],
        "discount_percent": 15,
        "highlights": ["Foldable yet sturdy shape retention", "Strong double-stitched leather-look handles", "Eco-friendly natural fibers"],
    },
    "prod_18": {
        "rating": 4.5,
        "rating_count": 195,
        "colors": ["Boho Geometric Blue", "Terracotta & Beige"],
        "sizes": ["Set of 2 (16x16 inches / 40x40 cm)"],
        "fabric": "Heavy Textured Cotton Canvas",
        "occasion": ["Sofa Decor", "Living Room", "Gifting"],
        "discount_percent": 10,
        "highlights": ["Concealed hidden zipper closure", "High-density weave for lasting durability", "Machine washable fabric"],
    },
}


def serialize_assistant_product(product):
    """Formats a real database Product into a rich, structured assistant card."""
    extra = PRODUCT_METADATA_ENRICHMENT.get(product.id, {
        "rating": 4.6,
        "rating_count": 100,
        "colors": ["Standard"],
        "sizes": ["Standard"],
        "fabric": "Quality Material",
        "occasion": ["Daily", "Casual"],
        "discount_percent": 10,
        "highlights": ["Verified ReturnGuard authenticity", "Easy 7-day hassle-free returns"],
    })

    price_val = float(product.price)
    original_price = round(price_val / (1 - (extra.get("discount_percent", 10) / 100)))

    return {
        "id": product.id,
        "name": product.name,
        "price": price_val,
        "original_price": original_price,
        "discount_percent": extra.get("discount_percent", 10),
        "rating": extra.get("rating", 4.6),
        "rating_count": extra.get("rating_count", 100),
        "image": product.image,
        "description": product.description,
        "stock": product.stock,
        "in_stock": product.stock > 0,
        "category_id": product.category_id,
        "category_name": product.category.name if product.category else "General",
        "merchant_name": product.merchant.business_name if product.merchant else "ReturnGuard Verified",
        "colors": extra.get("colors", []),
        "sizes": extra.get("sizes", []),
        "fabric": extra.get("fabric", ""),
        "occasion": extra.get("occasion", []),
        "highlights": extra.get("highlights", []),
    }


def parse_shopper_intent(message, current_context=None, cart_items=None):
    """
    Parses natural language requirements into structured filters and conversation intents.
    Remembers multi-turn context (e.g. category, budget, occasion, color, style).
    """
    text = (message or "").strip().lower()
    ctx = dict(current_context or {})
    
    intents = []
    
    # 1. Budget extraction
    # Patterns like "under 2000", "below ₹2500", "less than 1500", "budget 3000", "under 1k", "under ₹1000"
    budget_match = re.search(r'(?:under|below|less\s+than|within|upto|max|budget(?: of)?)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)?|\d+k)', text)
    if not budget_match:
        budget_match = re.search(r'(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)?)', text)
    if not budget_match:
        # Check for lone numbers like "2000" or "1500" if context asked for budget
        budget_match = re.search(r'^\s*(?:rs\.?|inr|₹)?\s*(\d{3,6})\s*$', text)

    if budget_match:
        val_str = budget_match.group(1).replace(',', '')
        if 'k' in val_str:
            budget_val = float(val_str.replace('k', '')) * 1000
        else:
            budget_val = float(val_str)
        ctx["budget_max"] = budget_val
        intents.append("BUDGET_SPECIFIED")

    # Range extraction: "between 1000 and 3000"
    range_match = re.search(r'between\s*(?:rs\.?|inr|₹)?\s*(\d+)\s*(?:and|to|-)\s*(?:rs\.?|inr|₹)?\s*(\d+)', text)
    if range_match:
        ctx["budget_min"] = float(range_match.group(1))
        ctx["budget_max"] = float(range_match.group(2))
        intents.append("BUDGET_RANGE_SPECIFIED")

    # Relative budget adjustments: "cheaper", "more affordable", "more premium", "higher end", "expensive"
    if any(w in text for w in ["cheaper", "more affordable", "low price", "lower price", "less expensive", "budget friendly", "cheapest"]):
        intents.append("REFINE_CHEAPER")
        current_max = ctx.get("budget_max")
        if current_max and current_max > 1000:
            ctx["budget_max"] = round(current_max * 0.65)
        else:
            ctx["budget_max"] = 1500

    if any(w in text for w in ["more premium", "higher end", "expensive", "luxury", "best quality"]):
        intents.append("REFINE_PREMIUM")
        ctx["budget_min"] = 2500
        if "budget_max" in ctx:
            del ctx["budget_max"]

    # 2. Category & Item Type
    category_map = {
        "cat_ethnic": ["ethnic", "lehenga", "saree", "sari", "kurta", "anarkali", "dupatta", "traditional", "indian wear", "wedding dress", "churidar"],
        "cat_daily": ["daily", "daily wear", "shirt", "t-shirt", "tshirt", "tee", "trouser", "trousers", "pant", "pants", "linen", "sneaker", "sneakers", "shoes", "casual", "college"],
        "cat_electronics": ["electronic", "electronics", "earbud", "earbuds", "headphone", "headphones", "bluetooth", "speaker", "fitness band", "smart band", "watch", "smartwatch", "power bank", "charger", "gadget", "audio"],
        "cat_home": ["home", "decor", "dinner set", "crockery", "plate", "plates", "lamp", "table lamp", "light", "basket", "storage", "cushion", "pillow", "cushion cover", "living room"],
    }

    matched_new_category = False
    for cat_id, keywords in category_map.items():
        if any(re.search(rf'\b{re.escape(kw)}\b', text) for kw in keywords):
            ctx["category_id"] = cat_id
            intents.append("CATEGORY_SPECIFIED")
            matched_new_category = True
            break

    # 3. Occasion
    occasions = {
        "wedding": ["wedding", "shaadi", "sangeet", "reception", "bridal", "marriage"],
        "festive": ["festive", "festival", "diwali", "eid", "pooja", "puja"],
        "daily": ["daily", "everyday", "regular", "casual", "home"],
        "college": ["college", "university", "campus", "study"],
        "work": ["work", "office", "formal", "interview", "business"],
        "party": ["party", "club", "evening", "celebration", "gathering"],
        "gift": ["gift", "gifting", "present", "sister", "brother", "friend", "mom", "birthday", "anniversary"],
    }
    for occ, keywords in occasions.items():
        if any(re.search(rf'\b{re.escape(kw)}\b', text) for kw in keywords):
            ctx["occasion"] = occ
            intents.append("OCCASION_SPECIFIED")
            break

    # 4. Colors
    colors = ["black", "white", "blue", "red", "gold", "maroon", "green", "yellow", "pink", "beige", "olive", "navy", "charcoal", "grey", "silver", "teal"]
    for col in colors:
        if re.search(rf'\b{re.escape(col)}\b', text):
            ctx["color"] = col
            intents.append("COLOR_SPECIFIED")
            break

    # 5. Styles / Specific Keywords
    style_keywords = ["embroidered", "silk", "cotton", "linen", "wireless", "noise cancellation", "anc", "fast charge", "oversized", "ceramic", "glazed", "dimmable", "touch"]
    found_styles = [sk for sk in style_keywords if re.search(rf'\b{re.escape(sk)}\b', text)]
    if found_styles:
        ctx["styles"] = list(set(ctx.get("styles", []) + found_styles))
        intents.append("STYLE_SPECIFIED")

    # 6. Intent classification: Greeting, Compare, Cart cross-sell, Clear, Trending, Help Choose
    if any(w in text for w in ["hi", "hello", "hey", "hola", "namaste", "good morning", "good evening"]) and len(text.split()) <= 3:
        intents.append("GREETING")

    if any(phrase in text for phrase in ["which one is better", "which is better", "compare", "vs", "difference between", "help me choose", "which should i buy"]):
        intents.append("COMPARE")

    if any(phrase in text for phrase in ["with this", "with my cart", "anything else", "accessories", "matching", "goes with", "cart"]):
        intents.append("CART_CROSS_SELL")

    if any(phrase in text for phrase in ["trending", "popular", "best seller", "bestseller", "top rated", "highly rated"]):
        intents.append("SHOW_TRENDING")

    if any(phrase in text for phrase in ["find similar", "similar products", "similar to this", "like this"]):
        intents.append("FIND_SIMILAR")

    # Item specific keyword boosts
    item_keywords = {
        "sneaker": ["sneaker", "sneakers", "shoe", "shoes", "footwear", "canvas sneaker"],
        "shirt": ["shirt", "shirts", "cotton shirt", "linen shirt", "button up"],
        "tshirt": ["t-shirt", "tshirt", "t-shirts", "tshirts", "tee", "tees"],
        "trouser": ["trouser", "trousers", "pant", "pants", "linen trouser"],
        "saree": ["saree", "sarees", "sari", "saris", "banarasi"],
        "lehenga": ["lehenga", "lehengas", "ghagra", "chaniya"],
        "kurta": ["kurta", "kurtas", "kurti", "kurtis", "kurta set"],
        "anarkali": ["anarkali", "anarkalis", "dress", "dresses", "gown", "gowns"],
        "dupatta": ["dupatta", "dupattas", "stole", "scarf"],
        "earbuds": ["earbud", "earbuds", "headphone", "headphones", "earphones", "anc", "audio"],
        "band": ["fitness band", "smart band", "tracker", "smartwatch", "smart watch"],
        "speaker": ["speaker", "speakers", "soundbox", "bluetooth speaker"],
        "powerbank": ["power bank", "powerbank", "charger", "fast charge"],
        "lamp": ["lamp", "lamps", "table lamp", "bedside lamp", "light", "lighting"],
        "dinner": ["dinner set", "crockery", "plate", "plates", "tableware", "ceramic", "bowl", "bowls", "dinnerware"],
        "bag": ["bag", "bags", "handbag", "handbags", "tote", "tote bag", "totes", "purse", "purses", "clutch", "basket", "baskets", "storage basket", "storage", "organizer", "woven"],
        "cushion": ["cushion", "cushions", "cushion cover", "cushion covers", "pillow", "pillows", "pillow cover", "throw"],
    }
    
    # Extract item_type from CURRENT text
    current_item_type = None
    for item_key, syns in item_keywords.items():
        if any(re.search(rf'\b{re.escape(s)}\b', text) for s in syns):
            current_item_type = item_key
            break

    if current_item_type:
        ctx["item_type"] = current_item_type
    elif matched_new_category or "REFINE" not in "".join(intents):
        # Clear previous item_type if user asked a general category query or new topic
        ctx.pop("item_type", None)

    return intents, ctx


def search_and_rank_products(context, query_text="", limit=4):
    """
    Finds real database products matching extracted requirements.
    Strictly filters so that only products relevant to the shopper's specific request
    are returned. Never pads with unrelated categories.
    """
    qs = Product.objects.filter(is_active=True).select_related("category", "merchant")
    all_products = list(qs)
    if not all_products:
        return [], False

    target_cat = context.get("category_id")
    target_item_type = context.get("item_type")
    target_max_budget = context.get("budget_max")
    target_min_budget = context.get("budget_min")
    target_color = context.get("color")
    target_occasion = context.get("occasion")
    target_styles = context.get("styles", [])
    
    query_lower = (query_text or "").lower()

    # Map item_type to strict matching regex patterns
    item_type_to_patterns = {
        "sneaker": [r"\bsneaker\b", r"\bsneakers\b", r"\bcanvas\b", r"\bshoes?\b", r"\bfootwear\b"],
        "shirt": [r"\bshirts?\b", r"\bbutton\s*up\b"],
        "tshirt": [r"\bt-?shirts?\b", r"\btees?\b"],
        "trouser": [r"\btrousers?\b", r"\bpants?\b"],
        "saree": [r"\bsarees?\b", r"\bsaris?\b", r"\bbanarasi\b"],
        "lehenga": [r"\blehengas?\b", r"\bghagra\b", r"\bchaniya\b"],
        "kurta": [r"\bkurtas?\b", r"\bkurtis?\b"],
        "anarkali": [r"\banarkalis?\b", r"\bdress(es)?\b", r"\bgowns?\b"],
        "dupatta": [r"\bdupattas?\b", r"\bstoles?\b", r"\bscarf\b"],
        "earbuds": [r"\bearbuds?\b", r"\bheadphones?\b", r"\bearphones?\b", r"\banc\b"],
        "band": [r"\bfitness\s*band\b", r"\bsmart\s*band\b", r"\btracker\b", r"\bsmartwatch\b"],
        "speaker": [r"\bspeakers?\b", r"\bbluetooth\s*speaker\b", r"\bsoundbox\b"],
        "powerbank": [r"\bpower\s*banks?\b", r"\bchargers?\b"],
        "lamp": [r"\blamps?\b", r"\btable\s*lamp\b", r"\blighting\b"],
        "dinner": [r"\bdinner\s*sets?\b", r"\bceramic\s*dinner\b", r"\bdinnerware\b", r"\bplates?\b", r"\bbowls?\b", r"\bcrockery\b"],
        "bag": [r"\bbags?\b", r"\bhandbags?\b", r"\btotes?\b", r"\bpurses?\b", r"\bclutch(es)?\b", r"\bbaskets?\b", r"\bstorage\s*baskets?\b", r"\bwoven\b"],
        "cushion": [r"\bpillows?\b", r"\bcushion\s*covers?\b", r"\bcushions?\s*set\b", r"\bsofa\s*cushions?\b", r"\b(?!cushioned)\bcushions?\b"],
    }

    # Step 1: Filter candidates strictly
    filtered_products = []
    
    stop_words = {
        "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they",
        "what", "which", "who", "whom", "this", "that", "these", "those",
        "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
        "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or",
        "of", "at", "by", "for", "with", "about", "to", "from", "in", "out", "on", "off",
        "under", "over", "some", "any", "can", "will", "just", "should", "now",
        "need", "want", "looking", "show", "find", "give", "please", "item", "items",
        "product", "products", "good", "best", "something", "options", "option", "price", "prices"
    }
    query_keywords = [w for w in re.findall(r'\b[a-zA-Z0-9_-]+\b', query_lower) if w not in stop_words and len(w) >= 3]

    for prod in all_products:
        prod_name_lower = prod.name.lower()
        prod_desc_lower = prod.description.lower()
        full_text = f"{prod_name_lower} {prod_desc_lower} {prod.category.name.lower() if prod.category else ''}"

        # If a specific item type is requested (e.g. bag/handbag/pillow), product MUST match it via regex
        if target_item_type:
            patterns = item_type_to_patterns.get(target_item_type, [rf"\b{re.escape(target_item_type)}\b"])
            if not any(re.search(pat, full_text) for pat in patterns):
                continue

        # If a specific category was requested (and not all), product must match category
        elif target_cat and target_cat != "all":
            if prod.category_id != target_cat:
                continue

        # If neither item_type nor category was specified, product must match at least one query keyword if present
        elif query_keywords:
            if not any(re.search(rf"\b{re.escape(kw)}", full_text) for kw in query_keywords):
                continue

        # If budget max was specified, exclude products that exceed budget (unless no other items match)
        prod_price = float(prod.price)
        if target_max_budget is not None and prod_price > target_max_budget * 1.15:
            continue

        filtered_products.append(prod)

    # If strict filter returned products, rank them
    if filtered_products:
        scored_products = []
        for prod in filtered_products:
            meta = PRODUCT_METADATA_ENRICHMENT.get(prod.id, {})
            score = 100
            prod_name_lower = prod.name.lower()
            prod_desc_lower = prod.description.lower()

            # Price bonus
            prod_price = float(prod.price)
            if target_max_budget is not None and prod_price <= target_max_budget:
                score += 30

            # Color match bonus
            if target_color:
                prod_colors = [c.lower() for c in meta.get("colors", [])]
                if any(target_color in c for c in prod_colors) or target_color in prod_name_lower:
                    score += 40

            # Occasion match bonus
            if target_occasion:
                prod_occasions = [o.lower() for o in meta.get("occasion", [])]
                if any(target_occasion in o for o in prod_occasions):
                    score += 30

            # Query keyword matches
            for word in query_lower.split():
                if len(word) > 2 and word in prod_name_lower:
                    score += 25

            scored_products.append((score, prod))

        scored_products.sort(key=lambda x: x[0], reverse=True)
        selected = [serialize_assistant_product(item[1]) for item in scored_products[:limit]]
        return selected, False

    # If no matching products exist for the query, return empty list (never dump random products)
    return [], True




def build_comparison_payload(product_a, product_b):
    """Builds a rich side-by-side comparison for two products."""
    card_a = serialize_assistant_product(product_a)
    card_b = serialize_assistant_product(product_b)

    spec_comparison = [
        {"aspect": "Price", "product_a": f"₹{int(card_a['price']):,}", "product_b": f"₹{int(card_b['price']):,}"},
        {"aspect": "Customer Rating", "product_a": f"⭐ {card_a['rating']} ({card_a['rating_count']} reviews)", "product_b": f"⭐ {card_b['rating']} ({card_b['rating_count']} reviews)"},
        {"aspect": "Material / Build", "product_a": card_a["fabric"] or "Premium", "product_b": card_b["fabric"] or "Premium"},
        {"aspect": "Best Suited For", "product_a": ", ".join(card_a["occasion"][:2]) or "All Occasions", "product_b": ", ".join(card_b["occasion"][:2]) or "All Occasions"},
        {"aspect": "Sizes / Options", "product_a": ", ".join(card_a["sizes"][:3]) or "Standard", "product_b": ", ".join(card_b["sizes"][:3]) or "Standard"},
        {"aspect": "ReturnGuard Guarantee", "product_a": "✓ 7-Day Free Returns", "product_b": "✓ 7-Day Free Returns"},
    ]

    # Smart AI verdict
    if card_a["price"] < card_b["price"]:
        verdict = f"**{card_a['name']}** offers outstanding value at ₹{int(card_a['price']):,}. However, if you want top-tier premium craftsmanship and extra features, **{card_b['name']}** (₹{int(card_b['price']):,}) is the winner."
    else:
        verdict = f"**{card_b['name']}** is the more budget-friendly option (₹{int(card_b['price']):,}), while **{card_a['name']}** (₹{int(card_a['price']):,}) brings higher-spec finishes and rating (⭐ {card_a['rating']})."

    return {
        "type": "comparison",
        "products": [card_a, card_b],
        "specs": spec_comparison,
        "verdict": verdict,
    }


def generate_ai_assistant_response(message, context=None, cart_items=None):
    """
    Main dialogue manager for the ReturnGuard AI Shopping Assistant.
    Coordinates intent parsing, requirement clarifying questions, product searching,
    recommendations, follow-ups, and comparison.
    """
    context = dict(context or {})
    cart_items = list(cart_items or [])
    intents, updated_context = parse_shopper_intent(message, context, cart_items)

    # Quick handle: GREETING without requirements
    if "GREETING" in intents and not any(k in updated_context for k in ["category_id", "budget_max", "occasion"]):
        return {
            "message": "Hi! 👋 I'm your ReturnGuard Shopping Assistant. Tell me what you're looking for, and I'll help you find the best products.",
            "products": [],
            "quick_options": [
                "Find something for me",
                "Shop by occasion",
                "Find under ₹1000",
                "Show trending products",
                "Help me choose",
                "Find similar products",
            ],
            "context": updated_context,
            "state": "welcome",
        }

    # Handle CART_CROSS_SELL: "Do you think I need anything else with this?"
    if "CART_CROSS_SELL" in intents or "anything else" in (message or "").lower():
        cart_product_ids = [item.get("product_id") or item.get("id") for item in cart_items if item]
        all_qs = Product.objects.filter(is_active=True).exclude(id__in=cart_product_ids)
        
        # If cart contains ethnic wear, suggest dupatta/jewelry/accessories or decor
        matching_recs = []
        if any("ethnic" in str(item.get("category_id", "")).lower() for item in cart_items):
            matching_recs = list(all_qs.filter(Q(id="prod_12") | Q(id="prod_3") | Q(id="prod_10")))
        elif any("daily" in str(item.get("category_id", "")).lower() for item in cart_items):
            matching_recs = list(all_qs.filter(Q(id="prod_14") | Q(id="prod_6") | Q(id="prod_7")))
        else:
            matching_recs = list(all_qs.filter(stock__gt=0)[:3])

        products_data = [serialize_assistant_product(p) for p in matching_recs]
        return {
            "message": "Since you have great items in your cart, here are authentic matching accessories and essentials from our catalog that pair wonderfully! ✨",
            "products": products_data,
            "quick_options": ["More affordable", "Show ethnic items", "Show daily essentials", "View my cart"],
            "context": updated_context,
            "state": "recommendations",
        }

    # Handle COMPARE intent
    if "COMPARE" in intents:
        # Check if 2 products were mentioned or recently shown
        last_ids = updated_context.get("last_shown_product_ids", [])
        prods_to_compare = []
        
        # Look for prod_id in text
        for p in Product.objects.all():
            if p.name.lower() in (message or "").lower() or p.id.lower() in (message or "").lower():
                prods_to_compare.append(p)

        if len(prods_to_compare) < 2 and len(last_ids) >= 2:
            prods_to_compare = list(Product.objects.filter(id__in=last_ids[:2]))

        if len(prods_to_compare) < 2:
            # Fallback to 2 relevant products
            prods_to_compare = list(Product.objects.filter(is_active=True)[:2])

        if len(prods_to_compare) >= 2:
            comp_data = build_comparison_payload(prods_to_compare[0], prods_to_compare[1])
            return {
                "message": f"Here is a side-by-side breakdown between **{prods_to_compare[0].name}** and **{prods_to_compare[1].name}**:\n\n{comp_data['verdict']}",
                "products": comp_data["products"],
                "comparison": comp_data,
                "quick_options": [
                    f"Add {prods_to_compare[0].name.split()[0]} to cart",
                    f"Add {prods_to_compare[1].name.split()[0]} to cart",
                    "Show cheaper alternatives",
                    "Ask another question",
                ],
                "context": updated_context,
                "state": "comparison",
            }

    # Check if we should ask a gentle clarifying question (only ask ONE question at a time)
    has_category = "category_id" in updated_context or "occasion" in updated_context
    has_budget = "budget_max" in updated_context or "budget_min" in updated_context
    has_specific_item = "item_type" in updated_context

    # Case: User said something very broad like "I need a dress" or "I want clothes" or "Shop by occasion"
    if "Shop by occasion" in message:
        return {
            "message": "I'd love to help! 🌟 What occasion are you shopping for?",
            "products": [],
            "quick_options": ["Wedding & Festive", "Daily College / Work", "Party & Evening", "Housewarming & Home Gifting"],
            "context": updated_context,
            "state": "asking_requirements",
        }

    if "Find something for me" in message or "Help me choose" in message:
        return {
            "message": "Let's find your perfect match! ✨ What type of item are you looking for today?",
            "products": [],
            "quick_options": ["Ethnic & Festive Wear", "Daily Wear & Basics", "Smart Gadgets & Audio", "Home & Living Decor"],
            "context": updated_context,
            "state": "asking_requirements",
        }

    # If broad category is known, but budget is not known and no specific item was named
    if has_category and not has_budget and not has_specific_item and len((message or "").split()) <= 7 and "REFINE" not in "".join(intents):
        # We can still find matching preview products while asking for budget
        preview_products, _ = search_and_rank_products(updated_context, query_text=message, limit=3)
        updated_context["last_shown_product_ids"] = [p["id"] for p in preview_products]
        
        return {
            "message": "Of course! 💕 What is your approximate budget for this?",
            "products": preview_products,
            "quick_options": ["Under ₹1000", "Under ₹2500", "Under ₹5000", "Show all prices"],
            "context": updated_context,
            "state": "asking_requirements",
        }

    # Retrieve matching products
    products, is_fallback = search_and_rank_products(updated_context, query_text=message, limit=4)
    updated_context["last_shown_product_ids"] = [p["id"] for p in products]

    # Format response message
    if not products:
        response_msg = f"I couldn't find an exact match for '{message}' in our current store catalog. Would you like to explore our other collections?"
        follow_up_chips = [
            "Explore Ethnic Wear",
            "Explore Daily Wear",
            "Explore Electronics",
            "Explore Home Living",
            "Show trending products",
        ]
        return {
            "message": response_msg,
            "products": [],
            "quick_options": follow_up_chips,
            "context": updated_context,
            "state": "no_results",
        }
    else:
        # Contextual response
        cat_name = ""
        if updated_context.get("category_id") == "cat_ethnic":
            cat_name = "ethnic and festive"
        elif updated_context.get("category_id") == "cat_daily":
            cat_name = "daily wear"
        elif updated_context.get("category_id") == "cat_electronics":
            cat_name = "electronics and audio"
        elif updated_context.get("category_id") == "cat_home":
            cat_name = "home living"

        budget_str = f" under ₹{int(updated_context['budget_max']):,}" if updated_context.get("budget_max") else ""
        occ_str = f" for {updated_context.get('occasion')}" if updated_context.get("occasion") else ""
        
        response_msg = f"I found these great {cat_name} options{occ_str}{budget_str} for you! 💕"

    follow_up_chips = [
        "More affordable",
        "More premium",
        "In another color",
        "Which one is better?",
        "Show trending products",
    ]

    return {
        "message": response_msg,
        "products": products,
        "quick_options": follow_up_chips,
        "context": updated_context,
        "state": "recommendations",
    }
