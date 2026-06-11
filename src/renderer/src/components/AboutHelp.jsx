import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const AboutHelp = () => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  const faqs = [
    { q: t('about.faq_q1'), a: t('about.faq_a1') },
    { q: t('about.faq_q2'), a: t('about.faq_a2') },
    { q: t('about.faq_q3'), a: t('about.faq_a3') },
    { q: t('about.faq_q4'), a: t('about.faq_a4') }
  ];

  const socialLinks = {
    code: [
      { name: 'GitHub', url: 'https://github.com/emirtdede' },
      { name: 'LeetCode', url: 'https://leetcode.com/emirtdede/' },
      { name: 'HackerRank', url: 'https://www.hackerrank.com/emirtdede' },
      { name: 'StackOverflow', url: 'https://stackoverflow.com/users/17289462/emir-dede' },
      { name: 'Kaggle', url: 'https://www.kaggle.com/emirdede' },
      { name: 'ReadyTensor', url: 'https://app.readytensor.ai/users/emirtdede' },
      { name: 'ORCID', url: 'https://orcid.org/my-orcid?orcid=0009-0006-1356-0316' }
    ],
    prof: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/in/emirtdede/' },
      { name: 'Google Developers', url: 'https://developers.google.com/profile/u/emirtdede' }
    ],
    social: [
      { name: 'YouTube', url: 'https://www.youtube.com/@emirtdede' },
      { name: 'Medium', url: 'https://emirtdede.medium.com/' },
      { name: 'Twitter', url: 'https://twitter.com/emirtdede' },
      { name: 'Twitch', url: 'https://www.twitch.tv/Mexonom' },
      { name: 'Instagram', url: 'https://www.instagram.com/emirtdede/' },
      { name: 'Quora', url: 'https://www.quora.com/profile/Emir-Dede-1' },
      { name: 'Pinterest', url: 'https://tr.pinterest.com/emirtdede/' },
      { name: 'Reddit', url: 'https://www.reddit.com/user/emirtdede/' }
    ]
  };

  const renderLinks = (links) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '0.5rem' }}>
      {links.map((link, i) => (
        <a 
          key={i} 
          href={link.url} 
          target="_blank" 
          rel="noreferrer"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.3rem', 
            background: 'rgba(56, 189, 248, 0.1)', 
            color: '#38bdf8', 
            padding: '0.4rem 0.8rem', 
            borderRadius: '20px', 
            textDecoration: 'none',
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)' }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)' }}
        >
          {link.name} <ExternalLink size={12} />
        </a>
      ))}
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Project Info */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 className="card-title" style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem', textAlign: 'center' }}>
          {t('about.hero_title')}
        </h2>
        <h4 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: '1.5rem', fontWeight: '500' }}>
          {t('about.hero_subtitle')}
        </h4>
        <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '2rem', fontSize: '1rem', textAlign: 'justify' }}>
          {t('about.hero_desc')}
        </p>

        <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          {t('about.section_aim_title')}
        </h3>
        <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '2rem', fontSize: '0.95rem', textAlign: 'justify' }}>
          {t('about.section_aim_desc')}
        </p>

        <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          {t('about.section_why_title')}
        </h3>
        <ul style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '0.95rem', paddingLeft: '1.2rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <li><strong style={{ color: '#e2e8f0' }}>{t('about.why_1_title')}</strong> {t('about.why_1_desc')}</li>
          <li><strong style={{ color: '#e2e8f0' }}>{t('about.why_2_title')}</strong> {t('about.why_2_desc')}</li>
          <li><strong style={{ color: '#e2e8f0' }}>{t('about.why_3_title')}</strong> {t('about.why_3_desc')}</li>
          <li><strong style={{ color: '#e2e8f0' }}>{t('about.why_4_title')}</strong> {t('about.why_4_desc')}</li>
          <li><strong style={{ color: '#e2e8f0' }}>{t('about.why_5_title')}</strong> {t('about.why_5_desc')}</li>
        </ul>

        <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          {t('about.section_how_title')}
        </h3>
        <p style={{ color: '#38bdf8', marginBottom: '1rem', fontWeight: '500' }}>{t('about.how_subtitle')}</p>
        <ul style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '0.95rem', paddingLeft: '1.2rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <li><strong style={{ color: '#e2e8f0' }}>{t('about.how_1_title')}</strong> {t('about.how_1_desc')}</li>
          <li><strong style={{ color: '#e2e8f0' }}>{t('about.how_2_title')}</strong> {t('about.how_2_desc')}</li>
          <li><strong style={{ color: '#e2e8f0' }}>{t('about.how_3_title')}</strong> {t('about.how_3_desc')}</li>
          <li><strong style={{ color: '#e2e8f0' }}>{t('about.how_4_title')}</strong> {t('about.how_4_desc')}</li>
        </ul>

        <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
          <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{t('about.conclusion_1')}</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>{t('about.conclusion_2')}</p>
        </div>
      </div>

      {/* SSS Accordion */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('about.faq')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              style={{ 
                border: '1px solid var(--glass-border)', 
                borderRadius: '8px', 
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)'
              }}
            >
              <button 
                onClick={() => toggleFaq(idx)}
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem', 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-main)', 
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {faq.q}
                {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              
              <div style={{ 
                maxHeight: openFaq === idx ? '500px' : '0', 
                overflow: 'hidden', 
                transition: 'max-height 0.3s ease',
                background: 'rgba(0,0,0,0.1)'
              }}>
                <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Details & Social */}
      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>
          {t('about.dev_info')} Emir Tarık Dede
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem' }}>
              {t('about.cat_code')}
            </h4>
            {renderLinks(socialLinks.code)}
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem' }}>
              {t('about.cat_prof')}
            </h4>
            {renderLinks(socialLinks.prof)}
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem' }}>
              {t('about.cat_social')}
            </h4>
            {renderLinks(socialLinks.social)}
          </div>

        </div>
      </div>

    </div>
  );
};

export default AboutHelp;
