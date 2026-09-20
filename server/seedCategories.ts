export interface SeedCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  icon: string;
  description: string;
}

export interface SeedResource {
  name: string;
  categorySlug: string;
  url: string;
  description: string;
  usageContext: string;
  inputOutput: string;
  opsecNotes: string;
  toolFlags: string; // T, D, R, M
  isFree: number; // 1 = Free, 0 = Paid, 2 = Freemium
  ratingAvg: number;
  ratingCount: number;
  views: number;
  tags: string[];
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { id: 1, name: "Username Intelligence", slug: "username", parentId: null, icon: "UserCheck", description: "Search, verify, and correlate usernames across hundreds of platforms and services." },
  { id: 2, name: "Email Address Analysis", slug: "email", parentId: null, icon: "Mail", description: "Verify email deliverability, check data breaches, inspect headers, and reverse lookup." },
  { id: 3, name: "Domain & DNS Investigation", slug: "domain", parentId: null, icon: "Globe", description: "Subdomain enumeration, DNS records, WHOIS archives, SSL/TLS certificates, and web tech." },
  { id: 4, name: "IP Address & Geolocation", slug: "ip-address", parentId: null, icon: "MapPin", description: "Geolocate IP addresses, inspect ASNs, identify VPNs/proxies, and scan open services." },
  { id: 5, name: "Social Media Intelligence", slug: "social-media", parentId: null, icon: "Share2", description: "Extract intelligence from platforms like X/Twitter, Reddit, LinkedIn, Instagram, and Telegram." },
  { id: 6, name: "Geolocation & Satellite Imagery", slug: "geolocation", parentId: null, icon: "Compass", description: "Analyze satellite imagery, street cameras, flight tracking, maritime AIS, and sun angles." },
  { id: 7, name: "Search Engines & Google Dorks", slug: "search-dorks", parentId: null, icon: "Search", description: "Leverage advanced Google dorks, pastebin monitors, and specialized search indices." },
  { id: 8, name: "Public Records & Corporate Data", slug: "public-records", parentId: null, icon: "Building2", description: "Company registries, SEC filings, court dockets, sanctions lists, and trade records." },
  { id: 9, name: "Documents & Metadata Extraction", slug: "documents-metadata", parentId: null, icon: "FileText", description: "Analyze EXIF tags, extract hidden PDF metadata, and inspect document revisions." },
  { id: 10, name: "Image & Video Forensics", slug: "image-video", parentId: null, icon: "Eye", description: "Reverse image search, ELA (Error Level Analysis), facial recognition, and media verification." },
  { id: 11, name: "Threat Intelligence & Malware", slug: "threat-intel", parentId: null, icon: "ShieldAlert", description: "Analyze malicious files, query IoC databases, sandbox URLs, and investigate C2 domains." },
  { id: 12, name: "Archives & Historical Cache", slug: "archives", parentId: null, icon: "History", description: "Access historical web snapshots, deleted social posts, and historical DNS changes." },
  { id: 13, name: "Dark Web & Tor Resources", slug: "dark-web", parentId: null, icon: "Terminal", description: "Navigate .onion directories, monitor ransomware extortion blogs, and search leak forums." },
  { id: 14, name: "People & Directory Search", slug: "people-search", parentId: null, icon: "Users", description: "Locate phone numbers, residential addresses, relatives, and public voter registries." },
  { id: 15, name: "Network Infrastructure & BGP", slug: "network-routing", parentId: null, icon: "Network", description: "BGP route leaks, PeeringDB interconnections, CDN mapping, and traceroute nodes." },
  { id: 16, name: "Wireless, RF & Maritime Signals", slug: "wireless-rf", parentId: null, icon: "Radio", description: "Monitor Wi-Fi BSSID positions, ADS-B flight transponders, AIS marine signals, and SDR." }
];
