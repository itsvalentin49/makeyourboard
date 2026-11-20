import {
    gearKey,
    type GearEntry,
} from "@/utils/gearCatalog";



/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalize(value: unknown): string {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

/* =========================================================
   FEATURED PEDALS

   Format:
   Brand|Model

   Multiple model names can be separated with ";"
   to support different database naming conventions.
   ========================================================= */

export const FEATURED_PEDALS: Record<string, string[]> = {

    "A/B Box": [
        "Boss|AB-2",
        "MXR|A/B Box;M196",
        "JHS Pedals|Mini A/B",
        "Radial|BigShot AB",
    ],

    "ABY Switcher": [
        "Radial|Twin-City",
        "Radial|BigShot ABY",
        "Lehle|Little Dual II",
        "Orange|Amp Detonator",
        "Morley|ABY",
        "Electro-Harmonix|Switchblade Pro",
        "JHS Pedals|Active A/B/Y",
    ],

    "Acoustic": [
        "LR Baggs|Venue DI",
        "Fishman|Platinum Pro EQ",
        "Boss|AD-2",
        "TC Electronic|BodyRez",
        "Nux|Optima Air",
        "Grace Design|ALiX",
        "Tech 21|Acoustic Fly Rig",
    ],

    "Acoustic Simulator": [
        "Boss|AC-3 Acoustic Simulator",
        "Mooer|Acoustikar",
        "Hotone|Wood",
    ],

    "Amp Simulator": [
        "Strymon|Iridium",
        "Universal Audio|Dream '65 Reverb-Amp",
        "Universal Audio|Ruby '63 Top Boost Amp",
        "Universal Audio|Lion Super Lead",
        "Boss|IR-2 Amp & Cabinet",
        "Walrus Audio|Mako ACS1 MK2",
        "Line 6|HX Stomp",
        "IK Multimedia|ToneX",
        "DSM & Humboldt|Simplifier MKII",
        "Neural DSP|Nano Cortex",
        "Friedman|IR-X",
        "Tone King|Imperial",
        "TC ELectronic|Combo Deluxe 65' Preamp",
        "Hotone|Ampero II Stomp",
        "Nux|Amp Academy",

    ],

    "Audio Interface": [
        "IK Multimedia|iRig HD X",
        "Boss|Pocket GT",
        "Line 6|HX Stomp",
        "Universal Audio|OX Stomp",
        "Mooer|Prime P1",
    ],

    "Bit Crusher": [
        "Meris|Ottobit Jr.",
        "Red Panda|Bitmap 2",
        "Electro-Harmonix|Mainframe",
        "Malekko|Scrutator",
        "WMD|Geiger Counter",
        "Mooer|LoFi Machine",
        "Alexander Pedals|Syntax Error 2",
        "OBNE|BL-44 Reverse",
    ],

    "Boost": [
        "Xotic|EP Booster",
        "TC Electronic|Spark Booster",
        "MXR|Micro Amp;M133 Micro Amp",
        "EHX|LPB-1",
        "JHS Pedals|Prestige",
        "Keeley|Katana Clean Boost",
        "Fulltone|Fat-Boost",
        "Wampler|Decibel Plus",
        "EarthQuaker Devices|Arrows",
        "Benson Amps|Germanium Boost",
        "Catalinbread|Super Chili Picoso",
        "Zvex|Super Hard On",
        "Boss|BP-1W;BP-1W Booster/Preamp",
        "Browne Amplification|Carbon X",
        "Way Huge|Saucy Box",
        "Friedman|Buxom Boost",
        "Jackson Audio|AMP MODE",
        "Seymour Duncan|Pickup Booster",
        "Suhr|Koko Boost",
        "Orange|Two Stroke",
    ],

    "Buffer": [
        "Empress Effects|Buffer",
        "TC Electronic|Bonafide Buffer",
        "JHS Pedals|Little Black Buffer",
        "Suhr|Buffer",
        "Mesa Boogie|High-Wire",
        "Lehle|Sunday Driver",
        "Wampler|Buffer",
        "Xotic|Super Clean",
        "BJF|Buffer",
    ],

    "Cab Simulator": [
        "Two Notes|Torpedo CAB M+",
        "Universal Audio|OX Stomp",
        "Strymon|Iridium",
        "Boss|IR-200",
        "Mooer|Radar",
        "TC Electronic|Impulse IR Loader",
        "Walrus Audio|ACS1",
        "Suhr|ACE",
        "Palmer|Pocket Amp MK2",
    ],

    "Chorus": [
        "Boss|CE-2W;CE-2W Chorus",
        "Electro-Harmonix|Small Clone",
        "MXR|Analog Chorus;M234 Analog Chorus",
        "TC Electronic|Corona Chorus",
        "Walrus Audio|Julia",
        "JHS Pedals|3 Series Chorus",
        "Strymon|Ola",
        "EarthQuaker Devices|Sea Machine",
        "Analog Man|Mini Chorus",
        "Chase Bliss| warped vinyl hifi",
        "Ibanez|CS9",
        "Maxon|CS550",
        "Jam Pedals|WaterFall",
        "Diamond|Vibrato",
        "Source Audio|Gemini Chorus",
        "Keeley|Seafoam Plus",
        "Mooer|Ensemble King",
        "PastFX|Chorus Ensemble",
        "ThorpyFX|Deep Oggin",
        "Fender|Bubbler Chorus",
    ],

    "Compressor": [
        "Keeley|Compressor Plus",
        "Boss|CP-1X;CP-1X Compressor",
        "MXR|Dyna Comp;M102 Dyna Comp",
        "Xotic|SP Compressor",
        "Origin Effects|Cali76 Compact Deluxe;Cali76 FET Compressor",
        "Wampler|Ego Compressor",
        "Walrus Audio|Deep Six",
        "Empress Effects|Compressor MKII",
        "TC Electronic|HyperGravity Compressor",
        "JHS Pedals|Pulp 'N' Peel V4",
        "Electro-Harmonix|Tone Corset",
        "Diamond|Compressor",
        "Jam Pedals|Dyna-ssoR",
        "Strymon|Compadre",
        "Becos|CompIQ Stella",
        "Suhr|Koji Comp",
        "Seymour Duncan|Studio Bass Compressor",
        "Aguilar|TLC Compressor",
        "Darkglass|Hyper Luminal",
        "Mooer|Yellow Comp",
    ],

    "Delay": [
        "Boss|DD-8 Delay",
        "Boss|DM-2W Delay",
        "MXR|Carbon Copy M169",
        "Strymon|TimeLine",
        "Strymon|El Capistan V2",
        "Electro-Harmonix|Deluxe Memory Man",
        "TC Electronic|Flashback 2 Delay",
        "Line 6|DL4 MKII",
        "Walrus Audio|ARP-87",
        "Eventide|TimeFactor",
        "Source Audio|Nemesis Delay",
        "Catalinbread|Belle Epoch Tape Echo",
        "Keeley|Halo",
        "JHS Pedals|Lucky Cat",
        "Ibanez|AD9",
        "Way Huge|Aqua-Puss",
        "Jam Pedals|Delay Llama",
    ],

    "DI": [
        "Radial|JDI",
        "Radial|J48",
        "Tech 21|SansAmp Bass Driver DI V2",
        "Darkglass|Microtubes B7K Ultra",
        "LR Baggs|Para DI",
        "Fishman|Platinum Pro EQ",
        "BSS|AR-133",
        "Palmer|PAN 01",
        "Countryman|Type 85",
        "Rupert Neve Designs|RNDI",
        "Aguilar|Tone Hammer",
        "Ampeg|SCR-DI",
    ],

    "Distortion": [
        "ProCo|RAT 2",
        "Boss|DS-1 Distortion",
        "Boss|DS-2 Turbo Distortion",
        "MXR|Distortion+;M104 Distortion Plus",
        "1981 Inventions|DRV",
        "Friedman|BE-OD",
        "Wampler|Pinnacle Deluxe",
        "JHS Pedals|Angry Charlie V3",
        "Suhr|Riot",
        "Fulltone|OCD",
        "Electro-Harmonix|Metal Muff",
        "Revv|G3",
        "EarthQuaker Devices|Acapulco Gold",
        "TC Electronic|Dark Matter Distortion",
        "Keeley|Filaments",
        "Catalinbread|Dirty Little Secret",
        "Kernom|Ridge",
        "Way Huge|Fat Sandwich",
    ],

    "Doubler": [
        "TC Electronic|Mimiq Doubler",
        "Strymon|Deco V2",
        "Electro-Harmonix|Double Tracker",
        "Keeley|30ms Double Tracker",
        "Boss|DD-8",
    ],

    "Drum Machine": [
        "Digitech|Trio+",
        "Boss|DR-01S",
        "Singular Sound|BeatBuddy",
        "Mooer|Micro Drummer",
        "Nux|Loop Core Deluxe",
        "Donner|Circle Looper",
    ],

    "Enhancer": [
        "BBE|Sonic Stomp",
        "Aphex|Xciter",
        "Boss|BP-1W",
        "Xotic|EP Booster",
    ],

    "Envelope Filter": [
        "Electro-Harmonix|Q-Tron Plus",
        "MXR|Bass Envelope Filter;M82",
        "Source Audio|Spectrum Intelligent Filter",
        "Aguilar|Filter Twin",
        "EarthQuaker Devices|Spatial Delivery",
        "Boss|AW-3;AW-3 Dynamic Wah",
        "Keeley|Neutrino V2",
        "Emma Electronic|Discombobulator",
        "Mu-Tron|Micro-Tron IV",
        "DOD|Envelope Filter 440",
    ],

    "EQ": [
        "Boss|GE-7 Equalizer",
        "MXR|Six Band EQ;M109S Six Band EQ",
        "MXR|Ten Band EQ;M108S Ten Band EQ",
        "Source Audio|EQ2 Programmable Equalizer",
        "Empress Effects|ParaEq MKII Deluxe",
        "EarthQuaker Devices|Tone Job",
        "JHS Pedals|Haunting Mids",
        "Wampler|EQuator",
        "Orange|Two Stroke",
        "Free The Tone|PA-1QG",
        "Mesa Boogie|Five-Band Graphic EQ",
        "Becos|CompIQ",
        "Aguilar|Tone Hammer",
        "Tech 21|Q\\Strip",
    ],

    "Expression": [
        "Boss|EV-30",
        "Dunlop|DVP4;DVP5",
        "Mission Engineering|EP-1",
        "Moog|EP-3",
        "Roland|EV-5",
        "Electro-Harmonix|Expression Pedal",
        "Lehle|Dual Expression",
        "M-Audio|EX-P",
    ],

    "Filter": [
        "Source Audio|Spectrum Intelligent Filter",
        "Electro-Harmonix|Q-Tron Plus",
        "EarthQuaker Devices|Spatial Delivery",
        "DOD|Envelope Filter 440",
        "Death By Audio|Evil Filter",
        "WMD|Protostar",
        "Fairfield Circuitry|Long Life",
        "Meris|Enzo",
    ],

    "Flanger": [
        "Boss|BF-3;BF-3 Flanger",
        "Electro-Harmonix|Electric Mistress;Deluxe Electric Mistress",
        "MXR|Flanger;M117R",
        "TC Electronic|Vortex Flanger",
        "Strymon|Orbit",
        "Source Audio|Mercury Flanger",
        "Walrus Audio|Polychrome",
        "Jam Pedals|Ripple",
        "Mooer|E-Lady",
        "Ibanez|FL9",
        "PastFX|Elastic Mattress",
    ],

    "Footswitch": [
        "Boss|FS-5U",
        "Boss|FS-7",
        "Boss|FS-6",
        "Marshall|PEDL-91016",
        "Fender|MGT-4",
        "Orange|FS-1",
        "TC Electronic|Switch-3",
        "Digitech|FS3X",
    ],

    "Fuzz": [
        "Electro-Harmonix|Big Muff Pi",
        "Dunlop|JDF2 Fuzz Face",
        "ZVEX|Fuzz Factory",
        "EarthQuaker Devices|Hizumitas",
        "JHS Pedals|Muffuletta",
        "Death By Audio|Fuzz War",
        "Walrus Audio|Eons",
        "Keeley|Fuzz Bender",
        "Wampler|Velvet Fuzz",
        "Way Huge|Swollen Pickle",
        "Benson Amps|Germanium Fuzz",
        "Catalinbread|Karma Suture",
        "Analog Man|Sun Face",
        "Fulltone|69 MKII",
        "Fuzzrocious|Grey Stache",
        "DOD|Carcosa",
        "Fjord Fuzz|Berserk",
        "Collision Devices|Black Hole Symmetry",
        "Basic Audio|Scar Hair",
        "Kernom|Moho",
    ],

    "Limiter": [
        "Boss|LMB-3;LMB-3 Bass Limiter Enhancer",
        "MXR|Bass Compressor;M87",
        "Empress Effects|Bass Compressor",
        "Darkglass|Hyper Luminal",
        "Keeley|Bassist",
    ],

    "Line Selector": [
        "Boss|LS-2;LS-2 Line Selector",
        "Radial|BigShot EFX",
        "Lehle|D.Loop SGoS",
        "Electro-Harmonix|Tri Parallel Mixer",
        "JHS Pedals|Switchback",
        "Old Blood Noise Endeavors|Signal Blender",
        "One Control|Mosquito Blender",
    ],

    "Lo-Fi": [
        "Chase Bliss|Generation Loss MKII",
        "Fairfield Circuitry|Shallow Water",
        "Kinotone|Ribbons",
        "Strymon|Deco V2",
        "Walrus Audio|M1",
        "Red Panda|Tensor",
        "Old Blood Noise Endeavors|BL-44 Reverse",
        "Cooper FX|Generation Loss",
        "Hungry Robot|Wardenclyffe",
        "Zvex|Instant Lo-Fi Junky",
        "Tefi Vintage Lab|Golden Era",
    ],

    "Loop Switcher": [
        "Boss|ES-8",
        "MusicomLAB|EFX MK-VI",
        "GigRig|G3",
        "RJM Music|Mastermind PBC/6X",
        "Joyo|PXL Live",
        "One Control|Crocodile Tail Loop",
        "Carl Martin|Octa-Switch",
        "Disaster Area Designs|DPC-8EZ",
        "Voodoo Lab|PX-8 Plus",
    ],

    "Looper": [
        "Boss|RC-5 Loop Station",
        "Boss|RC-1 Loop Station",
        "TC Electronic|Ditto Looper",
        "Electro-Harmonix|720 Stereo Looper",
        "Pigtronix|Infinity 3",
        "Singular Sound|Aeros Loop Studio",
        "Line 6|DL4 MKII",
        "Chase Bliss|Blooper",
        "Nux|Loop Core Deluxe",
        "Donner|Circle Looper",
        "Digitech|JamMan Solo XT",
        "Mooer|Micro Looper",
    ],

    "MIDI Controller": [
        "Morningstar Engineering|MC6 Pro",
        "Morningstar Engineering|MC8",
        "Boss|ES-8",
        "Disaster Area Designs|DMC.micro Pro",
        "Behringer|FCB1010",
        "RJM Music|Mastermind GT",
        "Hotone|Ampero Control",
        "Source Audio|Neuro Hub",
        "Pirate MIDI|Bridge6",
        "Paint Audio|MIDI Captain",
    ],

    "MIDI Switcher": [
        "Morningstar Engineering|ML5",
        "Boss|ES-5",
        "Disaster Area Designs|DPC-8EZ",
        "RJM Music|Mastermind PBC/6X",
        "MusicomLAB|EFX MK-VI",
    ],

    "Multi-FX": [
        "Line 6|HX Stomp",
        "Boss|GT-1000CORE",
        "Boss|ME-90",
        "Neural DSP|Quad Cortex",
        "Eventide|H90 Harmonizer",
        "Fractal Audio|FM3",
        "Headrush|Prime",
        "Zoom|MS-50G+",
        "TC Electronic|Plethora X5",
        "Hotone|Ampero II Stomp",
        "Mooer|GE300",
        "Nux|MG-30",
        "Kemper|Profiler Player",
        "Valeton|GP-200",
        "Fender|Tone Master Pro",
        "IK Multimedia|TONEX Pedal",
        "Strymon|Mobius",
        "Source Audio|Collider",
    ],

    "Noise Gate": [
        "Boss|NS-2;NS-2 Noise Suppressor",
        "Boss|NS-1X;NS-1X Noise Suppressor",
        "ISP Technologies|Decimator II",
        "Fortin|Zuul",
        "TC Electronic|Sentry Noise Gate",
        "MXR|Smart Gate;M135",
        "Electro-Harmonix|Silencer;The Silencer",
        "Revv|G8",
        "Horizon Devices|Precision Drive",
        "Mooer|Noise Killer",
    ],

    "Octaver": [
        "Boss|OC-5 Octave",
        "Electro-Harmonix|POG2",
        "Electro-Harmonix|Nano POG",
        "TC Electronic|Sub 'N' Up Octaver",
        "MXR|Bass Octave Deluxe;M288",
        "Aguilar|Octamizer",
        "EarthQuaker Devices|Tentacle",
        "Digitech|Drop",
        "Mooer|Pure Octave",
        "Foxrox|Octron 3",
        "3Leaf Audio|Octabvre",
        "Emma Electronic|Okto-Nøjs",
    ],

    "Overdrive": [
        "Boss|SD-1 Super OverDrive",
        "Ibanez|TS9 Tube Screamer",
        "Fulltone|OCD",
        "JHS Pedals|Morning Glory V4",
        "Electro-Harmonix|Soul Food",
        "Nobels|ODR-1",
        "Wampler|Tumnus",
        "Analog Man|King of Tone",
        "Paul Cochrane|Timmy",
        "Maxon|OD808",
        "EarthQuaker Devices|Plumes",
        "Browne Amplification|Protein",
        "Greer Amps|Lightspeed",
        "Origin Effects|Halcyon Green Overdrive",
        "Way Huge|Green Rhino",
        "Xotic|BB Preamp",
        "Jam Pedals|TubeDreamer",
        "Keeley|Oxblood",
        "Warm Audio|Centavo Gold;Centavo",
        "Kernom|Ridge",
    ],

    "Phaser": [
        "MXR|Phase 90;M101 Phase 90",
        "Electro-Harmonix|Small Stone;Nano Small Stone",
        "Boss|PH-3;PH-3 Phase Shifter",
        "TC Electronic|Helix Phaser",
        "Walrus Audio|Lillian",
        "EarthQuaker Devices|Grand Orbiter",
        "Jam Pedals|Ripple",
        "Source Audio|Lunar Phaser",
        "Keeley|Bubble Tron",
        "Fender|Lost Highway Phaser",
        "Strymon|Zelzah",
        "Mooer|Ninety Orange",
    ],

    "Pitch": [
        "Digitech|Whammy 5",
        "Digitech|Drop",
        "Electro-Harmonix|Pitch Fork",
        "Boss|PS-6 Harmonist",
        "Eventide|PitchFactor",
        "Meris|Hedra",
        "EarthQuaker Devices|Rainbow Machine",
        "TC Electronic|Brainwaves Pitch Shifter",
        "Red Panda|Tensor",
        "Chase Bliss|Thermae",
        "Mooer|Pitch Box",
    ],

    "Power Amp": [
        "Electro-Harmonix|44 Magnum",
        "Seymour Duncan|PowerStage 200",
        "Orange|Pedal Baby 100",
        "Fryette|Power Station PS-2A",
        "Blackstar|Dept. 10 AMPED 1",
        "Harley Benton|Custom Line Thunder 99",
        "Mooer|Baby Bomb 30",
    ],

    "Preamp": [
        "Tech 21|SansAmp Bass Driver DI V2",
        "Benson Amps|Preamp",
        "Boss|BP-1W;BP-1W Booster/Preamp",
        "Darkglass|Microtubes B7K Ultra",
        "JHS Pedals|Colour Box V2",
        "Xotic|BB Preamp",
        "Aguilar|Tone Hammer",
        "Friedman|BE-OD",
        "Origin Effects|BassRig Super Vintage",
        "Ampeg|SCR-DI",
        "Two Notes|Le Clean",
        "Diezel|VH4 Pedal",
        "Universal Audio|Dream '65",
        "Hudson Electronics|Broadcast",
        "Kingsley|Page",
        "Victory|V4 The Duchess",
        "Strymon|Iridium",
        "Fender|Bassman Preamp",
    ],

    "Reverb": [
        "Strymon|BigSky",
        "Strymon|Cloudburst",
        "Boss|RV-6 Reverb",
        "Electro-Harmonix|Oceans 11 Reverb",
        "TC Electronic|Hall of Fame 2",
        "EarthQuaker Devices|Afterneath V3",
        "Walrus Audio|Slö",
        "Eventide|Space",
        "Source Audio|Ventris",
        "Universal Audio|Golden Reverberator",
        "Keeley|Caverns V2",
        "JHS Pedals|3 Series Reverb",
        "Neunaber|Immerse Reverberator MKII",
        "Electro-Harmonix|Holy Grail Nano",
        "Anasounds|Element",
        "Meris|Mercury 7",
        "Catalinbread|Topanga"
    ],

    "Ring Modulator": [
        "Electro-Harmonix|Ring Thing",
        "Fairfield Circuitry|Randy's Revenge",
        "Way Huge|Ringworm",
        "DOD|Gonkulator",
        "Red Panda|Radius",
        "Ring Modulator|Ring Modulator",
    ],

    "Rotary": [
        "Neo Instruments|Ventilator II",
        "Strymon|Lex V2",
        "Electro-Harmonix|Lester G",
        "Boss|RT-20",
        "Digitech|Ventura Vibe",
        "Keeley|Rotary",
        "Fender|Pinwheel Rotary Speaker Emulator",
    ],

    "Slicer": [
        "Boss|SL-2;SL-2 Slicer",
        "Boss|SL-20",
        "Red Panda|Particle 2",
        "Chase Bliss|Mood MKII",
    ],

    "Sustainer": [
        "Electro-Harmonix|Freeze",
        "Gamechanger Audio|Plus Pedal",
        "TC Electronic|Infinite Sample Sustainer",
        "Boss|CS-3;CS-3 Compression Sustainer",
        "Fernandes|Sustainer",
        "Keeley|Compressor Plus",
    ],

    "Swell": [
        "Boss|SG-1",
        "Electro-Harmonix|Attack Decay",
        "TC Electronic|Crescendo Auto Swell",
        "Mooer|Slow Engine",
        "Malekko|Sneak Attack",
    ],

    "Switcher": [
        "Boss|LS-2",
        "GigRig|G3",
        "Lehle|Little Dual II",
        "Radial|BigShot ABY",
        "One Control|Crocodile Tail Loop",
        "Carl Martin|Octa-Switch",
    ],

    "Synth": [
        "Boss|SY-1;SY-1 Synthesizer",
        "Electro-Harmonix|Synth9",
        "Meris|Enzo",
        "Source Audio|C4 Synth",
        "Future Impact|Future Impact V4",
        "EarthQuaker Devices|Data Corrupter",
        "Pigtronix|Mothership 2",
        "Dreadbox|Hades",
        "Eventide|H90 Harmonizer",
        "Keeley|Synth-1",
    ],

    "Tap Tempo": [
        "Boss|FS-5U",
        "JHS Pedals|Tap Tempo",
        "Disaster Area Designs|Micro Clock",
        "MXR|Tap Tempo",
        "One Control|Minimal Series Tap Tempo",
        "Saturnworks|Tap Tempo",
    ],

    "Tremolo": [
        "Boss|TR-2;TR-2 Tremolo",
        "Strymon|Flint V2",
        "Electro-Harmonix|Pulsar;Nano Pulsar",
        "Walrus Audio|Monument",
        "EarthQuaker Devices|Hummingbird",
        "JHS Pedals|Tidewater",
        "Fulltone|Supra-Trem",
        "Jam Pedals|Harmonious Monk",
        "Keeley|Hydra",
        "Source Audio|Vertigo Tremolo",
        "Origin Effects|RevivalTREM",
        "Fender|Tre-Verb",
        "Suhr|Jack Rabbit",
        "TC Electronic|Pipeline Tap Tremolo",
        "Diamond|Tremolo",
        "Chase Bliss|Gravitas",
    ],

    "Tuner": [
        "Boss|TU-3;TU-3 Chromatic Tuner",
        "TC Electronic|PolyTune 3;Polytune 3",
        "Peterson|StroboStomp HD",
        "Korg|Pitchblack X",
        "D'Addario|Chromatic Pedal Tuner",
        "Sonic Research|ST-300",
        "Walrus Audio|Canvas Tuner",
        "Fender|Professional Pedal Tuner",
        "Ernie Ball|VPJR Tuner",
    ],

    "Uni-Vibe": [
        "Dunlop|Uni-Vibe;MXR Uni-Vibe;M68",
        "Fulltone|Deja Vibe",
        "Jam Pedals|RetroVibe",
        "EarthQuaker Devices|The Depths",
        "JHS Pedals|Unicorn V2",
        "Strymon|UltraViolet",
        "DryBell|Vibe Machine V3",
        "Voodoo Lab|Micro Vibe",
        "Sabbadius|Funky-Vibe",
        "TC Electronic|Viscous Vibe",
    ],

    "Utility": [
        "Boss|LS-2",
        "JHS Pedals|Little Black Amp Box",
        "Old Blood Noise Endeavors|Signal Blender",
        "Electro-Harmonix|Tri Parallel Mixer",
        "Radial|BigShot ABY",
        "Lehle|Sunday Driver",
        "Empress Effects|Buffer+",
    ],

    "Vibrato": [
        "Boss|VB-2W;VB-2W Vibrato",
        "TC Electronic|Shaker Vibrato",
        "Walrus Audio|Julia",
        "Chase Bliss|Warped Vinyl HiFi",
        "EarthQuaker Devices|Aqueduct",
        "Fairfield Circuitry|Shallow Water",
        "Diamond|Vibrato",
        "Jam Pedals|WaterFall",
        "JHS Pedals|3 Series Chorus",
        "Magnatone|Vibrato",
    ],

    "Vocal": [
        "Boss|VE-500",
        "Boss|VE-22",
        "TC Helicon|VoiceLive Play",
        "Electro-Harmonix|Voice Box",
        "Zoom|V3",
        "HeadRush|VX5",
    ],

    "Volume": [
        "Ernie Ball|VP Jr",
        "Boss|FV-500H",
        "Dunlop|DVP4;DVP5",
        "Lehle|Mono Volume S",
        "Mission Engineering|VM-PRO",
        "Morley|Volume Plus",
        "Visual Sound|Visual Volume",
        "Hotone|Soul Press II",
    ],

    "Wah": [
        "Dunlop|GCB95 Cry Baby",
        "Vox|V847-A",
        "Morley|Bad Horsie",
        "Fulltone|Clyde Deluxe",
        "Xotic|XW-1",
        "Jam Pedals|Wahcko",
        "Real McCoy Custom|RMC10",
        "Boss|PW-3",
        "CAE|MC404",
        "Ibanez|WH10V3",
        "Wilson Effects|RippahQ",
        "Friedman|No More Tears Gold-72",
    ],

    "Wireless System": [
        "Boss|WL-50",
        "Line 6|Relay G10S",
        "Shure|GLXD16+",
        "Sennheiser|XSW-D Pedalboard Set",
        "Xvive|U2",
        "Nux|B-8",
    ],

    "Whammy": [
        "Digitech|Whammy 5",
        "Digitech|Whammy DT",
        "Digitech|Ricochet",
        "Electro-Harmonix|Pitch Fork",
        "Boss|PS-6",
        "Eventide|PitchFactor",
    ],
};

/* =========================================================
   BRAND ALIASES
   ========================================================= */

const BRAND_ALIASES: Record<string, string> = {
    ehx: "electroharmonix",
    procosound: "proco",
    jhs: "jhspedals",
    eqd: "earthquakerdevices",
    ua: "universalaudio",
    obne: "oldbloodnoiseendeavors",
    tce: "tcelectronic",
    mxrjimdunlop: "mxr",
    morningstar: "morningstarengineering",
};

function normalizeBrand(value: unknown): string {
    const brand = normalize(value);
    return BRAND_ALIASES[brand] ?? brand;
}

/* =========================================================
   TYPE ALIASES
   ========================================================= */

const TYPE_ALIASES: Record<string, string> = {
    abbox: "abbox",
    abybox: "abyswitcher",
    abyswitcher: "abyswitcher",
    pitchshifter: "pitch",
    multi: "multifx",
    multieffects: "multifx",
    univibe: "univibe",
};

function normalizeType(value: unknown): string {
    const type = normalize(value);
    return TYPE_ALIASES[type] ?? type;
}

/* =========================================================
   PRODUCTION STATUS

   Unknown or missing statuses are excluded.
   ========================================================= */

export function isActiveRecommendation(
    entry: GearEntry
): boolean {
    const status = normalize(entry.item.status);

    return [
        "active",
        "inproduction",
        "production",
    ].includes(status);
}

/* =========================================================
   FEATURED INDEX
   ========================================================= */

const featuredIndex = new Map<string, Set<string>>();

for (const [type, references] of Object.entries(
    FEATURED_PEDALS
)) {
    const keys = new Set<string>();

    for (const reference of references.slice(0, 20)) {
        const [brand, models] = reference.split("|");

        if (!brand || !models) continue;

        for (const model of models.split(";")) {
            keys.add(
                `${normalizeBrand(brand)}:${normalize(model)}`
            );
        }
    }

    featuredIndex.set(
        normalizeType(type),
        keys
    );
}

/* =========================================================
   FEATURED MATCHING
   ========================================================= */

export function isFeaturedPedal(
    entry: GearEntry,
    type: string
): boolean {
    const featured = featuredIndex.get(
        normalizeType(type)
    );

    if (!featured) return false;

    const key =
        `${normalizeBrand(entry.brand)}:` +
        normalize(entry.item.name);

    return featured.has(key);
}

/* =========================================================
   STABLE RANDOM ORDER
   ========================================================= */

function hash(value: string): number {
    let result = 2166136261;

    for (let i = 0; i < value.length; i++) {
        result ^= value.charCodeAt(i);
        result = Math.imul(result, 16777619);
    }

    return result >>> 0;
}

function randomOrder(
    entries: GearEntry[],
    seed: string
): GearEntry[] {
    return entries
        .map(entry => ({
            entry,
            score: hash(`${seed}:${gearKey(entry)}`),
        }))
        .sort((a, b) =>
            a.score - b.score ||
            gearKey(a.entry).localeCompare(gearKey(b.entry))
        )
        .map(({ entry }) => entry);
}

/* =========================================================
   RECOMMENDATION ENGINE
   ========================================================= */

export function getOtherBrandRecommendations(
    catalog: GearEntry[],
    selected: GearEntry,
    primaryType: string,
    sessionSeed: string
): GearEntry[] {
    if (!primaryType) return [];

    const selectedKey = gearKey(selected);
    const selectedBrand = normalizeBrand(selected.brand);
    const selectedType = normalizeType(primaryType);

    /* Only eligible pedals. */

    const candidates = catalog.filter(entry => {
        const brand = normalizeBrand(entry.brand);

        return (
            entry.kind === "pedals" &&
            gearKey(entry) !== selectedKey &&
            Boolean(brand) &&
            brand !== selectedBrand &&
            isActiveRecommendation(entry) &&
            entry.tags.some(
                tag => normalizeType(tag) === selectedType
            )
        );
    });

    /* Separate featured and discovery products. */

    const featured: GearEntry[] = [];
    const discovery: GearEntry[] = [];

    for (const entry of candidates) {
        if (isFeaturedPedal(entry, primaryType)) {
            featured.push(entry);
        } else {
            discovery.push(entry);
        }
    }

    /* Stable random order within each group. */

    const seed =
        `${sessionSeed}:${selectedKey}:${selectedType}`;

    const ordered = [
        ...randomOrder(
            featured,
            `${seed}:featured`
        ),
        ...randomOrder(
            discovery,
            `${seed}:discovery`
        ),
    ];

    /* Keep only one pedal per brand.
       Featured products always have priority. */

    const seenProducts = new Set<string>();

    const recommendations: GearEntry[] = [];

    for (const entry of ordered) {
        const key = gearKey(entry);

        if (seenProducts.has(key)) {
            continue;
        }

        seenProducts.add(key);
        recommendations.push(entry);
    }

    return recommendations;
}