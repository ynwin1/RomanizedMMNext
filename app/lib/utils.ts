export const generatePagination = (currentPage: number, totalPages: number) => {
    // For 5 or fewer pages, show all pages without ellipses
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // For pages 1-3, show the first 3 pages, an ellipsis, and the last page
    if (currentPage <= 3) {
        if (currentPage === 3) {
            return [1, 2, 3, 4, '...', totalPages];
        } else {
            return [1, 2, 3, '...', totalPages];
        }
    }

    // for pages totalPages-2 to totalPages, show the first page, an ellipsis, and the last 3 pages
    if (currentPage >= totalPages - 2) {
        if (currentPage === totalPages - 2) {
            return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            return [1, '...', totalPages - 2, totalPages - 1, totalPages];
        }
    }

    // else show middle pages with neighbors surrounded by ellipses and the first and last pages
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};

export const countryFlags = [
    "🇲🇲", // Myanmar
    "🇦🇫", // Afghanistan
    "🇦🇱", // Albania
    "🇩🇿", // Algeria
    "🇦🇸", // American Samoa
    "🇦🇩", // Andorra
    "🇦🇴", // Angola
    "🇦🇮", // Anguilla
    "🇦🇶", // Antarctica
    "🇦🇬", // Antigua and Barbuda
    "🇦🇷", // Argentina
    "🇦🇲", // Armenia
    "🇦🇼", // Aruba
    "🇦🇺", // Australia
    "🇦🇹", // Austria
    "🇦🇿", // Azerbaijan
    "🇧🇸", // Bahamas
    "🇧🇭", // Bahrain
    "🇧🇩", // Bangladesh
    "🇧🇧", // Barbados
    "🇧🇾", // Belarus
    "🇧🇪", // Belgium
    "🇧🇿", // Belize
    "🇧🇯", // Benin
    "🇧🇲", // Bermuda
    "🇧🇹", // Bhutan
    "🇧🇴", // Bolivia
    "🇧🇶", // Caribbean Netherlands
    "🇧🇦", // Bosnia and Herzegovina
    "🇧🇼", // Botswana
    "🇧🇷", // Brazil
    "🇮🇴", // British Indian Ocean Territory
    "🇻🇬", // British Virgin Islands
    "🇧🇳", // Brunei
    "🇧🇬", // Bulgaria
    "🇧🇫", // Burkina Faso
    "🇧🇮", // Burundi
    "🇨🇻", // Cabo Verde
    "🇰🇭", // Cambodia
    "🇨🇲", // Cameroon
    "🇨🇦", // Canada
    "🇨🇻", // Cape Verde
    "🇰🇾", // Cayman Islands
    "🇨🇫", // Central African Republic
    "🇹🇩", // Chad
    "🇨🇱", // Chile
    "🇨🇳", // China
    "🇨🇽", // Christmas Island
    "🇨🇨", // Cocos (Keeling) Islands
    "🇨🇴", // Colombia
    "🇰🇲", // Comoros
    "🇨🇬", // Congo (Brazzaville)
    "🇨🇩", // Congo (Kinshasa)
    "🇨🇰", // Cook Islands
    "🇨🇷", // Costa Rica
    "🇭🇷", // Croatia
    "🇨🇺", // Cuba
    "🇨🇼", // Curaçao
    "🇨🇾", // Cyprus
    "🇨🇿", // Czechia
    "🇩🇰", // Denmark
    "🇩🇯", // Djibouti
    "🇩🇲", // Dominica
    "🇩🇴", // Dominican Republic
    "🇪🇨", // Ecuador
    "🇪🇬", // Egypt
    "🇸🇻", // El Salvador
    "🇬🇶", // Equatorial Guinea
    "🇪🇷", // Eritrea
    "🇪🇪", // Estonia
    "🇸🇿", // Eswatini
    "🇪🇹", // Ethiopia
    "🇫🇰", // Falkland Islands
    "🇫🇴", // Faroe Islands
    "🇫🇯", // Fiji
    "🇫🇮", // Finland
    "🇫🇷", // France
    "🇬🇫", // French Guiana
    "🇵🇫", // French Polynesia
    "🇹🇫", // French Southern Territories
    "🇬🇦", // Gabon
    "🇬🇲", // Gambia
    "🇬🇪", // Georgia
    "🇩🇪", // Germany
    "🇬🇭", // Ghana
    "🇬🇮", // Gibraltar
    "🇬🇷", // Greece
    "🇬🇱", // Greenland
    "🇬🇩", // Grenada
    "🇬🇵", // Guadeloupe
    "🇬🇺", // Guam
    "🇬🇹", // Guatemala
    "🇬🇬", // Guernsey
    "🇬🇳", // Guinea
    "🇬🇼", // Guinea-Bissau
    "🇬🇾", // Guyana
    "🇭🇹", // Haiti
    "🇭🇳", // Honduras
    "🇭🇰", // Hong Kong
    "🇭🇺", // Hungary
    "🇮🇸", // Iceland
    "🇮🇳", // India
    "🇮🇩", // Indonesia
    "🇮🇷", // Iran
    "🇮🇶", // Iraq
    "🇮🇪", // Ireland
    "🇮🇲", // Isle of Man
    "🇮🇱", // Israel
    "🇮🇹", // Italy
    "🇨🇮", // Ivory Coast
    "🇯🇲", // Jamaica
    "🇯🇵", // Japan
    "🇯🇪", // Jersey
    "🇯🇴", // Jordan
    "🇰🇿", // Kazakhstan
    "🇰🇪", // Kenya
    "🇰🇮", // Kiribati
    "🇽🇰", // Kosovo
    "🇰🇼", // Kuwait
    "🇰🇬", // Kyrgyzstan
    "🇱🇦", // Laos
    "🇱🇻", // Latvia
    "🇱🇧", // Lebanon
    "🇱🇸", // Lesotho
    "🇱🇷", // Liberia
    "🇱🇾", // Libya
    "🇱🇮", // Liechtenstein
    "🇱🇹", // Lithuania
    "🇱🇺", // Luxembourg
    "🇲🇴", // Macao
    "🇲🇬", // Madagascar
    "🇲🇼", // Malawi
    "🇲🇾", // Malaysia
    "🇲🇻", // Maldives
    "🇲🇱", // Mali
    "🇲🇹", // Malta
    "🇲🇭", // Marshall Islands
    "🇲🇶", // Martinique
    "🇲🇷", // Mauritania
    "🇲🇺", // Mauritius
    "🇾🇹", // Mayotte
    "🇲🇽", // Mexico
    "🇫🇲", // Micronesia
    "🇲🇩", // Moldova
    "🇲🇨", // Monaco
    "🇲🇳", // Mongolia
    "🇲🇪", // Montenegro
    "🇲🇸", // Montserrat
    "🇲🇦", // Morocco
    "🇲🇿", // Mozambique
    "🇳🇦", // Namibia
    "🇳🇷", // Nauru
    "🇳🇵", // Nepal
    "🇳🇱", // Netherlands
    "🇳🇨", // New Caledonia
    "🇳🇿", // New Zealand
    "🇳🇮", // Nicaragua
    "🇳🇪", // Niger
    "🇳🇬", // Nigeria
    "🇳🇺", // Niue
    "🇳🇫", // Norfolk Island
    "🇰🇵", // North Korea
    "🇲🇰", // North Macedonia
    "🇳🇴", // Norway
    "🇴🇲", // Oman
    "🇵🇰", // Pakistan
    "🇵🇼", // Palau
    "🇵🇸", // Palestine
    "🇵🇦", // Panama
    "🇵🇬", // Papua New Guinea
    "🇵🇾", // Paraguay
    "🇵🇪", // Peru
    "🇵🇭", // Philippines
    "🇵🇱", // Poland
    "🇵🇹", // Portugal
    "🇵🇷", // Puerto Rico
    "🇶🇦", // Qatar
    "🇷🇪", // Réunion
    "🇷🇴", // Romania
    "🇷🇺", // Russia
    "🇷🇼", // Rwanda
    "🇼🇸", // Samoa
    "🇸🇲", // San Marino
    "🇸🇹", // São Tomé and Príncipe
    "🇸🇦", // Saudi Arabia
    "🇸🇳", // Senegal
    "🇷🇸", // Serbia
    "🇸🇨", // Seychelles
    "🇸🇱", // Sierra Leone
    "🇸🇬", // Singapore
    "🇸🇽", // Sint Maarten
    "🇸🇰", // Slovakia
    "🇸🇮", // Slovenia
    "🇸🇧", // Solomon Islands
    "🇸🇴", // Somalia
    "🇿🇦", // South Africa
    "🇰🇷", // South Korea
    "🇸🇸", // South Sudan
    "🇪🇸", // Spain
    "🇱🇰", // Sri Lanka
    "🇸🇩", // Sudan
    "🇸🇷", // Suriname
    "🇸🇪", // Sweden
    "🇨🇭", // Switzerland
    "🇸🇾", // Syria
    "🇹🇼", // Taiwan
    "🇹🇯", // Tajikistan
    "🇹🇿", // Tanzania
    "🇹🇭", // Thailand
    "🇹🇱", // Timor-Leste
    "🇹🇬", // Togo
    "🇹🇴", // Tonga
    "🇹🇹", // Trinidad and Tobago
    "🇹🇳", // Tunisia
    "🇹🇷", // Turkey
    "🇹🇲", // Turkmenistan
    "🇹🇨", // Turks and Caicos Islands
    "🇹🇻", // Tuvalu
    "🇺🇬", // Uganda
    "🇺🇦", // Ukraine
    "🇦🇪", // United Arab Emirates
    "🇬🇧", // United Kingdom
    "🇺🇸", // United States
    "🇺🇾", // Uruguay
    "🇺🇿", // Uzbekistan
    "🇻🇺", // Vanuatu
    "🇻🇦", // Vatican City
    "🇻🇪", // Venezuela
    "🇻🇳", // Vietnam
    "🇼🇫", // Wallis and Futuna
    "🇪🇭", // Western Sahara
    "🇾🇪", // Yemen
    "🇿🇲", // Zambia
    "🇿🇼", // Zimbabwe
];