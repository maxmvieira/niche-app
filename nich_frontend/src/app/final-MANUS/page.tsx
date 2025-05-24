// src/app/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, ListFilter, ArrowUpDown, ChevronLeft, ChevronRight, LayoutDashboard, Search, Users, Folder, Zap, TrendingUp, DollarSign, MessageSquare, UserCircle, LogOut, Link as LinkIcon, Disc, MenuIcon, Flame, Settings2, ThumbsUp, Eye, CalendarDays, Filter, Tag, CheckCircle2 } from "lucide-react";

import { saveAs } from "file-saver";
import Papa from "papaparse";
import { loadStripe } from "@stripe/stripe-js";

// Importações de tradução - CORREÇÃO DE CAMINHO RELATIVO
import ptTranslations from "../../locales/pt.json"; 
import enTranslations from "../../locales/en.json";

interface NichResult {
  channelName: string;
  channelLink: string;
  subscriberCount: number;
  videoTitle: string;
  videoLink: string;
  viewCount: number;
  publishedAt: string;
  keyword: string;
  viewsPerSubscriber: number;
  platform?: string;
  niche?: string;
  likeCount?: number;
  commentCount?: number;
  thumbnailUrl?: string;
  id?: string; 
}

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_51RK6VmGbde7HGq89NHb4oCLxCVsgZReaNSZoDga95udXG6OEBjh318rcDiq5YuBdmV1xyAFjwKgKLp2917dybuOj00ALSJuLD8";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const availableNiches = [
  "Motivacional", "Reddit Stories", "Basketball", "Real Estate", "Crypto", "Finance", "Chat Message Stories", "History",
  "Quiz", "Relationships", "Food & Drink", "Animals", "Would You Rather", "Educational", "Music (Singing)", "Horror Scary",
  "Storytelling", "Fitness", "Geography", "Travel", "Lifestyle", "Gaming", "Ranking Content", "Podcast Clips",
  "Soccer Clips", "Religion", "Anime", "Clipping"
];

const ITEMS_PER_PAGE = 20;

interface Translations {
  [key: string]: string;
}

const translations: { [key: string]: Translations } = {
  "pt-BR": ptTranslations,
  "en-US": enTranslations,
};

// DEBUG: Log para verificar se os arquivos de tradução foram carregados
console.log("PT Translations Loaded:", ptTranslations);
console.log("EN Translations Loaded:", enTranslations);

const mockOutliers: NichResult[] = [
  {
    id: "1",
    channelName: "stutzsendors",
    channelLink: "#",
    subscriberCount: 150000,
    videoTitle: "Bro why uber drivers dont just book themselves and drive in circles??? (Infinite money glitch)",
    videoLink: "#",
    viewCount: 10650000, 
    publishedAt: new Date().toISOString(),
    keyword: "Crypto",
    viewsPerSubscriber: 711,
    platform: "TikTok",
    niche: "Crypto",
    likeCount: 750000,
    commentCount: 12000,
    thumbnailUrl: "/assets/images/mock_thumb_1.png" 
  },
  {
    id: "2",
    channelName: "practicelive01",
    channelLink: "#",
    subscriberCount: 50000,
    videoTitle: "Practice Singing Live... (Until I Found You Edition) 3...",
    videoLink: "#",
    viewCount: 19185000, 
    publishedAt: new Date(Date.now() - 86400000 * 1).toISOString(), 
    keyword: "Music (Singing)",
    viewsPerSubscriber: 3837,
    platform: "TikTok",
    niche: "Music (Singing)",
    likeCount: 1200000,
    commentCount: 25000,
    thumbnailUrl: "/assets/images/mock_thumb_2.png"
  },
  {
    id: "3",
    channelName: "mochii784",
    channelLink: "#",
    subscriberCount: 200000,
    videoTitle: "19 14900K",
    videoLink: "#",
    viewCount: 148600000, 
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(), 
    keyword: "Gaming",
    viewsPerSubscriber: 743,
    platform: "TikTok",
    niche: "Gaming",
    likeCount: 5000000,
    commentCount: 80000,
    thumbnailUrl: "/assets/images/mock_thumb_3.png"
  },
  {
    id: "4",
    channelName: "orthodoxmuslim.clips",
    channelLink: "#",
    subscriberCount: 300000,
    videoTitle: "IS GOD IN YOUR POCKET",
    videoLink: "#",
    viewCount: 33600000, 
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(), 
    keyword: "Religion",
    viewsPerSubscriber: 112,
    platform: "TikTok",
    niche: "Religion",
    likeCount: 2000000,
    commentCount: 45000,
    thumbnailUrl: "/assets/images/mock_thumb_4.png"
  },
];

// DEBUG: Log para verificar as URLs das thumbnails mockadas
mockOutliers.forEach(item => console.log("Mock Thumbnail URL:", item.thumbnailUrl));

export default function Home() {
  const [currentView, setCurrentView] = useState<"dashboard" | "outlier">("dashboard");
  const [selectedNichesForOutlier, setSelectedNichesForOutlier] = useState<string[]>([]);

  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [videoPublishedDays, setVideoPublishedDays] = useState("30");
  const [maxSubs, setMaxSubs] = useState("10000");
  const [minViews, setMinViews] = useState("50000");
  const [maxChannelVideosTotal, setMaxChannelVideosTotal] = useState("50");

  const [allResults, setAllResults] = useState<NichResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  const [favoritedVideos, setFavoritedVideos] = useState<string[]>([]);

  const [platformFilter, setPlatformFilter] = useState<string>("YouTube Shorts");
  const [sortBy, setSortBy] = useState<string>("views_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLang, setCurrentLang] = useState("pt-BR");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLangOverlay, setShowLangOverlay] = useState(false);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const langTranslations = translations[currentLang];
    if (!langTranslations) {
      console.warn(`Traduções não encontradas para o idioma: ${currentLang}`);
      return key; // Retorna a chave se o idioma não for encontrado
    }
    let text = langTranslations[key];
    if (text === undefined) {
      console.warn(`Chave de tradução não encontrada para '${key}' no idioma '${currentLang}'. Usando a chave como fallback.`);
      return key; // Retorna a chave se a tradução específica não for encontrada
    }
    if (params) {
      Object.keys(params).forEach(paramKey => {
        text = text.replace(`{{${paramKey}}}`, String(params[paramKey]));
      });
    }
    return text;
  };

  useEffect(() => {
    const checkSub = async () => {
      setCheckingSubscription(true);
      try {
        const query = new URLSearchParams(window.location.search);
        if (query.get("subscribed") === "true") {
          setIsSubscribed(true);
        }
      } catch (err) {
        console.error("Falha ao verificar assinatura:", err);
        setIsSubscribed(false);
      } finally {
        setCheckingSubscription(false);
      }
    };
    checkSub();
  }, []);

  const handleNicheToggleDashboard = (niche: string) => {
    setSelectedNiches(prev =>
      prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]
    );
  };

  const handleConfirmNiches = () => {
    if (selectedNiches.length > 0) {
      setSelectedNichesForOutlier([...selectedNiches]);
      setCurrentView("outlier");
      setVideoPublishedDays("30");
      setMaxSubs("10000");
      setMinViews("50000");
      setMaxChannelVideosTotal("50");
      setAllResults([]);
      setCurrentPage(1);
      setError(null);
    } else {
      setError(t("error_select_niche_dashboard"));
    }
  };

  const toggleFavorite = (videoLink: string) => {
    setFavoritedVideos(prev =>
      prev.includes(videoLink) ? prev.filter(link => link !== videoLink) : [...prev, videoLink]
    );
  };

  const handleSearch = async () => {
    if (!isSubscribed && !checkingSubscription) {
      setError(t("error_only_subscribers"));
      return;
    }
    if (selectedNichesForOutlier.length === 0) {
      setError(t("error_select_niche_dashboard_first"));
      return;
    }

    setIsLoading(true);
    setError(null);
    setAllResults([]);
    setCurrentPage(1);

    const searchParams = {
      niches: selectedNichesForOutlier.join(","),
      video_published_days: videoPublishedDays,
      max_subs: maxSubs,
      min_views: minViews,
      max_channel_videos_total: maxChannelVideosTotal,
    };

    const params = new URLSearchParams(searchParams);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/api/search/viral-videos?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const data: NichResult[] = await response.json();
      setAllResults(data);

    } catch (err: any) {
      console.error(t("error_search_failed"), err);
      setError(err.message || t("error_fetch_data"));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...allResults];
    if (platformFilter !== "all") {
      filtered = filtered.filter(result => result.platform === platformFilter);
    }
    switch (sortBy) {
      case "views_desc":
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "views_asc":
        filtered.sort((a, b) => (a.viewCount || 0) - (b.viewCount || 0));
        break;
      case "date_desc":
        filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
      case "date_asc":
        filtered.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
        break;
      default:
        break;
    }
    return filtered;
  }, [allResults, platformFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedResults.length / ITEMS_PER_PAGE);
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedResults.slice(startIndex, endIndex);
  }, [filteredAndSortedResults, currentPage]);

  const handlePlatformFilterChange = (value: string) => {
    setPlatformFilter(value);
    setCurrentPage(1);
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleExport = () => {
    if (filteredAndSortedResults.length === 0) return;
    const csvData = Papa.unparse(filteredAndSortedResults, { header: true });
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `nich_results_${selectedNichesForOutlier.join("_")}_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleCheckout = async () => {
    setError(null);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/api/payment/create-checkout-session`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("error_checkout_session"));
      }
      const session = await response.json();
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error(t("error_stripe_load"));
      }
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });
      if (error) {
        console.error("Erro no checkout Stripe:", error);
        setError(error.message || t("error_stripe_checkout"));
      }
    } catch (err: any) {
      console.error("Falha no checkout:", err);
      setError(err.message || t("error_payment_generic"));
    }
  };

  const sidebarNavItems = [
    { nameKey: "sidebar_dashboard", icon: LayoutDashboard, href: "#", view: "dashboard" },
    { nameKey: "sidebar_outlier", icon: Zap, href: "#", view: "outlier", new: true },
    { nameKey: "sidebar_viral_simulator", icon: TrendingUp, href: "#", current: false, soon: true }, 
    { nameKey: "sidebar_billing", icon: DollarSign, href: "#", current: false }, 
  ];

  const sidebarBottomNavItems = [
    { nameKey: "sidebar_feedback", icon: MessageSquare, href: "#" },
    { nameKey: "sidebar_account", icon: UserCircle, href: "#" },
    { nameKey: "sidebar_logout", icon: LogOut, href: "#" },
  ];

  const changeLanguage = (lang: string) => {
    if (lang === currentLang) return;
    setShowLangOverlay(true);
    setTimeout(() => {
      setCurrentLang(lang);
      setShowLangOverlay(false);
    }, 400);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const calculateViralFactor = (views: number, subscribers: number): string => {
    if (subscribers === 0 || !subscribers || views === 0 || !views) return "N/A";
    const factor = views / subscribers;
    return `${Math.round(factor)}x`;
  };

  const getNicheEmoji = (niche?: string): string => {
    const nicheLower = niche?.toLowerCase();
    if (nicheLower?.includes("crypto")) return "💰";
    if (nicheLower?.includes("gaming")) return "🎮";
    if (nicheLower?.includes("food")) return "🍔";
    if (nicheLower?.includes("travel")) return "✈️";
    if (nicheLower?.includes("music")) return "🎤";
    if (nicheLower?.includes("religion")) return "🛐";
    if (nicheLower?.includes("motivacional")) return "💪";
    if (nicheLower?.includes("reddit stories")) return "📝";
    if (nicheLower?.includes("basketball")) return "🏀";
    if (nicheLower?.includes("real estate")) return "🏠";
    if (nicheLower?.includes("finance")) return "💼";
    if (nicheLower?.includes("chat message stories")) return "💬";
    if (nicheLower?.includes("history")) return "📜";
    if (nicheLower?.includes("quiz")) return "❓";
    if (nicheLower?.includes("relationships")) return "❤️";
    if (nicheLower?.includes("animals")) return "🐾";
    if (nicheLower?.includes("would you rather")) return "🤔";
    if (nicheLower?.includes("educational")) return "🎓";
    if (nicheLower?.includes("horror scary")) return "👻";
    if (nicheLower?.includes("storytelling")) return "📖";
    if (nicheLower?.includes("fitness")) return "🏋️";
    if (nicheLower?.includes("geography")) return "🌍";
    if (nicheLower?.includes("lifestyle")) return "🌴";
    if (nicheLower?.includes("ranking content")) return "🏆";
    if (nicheLower?.includes("podcast clips")) return "🎙️";
    if (nicheLower?.includes("soccer clips")) return "⚽";
    if (nicheLower?.includes("anime")) return "🌸";
    if (nicheLower?.includes("clipping")) return "✂️";
    return "😊";
  };

  const renderDashboardView = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-custom-text-primary">{t("welcome_back")}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => changeLanguage("pt-BR")} title={t("portuguese_brazil")} className={`p-1 rounded-md ${currentLang === "pt-BR" ? "bg-custom-yellow-accent ring-2 ring-custom-yellow-hover" : "hover:bg-custom-card-bg"}`}>
            <img src="/assets/images/flag_br.png" alt={t("portuguese_brazil")} className="w-8 h-5 object-cover rounded" />
          </button>
          <button onClick={() => changeLanguage("en-US")} title={t("english")} className={`p-1 rounded-md ${currentLang === "en-US" ? "bg-custom-yellow-accent ring-2 ring-custom-yellow-hover" : "hover:bg-custom-card-bg"}`}>
            <img src="/assets/images/flag_uk.png" alt={t("english")} className="w-8 h-5 object-cover rounded" />
          </button>
          <img src="/assets/images/profile_placeholder.png" alt={t("user_avatar")} className="w-10 h-10 rounded-full border-2 border-custom-yellow-accent object-cover" />
        </div>
      </div>

      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-custom-text-primary flex items-center">
            <Zap className="w-6 h-6 mr-2 text-custom-yellow-accent" /> {t("dashboard_recently_added_outliers")}
          </h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" className="bg-custom-card-bg border-custom-border-color text-custom-text-secondary hover:border-custom-yellow-accent hover:text-custom-yellow-accent">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="bg-custom-card-bg border-custom-border-color text-custom-text-secondary hover:border-custom-yellow-accent hover:text-custom-yellow-accent">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockOutliers.map(result => (
            <Card key={result.id} className="flex flex-col bg-custom-card-bg border border-custom-border-color hover:border-custom-yellow-accent transition-all duration-200 ease-in-out shadow-lg hover:shadow-custom-yellow-accent/20 rounded-xl overflow-hidden">
              <CardHeader className="p-0 relative">
                {result.thumbnailUrl && (
                  <a href={result.videoLink} target="_blank" rel="noopener noreferrer" className="block aspect-video">
                    <img
                      src={result.thumbnailUrl} 
                      alt={t("thumbnail_alt_text", { title: result.videoTitle })}
                      className="w-full h-full object-cover"
                      onError={(e) => { 
                        console.error("Erro ao carregar thumbnail:", result.thumbnailUrl); 
                        (e.target as HTMLImageElement).style.display = 'none'; 
                        // Opcional: mostrar uma imagem de fallback
                        // (e.target as HTMLImageElement).src = '/assets/images/fallback_thumbnail.png';
                        // (e.target as HTMLImageElement).style.display = 'block'; 
                      }}
                    />
                  </a>
                )}
                <div className="absolute top-2 right-2 flex flex-col items-end space-y-1.5 z-10">
                  <div className="flex items-center bg-orange-500/80 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                    <Flame className="w-3.5 h-3.5 mr-1 text-white" />
                    <span>{calculateViralFactor(result.viewCount, result.subscriberCount)}</span>
                  </div>
                  {result.niche && (
                    <div className="flex items-center bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-md">
                      <span className="mr-1.5 text-sm">{getNicheEmoji(result.niche)}</span>
                      <span>{t(result.niche.toLowerCase().replace(/\s|&/g, "_"))}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 flex-grow flex flex-col">
                <h3 className="font-semibold text-sm leading-snug mb-1 text-custom-text-primary">
                  <a href={result.videoLink} target="_blank" rel="noopener noreferrer" title={result.videoTitle} className="hover:text-custom-yellow-accent line-clamp-2">
                    {result.videoTitle || t("title_unavailable")}
                  </a>
                </h3>
                <p className="text-xs text-custom-text-secondary mb-1.5">
                  <a href={result.channelLink} target="_blank" rel="noopener noreferrer" className="hover:text-custom-yellow-accent">
                    {result.channelName || t("channel_unknown")}
                  </a>
                </p>
                <div className="text-xs text-custom-text-secondary mt-auto">
                  <span>{new Date(result.publishedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
           <Card className="flex flex-col items-center justify-center bg-custom-card-bg border border-custom-border-color hover:border-custom-yellow-accent transition-all duration-200 ease-in-out shadow-lg hover:shadow-custom-yellow-accent/20 rounded-xl overflow-hidden p-6 aspect-video">
            <div className="bg-custom-yellow-accent/20 p-3 rounded-full mb-4">
                <ThumbsUp className="w-8 h-8 text-custom-yellow-accent" />
            </div>
            <h3 className="text-lg font-semibold text-custom-text-primary mb-1 text-center">{t("upgrade_to_pro")}</h3>
            <p className="text-xs text-custom-text-secondary mb-4 text-center">{t("get_access_all_viral_videos")}</p>
            <Button className="w-full bg-custom-yellow-accent text-custom-text-on-yellow hover:bg-custom-yellow-hover font-semibold rounded-md px-6 py-2.5 text-sm shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95" onClick={handleCheckout}>{t("unlock_all_videos")}</Button>
          </Card>
        </div>
      </div>

      <Card className="mb-8 bg-custom-card-bg border-custom-border-color shadow-xl rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-custom-text-primary flex items-center">
                <Tag className="w-5 h-5 mr-2 text-custom-yellow-accent" /> {t("dashboard_niches_title")}
            </h3>
            <Button variant="outline" className="text-xs bg-custom-dark-bg border-custom-border-color text-custom-text-secondary hover:border-custom-yellow-accent hover:text-custom-yellow-accent">
                {t("dashboard_suggest_niche")}
            </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {availableNiches.map(niche => (
            <Button
              key={niche}
              variant={selectedNiches.includes(niche) ? "default" : "outline"}
              onClick={() => handleNicheToggleDashboard(niche)}
              className={`w-full justify-start text-left py-2.5 px-3 rounded-lg transition-all duration-200 ease-in-out group
                ${selectedNiches.includes(niche)
                  ? "bg-custom-yellow-accent text-custom-text-on-yellow border-custom-yellow-accent font-semibold shadow-md hover:bg-custom-yellow-hover"
                  : "bg-custom-dark-bg border-custom-border-color text-custom-text-secondary hover:border-custom-yellow-accent hover:text-custom-yellow-accent hover:bg-custom-card-bg"
                }`}
            >
              <span className={`mr-2 text-lg ${selectedNiches.includes(niche) ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>{getNicheEmoji(niche)}</span>
              <span className="flex-1 truncate text-sm">{t(niche.toLowerCase().replace(/\s|&/g, "_"))}</span>
              {selectedNiches.includes(niche) && <CheckCircle2 className="ml-auto h-4 w-4 opacity-80" />}
            </Button>
          ))}
        </div>
        {selectedNiches.length > 0 && (
          <div className="mt-8 flex justify-end">
            <Button 
                onClick={handleConfirmNiches} 
                className="bg-custom-yellow-accent text-custom-text-on-yellow hover:bg-custom-yellow-hover font-semibold rounded-md px-8 py-3 text-base shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95"
            >
                {t("dashboard_confirm_selection", { count: selectedNiches.length })}
            </Button>
          </div>
        )}
      </Card>
      {error && (
          <Card className="mb-8 bg-red-900/30 border-red-700 text-custom-text-primary rounded-lg">
            <CardHeader><CardTitle className="text-red-400">{t("error_title")}</CardTitle></CardHeader>
            <CardContent><p>{error}</p></CardContent>
          </Card>
        )}
    </>
  );

  const renderOutlierView = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-custom-text-primary">{t("outlier_page_title")}</h2>
          <p className="text-custom-text-secondary mt-1">{t("outlier_page_subtitle", { niches: selectedNichesForOutlier.map(n => t(n.toLowerCase().replace(/\s|&/g, "_"))).join(", ") })}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => changeLanguage("pt-BR")} title={t("portuguese_brazil")} className={`p-1 rounded-md ${currentLang === "pt-BR" ? "bg-custom-yellow-accent ring-2 ring-custom-yellow-hover" : "hover:bg-custom-card-bg"}`}>
            <img src="/assets/images/flag_br.png" alt={t("portuguese_brazil")} className="w-8 h-5 object-cover rounded" />
          </button>
          <button onClick={() => changeLanguage("en-US")} title={t("english")} className={`p-1 rounded-md ${currentLang === "en-US" ? "bg-custom-yellow-accent ring-2 ring-custom-yellow-hover" : "hover:bg-custom-card-bg"}`}>
            <img src="/assets/images/flag_uk.png" alt={t("english")} className="w-8 h-5 object-cover rounded" />
          </button>
          <img src="/assets/images/profile_placeholder.png" alt={t("user_avatar")} className="w-10 h-10 rounded-full border-2 border-custom-yellow-accent object-cover" />
        </div>
      </div>

      {!isSubscribed && !checkingSubscription && (
        <Card className="mb-8 bg-custom-yellow-accent border-custom-yellow-hover">
          <CardHeader><CardTitle className="text-custom-text-on-yellow">{t("premium_access")}</CardTitle></CardHeader>
          <CardContent><p className="text-custom-text-on-yellow">{t("unlock_niche_search")}</p></CardContent>
          <CardFooter><Button onClick={handleCheckout} className="bg-custom-card-bg text-custom-yellow-accent hover:bg-opacity-80 font-semibold">{t("subscribe_now")}</Button></CardFooter>
        </Card>
      )}

      <Card className="mb-8 bg-custom-card-bg border-custom-border-color shadow-xl rounded-lg p-6">
        <CardHeader>
          <CardTitle className="text-custom-yellow-accent text-2xl flex items-center"><Filter className="w-6 h-6 mr-2"/>{t("outlier_filters_title")}</CardTitle>
          <CardDescription className="text-custom-text-secondary">{t("outlier_filters_description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="videoPublishedDays" className="text-custom-text-secondary font-medium"><CalendarDays className="inline h-4 w-4 mr-1.5 text-custom-yellow-accent"/>{t("videos_published_last_days")}</Label>
            <Select value={videoPublishedDays} onValueChange={setVideoPublishedDays}>
              <SelectTrigger id="videoPublishedDays" className="bg-custom-dark-bg border-custom-border-color text-custom-text-primary hover:border-custom-yellow-accent focus:ring-custom-yellow-accent rounded-md"><SelectValue placeholder={t("select_placeholder")} /></SelectTrigger>
              <SelectContent className="bg-custom-card-bg border-custom-border-color text-custom-text-primary rounded-md">
                <SelectItem value="7" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("days_7")}</SelectItem>
                <SelectItem value="30" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("days_30")}</SelectItem>
                <SelectItem value="90" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("days_90")}</SelectItem>
                <SelectItem value="180" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("days_180")}</SelectItem>
                <SelectItem value="365" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("days_365")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxSubs" className="text-custom-text-secondary font-medium"><Users className="inline h-4 w-4 mr-1.5 text-custom-yellow-accent"/>{t("max_subscribers_channel")}</Label>
            <Select value={maxSubs} onValueChange={setMaxSubs}>
              <SelectTrigger id="maxSubs" className="bg-custom-dark-bg border-custom-border-color text-custom-text-primary hover:border-custom-yellow-accent focus:ring-custom-yellow-accent rounded-md"><SelectValue placeholder={t("select_placeholder")} /></SelectTrigger>
              <SelectContent className="bg-custom-card-bg border-custom-border-color text-custom-text-primary rounded-md">
                <SelectItem value="1000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("subs_1k")}</SelectItem>
                <SelectItem value="5000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("subs_5k")}</SelectItem>
                <SelectItem value="10000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("subs_10k")}</SelectItem>
                <SelectItem value="25000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("subs_25k")}</SelectItem>
                <SelectItem value="50000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("subs_50k")}</SelectItem>
                <SelectItem value="100000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("subs_100k")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minViews" className="text-custom-text-secondary font-medium"><Eye className="inline h-4 w-4 mr-1.5 text-custom-yellow-accent"/>{t("min_views_video")}</Label>
            <Select value={minViews} onValueChange={setMinViews}>
              <SelectTrigger id="minViews" className="bg-custom-dark-bg border-custom-border-color text-custom-text-primary hover:border-custom-yellow-accent focus:ring-custom-yellow-accent rounded-md"><SelectValue placeholder={t("select_placeholder")} /></SelectTrigger>
              <SelectContent className="bg-custom-card-bg border-custom-border-color text-custom-text-primary rounded-md">
                <SelectItem value="1000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("views_1k")}</SelectItem>
                <SelectItem value="5000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("views_5k")}</SelectItem>
                <SelectItem value="10000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("views_10k")}</SelectItem>
                <SelectItem value="25000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("views_25k")}</SelectItem>
                <SelectItem value="50000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("views_50k")}</SelectItem>
                <SelectItem value="100000" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("views_100k")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxChannelVideosTotal" className="text-custom-text-secondary font-medium"><ListFilter className="inline h-4 w-4 mr-1.5 text-custom-yellow-accent"/>{t("max_videos_channel_total")}</Label>
            <Select value={maxChannelVideosTotal} onValueChange={setMaxChannelVideosTotal}>
              <SelectTrigger id="maxChannelVideosTotal" className="bg-custom-dark-bg border-custom-border-color text-custom-text-primary hover:border-custom-yellow-accent focus:ring-custom-yellow-accent rounded-md"><SelectValue placeholder={t("select_placeholder")} /></SelectTrigger>
              <SelectContent className="bg-custom-card-bg border-custom-border-color text-custom-text-primary rounded-md">
                <SelectItem value="10" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("videos_10")}</SelectItem>
                <SelectItem value="20" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("videos_20")}</SelectItem>
                <SelectItem value="30" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("videos_30")}</SelectItem>
                <SelectItem value="50" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("videos_50")}</SelectItem>
                <SelectItem value="100" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("videos_100")}</SelectItem>
                <SelectItem value="999999" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("no_limit")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center pt-6">
            <Button 
              onClick={() => setCurrentView("dashboard")} 
              variant="outline" 
              className="border-custom-yellow-accent text-custom-yellow-accent hover:bg-custom-yellow-accent hover:text-custom-text-on-yellow font-semibold rounded-md px-6 py-2.5"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> {t("back_to_dashboard_button")}
            </Button>
            <div className="flex space-x-4">
                <Button 
                onClick={handleExport} 
                variant="outline" 
                className="border-custom-yellow-accent text-custom-yellow-accent hover:bg-custom-yellow-accent hover:text-custom-text-on-yellow disabled:opacity-50 font-semibold rounded-md px-6 py-2.5"
                disabled={filteredAndSortedResults.length === 0 || isLoading || (!isSubscribed && !checkingSubscription)}>
                {t("export_csv")}
                </Button>
                <Button 
                onClick={handleSearch} 
                className="bg-custom-yellow-accent text-custom-text-on-yellow hover:bg-custom-yellow-hover disabled:opacity-50 font-semibold rounded-md px-6 py-2.5"
                disabled={isLoading || selectedNichesForOutlier.length === 0 || (!isSubscribed && !checkingSubscription)}>
                {isLoading ? t("searching") : t("search_outliers_button")}
                </Button>
            </div>
        </CardFooter>
      </Card>

      {error && (
        <Card className="mb-8 bg-red-900/30 border-red-700 text-custom-text-primary rounded-lg">
          <CardHeader><CardTitle className="text-red-400">{t("error_title")}</CardTitle></CardHeader>
          <CardContent><p>{error}</p></CardContent>
        </Card>
      )}

      {isLoading && <p className="text-center mt-10 text-custom-text-secondary text-lg">{t("loading_results")}</p>}

      {!isLoading && allResults.length > 0 && (isSubscribed || checkingSubscription) && (
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-custom-yellow-accent">{t("search_results_count")} ({filteredAndSortedResults.length})</h2>
            <div className="flex items-center gap-4">
              <Select value={platformFilter} onValueChange={handlePlatformFilterChange} disabled={true}>
                <SelectTrigger className="w-auto sm:w-[200px] bg-custom-dark-bg border-custom-border-color text-custom-text-primary disabled:opacity-70 hover:border-custom-yellow-accent focus:ring-custom-yellow-accent rounded-md">
                  <ListFilter className="h-4 w-4 mr-2 text-custom-yellow-accent" />
                  <SelectValue placeholder={t("filter_by_platform")} />
                </SelectTrigger>
                <SelectContent className="bg-custom-card-bg border-custom-border-color text-custom-text-primary rounded-md">
                  <SelectItem value="YouTube Shorts" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">YouTube Shorts</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-auto sm:w-[200px] bg-custom-dark-bg border-custom-border-color text-custom-text-primary hover:border-custom-yellow-accent focus:ring-custom-yellow-accent rounded-md">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-custom-yellow-accent" />
                  <SelectValue placeholder={t("sort_by")} />
                </SelectTrigger>
                <SelectContent className="bg-custom-card-bg border-custom-border-color text-custom-text-primary rounded-md">
                  <SelectItem value="views_desc" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("most_viewed")}</SelectItem>
                  <SelectItem value="views_asc" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("least_viewed")}</SelectItem>
                  <SelectItem value="date_desc" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("most_recent")}</SelectItem>
                  <SelectItem value="date_asc" className="hover:bg-custom-dark-bg hover:text-custom-yellow-accent">{t("least_recent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedResults.map((result, index) => (
              <Card key={`${result.videoLink}-${index}`} className="flex flex-col bg-custom-card-bg border border-custom-border-color hover:border-custom-yellow-accent transition-all duration-200 ease-in-out shadow-lg hover:shadow-custom-yellow-accent/20 rounded-xl overflow-hidden">
                <CardHeader className="p-0 relative">
                  {result.thumbnailUrl && (
                    <a href={result.videoLink} target="_blank" rel="noopener noreferrer" className="block aspect-video">
                      <img
                        src={result.thumbnailUrl}
                        alt={t("thumbnail_alt_text", { title: result.videoTitle })}
                        className="w-full h-full object-cover"
                        onError={(e) => { 
                            console.error("Erro ao carregar thumbnail (dentro do map):", result.thumbnailUrl); 
                            (e.target as HTMLImageElement).style.display = 'none'; 
                        }}
                      />
                    </a>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col items-end space-y-1.5 z-10">
                    <div className="flex items-center bg-orange-500/80 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                      <Flame className="w-3.5 h-3.5 mr-1 text-white" />
                      <span>{calculateViralFactor(result.viewCount, result.subscriberCount)}</span>
                    </div>
                    {result.niche && (
                      <div className="flex items-center bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-md">
                        <span className="mr-1.5 text-sm">{getNicheEmoji(result.niche)}</span>
                        <span>{t(result.niche.toLowerCase().replace(/\s|&/g, "_"))}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 left-3 bg-black/70 hover:bg-black/90 text-custom-yellow-accent rounded-full h-9 w-9 flex items-center justify-center z-10"
                    onClick={() => toggleFavorite(result.videoLink)}
                  >
                    <Heart className={`h-5 w-5 ${favoritedVideos.includes(result.videoLink) ? "fill-custom-yellow-accent text-custom-yellow-accent" : "text-custom-yellow-accent"}`} />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col">
                  <h3 className="font-semibold text-base leading-snug mb-1.5 text-custom-text-primary">
                    <a href={result.videoLink} target="_blank" rel="noopener noreferrer" title={result.videoTitle} className="hover:text-custom-yellow-accent line-clamp-2">
                      {result.videoTitle || t("title_unavailable")}
                    </a>
                  </h3>
                  <p className="text-sm text-custom-text-secondary mb-2">
                    <a href={result.channelLink} target="_blank" rel="noopener noreferrer" className="hover:text-custom-yellow-accent">
                      {result.channelName || t("channel_unknown")}
                    </a>
                  </p>
                  <div className="text-xs text-custom-text-secondary space-x-2 mb-3 flex items-center flex-wrap gap-y-1">
                    <span>{new Date(result.publishedAt).toLocaleDateString()}</span>
                    <span className="text-custom-yellow-accent font-medium">{result.platform}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 text-xs text-custom-text-secondary grid grid-cols-3 gap-2 border-t border-custom-border-color mt-auto">
                  <div className="text-center py-2">
                    <p className="font-bold text-sm text-custom-text-primary">{Number(result.viewCount || 0).toLocaleString()}</p>
                    <p className="text-custom-text-secondary">{t("views")}</p>
                  </div>
                  <div className="text-center py-2 border-x border-custom-border-color">
                    <p className="font-bold text-sm text-custom-text-primary">{Number(result.likeCount || 0).toLocaleString()}</p>
                    <p className="text-custom-text-secondary">{t("likes")}</p>
                  </div>
                  <div className="text-center py-2">
                    <p className="font-bold text-sm text-custom-text-primary">{Number(result.commentCount || 0).toLocaleString()}</p>
                    <p className="text-custom-text-secondary">{t("comments")}</p>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-custom-card-bg border-custom-border-color text-custom-yellow-accent hover:bg-custom-dark-bg hover:border-custom-yellow-accent disabled:opacity-50 rounded-md w-9 h-9"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(page)}
                  className={`${currentPage === page 
                    ? "bg-custom-yellow-accent text-custom-text-on-yellow hover:bg-custom-yellow-hover font-semibold"
                    : "bg-custom-card-bg border-custom-border-color text-custom-text-secondary hover:border-custom-yellow-accent hover:text-custom-yellow-accent"} rounded-md w-9 h-9`}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-custom-card-bg border-custom-border-color text-custom-yellow-accent hover:bg-custom-dark-bg hover:border-custom-yellow-accent disabled:opacity-50 rounded-md w-9 h-9"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {!isLoading && allResults.length === 0 && !error && (isSubscribed || checkingSubscription) && (
        <p className="text-center mt-10 text-custom-text-secondary text-lg">{t("no_results_found")}</p>
      )}
    </>
  );

  return (
    <div className={`flex min-h-screen bg-custom-dark-bg text-custom-text-primary font-sans transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "pl-20" : "pl-64"}`}>
      {showLangOverlay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out opacity-100"></div>
      )}
      <aside className={`bg-custom-card-bg p-4 space-y-6 fixed h-full flex flex-col justify-between border-r border-custom-border-color transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-20" : "w-64"}`}>
        <div>
          <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} mb-10`}>
            {!isSidebarCollapsed && <h1 className="text-3xl font-bold text-custom-yellow-accent">VIRLO</h1>}
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-custom-text-secondary hover:text-custom-yellow-accent hover:bg-custom-dark-bg">
              {isSidebarCollapsed ? <MenuIcon className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
            </Button>
          </div>
          <nav className="space-y-2">
            {sidebarNavItems.map((item) => (
              <a
                key={item.nameKey}
                href={item.href}
                title={!isSidebarCollapsed ? "" : t(item.nameKey)}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.view) setCurrentView(item.view as "dashboard" | "outlier");
                }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer
                  ${isSidebarCollapsed ? "justify-center" : ""}
                  ${currentView === item.view
                    ? "bg-custom-yellow-accent text-custom-text-on-yellow font-semibold"
                    : "hover:bg-custom-dark-bg hover:text-custom-yellow-accent text-custom-text-secondary"
                  }`}
              >
                <item.icon className={`h-5 w-5 ${isSidebarCollapsed ? "mx-auto" : ""}`} />
                {!isSidebarCollapsed && <span>{t(item.nameKey)}</span>}
                {!isSidebarCollapsed && item.new && <span className="ml-auto text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">{t("new_badge")}</span>}
                {!isSidebarCollapsed && item.soon && <span className="ml-auto text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{t("soon_badge")}</span>}
              </a>
            ))}
          </nav>
        </div>
        <div>
          <nav className="space-y-2 mb-4">
            {sidebarBottomNavItems.map((item) => (
              <a
                key={item.nameKey}
                href={item.href}
                title={!isSidebarCollapsed ? "" : t(item.nameKey)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-custom-dark-bg hover:text-custom-yellow-accent text-custom-text-secondary transition-colors ${isSidebarCollapsed ? "justify-center" : ""}`}
              >
                <item.icon className={`h-5 w-5 ${isSidebarCollapsed ? "mx-auto" : ""}`} />
                {!isSidebarCollapsed && <span>{t(item.nameKey)}</span>}
              </a>
            ))}
          </nav>
          {!isSidebarCollapsed && (
            <>
              <Button variant="outline" className="w-full mb-2 bg-green-500 hover:bg-green-600 text-white border-green-500 font-semibold">
                <DollarSign className="mr-2 h-4 w-4" /> {t("sidebar_affiliate_program")}
              </Button>
              <Button variant="outline" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 font-semibold">
                <Disc className="mr-2 h-4 w-4" /> {t("sidebar_join_discord")}
              </Button>
            </>
          )}
        </div>
      </aside>

      <main className={`flex-1 p-6 md:p-10 overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "ml-20" : "ml-64"}`}>
        {currentView === "dashboard" ? renderDashboardView() : renderOutlierView()}
      </main>
    </div>
  );
}

