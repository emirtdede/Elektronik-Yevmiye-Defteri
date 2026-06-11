import React, { useState } from 'react';

const TagInput = ({ tags, setTags, placeholder = "Etiket ekle (Enter veya virgül ile ayırın)" }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const handleBlur = () => {
    addTag(inputValue);
  };

  const addTag = (value) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  // Modern UI/UX Guidelines: Vivid colors and soft background
  const tagColors = [
    { bg: '#fee2e2', text: '#b91c1c' }, // Red
    { bg: '#dcfce7', text: '#15803d' }, // Green
    { bg: '#e0e7ff', text: '#4338ca' }, // Indigo
    { bg: '#fef3c7', text: '#b45309' }, // Amber
    { bg: '#f3e8ff', text: '#7e22ce' }, // Purple
    { bg: '#e0f2fe', text: '#0369a1' }  // Sky
  ];

  const getColor = (tag) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % tagColors.length;
    return tagColors[index];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.5rem',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          minHeight: '42px',
          alignItems: 'center'
        }}
      >
        {tags.map((tag, index) => {
          const color = getColor(tag);
          return (
            <span 
              key={index} 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                backgroundColor: color.bg,
                color: color.text,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: color.text,
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: '0.25rem',
                  fontSize: '1rem',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.7
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
              >
                &times;
              </button>
            </span>
          );
        })}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : "Yeni etiket..."}
          style={{
            flex: 1,
            minWidth: '120px',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            color: 'var(--text-color)',
            fontSize: '0.9rem'
          }}
        />
      </div>
    </div>
  );
};

export default TagInput;
