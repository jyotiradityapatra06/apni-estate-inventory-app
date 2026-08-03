import { useState } from "react";
import { Link } from "react-router";
import { ChevronDown, Menu, X } from "lucide-react";

const links = [{ label: "Features", mobileLabel: "Features", href: "#features" }, { label: "Solutions", mobileLabel: "Solutions", href: "#showcase" }, { label: "Request Pricing", mobileLabel: "Pricing", href: "#demo" }, { label: "Demo", mobileLabel: "Demo", href: "#demo" }, { label: "Contact", mobileLabel: "Contact", href: "#demo" }];

export default function MarketingHeader() {
  const [open, setOpen] = useState(false);
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-[#fffdf9]/85 backdrop-blur-xl">
    <div className="mx-auto flex h-17 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
      <Link to="/" className="flex items-center gap-2.5"><img src="/brand/apni-estate-logo.jpeg" alt="APNI ESTATE" className="h-9 w-9 rounded-lg object-cover shadow-sm" /><span><span className="block text-sm font-black tracking-tight text-[#0F172A]">APNI <span className="text-orange-500">ESTATE</span></span><span className="block text-[8px] font-bold uppercase tracking-[.17em] text-slate-500">Construction ERP</span></span></Link>
      <nav className="hidden items-center gap-8 lg:flex">{links.map(link => <a key={link.label} href={link.href} className="text-xs font-bold text-slate-600 transition hover:text-orange-600">{link.label}</a>)}<a href="#" className="flex items-center gap-1 text-xs font-bold text-slate-600">Resources <ChevronDown size={13} /></a></nav>
      <div className="hidden items-center gap-3 md:flex"><Link to="/auth/login" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-xs font-extrabold text-slate-800 shadow-sm hover:border-slate-400">Login</Link><Link to="/auth/signup" className="rounded-lg bg-orange-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600">Get Started</Link></div>
      <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm md:hidden" aria-label="Toggle navigation" aria-expanded={open}>{open ? <X size={19} /> : <Menu size={19} />}</button>
    </div>
    {open && <div className="border-t border-slate-200 bg-white p-5 shadow-xl md:hidden">{links.map(link => <a key={link.label} href={link.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600">{link.mobileLabel}</a>)}<div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4"><Link to="/auth/login" className="rounded-lg border border-slate-200 p-3 text-center text-sm font-bold text-slate-800">Login</Link><Link to="/auth/signup" className="rounded-lg bg-orange-500 p-3 text-center text-sm font-bold text-white">Get Started</Link></div></div>}
  </header>;
}
