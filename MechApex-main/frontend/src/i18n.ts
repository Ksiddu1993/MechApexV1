// Lightweight i18n. Add more strings as needed.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

type Lang = 'en' | 'kn' | 'hi';
const KEY = 'gf_lang';

const dict: Record<Lang, Record<string, string>> = {
  en: {
    welcome: 'Welcome to MechApex', enter_mobile: 'Enter mobile number',
    send_otp: 'Send OTP', verify_otp: 'Verify OTP', otp_hint: 'Enter 6-digit code',
    home: 'Home', reminders: 'Reminders', analytics: 'Analytics', more: 'More',
    two_wheeler: 'Two Wheeler', four_wheeler: 'Four Wheeler',
    service: 'Service', washing: 'Washing',
    new_job: 'New Job Card', recent_jobs: 'Recent Job Cards',
    pending: 'Pending', in_progress: 'In Progress', ready: 'Ready', completed: 'Completed',
    my_account: 'My Account', sub_users: 'Workers', owner: 'Owner', worker: 'Worker', workers: 'Workers', language: 'Language', settings: 'Settings', logout: 'Logout',
    customer: 'Customer', vehicle: 'Vehicle', services: 'Services', total: 'Total',
    send_whatsapp: 'Send on WhatsApp', download_invoice: 'Share Invoice PDF',
    checklist: 'Inspection Checklist', photos: 'Photos', timer: 'Time Tracker',
    revenue: 'Revenue', vehicles_serviced: 'Vehicles serviced',
  },
  kn: {
    welcome: 'ಮೆಕ್‌ಅಪೆಕ್ಸ್‌ಗೆ ಸ್ವಾಗತ', enter_mobile: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ',
    send_otp: 'OTP ಕಳುಹಿಸಿ', verify_otp: 'OTP ಪರಿಶೀಲಿಸಿ', otp_hint: '6 ಅಂಕಿಯ ಕೋಡ್ ನಮೂದಿಸಿ',
    home: 'ಮನೆ', reminders: 'ಜ್ಞಾಪನೆಗಳು', analytics: 'ವಿಶ್ಲೇಷಣೆ', more: 'ಇನ್ನಷ್ಟು',
    two_wheeler: 'ದ್ವಿಚಕ್ರ ವಾಹನ', four_wheeler: 'ನಾಲ್ಕು ಚಕ್ರ ವಾಹನ',
    service: 'ಸೇವೆ', washing: 'ತೊಳೆಯುವಿಕೆ',
    new_job: 'ಹೊಸ ಜಾಬ್ ಕಾರ್ಡ್', recent_jobs: 'ಇತ್ತೀಚಿನ ಜಾಬ್ ಕಾರ್ಡ್‌ಗಳು',
    pending: 'ಬಾಕಿ', in_progress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ', ready: 'ಸಿದ್ಧ', completed: 'ಪೂರ್ಣ',
    my_account: 'ನನ್ನ ಖಾತೆ', sub_users: 'ವರ್ಕರ್ಸ್', owner: 'ಮಲೀಕರು', worker: 'ವರ್ಕರ್', workers: 'ವರ್ಕರ್ಸ್', language: 'ಭಾಷೆ', settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್', logout: 'ಲಾಗ್ ಔಟ್',
    customer: 'ಗ್ರಾಹಕ', vehicle: 'ವಾಹನ', services: 'ಸೇವೆಗಳು', total: 'ಒಟ್ಟು',
    send_whatsapp: 'ವಾಟ್ಸಾಪ್‌ಗೆ ಕಳುಹಿಸಿ', download_invoice: 'ಇನ್ವಾಯ್ಸ್ ಹಂಚಿಕೊಳ್ಳಿ',
    checklist: 'ತಪಾಸಣೆ ಪಟ್ಟಿ', photos: 'ಫೋಟೋಗಳು', timer: 'ಸಮಯ ಟ್ರ್ಯಾಕರ್',
    revenue: 'ಆದಾಯ', vehicles_serviced: 'ಸೇವೆ ಪಡೆದ ವಾಹನಗಳು',
  },
  hi: {
    welcome: 'मेकएपेक्स में आपका स्वागत है', enter_mobile: 'मोबाइल नंबर दर्ज करें',
    send_otp: 'OTP भेजें', verify_otp: 'OTP सत्यापित करें', otp_hint: '6 अंकों का कोड डालें',
    home: 'होम', reminders: 'रिमाइंडर', analytics: 'विश्लेषण', more: 'और',
    two_wheeler: 'दो पहिया', four_wheeler: 'चार पहिया',
    service: 'सर्विस', washing: 'धुलाई',
    new_job: 'नया जॉब कार्ड', recent_jobs: 'हाल के जॉब कार्ड',
    pending: 'लंबित', in_progress: 'प्रगति पर', ready: 'तैयार', completed: 'पूर्ण',
    my_account: 'मेरा खाता', sub_users: 'वर्कर', owner: 'मालिक', worker: 'वर्कर', workers: 'वर्कर', language: 'भाषा', settings: 'सेटिंग्स', logout: 'लॉगआउट',
    customer: 'ग्राहक', vehicle: 'वाहन', services: 'सेवाएं', total: 'कुल',
    send_whatsapp: 'व्हाट्सएप पर भेजें', download_invoice: 'इनवॉइस शेयर करें',
    checklist: 'निरीक्षण सूची', photos: 'फ़ोटो', timer: 'समय ट्रैकर',
    revenue: 'राजस्व', vehicles_serviced: 'सेवा किए गए वाहन',
  },
};

let currentLang: Lang = 'en';
const listeners: Set<() => void> = new Set();

export async function initLang() {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === 'en' || raw === 'kn' || raw === 'hi') currentLang = raw;
}
export async function setLang(l: Lang) {
  currentLang = l;
  await AsyncStorage.setItem(KEY, l);
  listeners.forEach(fn => fn());
}
export function getLang(): Lang { return currentLang; }

export function t(key: string): string {
  return dict[currentLang][key] || dict.en[key] || key;
}

export function useLang() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return { lang: currentLang, t, setLang };
}
