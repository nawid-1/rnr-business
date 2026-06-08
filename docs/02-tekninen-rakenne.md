# 2. Tekninen rakenne

Alusta on rakennettu nykyaikaisilla web-teknologioilla. Sinun ei tarvitse osata näitä — tämä on viitteeksi.

## Teknologiat

| Osa | Teknologia | Rooli |
|-----|-----------|-------|
| Frontend | Next.js + Tailwind CSS | Käyttöliittymä |
| Tietokanta | Supabase (PostgreSQL) | Data ja tilit |
| Hostaus | Vercel | Julkaisu verkossa |
| Koodi | GitHub | Versionhallinta |
| Some | Meta Graph API | Facebook + Instagram |

## Näin tieto kulkee

```
Selain (käyttäjä)
   │
   ▼
Vercel (palvelin / API-reitit)
   │
   ├──► Supabase (tietokanta: tilit, postaukset, viestit)
   │
   └──► Meta (Facebook & Instagram)
```

Kaikki **salaiset avaimet ovat palvelimella**, ei selaimessa — tämä on turvallista.

## API-reitit

> Tämä lista päivittyy automaattisesti commitin yhteydessä.

<!-- AUTO:api-routes -->
- `/api/auth/instagram/callback`
- `/api/auth/instagram/login`
- `/api/auth/meta/callback`
- `/api/auth/meta/login`
- `/api/cron/refresh-analytics`
- `/api/marketing/feed`
- `/api/marketing`
- `/api/marketing/upload`
<!-- /AUTO:api-routes -->

## Tietokantataulut (Supabase)

- `social_accounts` — yhdistetyt some-tilit
- `posts` — postaukset ja luonnokset
- `messages` — DM:t ja kommentit
- `analytics` — päivittäiset tilastot
