# 5. Setup-muistilista

Tähän on koottu mitä on tehty, jotta muistat asetukset jatkossa.

## Vercel — Environment Variables

Projekti: **rnr-business-sgzu** → Settings → Environment Variables

| Muuttuja | Selitys | Salainen? |
|----------|---------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabasen osoite | ei |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabasen julkinen avain | ei |
| `NEXT_PUBLIC_META_APP_ID` | Facebook App ID | ei |
| `META_APP_SECRET` | Facebook App Secret | 🔒 kyllä |
| `INSTAGRAM_APP_SECRET` | Instagram App Secret | 🔒 kyllä |

> ⚠️ **Huom:** env-muuttujan lisäyksen tai muutoksen jälkeen pitää tehdä **Redeploy**, jotta se tulee voimaan.

## Meta-asetukset

- **Facebook Login** → Valid OAuth Redirect URI:
  `https://rnr-business-sgzu.vercel.app/api/auth/meta/callback`
- **Instagram Login** → OAuth Redirect URI:
  `https://rnr-business-sgzu.vercel.app/api/auth/instagram/callback`
- Instagram-tili (@rnrsalonki) lisätty **Instagram Tester** -rooliin (kehitystila).

## Kehitystila vs. julkinen

Sovellus on nyt Meta-**kehitystilassa**: toimii vain testaajille (sinulle). Omaan käyttöön se on valmis.

Kun haluat **myydä alustaa muille**, tarvitaan Metan **App Review** -hyväksyntä jokaiselle käyttöoikeudelle.
