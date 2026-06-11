import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const AboutHelp = () => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    { q: t('about.faq_q4'), a: t('about.faq_a4') },
    {
      q: t('about.faq_q5', 'Bilgisayarıma format atarsam veya uygulamayı silersem verilerim gider mi? Yedekleme ve Geri Yükleme nasıl yapılır?'),
      a: t('about.faq_a5', 'Evet, uygulama çevrimdışı (offline-first) çalıştığı için tüm verileriniz yerel bilgisayarınızda saklanır. Format atmadan önce verilerinizi korumak için:\n\n1. Ayarlar -> Sistem Güvenliği sayfasındaki "Tüm Veritabanını Yedekle (.sqlite)" butonuna basarak yedeğinizi alın.\n2. Yeni bilgisayarda uygulamayı açıp, Ayarlar sayfasındaki "Yedek Veritabanını Geri Yükle" alanına bu .sqlite dosyasını sürükleyip bırakarak sisteminizi otonom geri yükleyin (uygulama otomatik olarak yedeğin üzerine yazıp yeniden başlayacaktır).')
    },
    {
      q: t('about.faq_q6', 'Yerel Ağ (LAN) Mobil Fotoğraf Yükleyicisi nasıl çalışır?'),
      a: t('about.faq_a6', 'Malzeme İrsaliyesi veya Kalite Kontrol Tutanakları eklerken "Mobilden Yükle (QR)" butonuna bastığınızda, uygulama bilgisayarınızda geçici bir yerel ağ sunucusu (LAN Express server) açar. Telefonunuzla QR kodu okuttuğunuzda, telefon kamerasıyla çektiğiniz irsaliye resimleri internet / bulut maliyeti olmaksızın doğrudan bilgisayarınızdaki uygulamaya yüklenir.')
    },
    {
      q: t('about.faq_q7', 'Şantiye jurnallerindeki hava durumu bilgisi nereden çekilir?'),
      a: t('about.faq_a7', 'Şantiye Yönetimi sayfasından şantiyenizin lokasyon bilgisini (örneğin "İstanbul, TR") girdikten sonra Günlük Jurnal sekmesini açtığınızda, sistem otomatik olarak OpenWeather API üzerinden günün hava sıcaklık ve durum bilgisini şantiyenin konumuna göre otonom olarak çeker. İnternet olmaması durumunda ise sistem gerçekçi simüle değerler atar.')
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            background: 'var(--accent-bg)', 
            color: 'var(--accent)', 
            padding: '0.4rem 0.8rem', 
            borderRadius: '20px', 
            textDecoration: 'none',
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent-bg-hover)' }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--accent-bg)' }}
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
        <h4 style={{ color: 'var(--accent)', textAlign: 'center', marginBottom: '1.5rem', fontWeight: '500' }}>
          {t('about.hero_subtitle')}
        </h4>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2rem', fontSize: '1rem', textAlign: 'justify' }}>
          {t('about.hero_desc')}
        </p>

        <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
          {t('about.section_aim_title')}
        </h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2rem', fontSize: '0.95rem', textAlign: 'justify' }}>
          {t('about.section_aim_desc')}
        </p>

        <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontSize: '1.3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
          {t('about.section_why_title')}
        </h3>
        <ul style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '0.95rem', paddingLeft: '1.2rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <li><strong style={{ color: 'var(--text-main)' }}>{t('about.why_1_title')}</strong> {t('about.why_1_desc')}</li>
          <li><strong style={{ color: 'var(--text-main)' }}>{t('about.why_2_title')}</strong> {t('about.why_2_desc')}</li>
          <li><strong style={{ color: 'var(--text-main)' }}>{t('about.why_3_title')}</strong> {t('about.why_3_desc')}</li>
          <li><strong style={{ color: 'var(--text-main)' }}>{t('about.why_4_title')}</strong> {t('about.why_4_desc')}</li>
          <li><strong style={{ color: 'var(--text-main)' }}>{t('about.why_5_title')}</strong> {t('about.why_5_desc')}</li>
        </ul>

        <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
          {t('about.section_how_title')}
        </h3>
        <p style={{ color: 'var(--accent)', marginBottom: '1rem', fontWeight: '500' }}>{t('about.how_subtitle')}</p>
        <ul style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '0.95rem', paddingLeft: '1.2rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <li><strong style={{ color: 'var(--text-main)' }}>{t('about.how_1_title')}</strong> {t('about.how_1_desc')}</li>
          <li><strong style={{ color: 'var(--text-main)' }}>{t('about.how_2_title')}</strong> {t('about.how_2_desc')}</li>
          <li><strong style={{ color: 'var(--text-main)' }}>{t('about.how_3_title')}</strong> {t('about.how_3_desc')}</li>
          <li><strong style={{ color: 'var(--text-main)' }}>{t('about.how_4_title')}</strong> {t('about.how_4_desc')}</li>
        </ul>

        <div style={{ background: 'var(--accent-bg)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
          <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{t('about.conclusion_1')}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>{t('about.conclusion_2')}</p>
        </div>
      </div>

      {/* SSS Accordion */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>{t('about.faq')}</h3>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('about.faq_search_placeholder', 'Sıkça sorulan sorularda ara...')} 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredFaqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{t('about.faq_no_results', 'Aradığınız kriterlere uygun soru bulunamadı.')}</div>
          ) : (
            filteredFaqs.map((faq, idx) => (
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
                  background: 'var(--log-bg)'
                }}>
                  <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {faq.a}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Developer Details & Social */}
      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>
          {t('about.dev_info')} Emir Tarık Dede
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem' }}>
              {t('about.cat_code')}
            </h4>
            {renderLinks(socialLinks.code)}
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem' }}>
              {t('about.cat_prof')}
            </h4>
            {renderLinks(socialLinks.prof)}
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem' }}>
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
