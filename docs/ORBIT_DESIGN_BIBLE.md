# ORBIT — Design Bible

**Status: ORBIT V1 Foundation ✅ — bevroren.**
Dit document is de grondwet van ORBIT. Elke nieuwe feature wordt hiertegen getoetst voordat hij gebouwd wordt. Wijzigt iets hieraan, dan is dat een bewuste, expliciete beslissing — nooit een bijeffect van een andere wijziging.

---

## 1. Visie

ORBIT is een premium, minimalistische cognitieve geheugengame. Geen tutorial, geen tekst, geen uitleg, geen pijlen tijdens gameplay. De speler begrijpt de game volledig via observatie en herhaling.

De ervaring moet aanvoelen als een Apple-product: extreem eenvoudig aan de oppervlakte, tot in detail afgewerkt eronder. Rustig, bijna meditatief — nooit schreeuwerig.

Het uiteindelijke doel: een speler die na een paar rondes automatisch denkt *"nog één keer"*, zonder dat er ooit een score, streak of extra effect nodig was om dat gevoel op te wekken.

---

## 2. Ontwerpregels

- **Geen tekst, geen tutorial, geen pijlen, geen hints** tijdens de gameplay-loop zelf. (Het welkomstscherm bij hervatten is de uitzondering — dat is app-chrome, geen gameplay.)
- **Zuiver zwart-wit.** OLED-zwarte achtergrond (`#000000`), witte elementen. Geen kleur, ook niet subtiel — dat is bewust afgewezen toen het als optie is voorgelegd.
- **Minder is meer.** Elk visueel element moet zijn bestaansrecht bewijzen. Effecten worden pas toegevoegd als ze een concreet gevoel versterken (zie scanner-geschiedenis: van drie stijlen + texturen terug naar één krachtige streep).
- **Physics boven moeilijkheid.** Vloeiende, voorspelbare beweging weegt zwaarder dan een uitdagender spel. De speler moet een cel kunnen blijven volgen.
- **Eén ding tegelijk perfectioneren.** Nieuwe mechanics worden niet toegevoegd totdat de bestaande laag uitzonderlijk goed aanvoelt (feature freeze-principe).
- **Audio ondersteunt, nooit bepalend.** Geluid mag de pacing van de gameplay nooit vertragen of erop wachten. Klinkt een geluid nog door terwijl de volgende stap al begint (zoals de scan-opstart die overloopt in de scan zelf), dan is dat een bewuste overlap — nooit een wachttijd.
- **De scanner bepaalt het ritme, niet de speler.** De scanner is een apparaat, geen animatie die de speler bestuurt. Hij maakt altijd zijn volledige beweging af, ongeacht wat de speler doet — stopt niet, versnelt niet, verandert niet. Een ronde-beslissende tik tijdens de scan wordt direct vastgelegd, maar de afhandeling ervan (geluid, feedback, volgende ronde) wacht tot de scanner het scherm volledig heeft verlaten.

---

## 3. Architectuur (bevroren)

```
Classic Gameplay Loop
   ↓ (levert ruwe rondes)
Adaptive Memory Ladder   ← vast dataset (LADDER)
   ↓ (bepaalt WAT een ronde is: cellen × cijfers)
Cognitive Engine         ← geïsoleerde beslisser
   ↓ (bepaalt WAAR je zit in de ladder: -1 / 0 / 1)
Save System              ← persistente voortgang
```

**Kernregel:** de Cognitive Engine vervangt de ladder nooit. De ladder bepaalt de trainingsopbouw (inhoud); de engine navigeert er alleen doorheen (positie). Nieuwe functionaliteit wordt toegevoegd door uitbreiding, nooit door vervanging van deze basis.

### 3.1 Adaptive Memory Ladder
Vast dataset, 18 stappen, cyclisch:

| Fase | Cellen | Cijfers | Karakter |
|---|---|---|---|
| A | 3 → 8 | 1 | Tracking |
| B | 5 → 7 | 2 | Memory |
| C | 8 → 10 | 2 | Tracking |
| D | 6 → 8 | 3 | Memory |
| E | 9 → 11 | 3 | Tracking |

Na fase E herhaalt het patroon. De ladder zelf verandert nooit — alleen de positie erin.

### 3.2 Cognitive Engine
Interface-contract (stabiel, mag nooit breken):
```
CognitiveEngine.decide(roundHistory) -> -1 | 0 | 1
```
Huidige versie (V2): kijkt naar de laatste 5 rondes.
- ≥80% correct + gemiddelde reactietijd ≤3500ms → **+1** (vooruit)
- ≥80% correct maar traag, of 60–79% correct → **0** (blijft gelijk)
- <60% correct → **-1** (terug)

Nooit onder ladder-index 0. Toekomstige versies (rolling accuracy, streaks, per-fase gedrag) veranderen alleen de inhoud van `decide()` — nooit de aanroep ervan, nooit de ladder, nooit de gameplay.

### 3.3 Save System
`localStorage`, key `orbit_save_v1`. Opgeslagen na elke ronde en bij het verlaten van de app:
- `ladderIndex`, `highestLadderIndex`
- `score`, `highestScore`
- `totalCorrect`, `totalRounds`
- `totalPlayTimeMs`
- `lastPlayed`

Cognitive Rating (afgeleid, niet opgeslagen): `70% nauwkeurigheid + 30% hoogst bereikte niveau`, 0–100 schaal. Bewust eenvoudig, mag later verfijnd worden zonder de rest te raken.

---

## 4. Gameflow (definitief)

1. Nieuwe ronde start
2. Scanner beweegt automatisch, vaste snelheid, van onder naar boven
3. Cijfers worden ~600ms onthuld op het moment dat de scan een doelcel raakt
4. Scanner verdwijnt (of de ronde-beslissing wordt vastgelegd door een eerdere tik — tikken mag al tijdens de scan, maar de scanner zelf wordt daar nooit door onderbroken, versneld of veranderd; de afhandeling wacht tot de scanner het scherm volledig heeft verlaten)
5. Cellen blijven bewegen
6. Speler tikt de juiste cel(len) — bij meerdere cijfers: elke juiste tik geeft eigen feedback, pas de laatste sluit de ronde af
7. Feedback (correct of fout)
8. Direct volgende ronde — geen wachttijd, geen popups

**Vastgezet, wijzigt niet zonder aantoonbare fout:** automatische scan-start, scansnelheid, deze volgorde.

---

## 5. Visuele identiteit

### Kleuren
- Achtergrond: `#000000`
- Cellen en scanner: wit, met transparantie/gloed voor diepte — nooit een tweede kleur

### Scanner ("Scanner 2.0" basis)
- Vlijmscherpe, pixel-gesnapte haarlijn (1px) — geen blur op de rand zelf
- Zachte aura eromheen (blur, apart laagje) voor bloom zonder de rand te vervagen
- Asymmetrische sleep: vrijwel geen gloed vóór de kern (richting beweging), een lange uitwaaierende staart erachter die geleidelijk vervaagt
- Lichte, onregelmatige flikkering (twee overlappende sinusgolven) — energiek zonder storend te zijn
- **Helderheids-opbouw:** bij het verschijnen bouwt de volledige lichtintensiteit (kern, gloed, staart — via één gedeelde `flicker`-factor) op over de eerste ~8% van de doorkruising, bereikt dan maximum en blijft daarna stabiel
- Vaste snelheid: 4500ms om het zichtbare scherm te doorkruisen, lineair (geen easing)
- **Onderbreekbaar door niets:** de scanner maakt altijd zijn volledige pass af, ook als de speler eerder al heeft getikt (zie Gameflow-regel hieronder)

### Cellen ("Soft Pearl")
- Radiale gradient, minimaal contrast, brede zachte sheen — geen scherp glinstertje, geen rim light, geen diepe schaduw
- Lichten op ("lift") tijdens reveal en detectie-burst, richting puur wit
- Grootte schaalt mee met het aantal cellen (32–72px basisstraal, krimpt met `sqrt(3/n)`)

### Feedback
- Correct: witte pulse-ring, subtiel
- Fout: rode pulse-ring + zachte rode bloom eromheen — duidelijker dan correct, maar nog steeds subtiel, nooit fel

---

## 6. Geluid & Haptics

Geluidsidentiteit (Web Audio, geen samples), tonaal familie rond een gedeelde schaal zodat het als één geheel klinkt:

| Moment | Geluid | Karakter |
|---|---|---|
| Scan | 90Hz sine, statisch, zeer stil (vol 0.04) — één doorlopende toon | Eén enkele, lage aangehouden toon. Zwelt aan met de scan, houdt vlak, sterft rustig uit (0.5s fade) wanneer de scan eindigt — geen aparte opstart, geen ruislaag, geen stereobeweging. Bewust tot de eenvoudigst mogelijke vorm teruggebracht |
| Scan-einde | Ambience faded rustig uit over 0.5s | Nooit abrupt — ook niet als de ronde vroegtijdig eindigt door een tik tijdens de scan |
| Cijfer onthuld | 600Hz sine, kort | Zachte tik |
| Correct | 880Hz + 1320Hz sine, gelijktijdig | Helder akkoord |
| Level omhoog | 660 → 880 → 1100Hz sine, oplopend | Zeldzamer en feestelijker dan "correct" — alleen als de Cognitive Engine besluit vooruit te gaan |
| Fout | 340 → 230Hz triangle, dalend | Zacht, duidelijk "fout", nooit schril |

**Ontwerpprincipe:** de audio ondersteunt de gameplay, de gameplay wacht nooit op de audio. `INTRO_DELAY` bleef daarom op de oorspronkelijke ~350ms staan. De opstart-whoom piekt precies op dat moment en loopt nog kort (~450ms) door ín het begin van de scan zelf, terwijl de ambience-laag er vloeiend overheen neemt — geen zichtbare of hoorbare wachttijd, altijd beweging op het scherm.

Haptics: licht, kort. Correct = enkele tik. Fout = kort patroon (tik-pauze-tik). Reveal en scan-opstart/ambience hebben geen haptic.

**Ontwerpregel voor geluid:** rustig, helder, premium, realistisch — als een CT/MRI-scanner, nooit een sciencefiction-laser of gamepieptoon. Elk geluid dat vaak klinkt is bewust het stilst; geluiden die zeldzaam zijn (level omhoog) mogen iets meer ruimte innemen. De scanner moet op termijn zo herkenbaar worden dat de speler hem hoort aankomen vóór hij hem ziet.

---

## 7. Performance-uitgangspunten

- Doel: stabiele 60 FPS, 120 FPS waar het toestel het toelaat
- Geverifieerd op iPhone 13: soepel
- Canvas-gradients en shadowBlur zijn de duurste operaties — bij toekomstige uitbreidingen met veel meer visuele lagen, hergebruik gradients waar mogelijk in plaats van ze elke frame opnieuw te construeren

---

## 8. Wat hier NIET in thuishoort

Dingen die bewust zijn afgewezen of uitgesteld, zodat ze niet per ongeluk terugkomen://
- Kleur (ook niet subtiel cyaan/teal — expliciet overwogen en afgewezen)
- Score/streak-weergave tíjdens gameplay
- Tekst, HUD-elementen, of uitleg tijdens het spelen
- Verplicht alle cellen aantikken vóór de scan start (overwogen, expliciet verworpen — scanner blijft altijd automatisch)
- Device-specifieke edge cases (safe-area, canvas-randen) worden pas na de Premium Experience-fase verder verfijnd, niet ervoor

---

*Dit document wordt bijgewerkt zodra een architectuurkeuze bewust verandert — nooit stilzwijgend als bijeffect van een feature.*
