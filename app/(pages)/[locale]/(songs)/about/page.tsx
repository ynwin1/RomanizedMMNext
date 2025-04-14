import React from 'react';
import {Metadata} from "next";
import Image from 'next/image';
import {getTranslations} from "next-intl/server";
import CountryStatsUI from "@/app/components/country-counter/countryStatsUI";

interface AboutPageProps {
    params: Promise<{ locale: string }>;
}

export const metadata : Metadata = {
    title: 'About',
    description: 'Learn about RomanizedMM and their mission to elevate Myanmar music to the world stage.',
}

const Page = async ({params} : AboutPageProps) => {
    const {locale} = await params;
    const translator = await getTranslations("AboutPage");

    return (
        <div className="flex flex-col justify-center items-center mt-4">
            <h1 className="text-3xl font-bold mt-6 ">{translator("title")}</h1>
            <Image src="/weblogo.png" alt="RomanizedMM" width={180} height={180} className="mt-6 mb-4 border-2 border-white rounded-full"/>
            <div className="border-2 border-orange-200 p-4 rounded-2xl space-y-4 mt-6 leading-8 w-[80vw] text-left text-[1rem] max-md:text-base max-md:w-[90vw]">
                {locale === "en" ?
                    <>
                        <p>Welcome to RomanizedMM 😍!</p>
                        <p>I created this website for people who love Myanmar songs. I have seen our neighboring countries having their own website to service romanized lyrics for their songs, but when I searched ours, I found none. We do seem to have some audience from around the world 🌏, and comments in Youtube MVs are the pieces of evidence. Thus, was the birth of RomanizedMM. My goal is to provide lyrics for Myanmar music in one stop - to browse through in Burmese language or to sing along even if you do not understand Burmese.</p>
                        <p>I provide three types of lyrics:</p>
                        <ul>
                            <li><b>Romanized</b>: For folks who want to sing along.</li>
                            <li><b>Burmese</b>: For those who want to learn Burmese or just casually browse.</li>
                            <li><b>Meaning</b>: For people who want to know the meaning behind the lyrics.</li>
                        </ul>
                        <p>I am a firm believer that our music has the potential to be on a global stage. I really want our musicians to succeed and be heard by people around the world. My sole goal is to help our musicians reach new heights and earn some income through the YouTube player I provide here to increase viewership counts in their MVs. I do not receive any money in any way 💯. It's all for the sake of my country.</p>
                        <p>I am always trying to improve this website. If you are looking for new songs and can't find them on the site, feel free to submit a song request through the form in the navigation bar at the top. I am very active maintaining this site, and I will try my best to respond to you within 2-3 days 😇. Sometimes, I may get super busy, and in those cases, it may take longer.</p>
                        <p>To Artists and Musicians - If you don't want your piece of work to be on this website, please email at romanizedmm@gmail.com or DM at "Romanized MM" on our Facebook page.</p>
                        <p>Thank you for visiting my site. I hope you enjoy your stay! 🥳</p>
                    </>
                    :
                    <>
                        <p>RomanizedMM ကနေ ကြိုဆိုပါတယ်</p>
                        <p>ကျွန်တော် ဒီ website လေးကို မြန်မာသီချင်း ချစ်တဲ့သူတွေအတွက် ရည်ရွယ်ပြီး စလုပ်ခဲ့ပါတယ်။ </p>
                        <p>ကျွန်တော်က နိုင်ငံခြားသီချင်းတွေ နားထောင်တာမို့ တစ်ခါတစ်လေ လိုက်ဆိုချင်ရင် အင်တာနက်ပေါ်မှာ romanized lyrics (မြန်မာလိုဆို မြန်းဂလစ်ရှ်) တွေလိုက်ရှာတတ်ပါတယ်။ ဒါပေမယ့် မြန်မာသီချင်းတွေ အတွက်ရှာတဲ့အခါမှာ မတွေ့ပါဘူး။ ကျွန်တော်တို့ သီချင်းတွေရဲ့ Youtube music video တွေအောက်မှာ နိုင်ငံတကာက ပရိတ်သတ်တွေက lyrics တွေရယ် အဓိပ္ပာယ်တွေကို အမြဲလိုလိုတောင်းဆိုနေကြတာ အမြဲလိုလိုတွေ့မိပါတယ်။ ဒါနဲ့ပဲ ဒီ gap လေးကို ဖြည့်ပေးမယ် တွေးရင် ဒီဝက်ဘ်ဆိုဒ်လေး ဖြစ်လာတာပါ။</p>
                        <p>အဓိကအားဖြင့် သီချင်းစာသား ၃ မျိုး ရှိပါတယ်</p>
                        <ul>
                            <li><b>Romanized</b>: လိုက်ဆိုချင်ပေမယ့် မြန်မာစာ မဖတ်တတ်တဲ့သူတွေ အတွက်ပါ</li>
                            <li><b>Burmese</b>: ဒါကတော့ မြန်မာတွေ အတွက်ပါ</li>
                            <li><b>Meaning</b>: ဒီမှာကတော့ သီချင်စာသားတွေရဲ့ အဓိပ္ပာယ်တွေပါ။ မြန်မာစာလေ့လာသူတွေအတွက်လဲ အထောက်အကူဖြစ်မယ် ထင်ပါတယ်။</li>
                        </ul>
                        <p>ကျွန်တော် မြန်မာသီချင်းတွေကို အဆင့်တစ်ခုမှာ ရှိနေတယ်လို့ မြင်မိတယ် အထူးသဖြင့် နောက်ပိုင်းထွက်တဲ့ သီချင်းတွေပါ။ ကျွန်တော် ဖြစ်စေချင်တာက ဒီသီချင်းတွေ ထွန်းပေါက်ဖို့ရယ်၊ နိုင်ငံတကာမှာ ကျွန်တော်တို့ အဆိုတော်တွေ နေရာတစ်ခုရဖို့ပါ။</p>
                        <p>ကျွန်တော့် website မှာ Youtube Player ဖွင့်လိုက်တိုင်း အဆိုတော်ရဲ့ Youtube Video မှာ viewer တက်ပါတယ်။ ဒီ video တွေက အဆိုတော်တွေ ကိုယ်တိုင် တင်ထားတဲ့ official channel တွေကတစ်ဆင့် ပြန်တင်ပေးထားတာမို့ ဒီနည်းက အဆိုတော်တွေကို တစ်ဖက်တစ်လမ်းက ထောက်ပံ့တာဆိုရင်လဲ မမှားပါဘူး။ ကျွန်တော် ဒါကို ဝါသနာအရ လုပ်နေတာမို့ ပိုက်ဆံမရပါဘူး။ အဓိကက အောင်မြင်စေချင်တဲ့ ရည်ရွယ်ချက်လေး ဖြစ်လာအောင် အကောင်အထည်ဖော်နေတာပါ။</p>
                        <p>ကျွန်တော် ဒီ website ကို အမြဲထိန်းသိမ်းနေပါတယ်။ အားတဲ့အချိန်တိုင်းလဲ သီချင်းသစ်တွေ ထည့်ပေးနေပါတယ်။ တစ်ကယ်လို့ ကိုယ်လိုချင်တဲ့ သီချင်းမရှိဘူးဆိုရင် Menu က "Request a song" မှာ သီချင်းတောင်းလို့ရပါတယ်။ အကောင်းဆုံး ကြိုးစားပြီး ၂-၃ ရက်အတွင်း ရအောင် တင်ပေးပါ့မယ်။ တစ်ခါတစ်လေ အလုပ်ရှုပ်နေရင် ၄-၅ ရက်လဲ ကြာကောင်းကြာနိုင်ပါတယ်။</p>
                        <p>အနုပညာရှင်များသို့ - အကယ်၍ အနုပညာရှင်ရဲ့ သီချင်းကို ကျွန်တော့် website ပေါ်မှာမရှိစေချင်ရင် romanizedmm@gmail.com သို့ အီးမေးပို့၍သော်၎င်း ၊ Facebook page ဖြစ်တဲ့ Romanized MM ရဲ့ Chat Box မှသော်၎င်း ပြောကြားနိုင်ပါတယ်။</p>
                        <p>ဒီ website လေးကို အားပေးလို့ ကျေးဇူးတင်ပါတယ်။ 🥳</p>
                    </>
                }
            </div>
            <CountryStatsUI />
        </div>
    )
}
export default Page
