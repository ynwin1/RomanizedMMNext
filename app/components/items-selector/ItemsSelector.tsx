"use client";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useLocale} from "next-intl";

const limits = [10, 20, 30, 40, 50];

const ItemsPerPageSelector = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const current = Number(searchParams.get("limit")) || 10;

  const updateLimit = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, {scroll: false});
  };

  return (
    <div className="flex items-center gap-3 text-sm text-[#CBBEAE]">
      <label htmlFor="catalogue-page-size" className="whitespace-nowrap">
        {locale === "my" ? "တစ်မျက်နှာလျှင်" : "Show"}
      </label>
      <select id="catalogue-page-size" aria-label="Items per page" value={current}
        onChange={event => updateLimit(event.target.value)}
        className="min-h-11 min-w-20 cursor-pointer border border-[#665342] bg-[#24211E] px-3 py-2 text-[#F3EDE3] [color-scheme:dark] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DAA276]">
        {limits.map(limit => <option key={limit} value={limit}>{limit}</option>)}
      </select>
      <span className="whitespace-nowrap">{locale === "my" ? "ခု" : "per page"}</span>
    </div>
  );
};
export default ItemsPerPageSelector;
