// CONSTANTS
export const τ = 6.2831853071795864769252867665590057683943387987502116419498891846156328125724179972560696506842341359642961; //circle constant
export const sqrt2 = Math.sqrt(2.0)

export const c = 299792458.0; // s⁻¹ m
export const e = 1.602176634e-19; // C
export const εf = 1.129409067373019119565699212926e11; // s⁻² m³ kg C⁻²
export const μc = 1.25663706212005463974958835407640314e-6; // m kg C⁻²

export const ooc = 3.3356409519815204957557671447491851179258151984597290969874e-9; // s m⁻¹
export const coεf = 0.0026544187279929558624; // s m⁻² kg⁻¹ C²
export const ooμc = 795774.7150262416446744057792; // m⁻¹ kg⁻¹ C²

//export const natEF = 3.767303136680038e02; // s⁻¹ m⁻¹ C
//export const natMF = 1.256637062123837e-6; // s⁻¹ m⁻¹ C

// PARAMETERS
export const TOL = 2.0 * Number.EPSILON; //tolerance for numeric computations

export const signiFigM1 = 3 - 1; //significant figures (minus one)

export const revFracStep = 1.0 / (2.0**16); //stepsize, fractions of revolution for sketch sliders

export const ptsPerCharTime = 64; //time discretization per pseudocycle, for three.js animations

export const prefixes =
{
  "+24": "yotta (Y, 10²⁴)",
  "+21": "zetta (Z, 10²¹)",
  "+18": "exa (E, 10¹⁸)",
  "+15": "peta (P, 10¹⁵)",
  "+12": "tera (T, 10¹²)",
  "+09": "giga (G, 10⁹)",
  "+06": "mega (M, 10⁶)",
  "+03": "kilo (k, 10³)",
  "+02": "hecto (h, 10²)",
  "+01": "deka (da, 10¹)",
  "000": "1 (10⁰)",
  "-01": "deci (d, 10⁻¹)",
  "-02": "centi (c, 10⁻²)",
  "-03": "mili (m, 10⁻³)",
  "-06": "micro (μ, 10⁻⁶)",
  "-09": "nano (n, 10⁻⁹)",
  "-12": "pico (p, 10⁻¹²)",
  "-15": "femto (f, 10⁻¹⁵)",
  "-18": "atto (a, 10⁻¹⁸)",
  "-21": "zepto (z, 10⁻²¹)",
  "-24": "yocto (y, 10⁻²⁴)"
};

export const particles =
{
  "electron": ["electron (e⁻)", [0.00091093837015, "-24"], [-1.0, "000", "e"]],
  "positron": ["positron (e⁺)", [0.00091093837015, "-24"], [+1.0, "000", "e"]],
  "proton": ["proton (p⁺)", [1.67262192369, "-24"], [+1.0, "000", "e"]],
  "antiproton": ["antiproton (p⁻)", [1.67262192369, "-24"], [-1.0, "000", "e"]],
  "Helium4Nucleus": ["Helium-4 nucleus (⁴He²⁺)", [6.6446573357, "-24"], [+2.0, "000", "e"]],
  "muon": ["muon (μ⁻)", [0.188353163, "-24"], [-1.0, "000", "e"]],
  "antimuon": ["antimuon (μ⁺)", [0.188353163, "-24"], [+1.0, "000", "e"]],
  "pionm": ["negative pion (π⁻)", [0.2488068, "-24"], [-1.0, "000", "e"]],
  "pionp": ["positive pion (π⁺)", [0.2488068, "-24"], [+1.0, "000", "e"]]
};
