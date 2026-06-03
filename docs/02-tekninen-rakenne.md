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

## Tärkeät API-reitit

| Reitti | Tehtävä |
|--------|---------|
| `/api/auth/meta/login` | Aloittaa Facebook-kirjautumisen |
| `/api/auth/meta/callback` | Tallentaa Facebook-sivun |
| `/api/auth/instagram/login` | Aloittaa Instagram-kirjautumisen (ilman Facebookia) |
| `/api/auth/instagram/callback` | Tallentaa Instagram-tilin |
| `/api/marketing` | Hakee/päivittää kanavat, postaukset, viestit |

## Tietokantataulut (Supabase)

- `social_accounts` — yhdistetyt some-tilit
- `posts` — postaukset ja luonnokset
- `messages` — DM:t ja kommentit
- `analytics` — päivittäiset tilastot
