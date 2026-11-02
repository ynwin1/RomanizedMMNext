import Link from "next/link";

export default function SongDiscoveryTabs({locale,active}:{locale:string;active:"catalogue"|"moods"}) {
 const tabs=[
  {id:"catalogue" as const,href:`/${locale}/song-catalogue`,label:locale==="my"?"သီချင်းအားလုံး":"Browse songs"},
  {id:"moods" as const,href:`/${locale}/moods`,label:locale==="my"?"စိတ်ခံစားချက်အလိုက် ရှာဖွေမည်":"Discover by mood"},
 ];
 return <nav aria-label="Song discovery" className="flex flex-wrap gap-2 border-b border-theme-border pb-4">
   {tabs.map(tab=><Link key={tab.id} href={tab.href} aria-current={active===tab.id?"page":undefined}
     className={`inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${active===tab.id
      ?"border-accent bg-accent text-background":"border-theme-border text-foreground hover:border-accent hover:text-accent"}`}>
       {tab.label}
     </Link>)}
 </nav>;
}
