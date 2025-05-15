/** OMML 네임스페이스 */
export const OMML_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';

/** LaTeX에서 이스케이프가 필요한 문자들 */
export const ESCAPING_CHARS = ['{', '}', '_', '^', '#', '&', '$', '%', '~'];

/** 정렬 문자 */
export const ALIGN = '&';

/** 줄바꿈 문자 */
export const BREAK = '\\\\';

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
export const BIG_OPERATORS: Record<string, string> = {
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
export const LATEX_SYMBOLS: Record<string, string> = {
    // (참고) 유니코드 블록/검색: https://www.fileformat.info/info/unicode/block/index.htm
    // (참고) unicode_math.md 파일에 모든 수학식 관련 유니코드 정리해 놓음
    // HACK: 볼드 이텔릭 문자를 글자스타일 대신 사용해볼까?

    // 수학식 이탤릭 그리스 대문자
    "0001D6E2": "\\Alpha ",     // 𝛢
    "0001D6E3": "\\Beta ",      // 𝛣
    "0001D6E4": "\\Gamma ",     // 𝛤
    "0001D6E5": "\\Delta ",     // 𝛥
    "0001D6E6": "\\Epsilon ",   // 𝛦
    "0001D6E7": "\\Zeta ",      // 𝛧
    "0001D6E8": "\\Eta ",       // 𝛨
    "0001D6E9": "\\Theta ",     // 𝛩
    "0001D6EA": "\\Iota ",      // 𝛪
    "0001D6EB": "\\Kappa ",     // 𝛫
    "0001D6EC": "\\Lambda ",    // 𝛬
    "0001D6ED": "\\Mu ",        // 𝛭
    "0001D6EE": "\\Nu ",        // 𝛮
    "0001D6EF": "\\Xi ",        // 𝛯
    "0001D6F0": "O ",           // 𝛰 : latex에서 오미크론은 심볼 없이 그냥 라틴 알파벳 씀
    "0001D6F1": "\\Pi ",        // 𝛱
    "0001D6F2": "\\Rho ",       // 𝛲
    "0001D6F3": "\\Theta ",     // 𝛳
    "0001D6F4": "\\Sigma ",     // 𝛴
    "0001D6F5": "\\Tau ",       // 𝛵
    "0001D6F6": "\\Upsilon ",   // 𝛶
    "0001D6F7": "\\Phi ",       // 𝛷
    "0001D6F8": "\\Chi ",       // 𝛸
    "0001D6F9": "\\Psi ",       // 𝛹
    "0001D6FA": "\\Omega ",     // 𝛺

    // 수학식 이탤릭 그리스 소문자 (U+1D6FC - U+1D71B)
    "0001d6fc": "\\alpha ",     // 𝛼
    "0001d6fd": "\\beta ",      // 𝛽
    "0001d6fe": "\\gamma ",     // 𝛾
    "0001d6ff": "\\delta ",     // 𝛿
    "0001d700": "\\epsilon ",   // 𝜀
    "0001d701": "\\zeta ",      // 𝜁
    "0001d702": "\\eta ",       // 𝜂
    "0001d703": "\\theta ",     // 𝜃
    "0001d704": "\\iota ",      // 𝜄
    "0001d705": "\\kappa ",     // 𝜅
    "0001d706": "\\lambda ",    // 𝜆
    "0001d707": "\\mu ",        // 𝜇
    "0001d708": "\\nu ",        // 𝜈
    "0001d709": "\\xi ",        // 𝜉
    "0001d70a": "o ",           // 𝜊 : latex에서 오미크론은 심볼 없이 그냥 라틴 알파벳 씀
    "0001d70b": "\\pi ",        // 𝜋
    "0001d70c": "\\rho ",       // 𝜌
    "0001d70d": "\\varsigma ",  // 𝜍
    "0001d70e": "\\sigma ",     // 𝜎
    "0001d70f": "\\tau ",       // 𝜏
    "0001d710": "\\upsilon ",   // 𝜐
    "0001d711": "\\phi ",       // 𝜑
    "0001d712": "\\chi ",       // 𝜒
    "0001d713": "\\psi ",       // 𝜓
    "0001d714": "\\omega ",     // 𝜔
    "0001d715": "\\partial ",   // 𝜕
    "0001d716": "\\varepsilon ",// 𝜖
    "0001d717": "\\vartheta ",  // 𝜗
    "0001d718": "\\varkappa ",  // 𝜘
    "0001d719": "\\varphi ",    // 𝜙
    "0001d71a": "\\varrho ",    // 𝜚
    "0001d71b": "\\varpi ",     // 𝜛

    // 그리스 대문자
    "0391": "\\Alpha ",    // Α
    "0392": "\\Beta ",     // Β
    "0393": "\\Gamma ",    // Γ
    "0394": "\\Delta ",    // Δ
    "0395": "\\Epsilon ",  // Ε
    "0396": "\\Zeta ",     // Ζ
    "0397": "\\Eta ",      // Η
    "0398": "\\Theta ",    // Θ
    "0399": "\\Iota ",     // Ι
    "039a": "\\Kappa ",    // Κ
    "039b": "\\Lambda ",   // Λ
    "039c": "\\Mu ",       // Μ
    "039d": "\\Nu ",       // Ν
    "039e": "\\Xi ",       // Ξ
    "039f": "O ",          // Ο : latex에서 오미크론은 심볼 없이 그냥 라틴 알파벳 씀
    "03a0": "\\Pi ",       // Π
    "03a1": "\\Rho ",      // Ρ
    "03a3": "\\Sigma ",    // Σ
    "03a4": "\\Tau ",      // Τ
    "03a5": "\\Upsilon ",  // Υ
    "03a6": "\\Phi ",      // Φ
    "03a7": "\\Chi ",      // Χ
    "03a8": "\\Psi ",      // Ψ
    "03a9": "\\Omega ",    // Ω
    
    // 그리스 소문자 (https://unicodeplus.com/script/Grek)
    "03b1": "\\alpha ",    // α
    "03b2": "\\beta ",     // β
    "03b3": "\\gamma ",    // γ
    "03b4": "\\delta ",    // δ
    "03b5": "\\epsilon ",  // ε
    "03b6": "\\zeta ",     // ζ
    "03b7": "\\eta ",      // η
    "03b8": "\\theta ",    // θ
    "03b9": "\\iota ",     // ι
    "03ba": "\\kappa ",    // κ
    "03bb": "\\lambda ",   // λ
    "03bc": "\\mu ",       // μ
    "03bd": "\\nu ",       // ν
    "03be": "\\xi ",       // ξ
    "03bf": "o ",          // ο : latex에서 오미크론은 심볼 없이 그냥 라틴 알파벳 씀
    "03c0": "\\pi ",       // π
    "03c1": "\\rho ",      // ρ
    "03c2": "\\varsigma ", // ς
    "03c3": "\\sigma ",    // σ
    "03c4": "\\tau ",      // τ
    "03c5": "\\upsilon ",  // υ
    "03c6": "\\phi ",      // φ
    "03c7": "\\chi ",      // χ
    "03c8": "\\psi ",      // ψ
    "03c9": "\\omega ",    // ω

    // 수학식 이탤릭 라틴 대문자
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

    // 수학식 이탤릭 라틴 소문자
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
    "2206": "\\Delta ", // ∆
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

    // 괄호 좌/우
    "230a": "\\lceil ",
    "230b": "\\rceil ",
    "2308": "\\lfloor ",
    "2309": "\\rfloor ",

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
    'cot': '\\cot({fe})',

    'log': '\\log({fe})',
    'ln': '\\ln({fe})',
    'min': '\\min{fe}',
    'max': '\\max{fe}',
    // 이 함수들은 필요 없는 듯...
    // 'exp': '\\exp({fe})',
    // 'abs': '\\abs({fe})',
};

export const BAR_DEFAULT = '\\overline{{0}}';
export const BAR: Record<string, string> = {
    'top': '\\overline{{0}}', // Not sure about this
    'bot': '\\underline{{0}}'
};

/** Mapping of fraction types to LaTeX representations */
export const FRACTION_DEFAULT = '\\frac{{0}}{{1}}';
export const FRACTION_TYPES: Record<string, string> = {
    'bar': '\\frac{{0}}{{1}}',
    'skw': '^{{0}}/_{{1}}',
    'noBar': '\\genfrac{}{}{0pt}{}{{0}}{{1}}',
    'lin': '{{0}}/{{1}}'
};

/** Mapping of limit functions to LaTeX representations */
export const LIM_FUNC: Record<string, string> = {
    'lim': '\\lim_{{0}}',
    'max': '\\max_{{0}}',
    'min': '\\min_{{0}}'
};
export const LIM_UPP = '\\overset{{0}}{{1}}';