import {lusitana} from "@/app/components/fonts/fonts";
import {Navbar} from "@/app/components/navbar/Navbar";
import Footer from "@/app/components/footer/Footer";

export default function Layout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${lusitana.className} antialiased`}>
                <Navbar />
                    {children}
                <Footer />
            </body>
        </html>
    );
}