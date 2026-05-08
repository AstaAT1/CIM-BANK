import { Head } from "@inertiajs/react";
import Navbar from "../pages/customer/components/Navbar";
import Hero from "../pages/customer/components/Hero";
import About from "../pages/customer/components/About";
import FeatureCarousel from "../pages/customer/components/FeatureCarousel";
import HowItWorks from "../pages/customer/components/HowItWorks";
import Contact from "../pages/customer/components/Contact";
import Footer from "../pages/customer/components/Footer";

export default function WelcomePage() {
    return (
        <>
            <Head title="Welcome — CIM Bank" />

            <div className="min-h-screen overflow-x-hidden bg-[#F7F8FA] text-[#061F39] antialiased dark:bg-[#061F39] dark:text-white">
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute -top-40 right-10 h-96 w-96 rounded-full bg-[#0A6474]/8 blur-3xl dark:bg-[#0A6474]/18" />
                    <div className="absolute top-[42rem] -left-28 h-96 w-96 rounded-full bg-[#D4A23C]/10 blur-3xl dark:bg-[#D4A23C]/12" />
                    <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-[#082F54]/4 blur-3xl dark:bg-black/20" />
                </div>

                <div className="relative z-10">
                    <Navbar />
                    <Hero />
                    <About />
                    <FeatureCarousel />
                    <HowItWorks />
                    <Contact />
                    <Footer />
                </div>
            </div>
        </>
    );
}
