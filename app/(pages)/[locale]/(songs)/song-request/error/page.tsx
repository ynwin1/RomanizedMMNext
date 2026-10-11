import FormReturnButton from "@/app/components/buttons/FormReturnButton";
import {getTranslations} from "next-intl/server";

const Page = async () => {
    const t = await getTranslations("SongRequestPage");
    return (
        <main className="mx-auto flex min-h-[65vh] w-full max-w-2xl items-center justify-center px-4 py-16">
            <div className="w-full rounded-xl border border-theme-border bg-surface p-8 text-center sm:p-10">
                <div aria-hidden="true" className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised text-3xl text-accent">!</div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("errorTitle")}</h1>
                <p className="mx-auto mt-3 mb-7 max-w-md text-sm leading-relaxed text-muted sm:text-base">{t("errorDetail")}</p>
                <FormReturnButton url="/song-request" label={t("return")} />
            </div>
        </main>
    )
}
export default Page;
