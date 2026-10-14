/**
 * Owner Configuration
 * Contains the official owner information for WorkFriends platform
 */

export const OWNER_CONFIG = {
  // Official owner information
  name: "Rekhi Sachraf",
  email: "rekhisachraf.com83@gmail.com",
  supportEmail: "rekhisachraf.com83@gmail.com",
  businessName: "WorkFriends",
  website: "https://workfriends.com",
  
  // Support configuration
  support: {
    email: "rekhisachraf.com83@gmail.com",
    phone: null,
    responseTime: "24 hours",
    categories: ["technical", "billing", "complaint", "feature_request", "other"],
  },
  
  // Platform settings
  platform: {
    name: "WorkFriends",
    tagline: "منصة استطلاعات الرأي لكسب المال",
    description: "منصة عالمية لكسب النقاط والعملات الرقمية من خلال الإجابة على الاستطلاعات",
    version: "1.0.0",
  },
  
  // Currency settings
  currency: {
    code: "USD",
    symbol: "$",
    digitalCurrencyName: "WorkPoints",
    conversionRate: {
      digitalToUSD: 0.000001, // 10000 digital currency = 0.01 USD
      usdToDigital: 1000000,
    },
  },
  
  // Withdrawal settings
  withdrawal: {
    minimumAmount: 1, // $1 minimum
    maximumAmount: 10000, // $10,000 maximum per request
    processingTime: "3-5 business days",
    methods: ["paypal", "bank_transfer", "stripe"],
  },
  
  // Level settings
  levels: [
    {
      level: 1,
      name: "Beginner",
      requiredPoints: 0,
      badge: "🌟",
    },
    {
      level: 2,
      name: "Intermediate",
      requiredPoints: 100,
      badge: "⭐",
    },
    {
      level: 3,
      name: "Advanced",
      requiredPoints: 300,
      badge: "✨",
    },
    {
      level: 4,
      name: "Expert",
      requiredPoints: 600,
      badge: "💎",
    },
    {
      level: 5,
      name: "Professional",
      requiredPoints: 1000,
      badge: "👑",
    },
  ],
};

export default OWNER_CONFIG;
