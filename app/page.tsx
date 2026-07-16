import Link from "next/link";
import Image from "next/image";

/* ── Data ───────────────────────────────────────────────────── */

const POSITIONS = [
  { title: "Ship Building Workers", jp: "造船労働者", icon: "🚢" },
  { title: "Automotive Industry Workers", jp: "自動車産業労働者", icon: "🚗" },
  { title: "Civil Construction Workers", jp: "土木建設労働者", icon: "🏗️" },
  { title: "Semi-conductor Factory Workers", jp: "半導体工場労働者", icon: "💻" },
  { title: "Agriculture Workers", jp: "農業労働者", icon: "🌾" },
  { title: "Food Processing Factory Workers", jp: "食品加工工場労働者", icon: "🏭" },
];

const CORE_VALUES = [
  { en: "Integrity", jp: "誠実さ", icon: "🤝", desc: "Upholding honesty and transparency in every interaction." },
  { en: "Excellence", jp: "卓越性", icon: "⭐", desc: "Striving for the highest quality in recruitment services." },
  { en: "Commitment", jp: "コミットメント", icon: "💪", desc: "Dedicated to our workers' success and wellbeing." },
  { en: "Professionalism", jp: "プロフェッショナリズム", icon: "👔", desc: "Conducting business with skill, competence, and care." },
  { en: "Compassion", jp: "思いやり", icon: "❤️", desc: "Treating every applicant with dignity and respect." },
  { en: "Partnership", jp: "パートナーシップ", icon: "🌏", desc: "Building lasting relationships with global employers." },
];

const TITP_REQUIREMENTS = [
  "Colored Copy of Passport",
  "PSA Birth Certificate",
  "Marriage Certificate (if married)",
  "NBI Clearance",
  "Police Clearance",
  "Barangay Clearance",
  "DMW E-Registration",
  "PEOS Certificate",
  "TESDA Certificate",
  "Form 137 / TOR",
  "Diploma",
  "Letter of Recommendation",
  "DTI / SEC & Mayor's Permit",
  "Vaccination Certificate (VaxCert)",
  "2×2 ID Photo — Formal Attire",
];

const SSW_REQUIREMENTS = [
  "Colored Copy of New Passport",
  "Colored Copy of Old Passport w/ Stamps",
  "DMW E-Registration",
  "PEOS Certificate",
  "JITCO / TITP Completion Certificate",
  "Skill Test Level 3 (2018+ trainees)",
  "Alien Card / Residence Card",
  "NBI Clearance",
  "Police Clearance",
  "Barangay Clearance",
  "Vaccination Certificate (VaxCert)",
  "2×2 ID Photo — Formal Attire",
];

const RECRUITMENT_STEPS = [
  { step: 1, title: "Document Submission", desc: "Submit all required documents in a long white folder with fastener." },
  { step: 2, title: "IQ Test", desc: "Complete Basic Math, Essay, and Logic tests at our office." },
  { step: 3, title: "Application Assessment", desc: "Our team reviews your documents and test results." },
  { step: 4, title: "Pre-Screening & Physical Test", desc: "Physical fitness and skills assessment." },
  { step: 5, title: "Pre-Interview", desc: "Initial interview with our recruitment officers." },
  { step: 6, title: "Pre-Medical Examination", desc: "Health screening and medical check-up." },
  { step: 7, title: "Final Interview & Selection", desc: "Interview with the employer for final selection." },
  { step: 8, title: "Final Medical", desc: "Comprehensive medical examination clearance." },
  { step: 9, title: "JPETS", desc: "Japan Pre-Entry Tuberculosis Screening." },
  { step: 10, title: "BJLEC", desc: "Basic Japanese Language, Ethics and Culture training." },
  { step: 11, title: "Pre-departure Orientation", desc: "Final briefing and travel preparation." },
  { step: 12, title: "Dispatch to Japan", desc: "Deployment to your assigned company in Japan." },
];

/* ── Page ───────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="landing-page" style={{ background: "var(--surface)" }}>
      {/* ═══════════ HEADER ═══════════ */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link href="/" className="landing-logo-link">
            <Image
              src="/LOGO.jpg"
              alt="Phil-Apex Placement Agency Inc."
              width={160}
              height={64}
              className="landing-logo-img"
              priority
            />
          </Link>
          <nav className="landing-nav">
            <a href="#about" className="landing-nav-link">About</a>
            <a href="#programs" className="landing-nav-link">Programs</a>
            <a href="#process" className="landing-nav-link">Process</a>
            <a href="#contact" className="landing-nav-link">Contact</a>
            <Link href="/staff/login" className="landing-nav-link" style={{ color: "var(--ink-faint)" }}>Staff</Link>
          </nav>
          <Link href="/register" className="btn btn-crimson landing-header-cta" id="cta-header-apply">
            Apply Now
          </Link>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden />
        <div className="landing-hero-content">
          <div className="landing-hero-license">
            DMW LICENSE NO.: DMW-514-LB-08132024-R
          </div>
          <h1 className="landing-hero-title">
            Your Gateway to<br />
            <span className="landing-hero-highlight">International Employment</span>
          </h1>
          <p className="landing-hero-subtitle">
            Phil-Apex Placement Agency, Inc. connects skilled Filipino workers with
            reputable employers worldwide — ensuring opportunities that empower
            individuals and strengthen businesses.
          </p>
          <p className="landing-hero-subtitle-jp">
            フィル エイペックス プレイスメント エージェンシーは、熟練したフィリピン人労働者と世界中の評判の良い雇用主を結びつけます。
          </p>
          <div className="landing-hero-actions">
            <Link href="/register" className="btn btn-lg landing-cta-white-btn landing-pulse-btn" id="cta-hero-apply">
              ✍ Apply Now — Start Your Journey
            </Link>
            <a href="#programs" className="btn btn-ghost btn-lg">
              View Programs ↓
            </a>
          </div>
          <p className="landing-hero-notice">
            ⚠ Phil-Apex Placement Agency Inc. does <strong>NOT</strong> collect placement fees from applicants.
          </p>
        </div>
      </section>

      {/* ═══════════ ABOUT ═══════════ */}
      <section id="about" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-label">Company Profile</div>
          <h2 className="landing-section-title">About Phil-Apex</h2>
          
          <div className="landing-about-content">
            <div className="landing-about-text">
              <p>
                At Phil-Apex Placement Agency, Inc., we take pride in being a trusted partner in overseas manpower recruitment and deployment. With a commitment to integrity, efficiency, and professionalism, we connect skilled Filipino workers with reputable employers worldwide—ensuring opportunities that empower individuals and strengthen businesses.
              </p>
              <p>
                Guided by ethical recruitment standards and compliance with government regulations, we provide reliable services that safeguard the welfare of our workers while meeting the manpower needs of our global clients. Our mission is clear: to transform lives by opening doors to international employment while fostering long-term partnerships built on trust, transparency, and excellence.
              </p>
              <p className="landing-about-jp">
                フィル エイペックス プレイスメント エージェンシーは、海外での人材採用と派遣において信頼できるパートナーであることを誇りに思っています。誠実さ、効率性、そしてプロ意識を重視し、熟練したフィリピン人労働者と世界中の評判の良い雇用主を結びつけ、個人のエンパワーメントと企業の強化につながる機会を確保しています。論理的な採用 基準と政府規制の遵守に基づき、世界中のクライアントの人材ニーズを満たしながら、労働者の福祉を守る信頼、透明性、卓越性に基づく長期的なパートナーシップを育みながら、国際的な雇用への扉を開くことで人々の生活を変えることです。
              </p>
            </div>

            <div className="landing-president-card">
              <div className="landing-president-img-wrap">
                <Image 
                  src="/president.webp" 
                  alt="Engr. Alan M. Nuega" 
                  width={280} 
                  height={280} 
                  className="landing-president-img"
                />
              </div>
              <h3 className="landing-president-name">ENGR. ALAN M. NUEGA</h3>
              <p className="landing-president-title">President</p>
              <p className="landing-president-org">PHIL-APEX PLACEMENT AGENCY, INC.</p>
            </div>
          </div>

          {/* Mission / Vision / Goals */}
          <div className="landing-mvg-grid">
            <div className="landing-mvg-card">
              <div className="landing-mvg-icon">🎯</div>
              <h3 className="landing-mvg-title">Vision <span className="landing-jp-label">ビジョン</span></h3>
              <p className="landing-mvg-text">
                To be a globally trusted manpower agency, recognized for excellence,
                integrity, and care for Filipino workers.
              </p>
              <p className="landing-mvg-jp">
                フィリピン人労働者への卓越性、誠実さ、そして配慮で認められ、世界的に信頼される人材派遣会社になること。
              </p>
            </div>
            <div className="landing-mvg-card">
              <div className="landing-mvg-icon">🚀</div>
              <h3 className="landing-mvg-title">Mission <span className="landing-jp-label">ミッション</span></h3>
              <p className="landing-mvg-text">
                To connect skilled Filipinos with trusted employers worldwide, providing
                opportunities that uplift lives and empower businesses.
              </p>
              <p className="landing-mvg-jp">
                熟練したフィリピン人と世界中の信頼できる雇用主を結びつけ、生活を向上させ、企業を強化する機会を提供すること。
              </p>
            </div>
            <div className="landing-mvg-card">
              <div className="landing-mvg-icon">🏆</div>
              <h3 className="landing-mvg-title">Goals <span className="landing-jp-label">目標</span></h3>
              <p className="landing-mvg-text">
                Deliver ethical and efficient recruitment. Build lasting partnerships
                with global employers. Create meaningful opportunities for Filipinos.
              </p>
              <p className="landing-mvg-jp">
                論理的かつ効率的な採用活動を実施し、世界中の雇用主と永続的なパートナーシップを構築します。
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════ OPEN POSITIONS ═══════════ */}
      <section className="landing-section" style={{ background: "var(--navy)" }}>
        <div className="landing-container">
          <div className="landing-section-label" style={{ color: "rgba(255,255,255,.5)" }}>
            Accepting Applicants / 応募受付中
          </div>
          <h2 className="landing-section-title" style={{ color: "#fff" }}>Open Positions for Japan</h2>
          <div className="landing-positions-grid">
            {POSITIONS.map((pos) => (
              <div key={pos.title} className="landing-position-card">
                <div className="landing-position-icon">{pos.icon}</div>
                <div>
                  <p className="landing-position-title">{pos.title}</p>
                  <p className="landing-position-jp">{pos.jp}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link href="/register" className="btn btn-crimson btn-lg" id="cta-positions-apply">
              Apply for a Position →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ PROGRAMS & REQUIREMENTS ═══════════ */}
      <section id="programs" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-label">Japan Programs</div>
          <h2 className="landing-section-title">Programs & Requirements</h2>
          <p className="landing-section-subtitle">
            We currently recruit for two Japan programs. Review the qualifications and
            prepare your documents before applying.
          </p>

          <div className="landing-programs-grid">
            {/* TITP */}
            <div className="landing-program-card">
              <div className="landing-program-header" style={{ background: "var(--navy)" }}>
                <span className="landing-program-badge">TITP</span>
                <h3 className="landing-program-title">Technical Intern Training Program</h3>
                <p className="landing-program-country">🇯🇵 Japan • 3-year program</p>
              </div>
              <div className="landing-program-body">
                <h4 className="landing-req-heading">Qualifications</h4>
                <ul className="landing-qual-list">
                  <li>At least a high school graduate with a TESDA certificate relevant to the position</li>
                  <li>Must have at least one year of work experience related to the industry</li>
                </ul>
                <h4 className="landing-req-heading">Requirements</h4>
                <ul className="landing-req-list">
                  {TITP_REQUIREMENTS.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
                <h4 className="landing-req-heading">IDs Required</h4>
                <div className="landing-id-chips">
                  <span className="landing-id-chip">Passport</span>
                  <span className="landing-id-chip">Pag-IBIG MID #</span>
                  <span className="landing-id-chip">PhilHealth</span>
                  <span className="landing-id-chip">SSS</span>
                </div>
                <div className="landing-folder-note">
                  📁 All documents must be placed in a <strong>long white folder with fastener</strong>.
                </div>
              </div>
            </div>

            {/* SSW */}
            <div className="landing-program-card">
              <div className="landing-program-header" style={{ background: "var(--crimson)" }}>
                <span className="landing-program-badge">SSW</span>
                <h3 className="landing-program-title">Specified Skilled Worker</h3>
                <p className="landing-program-country">🇯🇵 Japan • 5-year program</p>
              </div>
              <div className="landing-program-body">
                <h4 className="landing-req-heading">Qualifications</h4>
                <ul className="landing-qual-list">
                  <li>Must be a former TITP trainee with completion certificate</li>
                  <li>Passed Skill Test Level 3 (for 2018+ trainees)</li>
                </ul>
                <h4 className="landing-req-heading">Requirements</h4>
                <ul className="landing-req-list">
                  {SSW_REQUIREMENTS.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
                <h4 className="landing-req-heading">IDs Required</h4>
                <div className="landing-id-chips">
                  <span className="landing-id-chip">Passport</span>
                  <span className="landing-id-chip">Pag-IBIG MID #</span>
                  <span className="landing-id-chip">PhilHealth</span>
                  <span className="landing-id-chip">SSS</span>
                </div>
                <div className="landing-folder-note">
                  📁 All documents must be placed in a <strong>long white folder with fastener</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ RECRUITMENT FLOW ═══════════ */}
      <section id="process" className="landing-section" style={{ background: "#fff" }}>
        <div className="landing-container">
          <div className="landing-section-label">How It Works</div>
          <h2 className="landing-section-title">Recruitment Process</h2>
          <p className="landing-section-subtitle">
            Your step-by-step journey from application to deployment in Japan.
          </p>

          <div className="landing-steps-grid">
            {RECRUITMENT_STEPS.map((s) => (
              <div key={s.step} className="landing-step-card">
                <div className="landing-step-number">{s.step}</div>
                <div>
                  <p className="landing-step-title">{s.title}</p>
                  <p className="landing-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: "var(--ink-muted)", fontSize: ".875rem", marginBottom: 16 }}>
              Ready to start? We look forward to assisting you throughout the process. <strong>Good luck!</strong>
            </p>
            <Link href="/register" className="btn btn-crimson btn-lg" id="cta-process-apply">
              Start Your Application →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ CORE VALUES ═══════════ */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-label">Core Values / コアバリュー</div>
          <h2 className="landing-section-title">What We Stand For</h2>
          <div className="landing-values-grid">
            {CORE_VALUES.map((v) => (
              <div key={v.en} className="landing-value-card">
                <div className="landing-value-icon">{v.icon}</div>
                <h4 className="landing-value-title">
                  {v.en} <span className="landing-jp-label">{v.jp}</span>
                </h4>
                <p className="landing-value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BANNER ═══════════ */}
      <section className="landing-cta-banner">
        <div className="landing-container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: 8 }}>
            Ready to Work in Japan?
          </h2>
          <p style={{ color: "rgba(255,255,255,.8)", fontSize: ".95rem", maxWidth: 480, margin: "0 auto 24px" }}>
            Take the first step toward your international career.
            Apply online now — it only takes a few minutes.
          </p>
          <Link href="/register" className="btn btn-lg landing-cta-white-btn" id="cta-banner-apply">
            ✍ Apply Now — Free of Charge
          </Link>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer id="contact" className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div>
              <Image
                src="/LOGO.jpg"
                alt="Phil-Apex logo"
                width={140}
                height={56}
                className="landing-footer-logo"
              />
              <p className="landing-footer-tagline">
                Phil-Apex Placement Agency, Inc.
              </p>
              <p className="landing-footer-dmw">
                DMW License: DMW-514-LB-08132024-R
              </p>
            </div>
            <div>
              <h4 className="landing-footer-heading">Contact Us</h4>
              <ul className="landing-footer-contacts">
                <li>📞 (+63) 432-6811</li>
                <li>📱 (+63) 917-300-2107</li>
                <li>📱 (+63) 928-500-8229</li>
                <li>📧 philapexbacolod@gmail.com</li>
              </ul>
            </div>
            <div>
              <h4 className="landing-footer-heading">Visit Us</h4>
              <p className="landing-footer-address">
                Honorata Manalo Road (Buri Road),<br />
                Brgy. Mandalagan, Bacolod City,<br />
                Negros Occidental, Philippines 6100
              </p>
              <div style={{ marginTop: 12 }}>
                <a
                  href="https://www.facebook.com/profile.php?id=61575052498498"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-footer-social"
                >
                  📘 Phil-Apex Placement Agency, Inc.
                </a>
              </div>
            </div>
            <div>
              <h4 className="landing-footer-heading">Quick Links</h4>
              <ul className="landing-footer-links">
                <li><Link href="/register">Apply Now</Link></li>
                <li><a href="#programs">Programs</a></li>
                <li><a href="#process">Recruitment Process</a></li>
                <li><Link href="/staff/login">Staff Portal</Link></li>
              </ul>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p>© {new Date().getFullYear()} Phil-Apex Placement Agency, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
