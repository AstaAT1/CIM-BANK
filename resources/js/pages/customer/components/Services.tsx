import React, { useEffect, useRef, useState } from 'react';

export default function Services() {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    const services = [
        {
            icon: '🏦',
            title: 'Comptes bancaires',
            description: 'Gestion complète de vos comptes avec outils numériques avancés',
            features: ['Virement instantané', 'Épargne sécurisée', 'API intégrée'],
            color: 'from-blue-500 to-blue-600',
        },
        {
            icon: '💳',
            title: 'Cartes de crédit',
            description: 'Cartes premium avec rewards et protections maximales',
            features: ['Cashback', 'Assurance voyage', 'Limite flexible'],
            color: 'from-purple-500 to-purple-600',
        },
        {
            icon: '💰',
            title: 'Crédits personnels',
            description: 'Financement ajusté à votre capacité réelle de remboursement',
            features: ['Taux compétitif', 'Période de grâce', 'Sans justificatif'],
            color: 'from-amber-500 to-orange-600',
        },
        {
            icon: '🚗',
            title: 'Crédits auto',
            description: 'Solutions de financement pour l\'achat de votre véhicule',
            features: ['Taux préférentiel', 'Assurance incluse', 'Durée flexible'],
            color: 'from-green-500 to-green-600',
        },
        {
            icon: '📚',
            title: 'Crédits éducation',
            description: 'Investir dans votre avenir avec conditions préférentielles',
            features: ['Délai de grâce', 'Taux réduit', 'Flexibilité'],
            color: 'from-cyan-500 to-blue-600',
        },
        {
            icon: '🎯',
            title: 'Machrou3i Crédit',
            description: 'Financez votre projet entrepreneurial par jalons',
            features: ['Décaissement progressif', 'Accompagnement', '40k-500k DH'],
            color: 'from-rose-500 to-pink-600',
        },
    ];

    return (
        <section
            ref={ref}
            className="relative py-32 bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-20">
                    <h2 className={`text-4xl md:text-5xl font-bold text-white mb-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        Nos services
                    </h2>
                    <p className={`text-slate-300 text-lg max-w-2xl mx-auto transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        Une gamme complète de solutions financières pensées pour votre réussite
                    </p>
                </div>

                {/* Services grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, idx) => (
                        <div
                            key={idx}
                            className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                            style={{ transitionDelay: `${idx * 100}ms` }}
                        >
                            <div className="relative group h-full">
                                {/* Animated glow background */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-25 rounded-2xl blur-2xl transition-all duration-500`}></div>

                                {/* Main card */}
                                <div className="relative bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-xl border border-white/10 group-hover:border-white/30 rounded-2xl p-8 h-full flex flex-col overflow-hidden transition-all duration-500 transform group-hover:scale-105">
                                    {/* Gradient accent */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${service.color} opacity-5 group-hover:opacity-15 rounded-full blur-2xl transition-all duration-500 -mr-16 -mt-16`}></div>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        {/* Icon */}
                                        <div className="text-5xl mb-6 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                                            {service.icon}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-2xl font-bold text-white mb-3">
                                            {service.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                                            {service.description}
                                        </p>

                                        {/* Features */}
                                        <div className="space-y-2 mb-8">
                                            {service.features.map((feature, fidx) => (
                                                <div key={fidx} className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${service.color}`}></div>
                                                    <span className="text-slate-400 text-sm">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CTA Link */}
                                        <button className={`w-full py-3 px-4 bg-gradient-to-r ${service.color} text-white font-bold rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm`}>
                                            En savoir plus →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className={`mt-20 text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <p className="text-slate-300 mb-6">Tous nos services sont conçus avec la rigueur d'une institution financière agréée</p>
                    <button className="px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-300 text-slate-900 font-bold rounded-lg hover:shadow-2xl hover:shadow-amber-400/50 transition-all duration-300 transform hover:scale-105">
                        Explore tous les services
                    </button>
                </div>
            </div>
        </section>
    );
}
