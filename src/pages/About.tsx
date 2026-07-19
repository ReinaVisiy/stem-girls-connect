import React from 'react';
import { Target, Eye, Users, CheckCircle2 } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';

const About: React.FC = () => {
  const bureau = [
    { name: "Visiy Edna Buhnyuy", position: "Chairperson and CEO", initials: "VE", link: "https://www.linkedin.com/in/reina-visiy", image:""},
    { name: "Visiy Reina Kinyuy", position: "Programs Officer", initials: "VR", link: "https://www.linkedin.com/in/reina-visiy", image: "/Reina.jpg"},
    { name: "Lendzele Odile Berinyuy", position: "Accounting Officer", initials: "LO", link: "https://www.linkedin.com/company/stem-girls-connect/", image: ""},
    { name: "Mbako Precious", position: "Administrative Secretary", initials: "MP", link: "https://www.linkedin.com/company/stem-girls-connect/", image: ""},
    { name: "Lemnyuy Telma", position: "Deputy Administrative Secretary", initials: "LT", link: "https://www.linkedin.com/company/stem-girls-connect/", image: ""},
    { name: "Gracious Rinyu", position: "Deputy Programs Officer", initials: "GR", link: "https://www.linkedin.com/company/stem-girls-connect/", image: ""},
  ];

  const objectives = [
    "Share ideas and gain inspiration for STEM careers.",
    "Access resources and information on excelling in STEM.",
    "Talent discovery through professional mentorship.",
    "Empowerment through basic STEM and leadership skills.",
    "Networking for personal, social, and professional development.",
    "Securing scholarships and funding for girls in STEM fields."
  ];

  return (
    <div className="pb-24">
      <PageHeader 
        title="Who We Are" 
        subtitle="Nuturing Women in STEM" 
      />

      <section className="container mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-12 mb-24">
          <ScrollReveal className="bg-[#486e7c]/5 p-10 rounded-[50px] border border-gray-100 flex flex-col h-full hover:shadow-2xl transition-all">
            <Target color="#82246d" size={48} className="mb-6" />
            <h2 className="text-3xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Mission</h2>
            <p className="text-brandSlate text-lg leading-relaxed text-justify font-bold">
              To bring together and empower girls and young women in STEM related fields.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={200} className="bg-[#486e7c]/5 p-10 rounded-[50px] border border-gray-100 flex flex-col h-full hover:shadow-2xl transition-all">
            <Eye color="#82246d" size={48} className="mb-6" />
            <h2 className="text-3xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Vision</h2>
            <p className="text-brandSlate text-lg leading-relaxed text-justify font-bold">
              To close the gender gap in STEM fields by empowering and supporting girls and young women to explore, learn and succeed in STEM.
            </p>
          </ScrollReveal>
        </div>

        {/* Team Photo */}
        <ScrollReveal className="max-w-4xl mx-auto mb-24 rounded-[50px] overflow-hidden shadow-2xl border-4 border-brandPink/10 aspect-video">
          <img
            src="/Group SGC pic Bamenda.jpg"
            alt="STEM Girls Connect team in Bamenda"
            className="w-full h-full object-cover"
          />
        </ScrollReveal>

        {/* Our Objectives Section */}
        <ScrollReveal className="bg-white p-5 rounded-[60px] border-2 border-brandPink/10 shadow-xl max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-brandGreen mb-10 uppercase tracking-tighter text-center">Our Objectives</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {objectives.map((obj, i) => (
              <div key={i} className="flex items-start space-x-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <CheckCircle2 color="#82246d" size={24} className="mt-1 flex-shrink-0" />
                <p className="text-brandSlate font-semibold text-sm leading-relaxed">{obj}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/*Official Bureau */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-6">
          <ScrollReveal className="text-center mb-20">
            <Users color="#82246d" size={48} className="mx-auto mb-6" />
            <h2 className="text-3xl font-extrabold text-brandGreen uppercase tracking-tighter">Bureau</h2>
            <p className="text-brandSlate font-bold mt-2 uppercase tracking-widest text-xs italic">Executive Comittee</p>
          </ScrollReveal>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {bureau.map((leader, i) => (
              <ScrollReveal key={i} delay={i * 100} className="text-center group">
                <div className="w-32 h-32 md:w-44 md:h-44 bg-brandPink/5 border-2 border-brandPink/10 rounded-full mx-auto mb-6 flex items-center justify-center text-brandPink font-extrabold text-2xl md:text-4xl shadow-lg relative overflow-hidden group-hover:bg-brandPink group-hover:text-white transition-all duration-500">
                  {leader.image ? (
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className="w-full h-full object-cover"
                    />):( 
                      <span className="relative z-10">{leader.initials}</span>)
                  }
                </div>
                <a 
                  href={leader.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block group"
                >
                  <h3 className="text-lg font-extrabold text-gray-900 leading-tight group-hover:text-brandPink group-hover:underline decoration-brandPink decoration-2 underline-offset-8 transition-all">
                    {leader.name}
                  </h3>
                </a>
                <div className="h-0.5 w-12 bg-brandPink mx-auto my-4 opacity-30 group-hover:w-24 transition-all"></div>
                <p className="text-brandPink font-bold text-[10px] uppercase tracking-[0.2em] px-4 leading-tight">{leader.position}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;