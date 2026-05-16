"use client";

import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { Button, Input } from "@/components/ui/StitchUI";
import Image from "next/image";

const SpecialistCard = ({ name, title, specialty, rating, desc, img }: { name: string, title: string, specialty: string, rating: string, desc: string, img: string }) => (
  <div className="bg-surface-container-low rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:shadow-2xl transition-all duration-500 group border border-outline-variant/5">
    <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 border-4 border-surface-container-highest shadow-md group-hover:scale-105 transition-transform relative mx-auto sm:mx-0">
      <Image src={img} alt={name} fill className="object-cover" />
    </div>
    <div className="flex-grow flex flex-col text-center sm:text-left">
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-2 gap-2">
        <div>
          <span className="inline-block px-2 sm:px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-extrabold uppercase tracking-widest rounded-full mb-2 shadow-sm">{specialty}</span>
          <h4 className="font-headline font-extrabold text-base sm:text-xl text-on-surface group-hover:text-primary transition-colors leading-tight">{name}</h4>
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter opacity-60">{title}</p>
        </div>
        <div className="flex items-center gap-1 bg-tertiary-container/30 px-2 py-1 rounded-lg border border-tertiary/10">
          <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-xs font-extrabold text-on-tertiary-container">{rating}</span>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-on-surface-variant line-clamp-2 mb-4 sm:mb-6 font-body leading-relaxed">{desc}</p>
      <div className="mt-auto flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button variant="primary" className="flex-grow py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg">Book Now</Button>
        <button className="px-3 sm:px-4 border border-primary/20 text-primary rounded-full hover:bg-primary/5 transition-colors shadow-sm">
          <span className="material-symbols-outlined text-lg sm:text-xl align-middle">mail</span>
        </button>
      </div>
    </div>
  </div>
);

export default function ProfessionalsPage() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8 sm:gap-12 px-4 sm:px-8 py-24 sm:py-32 flex-grow">
        {/* Filter Sidebar */}
        <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0">
          <div className="bg-surface-container-low rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 sticky top-32 border border-outline-variant/10 shadow-xl">
            <div className="mb-8 sm:mb-10">
              <h2 className="font-headline font-extrabold text-xl sm:text-2xl text-on-surface mb-2 sm:mb-3 tracking-tight">Find a Specialist</h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">Filter by expertise, location, and rating to find the perfect fit.</p>
            </div>

            <div className="space-y-6 sm:space-y-8 lg:space-y-10">
              {/* Search */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest ml-1">Name or Keyword</label>
                <div className="relative">
                  <Input className="w-full bg-surface-container-highest border-none rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 pl-10 sm:pl-12 shadow-inner" placeholder="Search professionals..." />
                  <span className="material-symbols-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg sm:text-2xl">search</span>
                </div>
              </div>

              {/* Specialty */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest ml-1">Specialty</label>
                <select className="w-full bg-surface-container-highest border-none rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-sm font-bold text-on-surface appearance-none shadow-inner cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all">
                  <option>All Specializations</option>
                  <option>Pediatrician</option>
                  <option>Child Psychologist</option>
                  <option>Speech Therapist</option>
                  <option>Occupational Therapist</option>
                  <option>Sensory Expert</option>
                </select>
              </div>

              {/* Rating */}
              <div className="space-y-3 sm:space-y-4">
                <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest ml-1">Minimum Rating</label>
                <div className="flex items-center gap-3 sm:gap-4">
                  <input type="range" min="1" max="5" step="0.5" className="w-full h-2 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary" />
                  <span className="text-sm font-extrabold text-primary min-w-[32px]">4.0+</span>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between bg-surface-container-highest/30 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-outline-variant/10">
                <span className="text-sm font-bold text-on-surface">New Clients</span>
                <button className="w-10 sm:w-12 h-6 sm:h-7 bg-secondary rounded-full relative p-0.5 sm:p-1 transition-all shadow-lg">
                  <div className="w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full translate-x-4 sm:translate-x-5 shadow-sm"></div>
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-4">
                <Button variant="primary" className="w-full py-3 sm:py-5 rounded-xl sm:rounded-2xl font-extrabold uppercase tracking-widest shadow-2xl text-xs sm:text-sm">Apply Filters</Button>
                <button className="w-full text-primary font-bold py-2 hover:bg-surface-container-high rounded-full transition-colors text-[10px] sm:text-xs uppercase tracking-widest">Clear all filters</button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Grid Area */}
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-extrabold text-on-surface tracking-tighter">Verified Professionals</h3>
              <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] sm:text-xs mt-1 sm:mt-2 opacity-60">Showing 24 experts matching your criteria</p>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <button className="px-4 sm:px-6 py-2 sm:py-3 bg-surface-container-low rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-widest border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">Sort: Recommended</button>
              <button className="p-2 sm:p-3 bg-surface-container-low rounded-full border border-outline-variant/10 shadow-sm"><span className="material-symbols-outlined text-on-surface-variant text-lg sm:text-xl">grid_view</span></button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <SpecialistCard
              name="Dr. Elena Rodriguez" specialty="Pediatrician" rating="4.9" title="Board Certified"
              desc="Expert in neurodiverse development with 15+ years experience in supporting children through sensory transitions."
              img="https://lh3.googleusercontent.com/aida-public/AB6AXuB8WkQsRpmGW6uLOIwi-adfCXSuBEa3Bnhr0kZUurI7Z__FyE9YPQV1jJw4VLIpxkPgsgeUmnQl1Vg7Pph9dQQuPuaSgPQ_90ZtJGWVgRr9ibGz4Q18bteRcXX25p-rlkESmp0hOwWtzddavznkb6651paS62UKAkRsAsPheZj4hmBdN1BHDoMG3ETG_ruF75k0qWJOkhIjnxV7CJPCX9qCzond2JbXJRk-x3WFFh5beuJHf6c8ofm7Rxs-115rUZ0yiQ4oDGL4NRQ"
            />
            <SpecialistCard
              name="Marcus Thorne, MS" specialty="Occupational Therapist" rating="4.8" title="M.S. Occupational Therapy"
              desc="Specializing in sensory integration and motor skill development in safe, play-based environments."
              img="https://lh3.googleusercontent.com/aida-public/AB6AXuDH0vaEYPg7zSynN2fI27AgYroHwEocEdr1rSLrRBBAWEmHzEm7JoXSGGVdUuUf8nNkz1kobA-PptgnyndUvbat6u61F5yobwLqaaVlKnEJESsJM8Vv6GHJG2AUU4J28vSojAnltJ3qHwWaaOq_6M_swGG6Wrcl4SE-fc05AY1J14GbjmA85qN_nWoA_kLOOlr5aViwQ6v9RHkoWiGhd568dXGQd-JK5dCv14CjJJe3V39Z85dh2skRtHkxcQgc61C8sD5tG0m4kCo"
            />
            <SpecialistCard
              name="Dr. Sarah Jenkins" specialty="Child Psychologist" rating="5.0" title="PhD Clinical Psychology"
              desc="Cognitive behavioral therapy expert focused on anxiety and emotional regulation for children and adolescents."
              img="https://lh3.googleusercontent.com/aida-public/AB6AXuCNTp2xJorGu6YKbkQcoTBJWbq9gHxQUOTKnXbdB4D_9V4bZCXHG7n5SuLyKdF2PAivLntEG6Yboe8MRjMxYf-oDHVAoZuVrsv1HCK8j6oR-KkxAfH1mT7B60FJfYFH0lqZsxuIfDU0VMoeDeyyf9LMHZFjHYgeZLikYtl3fHPevIqd2ruXzXj-n7if6vOSHE9E-YcpG4jHiXRFAgDRHclb8Ws5_aaxkHkEZetLGEuV6pxsjVim8K8lVW4mqceDHxlNgLP6mYuHjSI"
            />
            <SpecialistCard
              name="Julian Carter, SLP" specialty="Speech Therapist" rating="4.7" title="Speech-Language Pathologist"
              desc="Innovative communication strategies using AAC and sensory-aware techniques for non-verbal development."
              img="https://lh3.googleusercontent.com/aida-public/AB6AXuDHHeExVfVyYG2FrBnKoLjgWP6e4CPYdOqtZ3PhdoPv-mSe0Kfl_cqQ15DgtPKDP1RwwdNNV51DTkpXoPnEwuAZrwoN21cD-dJGEQFFZiQr3WvA-LdiTuun-vQhiHSRDxwlI2kW5xX8GWHqcNlerhCBumxkUAVgN7fjwGTj4JO5KCUrcJdZl9ZQvSn4UdeWR7ydvUDs6NLDSlSJn4pHq9Em-1v_pxkgL72byOIlOkMRaYIkA3P73eCvLQft0gYxza7FTiGMvL5tL-A"
            />
            <SpecialistCard
              name="Dr. Linda Chaves" specialty="Sensory Expert" rating="4.9" title="Occupational Specialist"
              desc="Designing tailored sensory environments and home plans for families navigating ASD and ADHD."
              img="https://lh3.googleusercontent.com/aida-public/AB6AXuBZi7AteqPH5AZlxbm8taoefPCjitA76DQ1GqpmKcrhFOyFl_tzfM4gVdoxOATihSUTD6s5-97dHcDfsb9fM7AIgcrAnan_VkAkPbfaU6nRwi0kDR6AGbATF7Op3JN3rIx8r3_zOCIJYA8eMUcUrvIkR9URwnLu7TmOFGPkicKHgEsTn27sAKJo8f2E4xNPxvuRxQPfboSIlsud1N-3xvGm7dl3YCeqYM1-6WYQmsQm1s6BwFgwuMmL0bMewbQygrbPl4TWyBuqWRY"
            />
            <SpecialistCard
              name="Dr. Kevin Wu" specialty="Pediatrician" rating="4.8" title="MD Pediatrics"
              desc="Focusing on early intervention and integrative health for neurodiverse children through gentle assessment."
              img="https://lh3.googleusercontent.com/aida-public/AB6AXuCA21CEhV_qYO9FOmNgHSqkI8R09P5OmeGmos2L7-37pi-Vawefp1wSLgOuKXHxzGWa45EUdBaM0hb7mDzEf9Tzxi9Y9hzkJ6FpyYrg0CFmdq32sUB0NWMjlxyfFXsYM-698ySCWrrl9uebtLcG3jXXCZeDzNK1td-hl48l71kd3ShTXLd8ix2g0gY_01649NP4JWOQjaEPqO1FTm11WKo_5eiqH359CaTF-NZS5nzW5IDCFhRPhPysVrZeVSFzB4X-qfqSeU3NvvM"
            />
          </div>

          {/* Pagination */}
          <div className="mt-12 sm:mt-16 lg:mt-20 flex items-center justify-center gap-2 sm:gap-3">
            <button className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-white transition-all shadow-sm"><span className="material-symbols-outlined text-lg sm:text-xl">chevron_left</span></button>
            <button className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center bg-primary text-white font-extrabold shadow-lg text-sm sm:text-base">1</button>
            <button className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-white transition-all shadow-sm font-bold text-sm sm:text-base">2</button>
            <button className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-white transition-all shadow-sm font-bold text-sm sm:text-base">3</button>
            <span className="mx-1 sm:mx-2 text-outline font-bold text-sm sm:text-base">...</span>
            <button className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-white transition-all shadow-sm font-bold text-sm sm:text-base">8</button>
            <button className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-white transition-all shadow-sm"><span className="material-symbols-outlined text-lg sm:text-xl">chevron_right</span></button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
