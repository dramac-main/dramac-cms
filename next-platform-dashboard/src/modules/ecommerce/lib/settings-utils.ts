/**
 * Utility functions for e-commerce settings
 * These are pure functions that don't require server-side execution
 */

/**
 * Validate tax rate
 */
export function validateTaxRate(rate: number): boolean {
  return rate >= 0 && rate <= 100
}

/**
 * Get list of countries for shipping/tax zones
 */
export function getCountryList(): Array<{ code: string; name: string }> {
  return [
    // ZAMBIA IS DEFAULT - Always at top
    { code: 'ZM', name: 'Zambia' },
    
    // Southern & East African Region (common trading partners)
    { code: 'ZW', name: 'Zimbabwe' },
    { code: 'BW', name: 'Botswana' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'KE', name: 'Kenya' },
    { code: 'UG', name: 'Uganda' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'CD', name: 'Democratic Republic of Congo' },
    { code: 'AO', name: 'Angola' },
    { code: 'NA', name: 'Namibia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'SZ', name: 'Eswatini (Swaziland)' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'GH', name: 'Ghana' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'EG', name: 'Egypt' },
    { code: 'MA', name: 'Morocco' },
    
    // International
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IN', name: 'India' },
    { code: 'CN', name: 'China' },
    { code: 'JP', name: 'Japan' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SG', name: 'Singapore' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'PT', name: 'Portugal' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'AT', name: 'Austria' },
    { code: 'IE', name: 'Ireland' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'PL', name: 'Poland' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'KR', name: 'South Korea' },
    { code: 'SA', name: 'Saudi Arabia' },
  ]
}

/**
 * Get list of currencies
 */
export function getCurrencyList(): Array<{ code: string; name: string; symbol: string }> {
  return [
    // US Dollar at top
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    
    // African Currencies (Regional)
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
    { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
    { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
    { code: 'CDF', name: 'Congolese Franc', symbol: 'FC' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
    
    // International Currencies
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  ]
}

/**
 * Get list of timezones
 */
export function getTimezoneList(): string[] {
  return [
    // ZAMBIA IS DEFAULT - Africa/Lusaka (CAT - Central Africa Time, UTC+2)
    'Africa/Lusaka',
    
    // African Timezones (Regional)
    'Africa/Harare',       // Zimbabwe (CAT)
    'Africa/Gaborone',     // Botswana (CAT)
    'Africa/Blantyre',     // Malawi (CAT)
    'Africa/Maputo',       // Mozambique (CAT)
    'Africa/Dar_es_Salaam', // Tanzania (EAT)
    'Africa/Nairobi',      // Kenya (EAT)
    'Africa/Kampala',      // Uganda (EAT)
    'Africa/Kigali',       // Rwanda (CAT)
    'Africa/Kinshasa',     // DRC West (WAT)
    'Africa/Lubumbashi',   // DRC East (CAT)
    'Africa/Luanda',       // Angola (WAT)
    'Africa/Windhoek',     // Namibia (CAT)
    'Africa/Johannesburg', // South Africa (SAST)
    'Africa/Lagos',        // Nigeria (WAT)
    'Africa/Accra',        // Ghana (GMT)
    'Africa/Addis_Ababa',  // Ethiopia (EAT)
    'Africa/Cairo',        // Egypt (EET)
    'Africa/Casablanca',   // Morocco (WET)
    
    // International
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Amsterdam',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Stockholm',
    'Europe/Oslo',
    'Europe/Copenhagen',
    'Europe/Helsinki',
    'Europe/Zurich',
    'Europe/Vienna',
    'Europe/Brussels',
    'Europe/Dublin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Seoul',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Riyadh',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
    'Africa/Johannesburg',
    'UTC'
  ]
}
