"""Default content template used to seed new countries.

Per-country fields are dynamically filled (brandName, currency, etc.) when
seeding. This is the SINGLE SOURCE OF TRUTH for the landing structure —
the React landing components consume this shape from the API.
"""
from __future__ import annotations
from typing import Any, Dict
import re


STOP_WORDS = {"the", "of", "and", "ltd", "limited", "inc", "co", "uk"}


def auto_abbreviation(name: str) -> str:
    """Generate a 2-letter abbreviation from a brand name."""
    if not name:
        return "SF"
    # Split by spaces & non-alnum
    tokens = [t for t in re.split(r"[^A-Za-z0-9]+", name) if t]
    significant = [t for t in tokens if t.lower() not in STOP_WORDS] or tokens
    if len(significant) >= 2:
        return (significant[0][0] + significant[1][0]).upper()
    word = significant[0]
    return (word[:2] if len(word) >= 2 else (word + "X")).upper()


def default_content_for(country: Dict[str, Any]) -> Dict[str, Any]:
    """Generate the default landing content for a country."""
    name = country["name"]
    brand = country["brand_name"]
    currency = country["currency_symbol"]
    price_from = country["price_from"]
    fee = country["government_fee_text"]
    company_type = country.get("company_type", "Limited Company")

    return {
        "hero": {
            "badge": f"Authorised {country['authority_name']} Filing Partner",
            "headline_prefix": f"Form your {name} {company_type} in",
            "headline_highlight": "24 hours",
            "headline_suffix": f"From {currency}{price_from}.",
            "sub": (
                f"Fast, compliant, and fully protected. 100% online. Expert support "
                f"included. Over 15,000+ companies formed."
            ),
            "fee_note": f"+ {fee} {country['authority_name']} fee.",
            "cta_primary": "Start your company now",
            "cta_secondary": "See pricing",
            "stats": [
                {"label": "Filings / mo", "value": "3,200"},
                {"label": "Avg. time", "value": "18 min"},
                {"label": "Success", "value": "99.8%"},
            ],
            "panel_steps": [
                {"label": "Name reservation", "t": "00:01:24", "done": True},
                {"label": "Director details", "t": "00:03:12", "done": True},
                {"label": "Share allotment", "t": "00:04:30", "done": True},
                {"label": f"{country['authority_name']} filing", "t": "00:11:08", "done": True},
                {"label": "Certificate of Incorporation", "t": "ETA 6h", "done": False},
            ],
            "trust_chips": [
                {"icon": "Star", "text": "4.9/5 · Trustpilot (20,000+)"},
                {"icon": "Shield", "text": f"{country['authority_short']} authorised"},
                {"icon": "Users", "text": "1,247 companies formed this month"},
            ],
        },
        "trust_bar": {
            "eyebrow": "Trusted by founders & partners",
            "right_text": "15,247 active companies",
            "partners": [
                {"icon": "Landmark", "label": country["authority_name"]},
                {"icon": "Banknote", "label": "Tide"},
                {"icon": "Banknote", "label": "Wise Business"},
                {"icon": "FileCheck2", "label": "Xero"},
                {"icon": "ShieldCheck", "label": f"{country['authority_short']} Authorised"},
                {"icon": "Building2", "label": "Stripe"},
                {"icon": "Award", "label": "B Corp"},
            ],
        },
        "how_it_works": {
            "eyebrow": "How it works",
            "title": "Four steps.",
            "title_secondary": "Under twenty minutes.",
            "lead": (
                f"No paperwork. No lawyer. No jargon. Our guided journey replaces a week "
                f"of admin with a 20-minute online form — submitted directly to {country['authority_name']}."
            ),
            "steps": [
                {"n": "01", "icon": "Search", "title": "Check your name",
                 "body": f"Search & reserve your company name with our live {country['authority_name']} lookup.",
                 "tag": "00:30s"},
                {"n": "02", "icon": "FileText", "title": "Add your details",
                 "body": "Directors, shareholders, registered office — a guided form in plain English.",
                 "tag": "~6 min"},
                {"n": "03", "icon": "CreditCard", "title": "Pay securely",
                 "body": f"From {currency}{price_from} + {country['authority_name']} fee. Stripe-secure. No hidden extras.",
                 "tag": "Instant"},
                {"n": "04", "icon": "Mail", "title": "Receive documents",
                 "body": "Certificate of incorporation, share certificates, statutory book — by email.",
                 "tag": "< 24h"},
            ],
        },
        "pricing": {
            "eyebrow": "Pricing",
            "title": "Transparent pricing.",
            "title_secondary": "No hidden fees.",
            "lead": (
                f"{country['authority_name']} charges a separate {fee} incorporation fee, included in "
                f"every quote up-front. Cancel anytime within 14 days, full refund."
            ),
            "footnote": f"Prices in {country['currency']} · VAT inclusive · 14-day refund guarantee",
            "tiers": [
                {
                    "id": "essential",
                    "name": "Essential",
                    "tagline": "Get incorporated — fast.",
                    "price": price_from,
                    "fee": f"+ {fee} {country['authority_name']}",
                    "cta": "Start with Essential",
                    "inverse": False,
                    "popular": False,
                    "features": [
                        "Company incorporation in 24h",
                        "Digital Certificate of Incorporation",
                        "Memorandum & Articles of Association",
                        "Share certificates (PDF)",
                        "Email support, 7 days",
                    ],
                },
                {
                    "id": "privacy",
                    "name": "Privacy",
                    "tagline": "Keep your home address off the public record.",
                    "price": country["privacy_price"],
                    "fee": f"+ {fee} {country['authority_name']}",
                    "cta": "Start with Privacy",
                    "inverse": True,
                    "popular": True,
                    "features": [
                        "Everything in Essential",
                        f"Registered office address — {country['capital']}",
                        "Service address for directors",
                        "Mail forwarding (statutory)",
                        "Priority phone & email support",
                    ],
                },
                {
                    "id": "all-inclusive",
                    "name": "All-Inclusive",
                    "tagline": "Everything you need to trade from day one.",
                    "price": country["allinclusive_price"],
                    "fee": f"+ {fee} {country['authority_name']}",
                    "cta": "Go All-Inclusive",
                    "inverse": False,
                    "popular": False,
                    "features": [
                        "Everything in Privacy",
                        "Business address & mail handling",
                        "VAT registration assistance",
                        "Payroll registration assistance",
                        "Free business bank account intro",
                        "1-yr Confirmation Statement filing",
                    ],
                },
            ],
        },
        "benefits": {
            "eyebrow": "Why founders choose us",
            "title": "Built for builders.",
            "title_secondary": "Compliance, on autopilot.",
            "lead": (
                "We're not just a filing service — we're the operational backbone for thousands "
                "of companies. Privacy, compliance, banking and support, in one place."
            ),
            "items": [
                {"icon": "Clock", "title": "24-hour formation",
                 "body": "Most companies registered same-day. Average filing time: 18 minutes after submission.",
                 "span": "md:col-span-7", "stat_value": "18m", "stat_label": "avg filing"},
                {"icon": "ShieldCheck", "title": "Privacy by default",
                 "body": f"Hide your home address from the public record with our {country['capital']} registered office.",
                 "span": "md:col-span-5"},
                {"icon": "Globe", "title": "Open to non-residents",
                 "body": f"No {name} address or visa required. We serve founders from 80+ countries.",
                 "span": "md:col-span-4"},
                {"icon": "Headphones", "title": "Human support",
                 "body": "Real advisors. Email, phone, live chat — for the life of your company.",
                 "span": "md:col-span-4"},
                {"icon": "FileCheck", "title": "Always compliant",
                 "body": "Annual filing reminders, director-change filings, free for the first year.",
                 "span": "md:col-span-4"},
                {"icon": "Banknote", "title": "Banking & accounting",
                 "body": "Free intros to Tide, Wise, Revolut Business + 1 month free Xero accounting.",
                 "span": "md:col-span-7", "stat_value": "0", "stat_label": "monthly fees"},
                {"icon": "Building2", "title": "Lifetime support",
                 "body": "Address changes, share transfers, dormant filings — all in one dashboard.",
                 "span": "md:col-span-5"},
            ],
            "cta_text": "Start trading in days, not weeks.",
            "cta_sub": f"Join 15,000+ companies built on {brand}.",
        },
        "testimonials": {
            "eyebrow": "Customer stories",
            "title": "Loved by 15,000+",
            "title_secondary": "founders.",
            "rating": "4.9 / 5",
            "rating_sub": "20,142 Trustpilot reviews",
            "items": [
                {
                    "quote": "Filed and incorporated in under an hour. The privacy package alone is worth it — my home address is finally off the public record.",
                    "name": "Sarah Jenkins", "role": "Tech Founder",
                    "img": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMGhlYWRzaG90JTIwcG9ydHJhaXR8ZW58MHx8fHwxNzc4NzQ0NzA2fDA&ixlib=rb-4.1.0&q=85",
                },
                {
                    "quote": f"I was based abroad and worried about forming a {name} company remotely. The team made it effortless and answered every question in plain English.",
                    "name": "David Chen", "role": "Consultant",
                    "img": "https://images.unsplash.com/photo-1600878459138-e1123b37cb30?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMGhlYWRzaG90JTIwcG9ydHJhaXR8ZW58MHx8fHwxNzc4NzQ0NzA2fDA&ixlib=rb-4.1.0&q=85",
                },
                {
                    "quote": "Confirmation reminders, dashboard, Tide intro — it pays for itself many times over. Genuinely the easiest part of starting my brand.",
                    "name": "Emma Thompson", "role": "E-commerce Owner",
                    "img": "https://images.unsplash.com/photo-1685760259914-ee8d2c92d2e0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMGhlYWRzaG90JTIwcG9ydHJhaXR8ZW58MHx8fHwxNzc4NzQ0NzA2fDA&ixlib=rb-4.1.0&q=85",
                },
            ],
        },
        "faqs": {
            "eyebrow": "FAQ",
            "title": "Common questions.",
            "contact_line": "Can't find what you're looking for?",
            "contact_cta": "Talk to a human →",
            "items": [
                {"q": f"How long does it take to form a {name} {company_type}?",
                 "a": f"Most companies are incorporated within 24 hours — many in under 3 hours during {country['authority_name']} business hours. Same-day service is also available on the All-Inclusive plan."},
                {"q": "Can non-residents form a company?",
                 "a": f"Yes. There's no requirement to be a {name} resident or to have a visa. You can be a director from anywhere in the world."},
                {"q": "What are the total costs?",
                 "a": f"{country['authority_name']} charges a {fee} fee for online incorporation. Plans start at {currency}{price_from} on top."},
                {"q": "Do I need a business bank account?",
                 "a": "Not to incorporate, but you'll need one to trade. We provide free, fast-track introductions to Tide, Wise Business and Revolut Business."},
                {"q": "What documents will I receive?",
                 "a": "Digital Certificate of Incorporation, Memorandum & Articles of Association, share certificates — all by email and stored in your dashboard."},
                {"q": "Will my home address appear on the public record?",
                 "a": f"Only if you use it as your registered office. With our Privacy plan you can use our {country['capital']} address instead."},
                {"q": "What ongoing obligations does the company have?",
                 "a": "Each year you must file annual accounts and a tax return. We send free reminders and offer affordable annual filing services."},
                {"q": "Can I get a refund if I change my mind?",
                 "a": f"Yes — if {country['authority_name']} has not yet processed your application, we offer a full 14-day refund, no questions asked."},
            ],
        },
        "final_cta": {
            "eyebrow": "Launch offer · ends soon",
            "headline": f"Be a {name} {company_type}",
            "headline_secondary": "by this time tomorrow.",
            "sub": f"From {currency}{price_from}. No hidden fees. 14-day refund. Expert support. The fastest, most trusted way to start your company.",
            "cta_primary": "Start your company now",
            "cta_secondary": "Compare plans",
            "chips": [
                {"v": f"{currency}{price_from}", "l": "from"},
                {"v": "24h", "l": "filing"},
                {"v": "14d", "l": "refund"},
            ],
        },
        "footer": {
            "tagline": f"The fastest, most trusted way to form a {name} {company_type}. {country['authority_short']} authorised.",
            "badge_text": f"{country['authority_short']} · Registered",
            "columns": [
                {"title": "Company", "links": ["About", "Careers", "Press", "Partners", "Contact"]},
                {"title": "Services", "links": ["Company Formation", "Registered Office", "Service Address", "Annual Filings", "Dormant Company"]},
                {"title": "Resources", "links": ["Founder Guide", "Tax Basics", f"{country['authority_short']} FAQ", "Director's duties", "Blog"]},
                {"title": "Legal", "links": ["Terms", "Privacy", "Cookies", "AML policy", "Refund policy"]},
            ],
            "legal": f"© {{year}} {brand}. {country['legal_suffix']}",
            "made_in": f"Made in {country['capital']} {country['flag']}",
        },
        "seo": {
            "title": f"{brand} — Register a {name} {company_type} in 24 hours",
            "description": f"Form your {name} {company_type} in 24 hours from {currency}{price_from} + {country['authority_name']} fee. {country['authority_short']} authorised, 15,000+ companies formed.",
        },
    }


# Definitions for each seeded country.
SEED_COUNTRIES = [
    {
        "slug": "uk",
        "name": "UK",
        "long_name": "United Kingdom",
        "flag": "🇬🇧",
        "domain": "ukcompanyformation.com",
        "brand_name": "Swift Formations UK",
        "brand_color": "#0A0A0A",
        "accent_color": "#C8102E",
        "currency": "GBP",
        "currency_symbol": "£",
        "locale": "en-GB",
        "country_code": "GB",
        "capital": "London EC2",
        "authority_name": "Companies House",
        "authority_short": "ACSP",
        "company_type": "Limited Company",
        "price_from": "12.99",
        "privacy_price": "39.99",
        "allinclusive_price": "89.99",
        "government_fee_text": "£50",
        "legal_suffix": "Registered in England & Wales. Company No. 12345678.",
        "b2bhub_country_code": "GB",
    },
    {
        "slug": "ua",
        "name": "Ukraine",
        "long_name": "Ukraine",
        "flag": "🇺🇦",
        "domain": "ukraineformations.com",
        "brand_name": "Swift Formations UA",
        "brand_color": "#0057B7",
        "accent_color": "#FFD700",
        "currency": "USD",
        "currency_symbol": "$",
        "locale": "uk-UA",
        "country_code": "UA",
        "capital": "Kyiv",
        "authority_name": "USR (State Registrar)",
        "authority_short": "USR",
        "company_type": "LLC (TOV)",
        "price_from": "199",
        "privacy_price": "399",
        "allinclusive_price": "799",
        "government_fee_text": "Free",
        "legal_suffix": "Registered in Ukraine.",
        "b2bhub_country_code": "UA",
    },
    {
        "slug": "de",
        "name": "Germany",
        "long_name": "Germany",
        "flag": "🇩🇪",
        "domain": "germanyformations.com",
        "brand_name": "Swift Formations DE",
        "brand_color": "#0A0A0A",
        "accent_color": "#DD0000",
        "currency": "EUR",
        "currency_symbol": "€",
        "locale": "de-DE",
        "country_code": "DE",
        "capital": "Berlin",
        "authority_name": "Handelsregister",
        "authority_short": "HR",
        "company_type": "UG / GmbH",
        "price_from": "399",
        "privacy_price": "699",
        "allinclusive_price": "1299",
        "government_fee_text": "€150",
        "legal_suffix": "Registered in the Handelsregister, Germany.",
        "b2bhub_country_code": "DE",
    },
    {
        "slug": "fr",
        "name": "France",
        "long_name": "France",
        "flag": "🇫🇷",
        "domain": "franceformations.com",
        "brand_name": "Swift Formations FR",
        "brand_color": "#0A0A0A",
        "accent_color": "#0055A4",
        "currency": "EUR",
        "currency_symbol": "€",
        "locale": "fr-FR",
        "country_code": "FR",
        "capital": "Paris",
        "authority_name": "Greffe (INPI)",
        "authority_short": "INPI",
        "company_type": "SAS / SARL",
        "price_from": "299",
        "privacy_price": "549",
        "allinclusive_price": "999",
        "government_fee_text": "€37",
        "legal_suffix": "Inscrite au RCS de Paris.",
        "b2bhub_country_code": "FR",
    },
    {
        "slug": "us",
        "name": "USA",
        "long_name": "United States",
        "flag": "🇺🇸",
        "domain": "usacompanyformation.com",
        "brand_name": "Swift Formations US",
        "brand_color": "#0A0A0A",
        "accent_color": "#B22234",
        "currency": "USD",
        "currency_symbol": "$",
        "locale": "en-US",
        "country_code": "US",
        "capital": "Delaware",
        "authority_name": "Secretary of State",
        "authority_short": "SoS",
        "company_type": "LLC / C-Corp",
        "price_from": "49",
        "privacy_price": "149",
        "allinclusive_price": "299",
        "government_fee_text": "$90",
        "legal_suffix": "Filed with the Delaware Division of Corporations.",
        "b2bhub_country_code": "US",
    },
]
