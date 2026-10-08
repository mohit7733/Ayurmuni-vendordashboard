import React from "react";
import { Mail, Phone, MessageCircle, BookOpen, Clock } from "lucide-react";
import DashboardPageShell from "../../components/shared/DashboardPageShell";

const faqs = [
    {
        q: "How long does vendor verification take?",
        a: "Verification typically completes within 12–24 hours after you submit your profile and documents.",
    },
    {
        q: "Why is my product variant pending approval?",
        a: "All new variants go through admin review. You will receive a notification when approval status changes.",
    },
    {
        q: "How do I update stock quantities?",
        a: "Use Stock Management to update quantities, or set quantity when creating/editing product variants.",
    },
    {
        q: "Can I manage customer orders from this dashboard?",
        a: "Vendor order management is not available yet. Order APIs are currently customer-facing only.",
    },
];

const CONTACT_CARDS = [
    { icon: Mail, title: "Email Support", value: "support@ayurmuni.com", meta: "Response within 24 hours", iconBg: "bg-emerald-50", iconColor: "text-[#0D614E]" },
    { icon: Phone, title: "Phone Support", value: "+91 70423 76400", meta: "Mon–Sat, 9 AM – 6 PM IST", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { icon: MessageCircle, title: "Vendor Desk", value: "Chat with our vendor success team", meta: "Available for verified vendors", iconBg: "bg-purple-50", iconColor: "text-purple-600" },
];

export default function VendorHelpSupport() {
    return (
        <DashboardPageShell
            title="Help &"
            accent="Support"
            subtitle="Get assistance with onboarding, products, inventory, and account verification."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {CONTACT_CARDS.map(({ icon: Icon, title, value, meta, iconBg, iconColor }) => (
                    <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center mb-4`}>
                            <Icon size={20} className={iconColor} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                        <p className="text-sm text-gray-700 mt-1">{value}</p>
                        <span className="text-xs text-gray-500 mt-2 block">{meta}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                    <BookOpen size={18} className="text-[#0D614E]" />
                    <h2 className="text-lg font-semibold text-gray-800">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-3">
                    {faqs.map((item) => (
                        <details key={item.q} className="group rounded-lg border border-gray-100 px-4 py-3 open:bg-gray-50">
                            <summary className="cursor-pointer text-sm font-medium text-gray-800 list-none flex justify-between items-center">
                                {item.q}
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                            </summary>
                            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <Clock size={16} className="mt-0.5 flex-shrink-0" />
                <p>
                    For urgent verification issues, keep your profile and documents up to date under Profile.
                    You can track approval updates in Notifications.
                </p>
            </div>
        </DashboardPageShell>
    );
}
