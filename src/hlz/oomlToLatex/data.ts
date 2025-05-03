/** OMML 네임스페이스 */
export const OMML_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';

/** LaTeX에서 이스케이프가 필요한 문자들 */
export const CHARS = ['{', '}', '_', '^', '#', '&', '$', '%', '~'];

/** 정렬 문자 */
export const ALN = '&';

/** 줄바꿈 문자 */
export const BRK = '\\\\';

/** 백슬래시 문자 */
export const BACKSLASH = '\\';

/** Mapping of accents and symbols to LaTeX representations */
export const CHR: Record<string, string> = {
    // Unicode : Latex Math Symbols
    // Top accents
    '0300': '\\grave{{0}}',
    '0301': '\\acute{{0}}',
    '0302': '\\hat{{0}}',
    '0303': '\\tilde{{0}}',
    '0304': '\\bar{{0}}',
    '0305': '\\overbar{{0}}',
    '0306': '\\breve{{0}}',
    '0307': '\\dot{{0}}',
    '0308': '\\ddot{{0}}',
    '0309': '\\ovhook{{0}}',
    '030a': '\\ocirc{{0}}',
    '030c': '\\check{{0}}',
    '0310': '\\candra{{0}}',
    '0312': '\\oturnedcomma{{0}}',
    '0315': '\\ocommatopright{{0}}',
    '031a': '\\droang{{0}}',
    '0338': '\\not{{0}}',
    '20d0': '\\leftharpoonaccent{{0}}',
    '20d1': '\\rightharpoonaccent{{0}}',
    '20d2': '\\vertoverlay{{0}}',
    '20d6': '\\overleftarrow{{0}}',
    '20d7': '\\vec{{0}}',
    '20db': '\\dddot{{0}}',
    '20dc': '\\ddddot{{0}}',
    '20e1': '\\overleftrightarrow{{0}}',
    '20e7': '\\annuity{{0}}',
    '20e9': '\\widebridgeabove{{0}}',
    '20f0': '\\asteraccent{{0}}',

    // Bottom accents
    '0330': '\\wideutilde{{0}}',
    '0331': '\\underbar{{0}}',
    '20e8': '\\threeunderdot{{0}}',
    '20ec': '\\underrightharpoondown{{0}}',
    '20ed': '\\underleftharpoondown{{0}}',
    '20ee': '\\underledtarrow{{0}}',
    '20ef': '\\underrightarrow{{0}}',

    // Over | group
    '23b4': '\\overbracket{{0}}',
    '23dc': '\\overparen{{0}}',
    '23de': '\\overbrace{{0}}',

    // Under| group
    '23b5': '\\underbracket{{0}}',
    '23dd': '\\underparen{{0}}',
    '23df': '\\underbrace{{0}}',
};

/** Mapping of Big Operators to LaTeX representations */
export const CHR_BO: Record<string, string> = {
    '2140': '\\Bbbsum',
    '220f': '\\prod',
    '2210': '\\coprod',
    '2211': '\\sum',
    '222b': '\\int',
    '222c': '\\iint',		//mxd. Double integral
    '222d': '\\iiint',	    //mxd. Triple integral
    '222e': '\\oint',		//mxd. Contour integral
    '222f': '\\oiint',		//mxd. Double Contour integral
    '2230': '\\oiiint',		//mxd. Triple Contour integral
    '22c0': '\\bigwedge',
    '22c1': '\\bigvee',
    '22c2': '\\bigcap',
    '22c3': '\\bigcup',
    '2a00': '\\bigodot',
    '2a01': '\\bigoplus',
    '2a02': '\\bigotimes'
};

/** Mapping of Greek letters and various symbols to LaTeX representations */
export const T: Record<string, string> = {
    // Mathematical Italic Greek lowercase letters
    "0001d6fc": "\\alpha ",
    "0001d6fd": "\\beta ",
    "0001d6fe": "\\gamma ",
    "0001d6ff": "\\theta ",
    "0001d700": "\\epsilon ",
    "0001d701": "\\zeta ",
    "0001d702": "\\eta ",
    "0001d703": "\\theta ",
    "0001d704": "\\iota ",
    "0001d705": "\\kappa ",
    "0001d706": "\\lambda ",
    "0001d707": "\\m ",
    "0001d708": "\\n ",
    "0001d709": "\\xi ",
    "0001d70a": "\\omicron ",
    "0001d70b": "\\pi ",
    "0001d70c": "\\rho ",
    "0001d70d": "\\varsigma ",
    "0001d70e": "\\sigma ",
    "0001d70f": "\\ta ",
    "0001d710": "\\upsilon ",
    "0001d711": "\\phi ",
    "0001d712": "\\chi ",
    "0001d713": "\\psi ",
    "0001d714": "\\omega ",
    "0001d715": "\\partial ",
    "0001d716": "\\varepsilon ",
    "0001d717": "\\vartheta ",
    "0001d718": "\\varkappa ",
    "0001d719": "\\varphi ",
    "0001d71a": "\\varrho ",
    "0001d71b": "\\varpi ",

    // greek uppercase letters
    "0391": "\\Alpha ",   // Α
    "0392": "\\Beta ",    // Β
    "0393": "\\Gamma ",   // Γ
    "0394": "\\Delta ",   // Δ
    "0395": "\\Epsilon ", // Ε
    "0396": "\\Zeta ",    // Ζ
    "0397": "\\Eta ",     // Η
    "0398": "\\Theta ",   // Θ
    "0399": "\\Iota ",    // Ι
    "039a": "\\Kappa ",   // Κ
    "039b": "\\Lambda ",  // Λ
    "039c": "\\Mu ",      // Μ
    "039d": "\\Nu ",      // Ν
    "039e": "\\Xi ",      // Ξ
    "039f": "\\Omicron ", // Ο
    "03a0": "\\Pi ",      // Π
    "03a1": "\\Rho ",     // Ρ
    "03a3": "\\Sigma ",   // Σ
    "03a4": "\\Tau ",     // Τ
    "03a5": "\\Upsilon ", // Υ
    "03a6": "\\Phi ",     // Φ
    "03a7": "\\Chi ",     // Χ
    "03a8": "\\Psi ",     // Ψ
    "03a9": "\\Omega ",   // Ω
    
    // greek lowercase letters (https://unicodeplus.com/script/Grek)
    "03b1": "\\alpha ",
    "03b2": "\\beta ",
    "03b3": "\\gamma ",
    "03b4": "\\theta ",
    "03b5": "\\epsilon ",
    "03b6": "\\zeta ",
    "03b7": "\\eta ",
    "03b8": "\\theta ",
    "03b9": "\\iota ",
    "03ba": "\\kappa ",
    "03bb": "\\lambda ",
    "03bc": "\\m ",
    "03bd": "\\n ",
    "03be": "\\xi ",
    "03bf": "\\omicron ",
    "03c0": "\\pi ",
    "03c1": "\\rho ",
    "03c2": "\\varsigma ",
    "03c3": "\\sigma ",
    "03c4": "\\ta ",
    "03c5": "\\upsilon ",
    "03c6": "\\phi ",
    "03c7": "\\chi ",
    "03c8": "\\psi ",
    "03c9": "\\omega ",

    // Mathematical Italic Latin uppercase letters
    "0001d434": "A",
    "0001d435": "B",
    "0001d436": "C",
    "0001d437": "D",
    "0001d438": "E",
    "0001d439": "F",
    "0001d43a": "G",
    "0001d43b": "H",
    "0001d43c": "I",
    "0001d43d": "J",
    "0001d43e": "K",
    "0001d43f": "L",
    "0001d440": "M",
    "0001d441": "N",
    "0001d442": "O",
    "0001d443": "P",
    "0001d444": "Q",
    "0001d445": "R",
    "0001d446": "S",
    "0001d447": "T",
    "0001d448": "U",
    "0001d449": "V",
    "0001d44a": "W",
    "0001d44b": "X",
    "0001d44c": "Y",
    "0001d44d": "Z",

    // Mathematical Italic Latin lowercase letters
    "0001d44e": "a",
    "0001d44f": "b",
    "0001d450": "c",
    "0001d451": "d",
    "0001d452": "e",
    "0001d453": "f",
    "0001d454": "g",
    "0001d456": "i",
    "0001d457": "j",
    "0001d458": "k",
    "0001d459": "l",
    "0001d45a": "m",
    "0001d45b": "n",
    "0001d45c": "o",
    "0001d45d": "p",
    "0001d45e": "q",
    "0001d45f": "r",
    "0001d460": "s",
    "0001d461": "t",
    "0001d462": "u",
    "0001d463": "v",
    "0001d464": "w",
    "0001d465": "x",
    "0001d466": "y",
    "0001d467": "z",

    "2102": "\\mathbb{C} ", // ℂ
    "210d": "\\mathbb{H} ", // ℍ
    "2115": "\\mathbb{N} ", // ℕ
    "2119": "\\mathbb{P} ", // ℙ
    "211a": "\\mathbb{Q} ", // ℚ
    "211d": "\\mathbb{R} ", // ℝ
    "2124": "\\mathbb{Z} ", // ℤ
    // "213c": "\\mathbb{p} ", // ℼ
    // "213d": "\\mathbb{g} ", // ℽ
    // "213e": "\\mathbb{e} ", // ℾ
    // "213f": "\\mathbb{p} ", // ℿ
    // "2140": "\\mathbb{i} ", // ⅀
    "2145": "D", // ⅅ
    "2146": "d", // ⅆ
    "2147": "e", // ⅇ
    "2148": "i", // ⅈ
    "2149": "j", // ⅉ

    //mxd. Prime
    "0027": "\\prime ",

    //mxd. Moodle math operators
    "22c5": "\\cdot ",
    "00d7": "\\times ",
    "002a": "\\ast ",
    "00f7": "\\div ",
    "22c4": "\\diamond ",
    "2295": "\\oplus ",
    "2296": "\\ominus ",
    "2297": "\\otimes ",
    "2298": "\\oslash ",
    "2299": "\\odot ",
    "2218": "\\circ ",
    "2219": "\\bullet ",
    "224d": "\\asymp ",
    "2261": "\\equiv ",
    "2286": "\\subseteq ",
    "2287": "\\supseteq ",
    "2aaf": "\\preceq ",
    "2ab0": "\\succeq ",
    "227c": "\\preccurlyeq ",
    "227d": "\\succcurlyeq ",
    "223c": "\\sim ",
    "2243": "\\simeq ",
    "2248": "\\approx ",
    "2282": "\\subset ",
    "2283": "\\supset ",
    "227a": "\\prec ",      //mxd. Exported as '\prcue' from MSWord...
    "227b": "\\succ ",
    "2200": "\\forall ",
    "2202": "\\partial ", // ∂
    "2203": "\\exists ",
    "2207": "\\nabla ", // ∇
    
    // 논리기호 
    // TODO: 추가해야 함
    "2227": "\\wedge ", // ∧
    "2228": "\\vee ",   // ∨
    "2229": "\\cap ",   // ∩
    "222a": "\\cup ",   // ∪

    // Relation symbols
    "2190": "\\leftarrow ",
    "2191": "\\uparrow ",
    "2192": "\\rightarrow ",
    "2193": "\\downright ",
    "2194": "\\leftrightarrow ",
    "2195": "\\updownarrow ",
    "2196": "\\nwarrow ",
    "2197": "\\nearrow ",
    "2198": "\\searrow ",
    "2199": "\\swarrow ",
    "22ee": "\\vdots ",
    "22ef": "\\cdots ",
    "22f0": "\\adots ",
    "22f1": "\\ddots ",
    "2260": "\\ne ",        //mxd. Called '\neq' in Moodle
    "2264": "\\leq ",
    "2265": "\\geq ",
    "2266": "\\leqq ",
    "2267": "\\geqq ",
    "2268": "\\lneqq ",
    "2269": "\\gneqq ",
    "226a": "\\ll ",
    "226b": "\\gg ",
    "2208": "\\in ",
    "2209": "\\notin ",
    "220b": "\\ni ",
    "220c": "\\nni ",

    //mxd. Double arrows
    "21d0": "\\Leftarrow ",
    "21d1": "\\Uparrow ",
    "21d2": "\\Rightarrow ",
    "21d3": "\\Downarrow ",
    "21d4": "\\Leftrightarrow ",

    //mxd. Long double arrows
    "27f8": "\\Longleftarrow ",
    "27f9": "\\Longrightarrow ",
    "27fa": "\\Longleftrightarrow ",

    //mxd. Ordinary symbols
    "221e": "\\infty ",

    // Binary relations
    "00b1": "\\pm ",
    "2213": "\\mp ",

};

/** Mapping of functions to their LaTeX representations */
export const FUNC: Record<string, string> = {
    'sin': '\\sin({fe})',
    'cos': '\\cos({fe})',
    'tan': '\\tan({fe})',
    'arcsin': '\\arcsin({fe})',
    'arccos': '\\arccos({fe})',
    'arctan': '\\arctan({fe})',
    'arccot': '\\arccot({fe})',
    'sinh': '\\sinh({fe})',
    'cosh': '\\cosh({fe})',
    'tanh': '\\tanh({fe})',
    'coth': '\\coth({fe})',
    'sec': '\\sec({fe})',
    'csc': '\\csc({fe})',

    // TODO: 이 함수들은 구현이 안되어 있는 것 같음.
    'log': '\\log({fe})',
    // 'ln': '\\ln({fe})',
    // 'exp': '\\exp({fe})',
    // 'abs': '\\abs({fe})',
    // 'floor': '\\floor({fe})',
    // 'ceil': '\\ceil({fe})',
    // 'cot': '\\cot({fe})',
};

export const FUNC_PLACE = '{fe}';

export const CHR_DEFAULT: Record<string, string> = {
    'ACC_VAL': '\\hat{{0}}'
};

export const ch2Latex: Record<string, string> = {
    'top': '\\overline{{0}}', // Not sure about this
    'bot': '\\underline{{0}}'
};

export const POS_DEFAULT: Record<string, string> = {
    'BAR_VAL': '\\overline{{0}}'
};

export const SUB = '_{{0}}';
export const SUP = '^{{0}}';

/** Mapping of fraction types to LaTeX representations */
export const F: Record<string, string> = {
    'bar': '\\frac{{0}}{{1}}',
    'skw': '^{{0}}/_{{1}}',
    'noBar': '\\genfrac{}{}{0pt}{}{{0}}{{1}}',
    'lin': '{{0}}/{{1}}'
};
export const F_DEFAULT = '\\frac{{0}}{{1}}';

/** Mapping of delimiter to LaTeX representations */
export const D = '\\left{0}{1}\\right{2}';
export const D_DEFAULT: Record<string, string> = {
    'left': '(',
    'right': ')',
    'null': '.'
};

/** Mapping of radical to LaTeX representations */
export const RAD = '\\sqrt[{0}]{{1}}';
export const RAD_DEFAULT = '\\sqrt{{0}}';

/** Mapping of array to LaTeX representations */
export const ARR = '\\begin{array}{c}{0}\\end{array}';

/** Mapping of limit functions to LaTeX representations */
export const LIM_FUNC: Record<string, string> = {
    'lim': '\\lim_{{0}}',
    'max': '\\max_{{0}}',
    'min': '\\min_{{0}}'
};
export const LIM_TO = ['\\rightarrow', '\\to'];
export const LIM_UPP = '\\overset{{0}}{{1}}';

/** Mapping of matrix to LaTeX representations */
export const M = '\\begin{matrix}{0}\\end{matrix}';
