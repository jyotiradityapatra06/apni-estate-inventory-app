import { ArrowRight, CalendarCheck, ShieldCheck } from "lucide-react";

const fieldClass = "mt-2 h-12 w-full cursor-text rounded-xl border border-slate-300 bg-white px-4 text-base font-medium normal-case tracking-normal text-slate-900 caret-orange-500 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10";

export default function DemoSection() {
  return (
    <section id="demo" className="bg-[#f8fafc] py-24">
      <div className="mx-auto grid max-w-[1120px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,.45)] lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative overflow-hidden bg-[#0B1329] p-8 text-white sm:p-12">
          <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-orange-500/20 blur-2xl" />
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-400">Personalized product walkthrough</p>
          <h2 className="demo-heading mt-6 font-black text-white">
            Book a Live<br />
            <span className="demo-brand-line">APNI ESTATE Demo</span>
          </h2>
          <p className="mt-6 text-base font-medium leading-7 text-slate-400">See how your inventory, godowns, GST billing, purchases and collections work together.</p>
          <div className="mt-9 space-y-4">
            <p className="flex items-center gap-3 text-sm font-bold"><CalendarCheck size={18} className="text-orange-400" />30-minute guided walkthrough</p>
            <p className="flex items-center gap-3 text-sm font-bold"><ShieldCheck size={18} className="text-orange-400" />No commitment or credit card</p>
          </div>
        </div>

        <form className="grid gap-5 p-8 sm:p-12" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              Full name
              <input type="text" name="fullName" autoComplete="name" className={fieldClass} placeholder="Your name" />
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              Phone number
              <input type="tel" name="phone" autoComplete="tel" inputMode="tel" className={fieldClass} placeholder="+91 98765 43210" />
            </label>
          </div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
            Business name
            <input type="text" name="businessName" autoComplete="organization" className={fieldClass} placeholder="e.g. Balaji Building Materials" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
            What do you supply?
            <select name="supplyType" defaultValue="" className="mt-2 h-12 w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 text-base font-medium normal-case tracking-normal text-slate-900 outline-none transition hover:border-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10">
              <option value="" disabled>Select material category</option>
              <option value="building-materials">Cement, steel and building materials</option>
              <option value="hardware">Hardware and sanitaryware</option>
              <option value="aggregates">Sand, bricks and aggregates</option>
              <option value="other">Other construction materials</option>
            </select>
          </label>
          <button type="submit" className="mt-2 inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600">
            Request My Demo <ArrowRight size={16} />
          </button>
          <p className="text-center text-[10px] font-medium text-slate-400">Our team will contact you to schedule a convenient time.</p>
        </form>
      </div>
    </section>
  );
}
