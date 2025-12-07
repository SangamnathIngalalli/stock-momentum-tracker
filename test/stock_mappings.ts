/**
 * Stock Symbol Mappings
 * 
 * This file contains mappings between symbol names in My_Track.csv 
 * and their corresponding names in today_price.csv
 * 
 * Format: 
 *   'SYMBOL_IN_MY_TRACK': 'SYMBOL_IN_TODAY_PRICE'
 * 
 * Example:
 *   'ABCAPITAL': 'ADITYA BIRLA CAPITAL LTD.'
 */

/**
 * List of symbols to ignore during price updates
 * These symbols will be skipped and won't trigger "Not found" warnings
 */
export const IGNORED_SYMBOLS: string[] = [
    'ABSLBANETF',
    'AONETMMQ50',
    'INDO-RE2',
    'LOWVOL1',
    'LICNETFN50',
    'AUTOIETF',
    'BANKBEES',
    'BANKETF',
    'FINIETF',
    'NIFTYETF',
    'ARFIN',
    'GAYAPROJ',
    'PVTBANIETF',
    'QNIFTY',
    'QUALITY30',
    'SENSEXADD',
    'AXSENSEX',
    'BSLNIFTY',
    'ENIFTY',
    'GOLDETF',
    'MOM100',
    'MOM50',
    'PSUBNKBEES',
    'SETFNIFBK',
    'BANKETFADD',
    'SBIETFPB',
    'EBANKNIFTY',
    'HDFCSENSEX',
    'GROWWCAPM',
    'MASPTOP50',
    'MOMNC',
    'SILVER360',
    'ESG',
    'NIF10GETF',
    'NIFTYBEES',
    'SCML',
    'BSLSENETFG',
    'CHOICEGOLD',
    'EQUAL200',
    'HDFCMID150',
    'HDFCGROWTH',






    // stock penny
    'SWANDEF',
    'TAKE',
    'Univa',
    'VCL',
    'EASTSILK',
    'RELIABLE',
    'VENUSREM',
    'GFSTEELS',
    'UNIVAFOODS',
    'GREENLEAF',
    'JPOLYINVST',
    'PSRAJ',
    'TRANSTEEL',
    'UEL',
    'SALSTEEL',
    'MEGAFLEX',
    'EFACTOR',
    'INFLUX',




    //new stocks
    'KMEW',
    'LEMERITE',
    'SAWALIYA',





    // major stock still not able find BHAV COPY
    'M&MFIN',
    'MOTHERSON',
    'SOUTHWEST',
    'SKFINDUS',


    // low score stocks after 6 months check that is good score or not
    'JAYKAY', // new and low score = 44 ON 6/12/2025
    'DELPHIFX', //low score = 56 ON 7/12/2025






    // 🚨 SECTOR GATE STATUS: ❌ FAIL
    'JETFREIGHT',



];


export const STOCK_MAPPINGS: Record<string, string> = {
    // Add your symbol mappings here
    // 'MY_TRACK_SYMBOL': 'TODAY_PRICE_SYMBOL',

    "ABCAPITAL": "ADITYA BIRLA CAPITAL LTD.",
    "ACCENTMIC": "ACCENT MICROCELL LIMITED",
    "ASAHIINDIA": "ASAHI INDIA GLASS LIMITED",
    "AUBANK": "AU SMALL FINANCE BANK LTD",
    "AXISBNKETF": "AXISAMC - AXISBNKETF",
    "BANKBARODA": "BANK OF BARODA",
    "CANBK": "CANARA BANK",
    "CHOICEGOLD": "CHOICEAMC - CHOICEGOLD",
    "CONNPLEX": "CONNPLEX CINEMAS LIMITED",
    "CUB": "CITY UNION BANK LTD",
    "CUMMINSIND": "CUMMINS INDIA LTD",
    "CUPID": "CUPID LIMITED",
    "GOKULAGRO": "GOKUL AGRO RESOURCES LTD",
    "GROWWNXT50": "GROWWAMC - GROWWNXT50",
    "HDFCGROWTH": "HDFCAMC - HDFCGROWTH",
    "HDFCPSUBK": "HDFCAMC HDFCPSUBK",
    "HDFCNIFBAN": "HDFCAMC - HDFCNIFBAN",
    "HDFCNIFTY": "HDFCAMC - HDFCNIFTY",
    "HEROMOTOCO": "HERO MOTOCORP LIMITED",
    "IIFL": "IIFL FINANCE LIMITED",
    "JAYESH": "JAYESH LOGISTICS LIMITED",
    "LAURUSLABS": "LAURUS LABS LIMITED",
    "LENSKART": "LENSKART SOLUTIONS LTD",
    "LUMAXIND": "LUMAX INDUSTRIES LTD",
    "M&M": "MAHINDRA & MAHINDRA LTD",
    "MAANALU": "MAAN ALUMINIUM LIMITED",
    "MEGAFLEX": "MEGA FLEX PLASTICS LTD",
    "MOSERVICE": "MOTILALAMC - MOSERVICE",
    "MOVALUE": "MOTILALAMC - MOVALUE",
    "MSCIADD": "DSPAMC - MSCIADD",
    "MUTHOOTFIN": "MUTHOOT FINANCE LIMITED",
    "NETF": "TATAAML - NETF",
    "NPBET": "TATAAML - NPBET",
    "PAUSHAKLTD": "PAUSHAK LIMITED",
    "PNB": "PUNJAB NATIONAL BANK",
    "SALSTEEL": "STEEL AUTHORITY OF INDIA",
    "SBC": "SBC EXPORTS LIMITED",
    "SBIETFPB": "SBIAMC - SBIBPB",
    "SHREEJISPG": "SHREEJI SHIPPING GLOBAL L",
    "TMB": "TAMILNAD MERCA BANK LTD",
    "UJJIVANSFB": "UJJIVAN SMALL FINANC BANK",
    "VARROC": "VARROC ENGINEERING LTD.",
    "VEDL": "VEDANTA LIMITED",
    "ACCPL": "ACCRETION PHARMA LIMITED",
    "ADANIPORTS": "ADANI PORT & SEZ LTD",
    "AIAENG": "AIA ENGINEERING LIMITED",
    "BSLSENETFG": "BIRLASLAMC - BSLSENETFG",
    "DELPHIFX": "DELPHI WORLD MONEY LTD",
    "FEDERALBNK": "FEDERAL BANK LTD",
    "GLOBAL": "GLOBAL EDUCATION LIMITED",
    "GMRAIRPORT": "GMR AIRPORTS LIMITED",
    "LUMAXTECH": "LUMAX AUTO TECH LTD",
    "Mangalam Worldwide": "MANGALAM WORLDWIDE LTD",
    "PAYTM": "ONE 97 COMMUNICATIONS LTD",
    "MWL": "MANGALAM WORLDWIDE LTD",
    "POWERINDIA": "HITACHI ENERGY INDIA LTD",
    'RICOAUTO': "RICO AUTO INDUSTRIES LTD",
    "RNPL": "RENOL POLYCHEM LIMITED",
    "SUNLITE": "SUNLITE RECYCLING IND LTD",
    "TMCV": "TATA MOTORS LIMITED",
    "ZFCVINDIA": "ZF COM VE CTR SYS IND LTD",
    "ASHOKLEY": "ASHOK LEYLAND LTD",
    "ASIANPAINT": "ASIAN PAINTS LIMITED",
    "DCBBANK": "DCB BANK LIMITED",
    "JAMNAAUTO": "JAMNA AUTO IND LTD",
    "NEPTUNE": "NEPTUNE PETROCHEMICALS L",
    "PARIN": "PARIN ENTERPRISES LIMITED",
    "RPEL": "RAGHAV PRODUCTIVITY ENH L",
    "UNIONBANK": "UNION BANK OF INDIA",
    "WELINV": "WELSPUN INV & COMM LTD",
    "ANURAS": "ANUPAM RASAYAN INDIA LTD",
    "CANFINHOME": "CAN FIN HOMES LTD",
    "ECLERX": "ECLERX SERVICES LTD",
    "EMMVEE": "EMMVEE PHOTOVOLTAIC PWR L",
    "JAYKAY": "JAYKAY ENTERPRISES LTD",
    "GREENLEAF": "GREENLEAF ENVIROTECH LTD",
    "JETFREIGHT": "JET FREIGHT LOGISTICS LTD",
    "UNIVCABLES": "UNIVERSAL CABLES LTD",
    "HINDCOPPER": "HINDUSTAN COPPER LTD",
    "IMFA": "INDIAN METALS & FERRO",
    "JKTYRE": "JK TYRE & INDUSTRIES LTD",
    "MIDWESTLTD": "MIDWEST LIMITED",
    "PTCIL": "PTC INDUSTRIES LIMITED",
    "SAWALIYA": "SAWALIYA FOOD PRODUCTS L",
    "STEL": "STEL HOLDINGS LIMITED",
    "NATIONALUM": "NATIONAL ALUMINIUM CO LTD",
    "SHRIPISTON": "SHRIRAM PIST. & RING LTD",
    "SKFINDUS": "SKF INDIA LTD",
    "IEX": "INDIAN ENERGY EXC LTD",



















    // Uncomment and add more mappings as needed:
    // 'RIL': 'RELIANCE INDUSTRIES LTD.',
    // 'TCS': 'TATA CONSULTANCY SER',
    // 'INFY': 'INFOSYS LTD.',
};

/**
 * Get the mapped symbol name for a given symbol
 * @param symbol - Symbol from My_Track.csv
 * @returns Mapped symbol name or the original symbol if no mapping exists
 */
export function getMappedSymbol(symbol: string): string {
    return STOCK_MAPPINGS[symbol] || symbol;
}

/**
 * Check if a symbol has a mapping
 * @param symbol - Symbol to check
 * @returns true if mapping exists, false otherwise
 */
export function hasMapping(symbol: string): boolean {
    return symbol in STOCK_MAPPINGS;
}


/**
 * Check if a symbol should be ignored
 * @param symbol - Symbol to check
 * @returns true if symbol is in the ignore list
 */
export function isIgnored(symbol: string): boolean {
    return IGNORED_SYMBOLS.includes(symbol);
}
