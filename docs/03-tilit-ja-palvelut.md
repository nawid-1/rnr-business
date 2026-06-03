# 3. Tilit ja palvelut

Alusta käyttää seuraavia palveluita. Kaikki ovat ilmaisia aloitusvaiheessa.

| Palvelu | Käyttötarkoitus |
|---------|-----------------|
| GitHub (`nawid-1/rnr-business`) | Koodin säilytys |
| Vercel (`rnr-business-sgzu`) | Sovelluksen hostaus |
| Supabase (`rnr-business`) | Tietokanta |
| Meta for Developers (`RNR Business`) | Facebook + Instagram API |

## Tärkeää turvallisuudesta

- 🔒 Salaiset avaimet (App Secret) ovat **vain Vercelin Environment Variables -kohdassa** — ei koskaan koodissa eikä jaettuna.
- 🔁 GitHub-token ja muut salaisuudet kannattaa **vaihtaa säännöllisesti**.
- ⚠️ Jos jokin avain on vahingossa jaettu (esim. chatissa), luo uusi ja poista vanha.

## Kahden projektin huomio

Vercelissä on kaksi projektia: **`rnr-business-sgzu`** (käytössä, kaikki avaimet täällä) ja `rnr-business` (vanha/tyhjä). Käytä aina **-sgzu**-osoitetta.
