// page.tsx - Enhanced with proper animations, Japanese aesthetic, and comprehensive city list
"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { fetchWeather, fetchGeminiResponse } from '@/lib/api';
import { WeatherData } from '@/lib/constants';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import MessageTime from "@/components/MessageTime";



// --- Types & Interfaces ---

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  weatherData?: WeatherData;
  sources?: { uri: string; title: string }[];
}

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

// --- Helper Functions ---

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;')
   .replace(/'/g, '&#39;');

const linkify = (s: string): string =>
  s.replace(/\b(https?:\/\/[^\s<]+)\b/gi, (m) => `<a href="${m}" target="_blank" rel="noopener noreferrer">${m}</a>`);

const applyInlineEmphasis = (s: string): string => {
  const keywords = [
    'today', 'tonight', 'this morning', 'this afternoon', 'this evening',
    'rain', 'snow', 'thunderstorm', 'storm', 'clear', 'sunny', 'cloudy', 'overcast', 'drizzle', 'humid', 'dry', 'windy',
    'hot', 'very hot', 'warm', 'cool', 'cold', 'chilly',
    'uv index', 'air quality', 'visibility',
    'warning', 'alert', 'advisory'
  ];
  let out = s;
  // Temperatures like 23°C or 72°F
  out = out.replace(/(-?\d+(?:\.\d+)?)\s?°\s?[CF]/gi, '<strong>$&</strong>');
  // Percentages
  out = out.replace(/(\b\d{1,3})%/g, '<strong>$1%</strong>');
  // Speed units
  out = out.replace(/(\b\d+(?:\.\d+)?)\s?(?:m\/s|km\/?h|kph|mph)\b/gi, '<strong>$&</strong>');
  // Time
  out = out.replace(/\b(\d{1,2})(?:[:.]\d{2})?\s?(?:am|pm)\b/gi, '<strong>$&</strong>');
  
  // Highlight gear/advice words
  const highlight = ['umbrella', 'raincoat', 'jacket', 'coat', 'sunscreen', 'water', 'mask', 'hydrated', 'layers'];
  highlight.forEach(w => {
    const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    out = out.replace(re, '<span class="hl">$&</span>');
  });
  
  // Bold keywords
  keywords.forEach(w => {
    const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    out = out.replace(re, '<strong>$&</strong>');
  });
  return out;
};

const formatAssistantHtml = (text: string): { __html: string } => {
  const lines = text.split(/\r?\n/);
  let html = '';
  let inList = false;
  const bulletRe = /^\s*[-•]\s+(.*)$/;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(bulletRe);
    if (bullet) {
      if (!inList) { html += '<ul class="assistant-list">'; inList = true; }
      const item = applyInlineEmphasis(linkify(escapeHtml(bullet[1])));
      html += `<li>${item}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (line.trim() === '') { html += '<br />'; }
      else {
        const content = applyInlineEmphasis(linkify(escapeHtml(line)));
        html += `<p>${content}</p>`;
      }
    }
  }
  if (inList) html += '</ul>';
  return { __html: html };
};

// --- Components ---

const LoadingSpinner = ({ darkMode }: { darkMode: boolean }) => (
  <div className="flex justify-center items-center p-2">
    <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${darkMode ? 'border-yellow-400' : 'border-orange-500'}`}></div>
    <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {darkMode ? '考え中...' : 'Thinking...'}
    </span>
  </div>
);

const App: React.FC = () => {
  // State
  const [userInput, setUserInput] = useState<string>('');
  const [location, setLocation] = useState<string>('Tokyo');
  const [voiceLanguage, setVoiceLanguage] = useState<string>('ja-JP');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'お天気ペディ 🔍 気軽に話しかけてください！\n(Weather Buddy 🌟 Feel free to chat with me!)',
      timestamp: new Date()
    }
  ]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState<boolean>(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [compactHeader, setCompactHeader] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  
  // Animation State
  const [cherryBlossoms, setCherryBlossoms] = useState<Particle[]>([]);
  const [snowflakes, setSnowflakes] = useState<Particle[]>([]);

  // Refs
  const compactRef = useRef<boolean>(false);
  const tickingRef = useRef<boolean>(false);
  const lastToggleRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // 1. Initial Mount & Theme Check
  useEffect(() => {
    setMounted(true);
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = saved ? saved === 'dark' : prefersDark;
      setDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    } catch {}
  }, []);

  // 2. Update Weather Elements (Snow/Blossoms) based on Dark Mode
  useEffect(() => {
    if (darkMode) {
      // Dark Mode = Snowflakes (Moon/Winter theme) - More snowflakes
      const flakes = Array.from({ length: 35 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 15,
        duration: 8 + Math.random() * 12
      }));
      setSnowflakes(flakes);
      setCherryBlossoms([]);
    } else {
      // Light Mode = Cherry Blossoms (Sun/Spring theme) - More blossoms
      const blossoms = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 10
      }));
      setCherryBlossoms(blossoms);
      setSnowflakes([]);
    }
  }, [darkMode]);

  // 3. Scroll Handling
  useEffect(() => {
    const ENTER_COMPACT_AT = 120; 
    const EXIT_COMPACT_AT = 48;   
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        try {
          const doc = document.documentElement;
          const y = window.scrollY || doc.scrollTop || 0;
          const nearBottom = window.innerHeight + y >= (doc.scrollHeight - 120);
          setShowScrollButton(!nearBottom);

          let nextCompact = compactRef.current;
          if (!nextCompact && y > ENTER_COMPACT_AT) nextCompact = true;
          else if (nextCompact && y < EXIT_COMPACT_AT) nextCompact = false;

          if (nextCompact !== compactRef.current) {
            const now = Date.now();
            if (now - lastToggleRef.current > 250) {
              lastToggleRef.current = now;
              compactRef.current = nextCompact;
              setCompactHeader(nextCompact);
            }
          }
        } finally {
          tickingRef.current = false;
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 4. Auto Scroll to Bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handlers ---

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
      return next;
    });
  }, []);

  

  const detectCity = useCallback((text: string) => {
    try {
      const lowerText = text.toLowerCase();
      
      // Extensive Map: Japanese Input (Kanji/Kana) -> English City Name for API
      const cityMap: { [key: string]: string } = {
        // --- JAPAN: Major & Designated Cities ---
        '東京': 'Tokyo', 'とうきょう': 'Tokyo', '東京都': 'Tokyo',
        '大阪': 'Osaka', 'おおさか': 'Osaka', '大阪市': 'Osaka',
        '横浜': 'Yokohama', 'よこはま': 'Yokohama',
        '名古屋': 'Nagoya', 'なごや': 'Nagoya',
        '札幌': 'Sapporo', 'さっぽろ': 'Sapporo',
        '福岡': 'Fukuoka', 'ふくおか': 'Fukuoka',
        '神戸': 'Kobe', 'こうべ': 'Kobe',
        '京都': 'Kyoto', 'きょうと': 'Kyoto',
        '川崎': 'Kawasaki', 'かわさき': 'Kawasaki',
        'さいたま': 'Saitama', 'さいたまし': 'Saitama',
        '広島': 'Hiroshima', 'ひろしま': 'Hiroshima',
        '仙台': 'Sendai', 'せんだい': 'Sendai',
        '北九州': 'Kitakyushu', 'きたきゅうしゅう': 'Kitakyushu',
        '千葉': 'Chiba', 'ちば': 'Chiba',
        '堺': 'Sakai', 'さかい': 'Sakai',
        '新潟': 'Niigata', 'にいがた': 'Niigata',
        '浜松': 'Hamamatsu', 'はままつ': 'Hamamatsu',
        '熊本': 'Kumamoto', 'くまもと': 'Kumamoto',
        '相模原': 'Sagamihara', 'さがみはら': 'Sagamihara',
        '静岡': 'Shizuoka', 'しずおか': 'Shizuoka',
        '岡山': 'Okayama', 'おかやま': 'Okayama',
        '鹿児島': 'Kagoshima', 'かごしま': 'Kagoshima',
        '八王子': 'Hachioji', 'はちおうじ': 'Hachioji',
        '姫路': 'Himeji', 'ひめじ': 'Himeji',
        '宇都宮': 'Utsunomiya', 'うつのみや': 'Utsunomiya',
        '松山': 'Matsuyama', 'まつやま': 'Matsuyama',
        '東大阪': 'Higashiosaka', 'ひがしおおさか': 'Higashiosaka',
        '西宮': 'Nishinomiya', 'にしのみや': 'Nishinomiya',
        '尼崎': 'Amagasaki', 'あまがさき': 'Amagasaki',
        '船橋': 'Funabashi', 'ふなばし': 'Funabashi',
        '金沢': 'Kanazawa', 'かなざわ': 'Kanazawa',
        '豊田': 'Toyota', 'とよた': 'Toyota',
        '高松': 'Takamatsu', 'たかまつ': 'Takamatsu',
        '富山': 'Toyama', 'とやま': 'Toyama',
        '長崎': 'Nagasaki', 'ながさき': 'Nagasaki',
        '岐阜': 'Gifu', 'ぎふ': 'Gifu',
        '宮崎': 'Miyazaki', 'みやざき': 'Miyazaki',
        '長野': 'Nagano', 'ながの': 'Nagano',
        '和歌山': 'Wakayama', 'わかやま': 'Wakayama',
        '奈良': 'Nara', 'なら': 'Nara',
        '大分': 'Oita', 'おおいた': 'Oita',
        '旭川': 'Asahikawa', 'あさひかわ': 'Asahikawa',
        'いわき': 'Iwaki', '高知': 'Kochi', 'こうち': 'Kochi',
        '高崎': 'Takasaki', 'たかさき': 'Takasaki',
        '郡山': 'Koriyama', 'こおりやま': 'Koriyama',
        '那覇': 'Naha', 'なは': 'Naha',
        '川越': 'Kawagoe', 'かわごえ': 'Kawagoe',
        '秋田': 'Akita', 'あきた': 'Akita',
        '大津': 'Otsu', 'おおつ': 'Otsu',
        '越谷': 'Koshigaya', 'こしがや': 'Koshigaya',
        '前橋': 'Maebashi', 'まえばし': 'Maebashi',
        '四日市': 'Yokkaichi', 'よっかいち': 'Yokkaichi',
        '盛岡': 'Morioka', 'もりおか': 'Morioka',
        '久留米': 'Kurume', 'くるめ': 'Kurume',
        '春日井': 'Kasugai', 'かすがい': 'Kasugai',
        '青森': 'Aomori', 'あおもり': 'Aomori',
        '明石': 'Akashi', 'あかし': 'Akashi',
        '函館': 'Hakodate', 'はこだて': 'Hakodate',
        '福島': 'Fukushima', 'ふくしま': 'Fukushima',
        '水戸': 'Mito', 'みと': 'Mito',
        '福井': 'Fukui', 'ふくい': 'Fukui',
        '甲府': 'Kofu', 'こうふ': 'Kofu',
        '津': 'Tsu', 'つ': 'Tsu',
        '徳島': 'Tokushima', 'とくしま': 'Tokushima',
        '松江': 'Matsue', 'まつえ': 'Matsue',
        '鳥取': 'Tottori', 'とっとり': 'Tottori',
        '山口': 'Yamaguchi', 'やまぐち': 'Yamaguchi',
        '佐賀': 'Saga', 'さが': 'Saga',
        
        // --- WORLD: Asia ---
        'ソウル': 'Seoul', '北京': 'Beijing', '上海': 'Shanghai',
        'バンコク': 'Bangkok', 'シンガポール': 'Singapore', '台北': 'Taipei',
        '香港': 'Hong Kong', 'マニラ': 'Manila', 'ジャカルタ': 'Jakarta',
        'クアラルンプール': 'Kuala Lumpur', 'ハノイ': 'Hanoi', 'ホーチミン': 'Ho Chi Minh City',
        'ニューデリー': 'New Delhi', 'デリー': 'Delhi', 'ムンバイ': 'Mumbai',
        'ドバイ': 'Dubai', 'イスタンブール': 'Istanbul',

        // --- WORLD: North America ---
        'ニューヨーク': 'New York', 'ロサンゼルス': 'Los Angeles', 'ロス': 'Los Angeles',
        'シカゴ': 'Chicago', 'ヒューストン': 'Houston', 'フェニックス': 'Phoenix',
        'フィラデルフィア': 'Philadelphia', 'サンアントニオ': 'San Antonio',
        'サンディエゴ': 'San Diego', 'ダラス': 'Dallas', 'サンノゼ': 'San Jose',
        'サンフランシスコ': 'San Francisco', 'シアトル': 'Seattle',
        'ワシントン': 'Washington', 'ボストン': 'Boston', 'ラスベガス': 'Las Vegas',
        'マイアミ': 'Miami', 'アトランタ': 'Atlanta', 'ホノルル': 'Honolulu',
        'バンクーバー': 'Vancouver', 'トロント': 'Toronto', 'モントリオール': 'Montreal',
        'メキシコシティ': 'Mexico City',

        // --- WORLD: Europe ---
        'ロンドン': 'London', 'パリ': 'Paris', 'ベルリン': 'Berlin',
        'マドリード': 'Madrid', 'ローマ': 'Rome', 'アムステルダム': 'Amsterdam',
        'ウィーン': 'Vienna', 'ダブリン': 'Dublin', 'ブリュッセル': 'Brussels',
        'リスボン': 'Lisbon', 'チューリッヒ': 'Zurich', 'ジュネーブ': 'Geneva',
        'プラハ': 'Prague', 'ブダペスト': 'Budapest', 'ワルシャワ': 'Warsaw',
        'アテネ': 'Athens', 'ストックホルム': 'Stockholm', 'オスロ': 'Oslo',
        'コペンハーゲン': 'Copenhagen', 'ヘルシンキ': 'Helsinki', 'モスクワ': 'Moscow',
        'バルセロナ': 'Barcelona', 'ミラノ': 'Milan', 'ミュンヘン': 'Munich',

        // --- WORLD: Oceania ---
        'シドニー': 'Sydney', 'メルボルン': 'Melbourne', 'ブリスベン': 'Brisbane',
        'パース': 'Perth', 'オークランド': 'Auckland', 'ウェリントン': 'Wellington',

        // --- WORLD: South America ---
        'サンパウロ': 'Sao Paulo', 'リオデジャネイロ': 'Rio de Janeiro',
        'ブエノスアイレス': 'Buenos Aires', 'リマ': 'Lima', 'サンティアゴ': 'Santiago',

        // --- WORLD: Africa ---
        'カイロ': 'Cairo', 'ヨハネスブルグ': 'Johannesburg', 'ケープタウン': 'Cape Town',
        'ナイロビ': 'Nairobi', 'ラゴス': 'Lagos'
      };
      
      const commonCities = [
        // Japan
        'tokyo', 'osaka', 'kyoto', 'yokohama', 'kobe', 'nagoya', 'fukuoka', 'sapporo', 'sendai', 'hiroshima',
        'nara', 'okinawa', 'naha', 'kanazawa', 'nagasaki', 'kagoshima', 'shizuoka', 'kumamoto', 'okayama',
        'niigata', 'hamamatsu', 'sagamihara', 'chiba', 'saitama', 'kawasaki', 'kitakyushu', 'sakai',
        // USA/Canada
        'new york', 'nyc', 'los angeles', 'la', 'chicago', 'houston', 'phoenix', 'philadelphia',
        'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville', 'fort worth',
        'columbus', 'san francisco', 'charlotte', 'indianapolis', 'seattle', 'denver', 'washington',
        'boston', 'el paso', 'nashville', 'detroit', 'oklahoma city', 'portland', 'las vegas', 'memphis',
        'louisville', 'baltimore', 'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento',
        'atlanta', 'kansas city', 'miami', 'raleigh', 'omaha', 'long beach', 'virginia beach',
        'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans', 'wichita', 'cleveland',
        'bakersfield', 'honolulu', 'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary',
        // Europe
        'london', 'paris', 'berlin', 'madrid', 'rome', 'kyiv', 'bucharest', 'vienna', 'hamburg',
        'warsaw', 'budapest', 'barcelona', 'munich', 'milan', 'prague', 'sofia', 'brussels',
        'birmingham', 'cologne', 'naples', 'stockholm', 'turin', 'marseille', 'amsterdam',
        'zagreb', 'valencia', 'krakow', 'frankfurt', 'seville', 'zaragoza', 'athens', 'riga',
        'helsinki', 'rotterdam', 'stuttgart', 'dusseldorf', 'glasgow', 'copenhagen', 'dublin',
        'lisbon', 'manchester', 'geneva', 'zurich', 'oslo', 'edinburgh', 'reykjavik',
        // Asia (Non-Japan)
        'beijing', 'shanghai', 'seoul', 'bangkok', 'singapore', 'jakarta', 'delhi', 'mumbai',
        'manila', 'taipei', 'hanoi', 'ho chi minh city', 'kuala lumpur', 'hong kong', 'dubai',
        'istanbul', 'dhaka', 'karachi', 'riyadh', 'tel aviv', 'doha', 'abu dhabi',
        // Oceania
        'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'auckland', 'wellington', 'christchurch',
        // South America
        'sao paulo', 'buenos aires', 'rio de janeiro', 'bogota', 'lima', 'santiago', 'caracas',
        // Africa
        'cairo', 'lagos', 'kinshasa', 'johannesburg', 'cape town', 'casablanca', 'nairobi', 'addis ababa'
      ];
      
      // Detection Logic
      // 1. Check for exact English matches in commonCities
      for (const city of commonCities) {
         if (lowerText.includes(city)) return city.charAt(0).toUpperCase() + city.slice(1);
      }
      // 2. Check for Japanese/Mapped matches in cityMap
      for (const [key, val] of Object.entries(cityMap)) {
         if (lowerText.includes(key)) return val;
      }
      
      return null;
    } catch (error) {
      console.error('Error in location detection:', error);
      return null;
    }
  }, []);

  const handleTranscript = useCallback((transcript: string) => {
    try {
      const detectedLocation = detectCity(transcript);
      if (detectedLocation && detectedLocation !== location) {
        setLocation(detectedLocation);
      }
      setUserInput(transcript);
      setShouldAutoSubmit(true);
    } catch (error) {
      console.error('Error processing transcript:', error);
      setUserInput(transcript);
      setShouldAutoSubmit(true);
    }
  }, [location, detectCity]);

  const { isListening, voiceError, isSupported, startListening } = useVoiceInput(handleTranscript, voiceLanguage);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!userInput.trim()) {
      setError('Please enter a message.');
      return;
    }
    
    const typedDetectedCity = detectCity(userInput);
    if (typedDetectedCity && typedDetectedCity !== location) {
      setLocation(typedDetectedCity);
    }

    const cityForFetch = (typedDetectedCity || location || '').trim();
    
    // Basic validation
    if (!typedDetectedCity && cityForFetch.length < 2) {
      setError('Please provide a valid city.');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setLoading(true);

    try {
      let weather: WeatherData;
      try {
        weather = await fetchWeather(cityForFetch);
      } catch (err) {
         // Fallback logic
         weather = await fetchWeather(location); 
      }

      const recentMessages = messages.slice(-5);
      const conversationContext = recentMessages
        .filter(msg => msg.type !== 'system')
        .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      let instruction = "";
      if (voiceLanguage === 'ja-JP') {
        instruction = "\n\nIMPORTANT: Please provide the response in two parts. First, write the complete response in Japanese. Then, immediately follow it with the full English translation enclosed in parentheses. \nFormat:\n[Japanese Text]\n([English Translation])";
      }

      const enhancedQuery = conversationContext 
        ? `Previous conversation:\n${conversationContext}\n\nCurrent question: ${userInput}${instruction}`
        : `${userInput}${instruction}`;

      const response = await fetchGeminiResponse(enhancedQuery, weather, voiceLanguage);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.text,
        timestamp: new Date(),
        weatherData: weather,
        sources: response.sources
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err: unknown) {
      console.error('Chat Error:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'system',
        content: `❌ Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [userInput, location, messages, voiceLanguage, detectCity]);

  // Auto-submit effect
  useEffect(() => {
    if (shouldAutoSubmit && userInput && !loading) {
      setShouldAutoSubmit(false);
      handleSendMessage();
    }
  }, [shouldAutoSubmit, userInput, loading, handleSendMessage]);

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('clear')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return '🌧️';
    if (conditionLower.includes('thunder')) return '⛈️';
    if (conditionLower.includes('snow')) return '🌨️';
    return '🌀';
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      type: 'system',
      content: 'お天気ペディ 🔍 気軽に話しかけてください！\n(Weather Buddy 🌟 Feel free to chat with me!)',
      timestamp: new Date()
    }]);
    setError(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Render ---

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-500">
      
      {/* --- Ambient Background Elements --- */}
      {cherryBlossoms.map(blossom => (
        <div 
          key={blossom.id}
          className="cherry-blossom"
          style={{
            left: `${blossom.left}%`,
            animationDelay: `${blossom.delay}s`,
            animationDuration: `${blossom.duration}s`
          }}
        >
          {Math.random() > 0.5 ? '🌸' : '💮'}
        </div>
      ))}
      
      {snowflakes.map(snowflake => (
        <div 
          key={snowflake.id}
          className="snowflake"
          style={{
            left: `${snowflake.left}%`,
            animationDelay: `${snowflake.delay}s`,
            animationDuration: `${snowflake.duration}s`
          }}
        >
          {Math.random() > 0.5 ? '❄️' : '🌨️'}
        </div>
      ))}

      {/* --- Header --- */}
      <header className={`app-header sticky top-0 z-50 transition-all duration-300 ${compactHeader ? 'p-2' : 'p-4'}`}>
        <div className={`${compactHeader ? 'max-w-4xl' : 'max-w-5xl'} mx-auto flex flex-row justify-between items-center ${compactHeader ? 'gap-2 flex-nowrap' : 'gap-3 flex-wrap'}`}>
          
          <div className="text-left flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className={`text-2xl ${darkMode ? 'japanese-moon' : 'japanese-sun'} w-10 h-10 rounded-full flex items-center justify-center`}>
                {darkMode ? '🌙' : '☀️'}
              </div>
              <div>
                <h1 className={`${compactHeader ? 'text-xl' : 'text-2xl'} font-bold text-black dark:text-white`}>
                  {darkMode ? '月天気アシスタント' : '日天気アシスタント'}
                </h1>
                {!compactHeader && (
                  <p className="text-black dark:text-gray-300 text-sm">
                    {darkMode ? '月明かりの気象アドバイス' : '太陽の下での気象アドバイス'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={`flex items-center ${compactHeader ? 'gap-2 flex-nowrap' : 'gap-2 md:gap-3 flex-wrap'}`}>
            <div className="flex items-center gap-2">
              <label htmlFor="location" className="text-black dark:text-white font-medium text-sm">都市:</label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`app-input p-2 text-sm ${compactHeader ? 'w-24' : 'w-28'}`}
                placeholder={darkMode ? "京都" : "東京"}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="voiceLanguage" className="text-black dark:text-white font-medium text-sm">言語:</label>
              <select
                id="voiceLanguage"
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                className={`app-select p-2 text-sm ${compactHeader ? 'max-w-[7.5rem]' : ''}`}
                disabled={loading}
              >
                <option value="en-US">English</option>
                <option value="ja-JP">日本語</option>
              </select>
            </div>
            
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`px-3 py-2 rounded-lg border text-black dark:text-white bg-white/70 dark:bg-blue-800/70 shadow-sm hover:bg-white dark:hover:bg-blue-700 transition ${compactHeader ? 'text-sm' : ''}`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="inline-flex items-center gap-2">
                <span>{darkMode ? '☀️' : '🌙'}</span>
                <span className="hidden sm:inline">{darkMode ? '太陽' : '月'}</span>
              </span>
            </button>
            
            <button
              onClick={clearChat}
              className={`px-3 py-2 rounded-lg text-black dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm whitespace-nowrap ${compactHeader ? 'px-2' : ''}`}
            >
              クリア
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Chat Area --- */}
      <main className="flex-grow max-w-5xl mx-auto w-full p-4 pb-36 flex flex-col">
        <div ref={chatContainerRef} className="flex-grow rounded-xl p-3 sm:p-4 flex flex-col gap-4 text-black bg-white dark:bg-blue-900/50 backdrop-blur-sm border border-orange-200 dark:border-blue-600">
          <div className={`flex-grow flex flex-col ${messages.length === 1 ? 'justify-center items-center' : 'justify-start space-y-4'}`}>
            
            {messages.map((message) => {
              const isWelcomeHero = messages.length === 1 && message.type === 'system';
              return (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} ${isWelcomeHero ? 'w-full justify-center items-center gap-6 flex-col sm:flex-row' : ''}`}>
                  
                  {isWelcomeHero && (
                    <div className="flex-shrink-0 relative">
                       <div className={`w-32 h-32 rounded-full overflow-hidden border-4 shadow-lg flex items-center justify-center text-5xl ${
                        darkMode ? 'border-blue-400 bg-blue-800 text-yellow-300' : 'border-orange-400 bg-orange-100 text-orange-600'
                      }`}>
                        {darkMode ? '🌙' : '☀️'}
                      </div>
                    </div>
                  )}

                  <div className={`
                    rounded-xl shadow-sm border transition-all duration-300
                    ${isWelcomeHero 
                        ? 'p-8 text-center text-lg max-w-2xl w-full welcome-message text-black' 
                        : 'max-w-[85%] sm:max-w-md px-4 py-3 text-base'
                    }
                    ${!isWelcomeHero && message.type === 'user' 
                      ? (darkMode ? 'bg-blue-700 text-white border-blue-600' : 'bg-orange-600 text-black border-orange-500') 
                      : ''
                    }
                    ${!isWelcomeHero && message.type === 'assistant'
                      ? (darkMode ? 'assistant-card text-white' : 'assistant-card text-black')
                      : ''
                    }
                    ${!isWelcomeHero && message.type === 'system'
                      ? (darkMode ? 'bg-blue-800/50 text-blue-100 border-blue-600' : 'bg-orange-100 text-orange-800 border-orange-300')
                      : ''
                    }
                  `}>
                    
                    {/* Weather Data Card */}
                    {message.type === 'assistant' && message.weatherData && (
                      <div className={`assistant-card mb-3 p-3 ${darkMode ? 'text-white' : 'text-black'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-xl">{getWeatherIcon(message.weatherData.condition)}</span>
                            <span className="font-semibold">{message.weatherData.city}</span>
                          </div>
                          <div className={`text-xl font-bold ${darkMode ? 'text-yellow-300' : 'text-orange-600'}`}>
                            {Math.round(message.weatherData.temp)}°C
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                           <div className={`assistant-stat text-center p-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                              <div className="opacity-70">湿度</div>
                              <div className="font-semibold">{message.weatherData.humidity}%</div>
                           </div>
                           <div className={`assistant-stat text-center p-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                              <div className="opacity-70">風速</div>
                              <div className="font-semibold">{message.weatherData.windSpeed}m/s</div>
                           </div>
                           <div className={`assistant-stat text-center p-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                              <div className="opacity-70">体感</div>
                              <div className="font-semibold">{Math.round(message.weatherData.feelsLike)}°</div>
                           </div>
                        </div>
                      </div>
                    )}
                    
                    {message.type === 'assistant' ? (
                      <div className="assistant-content" dangerouslySetInnerHTML={formatAssistantHtml(message.content)} />
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    )}
                    
                  {!isWelcomeHero && <MessageTime date={message.timestamp} />}
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex justify-start">
                 <div className={`px-4 py-2 rounded-xl shadow-sm border ${darkMode ? 'bg-blue-900/80 border-blue-700' : 'bg-white border-orange-200'}`}>
                    <LoadingSpinner darkMode={darkMode} />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Message */}
        {(voiceError || error) && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-3 rounded mb-4 max-w-5xl mx-auto w-full">
            <p className="font-medium text-sm">Error:</p>
            <p className="text-sm">{voiceError || error}</p>
          </div>
        )}

        {/* --- Input Area --- */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-4xl mx-auto w-full px-2 pt-4 pb-0">
            <form onSubmit={handleSendMessage} className="bg-white/90 dark:bg-blue-900/90 backdrop-blur-md border-t border-orange-200 dark:border-blue-700 rounded-t-xl shadow-lg p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={isListening 
                    ? (voiceLanguage === 'ja-JP' ? '聞いています...' : 'Listening...') 
                    : (voiceLanguage === 'ja-JP' ? '天気、食べ物、アクティビティについて...' : 'Ask about weather, food, activities...')}
                  className={`app-input flex-1 p-3 ${isListening ? 'ring-2 ring-red-400' : ''}`}
                  disabled={loading}
                />

                {isSupported && mounted && (
                  <button
                    type="button"
                    onClick={startListening}
                    disabled={loading}
                    className={`p-3 rounded-lg shadow-md transition-colors ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 8c1.1 0 2-.9 2-2V3a2 2 0 10-4 0v3c0 1.1.9 2 2 2zM10 18c3.31 0 6-2.69 6-6h-2c0 2.21-1.79 4-4 4s-4-1.79-4-4H4c0 3.31 2.69 6 6 6zM15 9H5a1 1 0 000 2h10a1 1 0 000-2z" />
                    </svg>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || !userInput.trim()}
                  className={`px-4 rounded-lg text-white font-bold shadow-md transition-colors disabled:opacity-50 ${
                     darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-orange-600 hover:bg-orange-500'
                  }`}
                >
                  {loading ? '...' : (darkMode ? '送信' : 'Send')}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                Powered by Google Gemini • Weather data from OpenWeatherMap
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* --- Scroll To Bottom Button --- */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={`fixed bottom-28 right-6 px-4 py-2 rounded-full shadow-lg text-white font-medium z-50 transition-transform hover:scale-105 ${
             darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-orange-600 hover:bg-orange-500'
          }`}
        >
          ↓ {darkMode ? '最新' : 'Latest'}
        </button>
      )}
    </div>
  );
};

export default App;
