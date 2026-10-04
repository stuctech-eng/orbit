# ORBIT — Changelog

Bijgehouden per feature/fix, nieuwste bovenaan. Zie `docs/ORBIT_DESIGN_BIBLE.md` voor de actuele architectuur en ontwerpregels — dit document is de geschiedenis, de Design Bible is de waarheid over de huidige staat.

---

## Cognitive Engine — plateau-assist toegevoegd

- **Idee:** als een speler lang op hetzelfde niveau blijft steken (niet vooruit, niet terug), moet de engine daar zelf iets aan doen — anders blijft iemand precies onder zijn skill-plafond vastzitten zonder ooit de Flow Zone te verlaten.
- Nieuw: `save.plateauRounds` telt opeenvolgende "blijft gelijk"-beslissingen op hetzelfde niveau. Na 8 rondes versoepelt de snelheids-eis geleidelijk (0,75× → max 0,90× verwachte tijd) — nooit de nauwkeurigheids-eis, dat zou fouten belonen in plaats van tempo.
- Reset zodra het level verandert (vooruit of terug) of bij een nieuwe sessie; blijft wél intact bij pauzeren/hervatten of het herstarten van de app, want de speler zit dan nog steeds op hetzelfde niveau.
- Gevalideerd met een gesimuleerd hang-patroon (~63% nauwkeurigheid, nooit een reeks van 3): zonder assist bleef de speler na 80 rondes nog vast, met assist brak hij er na 68 rondes uit.

## Moeilijkheidscurve — de grote terugval gefixt

- **Root cause:** de ladder liep van stap 18 via `% LADDER.length` weer terug naar stap 1 — van 11 cellen/3 symbolen (zwaarst) naar 3 cellen/1 symbool (lichtst). Veruit de grootste moeilijkheidsdaling in het spel, precies op het moment dat een sterke speler zou afhaken.
- **Fix:** ladder uitgebreid van 18 naar 29 stappen (fases F/G/H toegevoegd: 4 en 5 onthoudpunten, tot 13 cellen), en de wrap-around vervangen door een clamp — de zwaarste stap herhaalt zichzelf i.p.v. terug te vallen
- Volledige curve doorgerekend: geen enkele moeilijkheidsdaling meer, plafond nu ~11× zwaarder dan de start (was ~6,5×)
- Level-wissel wordt nu visueel gesignaleerd: de eerstvolgende scan kleurt groen (omhoog) of rood (omlaag). Bewust géén extra scans — dat zou ~9s dode tijd per level-wissel toevoegen en botst met de "geen wachttijd"-regel
- Tutorial-fixes: Home-scherm bleef zichtbaar onder de transparante tutorial-overlay (tekst en menuknoppen liepen door elkaar), tekst kreeg een donkere achtergrond-pil (witte tekst op witte ballen was onleesbaar), begeleiding toegevoegd bij elke stap inclusief het pauzemenu, en de tutorial-overlay opgehoogd naar z-index 30 zodat begeleiding boven het pauzemenu zichtbaar blijft

## BUG: "BESTE SCORE: undefined" + beste score nu ook vóóraf zichtbaar

- **Root cause:** oudere saves (van vóór de scoreformule) hadden `trackingBest`/`trackingLast` zonder `score`-veld. Bij het tonen van "BESTE SCORE: X" werd dat veld direct uitgelezen zonder terugval, dus `undefined`. Erger nog: de record-vergelijking (`result.score > save.trackingBest.score`) faalt stil bij een `undefined` rechterkant, dus oude spelers zouden ook nooit meer een nieuw record kunnen halen.
- **Fix:** migratie bij het laden van de save — ontbrekend `score`-veld wordt met terugwerkende kracht berekend uit de bestaande `balls`/`errors`. Ook de save-race-merge-logica (`persistSave()`) kreeg dezelfde terugval.
- **Extra, naar aanleiding van terechte vraag ("wil je niet weten wat de beste score is?"):** beste score staat nu ook zichtbaar op het Spelmodus-overzicht (onder elke kaart) én op het intro-scherm (onder de beschrijving) — niet meer alleen achteraf op het Game Over-scherm. Voor Classic Mode toont dit "Hoogste score", voor Getallen volgen "Beste score".
- **Getest:** exact het scenario uit de bug-screenshot nagebouwd (`trackingBest` zonder score-veld, 11 ballen/3 fouten/69s) — na de fix toont dat correct `score: 1010`, en beide nieuwe schermen renderen de beste score zoals bedoeld.

## Number Tracking — scoreformule vastgesteld

Na akkoord: `score = ballen × 100 − fouten × 30`. Ballen blijft de voortgangsmaat (geen apart levelsysteem), score is een aparte "kwaliteit van deze run"-maat — nooit samengevoegd, nooit opgeteld over sessies.

- Game Over-scherm toont Score nu prominent bovenaan (grote cijfers), Ballen/Fouten/Tijd eronder zoals al bestond.
- Record ("NIEUW RECORD" / "BESTE SCORE: X") vergelijkt nu op score, niet meer op kaal balaantal — zo telt een foutloze run zwaarder dan een even-ver-gekomen maar rommelige run.
- `persistSave()`'s save-race-bescherming (zie eerdere fix) bijgewerkt om ook `trackingBest` op score te vergelijken, met een veilige terugval voor oudere saves die nog geen `score`-veld hadden.
- **Getest:** de drie voorbeelden uit het overleg exact geverifieerd (8 ballen/0 fouten→800, /1 fout→770, /2 fouten→740), bevestigd dat de score nooit negatief kan worden, en de record-logica doorgerekend op een scenario waarbij een hogere score met meer fouten terecht boven een lagere score met minder fouten blijft staan.

## Spelmodus-overzicht + intro — primaire stijl doorgetrokken

- **Bug gevonden en gefixt:** `.ms-card.active` (blauwe gloed op de huidig gespeelde modus) had wel CSS maar werd nooit ergens in JS toegepast — de highlighting deed dus nooit iets. Nu wordt 'm bij het openen van het overzicht correct gezet op basis van `currentMode`.
- Gloed-waarden van de "▶ Starten"-knop exact gelijkgetrokken met Home's nieuwe primaire knop (zelfde blauwtint, zelfde gloed-sterkte).
- Iconen op de modus-kaarten en de kenmerken-lijst ook monochroom gemaakt (`grayscale`), consistent met Home — de actieve kaart behoudt wel zijn blauwe bol-gradient.

## Home-scherm herzien — stats weg, primaire actie uitgelicht

- **Statistiekenblok verwijderd van Home.** Het toonde altijd Classic Mode's cijfers (Level/Cognitive Rating), ook wanneer je net Getallen volgen had gespeeld — inmiddels misleidend nu er twee modi met compleet verschillende statistieken bestaan. Het aparte Statistieken-scherm dekt dit al volledig.
- **"Verder spelen" krijgt een blauwe gloed-rand** als duidelijke hoofdactie, losstaand van de overige knoppen.
- **Iconen monochroom gemaakt** (`filter: grayscale(1)` op alle Home-knoppen behalve de uitgelichte) — consistent met ORBIT's kleurloze basisprincipe, het blauw blijft voorbehouden aan de hoofdactie.
- `refreshHomeStats()` en de bijbehorende aanroep verwijderd — de elementen die deze functie vulde bestaan niet meer.

## Onderzoek "ik zie niets" + echte bug gevonden en gefixt

- **Wat er waarschijnlijk gebeurde:** bij een verse installatie (of na het wissen van app-data) toont ORBIT eerst de First Launch Tutorial — dat is een compleet andere flow dan Home, en de nieuwe UI (Spelmodus-overzicht, intro-schermen) zit pas ná die tutorial. Bevestigd met Playwright-screenshots: de nieuwe UI werkt gewoon correct zodra Home daadwerkelijk bereikt wordt.
- **Wél een echte bug gevonden tijdens het uitzoeken:** `persistSave()` kon, bij een race tussen twee overlappende pagina-instanties (bijv. rond een herlaad-moment), de opgeslagen voortgang overschrijven met verouderde in-memory data — inclusief het terugzetten van `tutorialCompleted` naar `false`. Gereproduceerd met een Playwright-test die de exacte race naboot.
- **Fix:** `persistSave()` leest nu eerst wat er daadwerkelijk op schijf staat en behoudt per veld de beste waarde (nooit een regressie op hoogste level/score/totalen/sessies, en `tutorialCompleted` kan nooit meer van `true` terug naar `false` vallen).
- **Getest:** dezelfde race die de bug blootlegde opnieuw gedraaid ná de fix — voortgang blijft nu behouden (`highestLadderIndex` bleef 8 i.p.v. terug te vallen op 0, `tutorialCompleted` bleef `true`).

## Sequence Memory — zelfde cover-mechanisme als Patroon

Exact gespiegeld op Patroon's net gebouwde veldgroei-mechanisme — zelfde gedeelde speelveld (`placePatternPositions()`), dus dezelfde logica.

- `sequenceTopRow`/`sequenceBottomRow` (grenzen), `SEQUENCE_ROW_REVEAL_ROUNDS = [3,6,9,12]` (geïsoleerde configuratie, zelfde placeholder-waarden als Patroon).
- Sessie start altijd gecentreerd met 16 ballen (4 rijen).
- De reeks-generator kiest voortaan uitsluitend uit zichtbare posities — een verborgen bal kan nooit in de sequence zitten (net zoals een verborgen bal bij Patroon nooit doelbal kan worden).
- Tikken op een verborgen bal heeft geen effect; verborgen ballen worden niet getekend.
- Rij-vrijgave: boven→onder→boven→onder, rustige infade, hergebruikt het bestaande pauze/auto-herstart-patroon — geen nieuwe architectuur.
- **Getest**: 16 ballen bij sessiestart (screenshot bevestigd), na ronde 3 exact 20 ballen (screenshot bevestigd, bovenrij zichtbaar infadend).
- Classic, Getallen volgen en Patroon apart geregressietest — alle drie ongewijzigd en foutloos (bevestigt dat de gedeelde plaatsingsfunctie voor beide modi intact blijft).

## Patroon — cover-mechanisme gebouwd (ORBIT Memory veldgroei)

Volgens het vastgelegde ontwerp (zie COVER_MECHANISME_AUDIT.md), met de twee aanpassingen uit de laatste review: één zichtbare-rijen-representatie (grenzen i.p.v. losse tellers) en de vrijgavemomenten volledig geïsoleerd in één configuratie.

- **Zichtbare-rijen-staat**: `patternTopRow`/`patternBottomRow` (grenzen, inclusief) — rij `cy` is zichtbaar als `patternTopRow <= cy <= patternBottomRow`. Start gecentreerd: rijen 2-5 (16 ballen), rijen 0-1 en 6-7 verborgen.
- **Geïsoleerde configuratie**: `PATTERN_ROW_REVEAL_ROUNDS = [3, 6, 9, 12]` — één array, placeholder-waarden, bewust nog niet definitief. Nergens anders in de logica verspreid.
- **Vrijgave-mechanisme**: hergebruikt het bestaande pauze/auto-herstart-patroon van Patroon volledig (geen nieuwe architectuur) — rustige infade (900ms) i.p.v. een letterlijke schuifanimatie, daarna automatisch door naar de volgende ronde.
- **Volgorde**: boven, onder, boven, onder — alternerend via `patternNextRevealSide`.
- Verborgen ballen: kunnen nooit doelbal worden (target-selectie beperkt tot zichtbare posities), tikken erop heeft geen effect, worden simpelweg niet getekend (de cover ís het weglaten van de tekenstap — geen apart overlay-element nodig).
- Bal-grootte en posities van reeds zichtbare ballen blijven exact ongemoeid bij een vrijgave — alleen hun verborgen-status/infade-waarde verandert.
- Nieuwe sessie start altijd weer gecentreerd met 4 rijen, ongeacht hoever een vorige sessie al open stond.
- Kleine audit-vondst verwerkt: rij-index (`cy`) wordt nu meegegeven door `placePatternPositions()` — was er eerder niet, nodig om te bepalen welke bal bij welke rij hoort.
- **Getest**: exact 16 ballen bij sessiestart (screenshot bevestigd), na ronde 3 exact 20 ballen (bovenrij vrijgegeven, screenshot bevestigd), na ronde 6 exact 24 ballen (onderrij vrijgegeven, boven→onder-volgorde bevestigd, screenshot bevestigd). Classic, Getallen volgen en Sequence Memory apart geregressietest — alle drie ongewijzigd en foutloos.

## BUG: onderste rij ballen te krap tegen schermrand (Patroon + Sequence Memory)

- **Root cause:** marge onderaan stond op 36px — nauwelijks meer dan de duim-indicator-ruimte zelf, waardoor de onderste rij tegen de rand aan oogde en op een echt toestel (met home-indicator) deels afgesneden leek.
- **Fix:** marge onderaan naar 55px. Geldt automatisch voor zowel Patroon als Sequence Memory, want beide delen dezelfde plaatsingsfunctie.
- **Getest**: marge onderaan nu bevestigd op 58px (ruim boven de 50px-ondergrens), nog steeds 0 overlap bij 32 ballen.
- Classic, Getallen volgen en Sequence Memory apart geregressietest — alle drie ongewijzigd en foutloos.

## ORBIT — "Score" geschrapt als universeel concept, record = natuurlijke voortgangsmaat

Implementatie van het vastgelegde ontwerpbesluit, na audit (zie SCORE_AUDIT_RAPPORT.md).

- **Getallen volgen**: scoreformule (`ballen×100−fouten×30`) volledig verwijderd uit spelervaring én recordbepaling. Game Over toont nu "NIEUW RECORD"/"BESTE" + het aantal ballen als kop, Fouten/Tijd blijven informatief eronder. Record-vergelijking nu op `.balls`, niet meer op een berekende score.
- **Patroon**: kreeg een eigen recordsysteem (`save.patternBest`, vergeleken op ballen) — bestond nog niet. Game Over toont nu ook "NIEUW RECORD"/"BESTE" + ballen.
- **Sequence Memory**: zelfde nieuwe recordsysteem (`save.sequenceBest`, vergeleken op reeks-lengte). Game Over toont "NIEUW RECORD"/"BESTE" + een kaal getal, geen eenheid — exact zoals het eigen voorbeeld in het besluit.
- **Classic**: interne `save.score`/`save.highestScore`-mechanica bewust ongemoeid gelaten (voorkomt onnodig risico, is technisch nergens meer relevant), maar nergens meer aan de speler getoond. Spelmodus-kaart toont nu "Beste level: X" i.p.v. "Hoogste score: X".
- **Statistieken-overlay volledig herzien**: toont nu één sectie per modus (Classic/Getallen volgen/Patroon/Sequence Memory) met hun eigen natuurlijke record, plus "Totaal gespeeld". De oude losse velden (Hoogste score, Cognitive Rating, Correcte antwoorden, Speeltijd, Sessies, Laatste keer gespeeld) zijn vervallen — geen verzonnen ORBIT-score, geen ratio's.
- Opgeruimd: drie nu dode functies (`cognitiveRating`, `formatPlayTime`, `formatLastPlayed`) en de bijbehorende legacy score-backfill-migratiecode.
- Save-race-bescherming (`persistSave()`) uitgebreid met dezelfde merge-logica voor `patternBest`/`sequenceBest` als al bestond voor `trackingBest`.
- **Getest**: alle drie Game Over-schermen bevestigd met screenshots (NIEUW RECORD-format correct, geen score-element meer in Getallen volgen), Statistieken-overlay met alle vier modi correct gevuld, Classic Mode apart geregressietest (foutloos) en kaart-tekst bevestigd bijgewerkt.

## Sequence Memory — correct getikte ballen blijven wit

- Elke correct getikte bal blijft nu wit staan (was: alleen een korte sprankel-pulse die weer wegdooft) — zelfde mechanisme als Patroon.
- Werkt ook correct samen met herhaling: als een positie later in de reeks nogmaals nodig is, is die bal dan al wit en blijft dat gewoon.
- **Getest**: bevestigd dat een correct getikte bal nog steeds wit is, ruim nadat de feedback-pulse is weggeëbd (900ms later).
- Classic en Patroon apart geregressietest — beide ongewijzigd en foutloos.

## Sequence Memory — vierde ORBIT-modus (nieuwe implementatie)

Hergebruikt Patroon's speelveld, plaatsingslogica en rendering volledig ongewijzigd (zoals gevraagd), met eigen sequence-specifieke state/logica erbovenop.

- **Mechaniek**: ballen lichten één voor één (sequentieel) op in een willekeurige volgorde — herhaling van een positie binnen dezelfde reeks is expliciet toegestaan. Speler reproduceert daarna exact die volgorde.
- **Kernregel** (vastgelegd vooraf, geen giswerk): een foute tik verhoogt de foutenteller, maar de huidige sequencepositie blijft actief — geen reset naar stap 1, geen herkijking.
- **Moeilijkheid**: sequentie-lengte als enige as (3→4→5→...→12), geen snelheid.
- **Open parameter**: reveal-duur per bal (500ms) vastgelegd als centrale constante, bewust nog niet definitief.
- **Audit-bevinding gerapporteerd**: `placePatternPositions()` zet als neveneffect `patternBallR` — bewust hergebruikt (exact dezelfde plaatsingslogica), resultaat overgenomen in eigen `sequenceBallR`. Geen risico: modi draaien nooit gelijktijdig.
- **Kleine correctie meegenomen**: Patroon's kaart-tekst op het spelmodus-overzicht was nog de oude (sequentiële) omschrijving van vóór de herziening — nu actief misleidend naast de nieuwe Sequence Memory-kaart, dus gecorrigeerd.
- **Getest** (13 scenario's): sequentiële reveal, correcte invoer, kernregel (fout zonder reset, expliciet geverifieerd), herhaling binnen een reeks (al vanaf ronde 1 waargenomen), rondeprogressie, Game Over, 8x wisselen tussen alle vier de modi zonder cross-talk, regressie op Classic/Getallen volgen/Patroon afzonderlijk.

## Patroon — vast 4×8-rooster, volledig schermvullend

Op specifiek verzoek: niet langer een automatisch bepaald aantal kolommen/rijen, maar een vast rooster van 4×8 (32 ballen), met marges geminimaliseerd tot het strikt noodzakelijke (pauze-indicator/duim-bereik).

- `PATTERN_COLS = 4`, `PATTERN_ROWS = 8` — vast, in plaats van automatisch berekend uit een referentie-straal.
- Marges fors verkleind: zijkant naar 6px, boven naar 26px, onder naar 36px (was bal-afhankelijk en veel ruimer).
- Bal-straal = de helft van de krapste richting minus 3px — vult de cel zo vol mogelijk.
- **Getest**: precies 32 ballen bevestigd, straal 44,2px, marge links/rechts nog maar 9px, 0 overlap.
- Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## Patroon — ballen groter, marges verder verkleind

- Vaste marges verder verkleind: boven bal+56→bal+36, onder bal+70→bal+50, zijkant bal+10→bal+6.
- Referentiewaarde voor het bepalen van kolommen/rijen verhoogd (34→40), zodat het systeem naar minder, grotere cellen stuurt in plaats van veel kleine.
- Straal-maximum verhoogd van 44px naar 50px.
- **Getest**: straal nu 38,5px (was 32,8px), marges verder verkleind (boven 80px, onder 92px — was 95/111px), nog steeds perfect gecentreerd (1px verschil links/rechts), 0 overlap.
- Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## Patroon — herontwerp: rooster bepaalt bal-grootte (i.p.v. andersom)

**Ander idee, zoals gevraagd**, in plaats van nog een losse aanpassing: de volgorde omgedraaid. Eerder werd eerst een vaste bal-grootte gekozen en de restruimte geaccepteerd als marge (dat bleef, ondanks eerdere fixes, een herkenbaar "niet-helemaal-vol"-gevoel geven). Nu wordt eerst het aantal kolommen/rijen bepaald, waarna de cellen wiskundig worden uitgerekt tot ze precies de volledige breedte/hoogte vullen — en de bal-straal wordt daarvan afgeleid (geclamped tussen 28-44px).

- Vaste marges ook verkleind (boven: bal+70→bal+56, onder: bal+90→bal+70) — die waren ruimer dan nodig.
- **Getest**: marge boven/onder nu nog maar ~95-111px (was ~280px elk) en komt overeen met de bedoelde vaste marge, niet met verspilde restruimte. Links/rechts blijft exact gecentreerd (1px verschil). 32 ballen op 32,8px, 0 overlap.
- Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## Patroon — rooster gecentreerd, ballen groter

- **Root cause "niet mooi verdeeld":** het rooster begon altijd linksboven; omdat de beschikbare breedte/hoogte zelden exact deelbaar is door de celgrootte, bleef de overgebleven ruimte structureel aan de rechter-/onderkant hangen — een scheve indruk, geen toeval.
- **Fix:** het hele roosterblok wordt nu gecentreerd binnen het speelbare gebied — restruimte gelijk verdeeld over beide kanten.
- Bal-grootte verder vergroot: 30px → 34px.
- **Getest**: linker- en rechtermarge bevestigd exact gelijk (0px verschil), 0 overlap, straal bevestigd op 34px.
- Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## BUG: lege ruimte rechts op het toestel (Patroon) — gevonden en gefixt

**Root cause:** Patroon's ballen zijn statisch (geen physics zoals Classic/Tracking, die sowieso elk frame herberekenen en zich dus vanzelf aan een gewijzigd scherm aanpassen). Als de viewport kort na het starten van een ronde nog wordt bijgesteld (bijv. iOS-browserchrome die instelt), bleven Patroon's ballen voorgoed op hun oude, te smalle posities staan — vandaar de lege ruimte rechts in de meegestuurde screenshot.

**Fix:** een zelfherstellende check in de render-lus zelf (niet alleen reactief op een resize-event, wat te onbetrouwbaar bleek — als de wijziging toevallig tijdens de flits viel, werd die bewust geblokkeerd om de geheugentaak niet te verstoren, en kwam er daarna nooit meer een kans). Nu wordt elk frame gecontroleerd of de huidige schermafmetingen nog overeenkomen met waarmee de actieve ronde geplaatst is; zodra dat niet meer klopt én de speler niet middenin de flits of de ronde-pauze zit, worden de posities opnieuw berekend voor de actuele maat.

**Getest:** scenario nagebouwd waarbij de viewport van 320px naar 390px breed verandert tijdens de invoerfase — bevestigd dat de ballen zich herpositioneren (27→36 ballen, meest-rechtse positie verschoof van 221px naar 290px, volledig schermvullend) zonder overlap. Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## Patroon — grotere ballen voor betrouwbaar tikken

- Bal-grootte van 24px naar 30px, roosterafstand iets ruimer (2.18x → 2.3x) — bij de vorige, kleinste maat lag het middelpunt tussen twee buren maar 26px van elk balcentrum, te weinig marge voor een vinger.
- Resultaat: 36 ballen op het scherm (was 60) — minder dicht, maar betrouwbaar aan te tikken. Nog steeds het hele scherm vullend, geen gaten.
- **Getest**: 0 overlap, en een steekproef van 15 tikken — precies op elk balcentrum, inclusief dicht-op-elkaar liggende buren — landde elke keer op de juiste bal (15/15).
- Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## Patroon — écht elk roostervakje gevuld (geen gaten meer)

Root cause van "geen 40 ballen, niet helemaal vol": de plaatsing streefde een vast aantal na en sloeg daarbij willekeurig een deel van de beschikbare roostervakken over — dat liet zichtbare gaten achteren, en op een kleiner scherm dan waarop getest was, kwam het bovendien onder de 40 uit.

- **Herontwerp**: geen "gewenst aantal" meer. Het rooster wordt nu volledig gevuld — elk vakje krijgt een bal, zonder uitzondering.
- Past zich vanzelf aan het daadwerkelijke scherm aan: geen vaste 40 meer, maar zoveel als er op dát scherm past (bijv. 60 op een iPhone 14-formaat, 40 op kleiner iPhone SE-formaat) — nooit meer gaten, nooit meer te weinig.
- Dode code opgeruimd (het oude dynamische grootte-schema, dat niet meer nodig is nu de grootte vast staat op de kleinste maat voor maximale dichtheid).
- **Getest** op twee schermformaten: geen enkele overlap op beide, bevestigd dat alle vakjes daadwerkelijk bezet zijn (geen gaten). Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## Patroon — correctie: geen arcering, 40 ballen vanaf ronde 1

Verduidelijking na eerdere heen-en-weer: géén arcering (effen/vlak), en
40 ballen moeten meteen zichtbaar zijn — niet pas opgebouwd tegen ronde 10.

- Achtergrond-schema (dat per ronde opliep) teruggebracht naar een vaste constante (37, + 3-6 doelen = 40-43 totaal, elke ronde gelijk).
- Arcering definitief verwijderd — effen, vlakke donkere ballen.
- **Getest**: ronde 1 bevestigd op 40 ballen (niet pas later), 0 hatch-lijnen getekend, 0 overlap over 780 gecontroleerde paren. Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## Patroon — arcering teruggezet, dichtheid naar 40 ballen

- Correctie op mijn vorige interpretatie: arcering was abusievelijk verwijderd, nu teruggezet (diagonale lijntjes op de donkere rustballen).
- Achtergrond-schema verder opgevoerd (`[1,3,5,8,11,14,18,22,27,34]`) zodat ronde 10 nu exact 40 ballen op het scherm heeft (was 36), bij een straal van 24px.
- Bevestigd: het volledige veld staat vanaf het eerste frame al klaar (donker/gearceerd) — geen opbouw-animatie, het enige wat gebeurt is dat de doelballen daarna oplichten.
- **Getest**: volledige 10-ronde-doorloop, ronde 10 bevestigd op exact 40 ballen, 0 overlap over 780 gecontroleerde paren. Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## Patroon — effen ballen, écht vol scherm, groot-naar-klein over de sessie

- **Arcering verwijderd**: ruststaat is nu een mooi egaal, vlak donker oppervlak — geen diagonale lijntjes meer.
- **Achtergrondballen groeien nu mee met de ronde** (was: vast op 18). Nieuw schema `[1,3,5,8,11,14,17,21,25,30]` naast het bestaande doelen-schema. Ronde 1 begint met 4 ballen in totaal (groot, ~48px); ronde 10 heeft 36 ballen (klein, ~24px, scherm écht vol).
- Bal-groottebereik verbreed (24-50px, was 32-38px) zodat dit verloop ook daadwerkelijk zichtbaar is.
- **Getest**: ronde 1 bevestigd groot (48px, 4 ballen, 0 overlap), volledige 10-ronde-doorloop tot ronde 10 bevestigd klein+vol (36 ballen, 24px, 0 overlap over 630 gecontroleerde paren). Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## Patroon — overlap-bug, gevuld scherm, blijvend wit na tik

Drie punten uit een echte iPhone-speeltest, alle drie verholpen:

- **Overlap-bug ("ruitjes") opgelost**: de plaatsing gebruikte willekeurige pogingen (200x proberen, anders toch maar plaatsen) — bij een voller veld kon dat zichtbaar overlappende ballen opleveren, precies zoals in de screenshot. Vervangen door een rooster-met-jitter-plaatsing die overlap wiskundig uitsluit in plaats van 'm alleen te proberen te vermijden. Geverifieerd: 0 overlappende paren over 210 gecontroleerde balcombinaties.
- **Scherm echt gevuld**: achtergrondballen van 9 naar 18 verhoogd. Bal-grootte bewust verkleind (was 43-48px, gelijk aan Getallen volgen; nu 32-38px) — bij de oude maat pasten er fysiek maar 2-3 ballen per rij op een telefoonscherm, dus "heel scherm vullen" was met die maat niet haalbaar. Nu 21+ ballen gelijktijdig zichtbaar, willekeurige celselectie voorkomt een voorspelbaar vast raster.
- **Blijvend wit na een juiste tik**: een correct geselecteerde doelbal blijft nu wit voor de rest van de ronde (was: alleen een kort sprankel-pulsje dat weer wegdooft), zodat de speler zijn eigen voortgang kan zien. Reset netjes bij elke nieuwe ronde.
- **Getest**: geen enkele overlap (210 paren gecontroleerd), scherm daadwerkelijk gevuld (21 ballen bevestigd), bal blijft aantoonbaar wit 900ms na de tik (ruim voorbij de pulse-vervaging). Classic en Getallen volgen apart geregressietest — beide ongewijzigd en foutloos.

## Patroon — herziening naar visueel/ruimtelijk geheugen (geen volgorde meer)

Fundamentele mechaniekwijziging, niet een uitbreiding van de vorige versie:

- **Oud**: sequentiële onthulling (positie 1→2→3 na elkaar), speler moest exacte volgorde onthouden en navolgen.
- **Nieuw**: een "memory field" van 9 constante achtergrondballen (donker, licht gearceerd) plus N doelballen die ALLEMAAL TEGELIJK kort wit oplichten. Speler moet onthouden *welke* posities wit waren en ze daarna in willekeurige volgorde terugvinden. Volgorde is nu irrelevant.
- **State herzien**: `seq`/`patternTargetIndex` (sequentieel) volledig vervangen door `isTarget`/`selected` (Set-gebaseerd) + `patternSelectedCount`/`patternTargetCount`.
- **Nieuwe rust-rendering**: donkere ballen met subtiele diagonale arcering (eigen nieuwe visuele staat) — dit is nu de norm voor het hele veld; wit is de tijdelijke uitzondering tijdens het geheugenmoment (voorheen precies andersom).
- Foutafhandeling, 3-fouten-limiet, rondepauzes, sprankel-feedback en Game Over-scherm ongewijzigd qua principe, aangepast waar nodig aan de nieuwe state.
- **Getest**: alle 13 scenario's uit de opdracht (P1 t/m P13) — memory field correct getekend, rustballen zichtbaar/donker, exact N doelballen tegelijk wit, doelballen onherkenbaar na de kijktijd, willekeurige volgorde geaccepteerd, niet-doelbal = fout, geen herkijking na fout, dezelfde doelverzameling blijft actief, 3 fouten → Game Over, volledige 10-ronde-progressie (3,3,3,4,4,4,5,5,5,6) exact bevestigd, 3 verse sessies met verschillende doelposities, Classic→Patroon→Getallen volgen→Patroon zonder cross-talk.
- **Regressie**: Classic Mode en Getallen volgen ongewijzigd en apart getest — beide foutloos.

## Rustmomenten bij start + level-up (Patroon én Getallen volgen), bal-grootte gelijkgetrokken

Op verzoek: beide modi beginnen nu iets later na het indrukken van "Starten", en pauzeren opnieuw even na elke voltooide ronde ("level up") — tijd om te settelen/genieten, voordat het volgende begint.

- **Getallen volgen**: `TRACK_ROUND_PAUSE` (1,1s) toegevoegd bij sessiestart én na elke ronde. Tijdens de pauze blijft het bevroren, voltooide bord zichtbaar (inclusief de laatste sprankel-feedback), fysica staat stil, invoer wordt genegeerd. Dit was eerder bewust verwijderd (geen tussenscherm), nu op expliciet verzoek opnieuw toegevoegd — ditmaal puur als rustmoment, zonder scorepaneel.
- **Patroon**: dezelfde pauze nu ook vóór de allereerste ronde van een sessie (niet alleen tussen rondes, wat er al was). Loste als bijeffect meteen op waarom eerdere feedback soms te snel leek te verdwijnen.
- **Bal-grootte gelijkgetrokken**: Patroon gebruikte een vaste 40px-straal, Getallen volgen een dynamische 43–48px. Patroon gebruikt nu exact dezelfde schaalformule als Getallen volgen — beide modi tonen nu identiek grote ballen bij hetzelfde aantal.
- **Getest**: bevestigd dat het NIEUWE cijfer/de nieuwe onthulling niet binnen 400ms na een voltooiing verschijnt (pauze werkt), en wel binnen 1,4s (pauze eindigt op tijd) — voor zowel sessiestart als ronde-overgang, in beide modi. Classic Mode (bewust ongewijzigd) getest en nog steeds foutloos.

## Patroon — rustmoment tussen rondes + sprankelende feedback

- **Rustmoment toegevoegd** (1,1s) na een voltooide ronde, vóór de volgende begint. Lost meteen ook het eerder gemelde punt op: de laatste correcte tik van een ronde toont nu wél zijn eigen witte pulse (die kreeg eerder geen tijd om te renderen doordat de ronde synchroon doorschakelde).
- **Sprankelende feedback** toegevoegd bij elke tik (correct én fout) — dezelfde zes-stralen-techniek als bij Getallen volgen, met Patroon's eigen rode tint voor consistentie. Materiaal licht ook op richting puur wit bij een correcte tik.
- Pauze-timer is pauze-bestendig gemaakt (`resumeGame()` schuift 'm mee, net als bij de onthullings-tijdlijn) en invoer wordt genegeerd tijdens het rustmoment.
- **Getest**: bevestigd dat de laatste tik nu wél een zichtbare witte pulse toont, dat er geen nieuwe onthulling verschijnt binnen 400ms na voltooiing (echte pauze), en dat de volgende ronde pas ná de volledige 1,1s begint.

## Patroon — Fase 2 basisversie (nieuwe, derde spelmodus)

Volledig geïsoleerde implementatie volgens de vastgelegde specificatie:
statische posities, sequentiële korte onthulling (zelfde donkere
markering als Classic Mode), exacte reproductie van positie én
volgorde, fout = fout zonder herkijking, 3 fouten = Game Over, eerste
10 rondes vast schema (3,3,3,4,4,4,5,5,5,6 — alleen aantal posities
varieert, zichtbaarheidstijd blijft constant).

- **Eigen state**: `patternBalls`, `patternTargetIndex`, `patternSessionErrors`,
  `patternRoundNumber` — geen enkele overlap met `cells` (Classic) of
  `trackingBalls` (Getallen volgen), grep-bevestigd.
- **Eigen Game Over-scherm** (`#patternGameOver`): Ronde bereikt / Fouten /
  Tijd — bewust géén score-regel (dat wordt later apart ontworpen).
  Hergebruikt alleen de generieke `.tgo-*`-CSS-classes, geen gedeelde
  state met Tracking's Game Over.
- **Derde kaart op het spelmodus-overzicht** ("Patroon", eigen icoon,
  monochrome intro-bol — geen nieuwe kleur geïntroduceerd, blauw blijft
  het enige gedeelde accent).
- **Getest** (10 geautomatiseerde tests via een lokale server + Chromium,
  canvas-tekenaanroepen onderschept voor precieze tik-detectie — geen
  enkele wijziging aan het spel zelf): sequentiële onthulling (exact 3
  aparte posities), correcte volgorde-reproductie, verkeerde volgorde
  correct als fout herkend, patroon blijft staan na 1 fout en is alsnog
  af te maken, foutlimiet triggert Game Over binnen 3 pogingen, Game
  Over toont alle velden correct (geen "undefined"), 6x achtereen wisselen
  tussen Classic/Tracking/Patroon zonder enige JS-fout, posities variëren
  over 3 verse sessies (echte randomisatie bevestigd), Classic en
  Getallen volgen draaien ongewijzigd door (regressie-smoketest).
- **Opgemerkt, niet gewijzigd**: de laatste correcte tik van een ronde
  toont zijn eigen witte feedback-pulsje niet zichtbaar (de ronde wisselt
  synchroon voordat die pulse kan renderen) — dit bleek al exact zo in
  Getallen volgen's bestaande, goedgekeurde code te zitten
  (`finishTrackingRound()` heeft hetzelfde patroon). Bewust getrouw
  overgenomen, niet als "kleine verbetering" aangepast.

## UI-fix — ontbrekende knop-resets in het nieuwe spelmodus-overzicht

- `.ms-card` (de modus-kaarten) miste `appearance: none`, `width: 100%` en een lettertype-reset — als natieve `<button>` kon dat op iOS native styling laten doorschemeren en de kaart laten krimpen naar zijn inhoud i.p.v. de volle breedte te vullen.
- De tekstkolom in elke `.mi-feature`-rij (intro-scherm) had geen `flex: 1`, waardoor lange labels konden overlopen i.p.v. netjes af te breken.
- `.mi-back`-knop kreeg dezelfde reset voor consistentie.
- Proactief gevonden bij code-review, niet via een specifieke foutmelding — gebruiker meldde alleen "er ging iets mis" zonder details.

## UI-herziening — Spelmodus-overzicht + intro-schermen, blauw accent

Per de eerder goedgekeurde UI-richting (blauw accent toegestaan voor actieve/geselecteerde elementen, gameplay zelf blijft monochroom; Memory/Reaction/Zen Mode blijven illustratief, niet gebouwd):

- **Home vereenvoudigd**: de losse "Classic Mode"/"Getallen volgen"-knoppen zijn vervangen door één "🎮 Spelmodus"-knop die naar een nieuw overzicht leidt.
- **Nieuw spelmodus-overzicht**: kaarten voor Classic Mode en Getallen volgen (met "Nieuw"-badge), geselecteerde/actieve kaart krijgt een blauwe gloed-rand.
- **Nieuw intro-scherm per modus**: een pulserende bol (wit voor Classic, blauw gloeiend met "123" voor Getallen volgen), titel, korte uitleg, een lijst met kenmerken (bijv. "3+ ballen — Begin met 3 ballen"), en een "▶ Starten"-knop.
- `launchClassicMode()`/`launchTrackingMode()` blijven de daadwerkelijke start-functies — de nieuwe schermen roepen ze alleen aan via een extra stap, geen dubbele logica.
- `updateIndicatorVisibility()` en `showHome()` uitgebreid met de twee nieuwe overlays, om exact de "Classic Mode onbereikbaar"-fout van hiervoor niet opnieuw te introduceren.

## BUG: Classic Mode onbereikbaar (regressie, gevonden tijdens Fase 9-speeltest)

- **Root cause:** `currentMode` was een eenrichtingsschakelaar. Zodra "Getallen volgen" één keer was aangetikt, stond `currentMode` op 'tracking' — en er bestond nergens een knop die 'm terugzette op 'classic'. "Verder spelen" en "Nieuwe sessie" op Home checken beide `currentMode` en bleven daardoor voorgoed naar Number Tracking wijzen.
- **Fix:** los "⚪ Classic Mode"-knop toegevoegd op Home, met een eigen `launchClassicMode()` die expliciet terugschakelt, ongeacht wat er laatst actief was. Herstelt Classic Mode's fase/cellen-status precies waar die was (die werd nooit aangeraakt tijdens tracking-mode, dus niets ging verloren).
- Dit is precies het soort fout waar de eigen testfase (Fase 9) voor bedoeld is — bevestigt de waarde van de echte iPhone-speeltest.

## Number Tracking — Fase 8 herzien (blok-schema i.p.v. korte cyclus)

- Eerdere versie wisselde elke 4 rondes snel van as (3 ballen-rondes, 1 snelheid-ronde). Op voorstel (via GPT, akkoord bevonden) vervangen door rustigere blokken: 4 rondes alleen ballen, dan 3 rondes alleen snelheid, herhaald — geeft de speler meer tijd om aan één uitdaging te wennen voordat de volgende komt.
- **Audit vooraf uitgevoerd** (zoals gevraagd): gecontroleerd dat snelheid nergens meer verborgen aan `trackingBallCount` hangt — bevestigd, `trackSpeedMultiplier` wordt uitsluitend met de eigen `trackingSpeedLevel`-teller aangeroepen. (`computeTrackRadius` hangt terecht nog wel aan bal-aantal — dat is bal-grootte/layout, geen moeilijkheidsas.)
- **Getest:** doorgerekend tegen het exacte schema uit het voorstel (ronde 1-11: 3,4,5,6,7,7,7,7,8,9,10 ballen) — komt precies overeen. Herhaling tot ronde 25 doorgerekend, patroon blijft consistent.

## Number Tracking — Fase 8 (moeilijkheidsassen losgekoppeld)

- Ballen-aantal en snelheid liepen tot nu toe altijd samen op (beide gedreven door dezelfde teller). Nu een gefaseerde cyclus van 4 rondes: de eerste 3 laten alleen het aantal ballen groeien (snelheid bevriest), de 4e laat alleen de snelheid groeien (ballen blijft gelijk). Herhaalt zich.
- "Rustig aan moeilijker" — nooit twee assen tegelijk, exact zoals de spec vraagt ("verhoog deze niet allemaal tegelijk").
- Snelheid komt nu uit een eigen teller (`trackingSpeedLevel`), volledig losgekoppeld van het aantal ballen.
- **Getest:** 16 rondes doorgerekend — in elke ronde verandert precies één van de twee assen, nooit beide tegelijk, nooit geen van beide.

## Number Tracking — Home-knop op Game Over-scherm

- Terecht gevonden gat: het Game Over-scherm dekte de scanner-indicator zelfs visueel af (hogere z-index), dus er was geen enkele weg terug naar Home — alleen "Opnieuw proberen".
- "🏠 Home"-knop toegevoegd, secundair aan de retry-knop.
- `updateIndicatorVisibility()` houdt nu ook rekening met het Game Over-scherm, zodat de scanner-indicator nooit meer onbedoeld interactief blijft onder een volledig-scherm-overlay.

## Number Tracking — definitieve fout-/Game Over-flow (aanvulling)

Op basis van een definitief document van de gebruiker, dat het eerdere BEST/HUIDIG-paneel-ontwerp expliciet afkeurt en een echte Game Over-structuur vastlegt:

- **Fouten zijn nu sessie-breed** (niet meer per ronde): 1e en 2e fout gaan door met hetzelfde doelnummer, de 3e fout beëindigt de hele sessie. `trackingSessionErrors` vervangt het oude per-ronde `trackingErrors`.
- **BEST/HUIDIG-paneel tijdens het spel verwijderd** — rondes lopen nu direct door naar de volgende zonder onderbreking of statistieken-weergave. Dit brak met het principe dat er tijdens het spelen geen scores zichtbaar zijn.
- **Nieuw Game Over-scherm**: Ballen / Fouten / Tijd (bewust géén Score-regel — die formule is nog niet vastgesteld, expliciet uitgesteld tot na een echte speeltest), plus "NIEUW RECORD" of "BESTE: X ballen", plus een "Opnieuw proberen"-knop.
- **Geen apart levelsysteem** — "Ballen" is de enige voortgangsmaat, zoals besloten ("Level = aantal ballen" was het alternatief, maar zelfs die naam is niet gebruikt — gewoon "Ballen").
- Record-vergelijking is nu puur op hoogste bereikte ballen-aantal (geen tijd-tiebreak meer nodig, aangezien er geen score is om op te optimaliseren).
- **Getest:** drie scenario's — (1) 1e/2e fout gaan door met hetzelfde doel, 3e fout triggert Game Over exact bij fout-teller 3; (2) fouten resetten niet tussen geslaagde rondes (sessie-breed bevestigd); (3) ballen-aantal loopt correct op zonder onderbreking tussen rondes (3→4→5→...→11 geverifieerd).

## Number Tracking — Fase 6 + 7 (foutenstatistiek + BEST/CURRENT-weergave)

- **Fase 6 compleet:** gemiddelde tijd per correcte selectie wordt nu berekend en bijgehouden (`avgMs`), naast de al bestaande fouten-telling die de ronde niet meer beëindigt.
- **Fase 7 compleet:** het tussenscherm tussen rondes toont nu een echt BEST/HUIDIG-paneel (donker, afgerond, zelfde visuele taal als de rest van ORBIT), precies zoals het voorbeeld in de spec. Bij een nieuw record staat er expliciet "Nieuw record!" in plaats van "Huidig".
- BEST wordt bijgewerkt op basis van: eerst meeste ballen, dan (bij gelijke ballen) snelste tijd — exact zoals gespecificeerd.
- **Getest:** vijf scenario's doorgerekend (nieuw record bij meer ballen, nieuw record bij zelfde ballen maar sneller, géén record bij minder ballen ook al was die ronde sneller, nieuw record bij weer meer ballen, gemiddelde-tijd-berekening) — allemaal correct.

## Number Tracking — vervaging iets langer

- Hold-periode 2,5s → 3,5s, vervaagtijd 3s → 4s. Cijfer nu volledig verdwenen na 7,5s (was 5,5s).

## Number Tracking — Fase 5 (nummers geleidelijk vervagen)

- Elk cijfer blijft 2,5s volledig helder na verschijnen, vervaagt daarna geleidelijk over 3s tot onzichtbaar. De bal zelf blijft te allen tijde volledig zichtbaar — alleen het cijfer dooft. Beweging gaat gewoon door.
- Introduceert de geheugendimensie: de speler moet op een gegeven moment onthouden waar welk nummer zat, in plaats van het steeds te kunnen aflezen.
- **Getest:** vervaagcurve doorgerekend — geen enkele sprong (max 0,00033 opaciteitsverandering per ms), volledig verdwenen na exact 5,5s.

## Number Tracking — Fase 4 (bewegingssnelheid)

- Snelheid schaalt nu geleidelijk mee met dezelfde teller als het aantal ballen (+4% per bal boven het startaantal van 3), geplafonneerd op 1,8× de basissnelheid — nooit chaotisch, nooit een sprong.
- **Getest:** progressie doorgerekend van 3 t/m 40 ballen — elke stap is exact +4%, plafond wordt bereikt rond 23 ballen, daarna blijft snelheid gelijk terwijl alleen het aantal verder groeit. Geen enkele sprong groter dan de vaste stapgrootte.

## Number Tracking — rood ook sprankelend, kleinere ballen groter

- Sprankel-lijntjes gelden nu ook bij een foute tik (rood i.p.v. wit) — was alleen bij correct.
- Ondergrens balgrootte verder omhoog: 38px → 43px, zodat ballen na de overgang naar hogere aantallen niet meer zo klein aanvoelen. Getest tot 15 ballen — plaatsing blijft altijd lukken.

## Number Tracking — sterkere correct/fout-feedback

- **Correct:** materiaal licht nu echt op richting puur wit (zelfde "lift"-principe als Classic Mode's detectie-burst), plus zes korte sprankel-lijntjes die kort naar buiten stralen, plus een dikkere/helderdere ring en iets meer schaal-pop (0,02 → 0,05).
- **Fout:** directe rode wassing over de bal zelf, niet meer alleen een dun randje — in één oogopslag duidelijk zonder het cijfer te hoeven lezen. Ring ook dikker/feller.
- Bewust ingetogen gehouden (dun, weinig stralen, geen confetti) — past bij de rest van ORBIT's rustige, premium visuele taal.

## Number Tracking — ballen groter (correctie)

- Vorige aanpassing ging de verkeerde kant op — "iets grote nog" was bedoeld als "iets groter", niet "te groot". Rechtgezet: max-straal nu 48px (was 42px origineel, 36px na de misinterpretatie), ondergrens 38px. Groter dan waar we begonnen, niet kleiner.
- Geverifieerd dat plaatsing bij 3 t/m 12 ballen nog steeds altijd lukt met de grotere maat.

## Number Tracking — ballen iets kleiner

- Terugkoppeling: nog iets te groot. Max-straal 42px → 36px, ondergrens 34px → 29px, krimpformule proportioneel meegeschaald. ~15% kleiner over de hele linie, zelfde verhoudingen.

## Number Tracking — overlap-bug + te-kleine-ballen gefixt

- **Root cause overlap:** ballen hadden alleen wand-botsing, geen botsing tussen elkaar — konden dus gewoon door elkaar heen bewegen zodra ze dicht bij elkaar kwamen. Zichtbaar in een screenshot (bal 2 en 3 overlappend).
- **Root cause gemiste tikken bij 6 ballen:** rechtstreeks gevolg van de overlap — bij overlappende ballen wordt precies de juiste raken lastig tot onmogelijk, wat aanvoelde als "reageert niet meer".
- **Fix:** paarsgewijze botsing toegevoegd aan `stepTrackingPhysics`, letterlijk dezelfde bewezen aanpak als Classic Mode's cellen (scheiden langs de contactnormaal, elastische snelheidsuitwisseling).
- **Ondergrens bal-grootte verhoogd** van 26px naar 34px, en de krimpformule iets afgevlakt — moeilijkheid bij meer ballen moet uit het volgen/onthouden komen, niet uit steeds kleiner wordende tikdoelen.
- **Getest:** 50 gesimuleerde seconden fysica per aantal ballen (3, 6, 9, 12, 15) — nul overlap-frames in alle gevallen, minimale middelpunt-afstand blijft altijd ruim boven de vereiste grens.

## Number Tracking — Fase 3 (moeilijkheidsopbouw)

- **Enige moeilijkheidsfactor deze fase:** één bal erbij per geslaagde ronde (3 → 4 → 5 → ...), exact zoals de spec vraagt — snelheid en zichtbaarheid blijven onaangeroerd tot de basis goed speelbaar is gebleken.
- Bal-straal schaalt nu mee met het aantal (zelfde `sqrt(3/n)`-aanpak als Classic Mode's celgrootte), met een ondergrens van 26px zodat ballen altijd comfortabel aan te tikken blijven.
- **Getest:** 15 opeenvolgende perfecte rondes gesimuleerd — plaatsing slaagt elke keer, radius schaalt vloeiend mee (42px → 26px, bereikt de vloer rond 9 ballen), alle ballen blijven binnen de grenzen. Stress-test tot 63 ballen over 60 rondes: geen enkele plaatsingsfout: het systeem degradeert netjes (iets minder perfecte spreiding bij extreme aantallen) in plaats van vast te lopen.
- Geen kunstmatig plafond toegevoegd — 60+ opeenvolgende perfecte rondes is praktisch nooit haalbaar, en het systeem breekt sowieso niet als het wel gebeurt.

## Nieuwe spelmodus — Moving Number Tracking (Fase 2, basisversie)

- **Nieuwe modus naast Classic Mode**, volledig gescheiden: eigen state (`trackingBalls`), eigen physics-stap (`stepTrackingPhysics`), eigen tekenfunctie, eigen tik-afhandeling. Classic Mode's `handleTap`, `resolveRound`, `startRound`, `cells`-array — geen letter aangeraakt, geverifieerd met een grep-check op de functie-bodies.
- `frame()` vertakt eenmaal, helemaal bovenaan, naar `frameTracking()` als `currentMode === 'tracking'` — de rest van de game-loop wordt dan niet eens bereikt.
- Spelregels (Fase 2, exact zoals gespecificeerd): 3 witte ballen, elk met een uniek zichtbaar nummer (1-3), continu bewegend, stuiterend tegen de randen. Speler tikt 1 → 2 → 3 in volgorde. Fout tikken telt als fout maar beëindigt de ronde niet (Fase 6-principe alvast toegepast in de basisversie). Ronde compleet → resultaat kort getoond → volgende ronde (nog met hetzelfde aantal ballen; Fase 3-progressie is bewust nog niet gebouwd).
- Minimale Fase 7-subset: `save.trackingBest`/`save.trackingLast` (aantal ballen, tijd, fouten) — geen UI ervoor gebouwd, puur de databasis alvast aanwezig.
- Toegang: nieuwe knop "🔢 Getallen volgen" op het Home-scherm. Pauzemenu en Instellingen werken automatisch mee (pause/resume was al mode-onafhankelijk); "Nieuwe sessie" is bewust modus-bewust gemaakt zodat 'ie in tracking-modus een tracking-ronde herstart in plaats van Classic Mode's ladder te resetten.
- **Getest, niet alleen gebouwd:** een losstaande Node-simulatie van de exacte spawn/physics/tik-logica (6 scenario's: spawn-integriteit over 3-12 ballen, 1000 frames physics-grenscontrole, volledige juiste reeks, foute tik zonder ronde-einde, al-getikte bal genegeerd, tik na ronde-einde genegeerd) — alle zes geslaagd.

**Nog open (Fase 3+, bewust niet gebouwd in deze levering):** moeilijkheidsopbouw (meer ballen, snelheid, vervagende nummers), volledige foutstatistieken-weergave, uitgebreide Score/PR-UI, meerdere moeilijkheidsassen los van elkaar regelbaar.

## First Launch Tutorial

- Interactieve onboarding, alleen bij een écht eerste bezoek (`save.tutorialCompleted`)
- Hergebruikt de echte gameplay-functies (`adjustCellCount`, `beginScan`, `updateScan`, `handleTap`, `resolveRound`) — geen aparte tutorial-code, `resolveRound()` heeft alleen één vroege `if (tutorialActive) return;`-tak
- Zes stappen: Welkom → Ronde A (3 cellen) → Ronde B (4 cellen) → Navigatie-demo → Klaar → echte eerste ladder-ronde
- Overslaanbaar, en opnieuw te bekijken via Instellingen
- Bestaande spelers bij deze update worden niet retroactief getrakteerd op de tutorial (`tutorialCompleted` wordt bij het laden op `true` gezet als de save al sporen van eerder spelen toont)

## Cognitive Engine — snelheid bijgesteld

- `ADVANCE_THRESHOLD` van 80 naar 70, punten per correct antwoord van 3 naar 4 — ongeveer 2× zo snel voor een consistent goede speler (doorgerekend met simulatie)
- `currentStreak`/`currentErrorStreak` resetten nu bij hervatten na pauze én bij het heropenen van de app — voorkomt dat een "roestig" foutje na een pauze meetelt als voortzetting van een oude foutenreeks (was de oorzaak van te ver terugzakken)

## Audio — volledig herbouwd met event-architectuur

- `GameEvents` (minimale pub/sub) + `AudioManager` (volledig losstaande listener) — harde regel: gameplay stuurt audio, audio stuurt nooit gameplay
- Zes observatiepunten: `scannerStarted`, `scannerReveal`, `scannerFinished`, `correctAnswer`, `wrongAnswer`, `levelUp` — elk één regel op een bestaand beslismoment, geen bestaande regel gewijzigd
- **Bugfix:** `pulseFound()` (tussentijdse juiste tik bij meerdere symbolen) miste het `correctAnswer`-event — alleen de laatste tik gaf geluid. Gefixt.
- **Bugfix:** audio-unlock hing aan een `window`-listener terwijl het geluid-triggerende event aan de canvas-listener hing, die altijd eerder afgaat — eerste tik(ken) waren daardoor stil. Nu unlockt de canvas-handler zelf eerst.
- **Bugfix:** een vers aangemaakte AudioContext kan een opstart-vertraging hebben waardoor het eerste geluid verloren gaat — opgelost met een onhoorbare "priming"-oscillator direct bij aanmaak
- iOS-stille-schakelaar-fix: een korte, stille `<audio>`-tag "ontgrendelt" de audio-sessie voor oscillators (bekend WebKit-eigenaardigheid)
- Geluidsset: na A/B/C-vergelijking gekozen voor Set B "Ademend" — lagere tonen, tragere aanzwelling, lowpass-gefilterd voor warmte (`tone()` heeft nu een `filterHz`-parameter)
- Scanner-toon: sine i.p.v. triangle (triangle klonk zoemerig/alarmerend bij 44Hz, vergeleken met een auto-deurtje-piepje)
- Instellingen: Geluid aan/uit toegevoegd naast Trilling

## In-Game Navigatie (Sprint 4)

- Scanner-indicator bovenaan: dunne witte lijn, geactiveerd via **kort ingedrukt houden** (350ms), niet een gewone tik — een tik op een hoog zwevende bal mag het menu nooit per ongeluk openen
- Pauzemenu: Verder spelen / Home / Nieuwe sessie / Instellingen — pauze bevriest physics/scan/timers exact, hervatten schuift de klokken op met precies de gepauzeerde duur
- Home = uitgebreid welkomstscherm met stats + Nieuwe sessie + Statistieken + Instellingen
- Nieuwe sessie reset alleen de huidige ladder-positie en score — lifetime-stats blijven staan
- Statistieken-scherm: Hoogste level, Hoogste score, Cognitive Rating, Correcte antwoorden, Speeltijd, Sessies, Laatste keer gespeeld
- Auto-save uitgebreid: ook bij pauzeren, naar Home gaan, en app-achtergrond

## Cognitive Engine V2.0 — Confidence Score

- Interne, nooit-getoonde Confidence Score (0–100, start 50) vervangt het eerdere vaste raam van 5 rondes
- Vijf factoren per ronde: correctheid, reactietijd (tegen de eigen verwachte tijd per ladder-stap, niet een vaste limiet), streak-bonus, foutenreeks-straf, extreme-prestatie-boost
- Vermoeidheidsfactor: na ~15 min onafgebroken spelen vervalt de trage-reactie-straf
- **Bugfix:** reactietijd werd gemeten vanaf ronde-start (inclusief de volledige verplichte scan van 5-7s), waardoor een speler nooit als "snel genoeg" kon gelden — nu gemeten vanaf `beginMemory()`

## Stabiliteitsfix — de echte oorzaak van inconsistente tikken

- **Root cause:** `roundTargets` sloeg doelcellen op als array-*index*, maar het cellen-array werd middenin een ronde gemuteerd (vervagende cellen die eruit werden gefilterd) — indices konden daardoor naar de verkeerde cel gaan wijzen
- **Fix:** elke cel kreeg een stabiel, uniek `id`; alle rondelogica draait nu op dat ID i.p.v. array-positie

## Definitieve Classic Mode

- Symbolen i.p.v. cijfers als scanner-inhoud → later vervangen door: de hele cel wordt bijna zwart bij reveal (i.p.v. lichter — op een wit-op-zwart wereld is donker worden unieker dan lichter worden)
- Tikken tijdens de scan doet niets — geheugenfase begint pas als de scanner het scherm volledig heeft verlaten (eerder gebouwde "tik tijdens scan"-functie weer teruggedraaid, bewust: observeren en kiezen blijven twee gescheiden cognitieve taken)
- Volledige-scherm-flits (220ms) als non-verbaal "ga"-signaal zodra de geheugenfase begint

## Motion Design (Sprint 3) + In-Game Navigatie basis

- Nieuwe cellen vloeien in (ease-out) i.p.v. instant verschijnen, symmetrisch met de bestaande fade-out
- Feedback-puls ease-out i.p.v. lineair
- Scanner-lichtpuls bij volledig binnenkomen, exacte 350ms opbouw/afbouw gekoppeld aan echte speelveld-aanwezigheid
- Cellen: langzaam meebewegende reflectie, ±2% schaalpuls bij correct, lichte trilling bij fout
- Eerste versie van pauzemenu/Home/Instellingen (later verder uitgebreid)

## Adaptive Memory Ladder + Cognitive Engine V1 + Save System

- Ladder: 18 stappen, fases A–E, afwisselend meer cellen (tracking) en meer onthoudpunten (werkgeheugen)
- Cognitive Engine V1: raam van laatste 5 rondes, accuracy/snelheid-drempels → -1/0/+1
- Save System: level, hoogste level/score, Cognitive Rating, speeltijd, correcte antwoorden, automatisch opslaan, hervatten via Welkom-terug-scherm
- **Bugfix:** cel-array-mutatie-bug (zie hierboven) bestond hier al, viel toen niet op omdat celaantal nog vast stond

## ORBIT V1 Foundation

- Classic Gameplay Loop bevroren: scanner (vaste snelheid, vlijmscherpe kern + uitwaaierende sleep, geen easing), physics (zachte botsingen, edge-safety), Soft Pearl cel-materiaal
- Refactor-pas: dode code verwijderd, dubbele wand-clamp-logica samengevoegd, magic numbers naar configuratie-constanten
- PWA-fundament: manifest, service worker (network-first), iconen

---

*Dit document wordt bijgehouden bij elke levering — staande opdracht, geen aparte aankondiging nodig.*
