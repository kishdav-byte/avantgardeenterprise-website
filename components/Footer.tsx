import Link from "next/link"

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black py-12">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <h3 className="text-lg font-bold uppercase tracking-wider mb-2">Avant-Garde</h3>
                    <p className="text-sm text-white/50">
                        &copy; {new Date().getFullYear()} Avant-Garde Enterprise. All rights reserved.
                    </p>
                </div>
                <div className="flex gap-6 text-sm text-white/50">
                    <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                    <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                    <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
                </div>
            </div>
        </footer>
    )
}
