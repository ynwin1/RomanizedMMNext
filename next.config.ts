import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
    images: {
        remotePatterns: [
            // {
            //     protocol: "https",
            //     hostname: "i.scdn.co",
            // },
            {
                protocol: 'https',
                hostname: '**',
            }
        ],
    },
    async redirects() {
        return [
            ...Object.entries(song_map).map(([oldName, id]) => ({
                source: `/song/${oldName}`,
                destination: `/en/song/${oldName}/${id}`,
                permanent: true
            })),
            {
                source: '/:path*',
                has: [
                    {
                        type: 'host',
                        value: 'romanizedmm.com',
                    },
                ],
                destination: 'https://www.romanizedmm.com/:path*', // Redirect to www
                permanent: true,
            }
        ]
    },
};

const song_map = {
    "MinShiTaeMyoh": 1,
    "PyanLarChainLay": 2,
    "SaungTwinNway": 3,
    "MinAtwatNgar": 4,
    "ASinPyayParTal": 5,
    "ShaeSatYanMaShi": 6,
    "MinNaeNeePho": 7,
    "PyanTwayKyi": 8,
    "Loser": 9,
    "PaingShin": 10,
    "ThanYawZin": 11,
    "AMonePin": 12,
    "MoeMaKhaEainMatKhaYanPyar": 13,
    "LatePyar": 14,
    "GaBarASetSet": 15,
    "BarLoNayThayLal": 16,
    "KyayZuuParKwal": 17,
    "Accident": 18,
    "WayThwarLal": 19,
    "SwayTal": 20,
    "Hurt": 21,
    "MoeKharYae": 22,
    "Why": 23,
    "NeeNeeLayNaeWay": 24,
    "SpaceDream": 25,
    "MaMyint": 26,
    "DearCrush": 27,
    "EainPyanChain": 28,
    "SuicideLove": 29,
    "Flashback": 30,
    "TheSein": 31,
    "EainMetYaeAThet": 32,
    "DontYouKnow": 33,
    "MyawNayMalSaung": 34,
    "Telepunk": 35,
    "AChitThiChin": 36,
    "NgeChitPonePyin": 37,
    "KaungMaLay": 38,
    "YangonAsBefore": 39,
    "ThaDiYaDal": 40,
    "HteeTaChaung": 41,
    "AllINeedIsYou": 42,
    "ChitTayThanThar": 43,
    "ThayMaLoPal": 44,
    "Gipsy": 45,
    "Hnin": 46,
    "YinYinLayYue": 47,
    "AMhatTaMae": 48,
    "Goodbye": 49,
    "NgweLaMinLay": 50,
    "HtarLitePar": 51,
    "AMikeMaeSoneSu": 52,
    "LostInUniverse": 53,
    "FooFoo": 54,
    "ALwanPyayANann": 55,
    "HnitPatLal": 56,
    "OneDay": 57,
    "APhyuYaungKaTiSakar": 58,
    "NgarMaShiThawNin": 59,
    "ATateMaeYawGar": 60,
    "ChitLuMike": 61,
    "WhatHtarTaeKaungKin": 62,
    "ToThuNgalChin": 63,
    "AChitAChit": 64,
    "Lawichal": 65,
    "K": 66,
    "LatHtatKyaMal": 67,
    "MaMaeSay": 68,
    "AthelKwelPyaTike": 69,
    "TheingaraThachinTaBote": 70,
    "Sar": 71,
    "MaChoThawAMhanTaYarr": 72,
    "Radio": 73,
    "Her": 74,
    "APyitMaTinYatPar": 75,
    "PhanTharNanTaw": 76,
    "TaGalLohMyar": 77,
    "AYinLoBawaMyoYoukChinTal": 78,
    "December": 79,
    "PanTwayNaeWai": 80,
    "KywayParSay": 81,
    "Cherry": 82,
    "GabarTiNayThaYwae": 83,
    "MaNgoParNaeTok": 84,
    "TaYatTotNgoPar": 85,
    "NwayYalMoeYalSaungYal": 86,
    "ThuThiThwarPe": 87
}


export default withNextIntl(nextConfig);
