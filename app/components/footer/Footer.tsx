import Link from 'next/link'
import Image from "next/image";

const Footer = () => {
    return (
        <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-theme-border-subtle bg-background px-4 py-6 text-foreground">
            <Link href="https://www.facebook.com/p/Romanized-MM-61567473470671/" target="_blank" rel="noopener noreferrer" aria-label="RomanizedMM on Facebook (opens in new tab)" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-surface-raised focus-visible:outline-accent">
                <Image src="/facebook-icon.png" alt="" width={27} height={27} />
            </Link>
            <Link href="https://github.com/ynwin1/RomanizedMMNext" target="_blank" rel="noopener noreferrer" aria-label="RomanizedMM on GitHub (opens in new tab)" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-surface-raised focus-visible:outline-accent">
                <Image src="/github-icon.png" alt="" width={30} height={30} />
            </Link>
            <p className="text-xs text-muted sm:text-sm">© 2026 RomanizedMM</p>
        </footer>
    )
}
export default Footer;
