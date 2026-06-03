@AGENTS.md

# RNR Business — projektin tila

> Tämä tiedosto luetaan automaattisesti joka sessiossa. Pidä ajan tasalla.
> Tarkempi dokumentaatio: `docs/`-kansio (päivittyy automaattisesti commitilla).

## Mikä tämä on

Selainpohjainen yritystoiminnan hallinta-alusta. Omistaja: **Nawid** (RNR Salonki, kauneus- ja hyvinvointiala). Käytetään aluksi omaan käyttöön, myöhemmin myydään muille yrittäjille (SaaS). Käyttöliittymä on **suomeksi**.

- **Sovellus:** https://rnr-business-sgzu.vercel.app
- **GitHub:** nawid-1/rnr-business
- **Vercel-projekti:** `rnr-business-sgzu` (EI pelkkä "rnr-business" — siinä ei ole avaimia)

## Tech stack

Next.js + Tailwind · Supabase (tietokanta) · Vercel (hostaus) · Meta Graph API (Facebook + Instagram).
Kaikki salaiset avaimet ovat **Vercelin Environment Variables** -kohdassa, ei koodissa. Selain ei lue env-muuttujia — kaikki Meta/Supabase-kutsut tehdään palvelimen API-reiteissä (`src/app/api/`).

## Mitä on rakennettu (valmis)

- **Dashboard, sivunavigaatio** — pohja
- **Markkinointi** (`/dashboard/markkinointi`) — TOIMII:
  - Facebook-yhdistäminen (Facebook Login, page-token granular_scopes kautta)
  - Instagram-yhdistäminen (Instagram Login API, **ei** vaadi Facebookia — `graph.instagram.com`)
  - Kanavan katkaisu
  - Postausten luonti (+ AI-ehdotus), kuvan URL -kenttä
  - **Oikea julkaisu**: Facebook /feed tai /photos; Instagram 2-vaiheinen media+media_publish (vaatii kuvan URL:n)
  - **Analytiikka**: seuraajat, postausten tykkäykset/kommentit ("Päivitä luvut" -nappi)
- **Asiakkaat, Talous, AI Assistentti** — vain pohja, ei toimintoja vielä
- **docs/** + automaattinen päivitys (git pre-commit hook ajaa `scripts/generate_docs.py`)

## Tärkeät tekniset opit (älä toista virheitä)

- Vercelissä env-muuttujat ovat "Sensitive" → niitä EI saa selaimeen. Siksi kaikki tehdään palvelinpuolella.
- Facebook Login `/me/accounts` palautti tyhjän → sivu löytyy `debug_token`in `granular_scopes.target_ids` kautta.
- Instagram ei tullut Facebook-sivun kautta → vaihdettiin erilliseen **Instagram Login** -tuotteeseen (eri App ID/Secret, eri scope-nimet `instagram_business_*`).
- Instagram vaatii AINA kuvan, Facebook ei.
- Meta-sovellus on **kehitystilassa** → toimii vain testaajille. Myyntiä varten tarvitaan App Review.

## Env-muuttujat (Vercel: rnr-business-sgzu)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_META_APP_ID`, `META_APP_SECRET`, `INSTAGRAM_APP_SECRET`. Muutoksen jälkeen aina **Redeploy**.

## Työtapa

- Käyttäjä ei koodaa itse — Claude tekee kaiken. Selitä selkeästi, suomeksi, ei jargonia.
- Git push GitHubiin → Vercel deployaa automaattisesti (~1 min).
- Buildaa (`npm run build`) ennen pushia.

## Mihin jäätiin (seuraavaksi)

Markkinointi on kattava. Seuraavat vaihtoehdot:
- Viestit & kommentit toimiviksi (lue DM:t/kommentit, vastaa alustalta)
- Asiakkaat (CRM) -osio
- Talous-osio
- AI Assistentti (Claude/MCP) kytkentä
