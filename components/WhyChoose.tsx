'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Star, Gem, Heart } from 'lucide-react';

const CARDS = [
  {
    Icon: AlertCircle,
    iconBg: '#1a3a33',
    iconColor: '#ffffff',
    title: "What's the problem?",
    desc: "Choosing a ring feels overwhelming. Too many styles, confusing choices, sky-high prices, and the fear of getting it wrong.",
  },
  {
    Icon: Star,
    iconBg: '#f5e6c8',
    iconColor: '#c49a3c',
    title: "What's the Idea?",
    desc: "Simplify the journey of buying rings so you can focus on the moment, not the stress.",
  },
  {
    Icon: Gem,
    iconBg: '#d6e8d0',
    iconColor: '#3a7a52',
    title: "What Gems GLobal created?",
    desc: "Most thoughtfully designed diamond rings that celebrates your love, fits your budget, and lasts forever.",
  },
  {
    Icon: Heart,
    iconBg: '#f0d8d8',
    iconColor: '#b05555',
    title: "What You'll Feel?",
    desc: 'The confidence of knowing you chose the right ring... and the joy of seeing her say "yes" with happy tears.',
  },
];

export default function WhyChoose() {
  return (
    <section className='why-choose-section'>
      <style>{`
        .why-choose-section {
          background: #ffffff;
          padding: 72px 48px 80px;
          font-family: "Lato", "Helvetica Neue", sans-serif;
        }
        .why-choose-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (max-width: 1024px) {
          .why-choose-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .why-choose-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .why-choose-section {
            padding: 40px 20px;
          }
        }
      `}</style>

      {/* Header */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: 'center',
          fontFamily: '"Montserrat", sans-serif',
          fontSize: 10,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#9e9489',
          margin: '0 0 10px',
        }}
      >
        Our Story
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.05 }}
        style={{
          textAlign: 'center',
          fontFamily: '"Cormorant Garamond", "Garamond", "Times New Roman", serif',
          fontSize: 'clamp(32px, 4vw, 48px)',
          fontWeight: 400,
          letterSpacing: '-0.01em',
          color: '#1a1714',
          margin: '0 0 56px',
          lineHeight: 1.1,
        }}
      >
        Why GEMS GLOBAL JEWELS Exists?
      </motion.h2>

      {/* Cards Grid */}
      <div className="why-choose-grid">
        {CARDS.map((card, i) => {
          const CardIcon = card.Icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
              style={{
                background: '#ffffff',
                border: '1px solid #e8e4dc',
                borderRadius: 14,
                padding: '36px 28px 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'default',
                transition: 'box-shadow 0.3s ease',
              }}
            >
              {/* Icon Circle */}
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: card.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 22,
                  flexShrink: 0,
                }}
              >
                <CardIcon size={22} color={card.iconColor} strokeWidth={1.6} />
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: '"Cormorant Garamond", "Garamond", serif',
                  fontSize: 19,
                  fontWeight: 500,
                  color: '#1a1714',
                  margin: '0 0 12px',
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                }}
              >
                {card.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.75,
                  color: '#7a746c',
                  fontWeight: 400,
                  margin: 0,
                }}
              >
                {card.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}