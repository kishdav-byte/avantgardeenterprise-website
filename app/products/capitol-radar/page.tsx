"use client"

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Loader2, Lock, ShieldCheck, ShieldAlert, Search, RefreshCw, 
    TrendingUp, TrendingDown, Bell, Phone, Save, CheckCircle2, 
    ArrowUpRight, AlertOctagon, HelpCircle, ChevronRight, X, Info,
    Sliders
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, CartesianGrid, BarChart, Bar, Cell, Legend } from 'recharts'

interface Trade {
    id: string
    politician_name: string
    chamber: 'House' | 'Senate' | 'Executive'
    party: string
    ticker: string
    transaction_type: 'Purchase' | 'Sale' | 'Exchange'
    amount_range: string
    transaction_date: string
    filing_date: string
    committee_overlap: boolean
    is_notified: boolean
    created_at: string
}

interface SimulatedStock {
    ticker: string
    name: string
    price: number
    change: number
    changePercent: number
    prevPrice: number
}

interface CompanyDetails {
    name: string
    industry: string
    description: string
}

const COMPANY_DIRECTORY: Record<string, CompanyDetails> = {
    "NVDA": {
        "name": "NVIDIA Corporation",
        "industry": "Semiconductors",
        "description": "NVIDIA designs and manufactures graphics processing units (GPUs) for gaming, professional markets, and AI applications."
    },
    "MU": {
        "name": "Micron Technology, Inc.",
        "industry": "Semiconductors",
        "description": "Micron produces memory and storage solutions, including DRAM and NAND flash memory."
    },
    "COHR": {
        "name": "Coherent, Inc.",
        "industry": "Manufacturing",
        "description": "Coherent provides laser-based manufacturing solutions for various industries, including materials processing and medical devices."
    },
    "CCI": {
        "name": "Crown Castle Inc.",
        "industry": "Telecommunications",
        "description": "Crown Castle owns and operates cell towers and fiber networks to support wireless communication."
    },
    "AAPL": {
        "name": "Apple Inc.",
        "industry": "Technology",
        "description": "Apple designs, manufactures, and markets consumer electronics, software, and services, including the iPhone and Mac computers."
    },
    "HUBB": {
        "name": "Hubbell Incorporated",
        "industry": "Electrical Equipment",
        "description": "Hubbell manufactures electrical and electronic products for commercial, industrial, and utility applications."
    },
    "NTDOY": {
        "name": "Nintendo Co., Ltd.",
        "industry": "Entertainment",
        "description": "Nintendo develops and publishes video games and consoles, including the popular Nintendo Switch."
    },
    "WAB": {
        "name": "Westinghouse Air Brake Technologies Corporation",
        "industry": "Transportation",
        "description": "Wabtec provides technology-based equipment and services for the rail and transit industries."
    },
    "MIDD": {
        "name": "Middleby Corporation",
        "industry": "Manufacturing",
        "description": "Middleby designs and manufactures commercial kitchen equipment and food processing solutions."
    },
    "VOYG": {
        "name": "Voyager Digital Ltd.",
        "industry": "Financial Services",
        "description": "Voyager offers a cryptocurrency trading platform and mobile app for buying and selling digital assets."
    },
    "LYV": {
        "name": "Live Nation Entertainment, Inc.",
        "industry": "Entertainment",
        "description": "Live Nation operates as a live events company, promoting concerts and managing ticket sales."
    },
    "CPAY": {
        "name": "ClydePay, Inc.",
        "industry": "Financial Services",
        "description": "ClydePay provides payment processing solutions for businesses and consumers."
    },
    "CNM": {
        "name": "Conformis, Inc.",
        "industry": "Medical Devices",
        "description": "Conformis develops personalized orthopedic implants and surgical solutions."
    },
    "INSM": {
        "name": "Insmed Incorporated",
        "industry": "Biotechnology",
        "description": "Insmed focuses on developing therapies for patients with rare diseases, particularly pulmonary conditions."
    },
    "ENTG": {
        "name": "Entegris, Inc.",
        "industry": "Manufacturing",
        "description": "Entegris provides materials and solutions for the semiconductor and other high-tech industries."
    },
    "UNH": {
        "name": "UnitedHealth Group Incorporated",
        "industry": "Healthcare",
        "description": "UnitedHealth Group offers health care products and insurance services."
    },
    "BEP": {
        "name": "Brookfield Renewable Partners L.P.",
        "industry": "Renewable Energy",
        "description": "BEP owns and operates renewable power assets, including hydroelectric, wind, and solar facilities."
    },
    "CRM": {
        "name": "Salesforce, Inc.",
        "industry": "Software",
        "description": "Salesforce provides cloud-based customer relationship management (CRM) software and applications."
    },
    "BIIB": {
        "name": "Biogen Inc.",
        "industry": "Biotechnology",
        "description": "Biogen develops therapies for neurological diseases, including multiple sclerosis and Alzheimer's."
    },
    "NVZMY": {
        "name": "Novozymes A/S",
        "industry": "Biotechnology",
        "description": "Novozymes produces enzymes and microorganisms for various industries, including agriculture and bioenergy."
    },
    "NSRGY": {
        "name": "Nestlé S.A.",
        "industry": "Food & Beverage",
        "description": "Nestlé is a multinational food and beverage company known for its diverse product portfolio."
    },
    "BKNG": {
        "name": "Booking Holdings Inc.",
        "industry": "Travel & Leisure",
        "description": "Booking Holdings operates online travel and related services, including Booking.com and Priceline."
    },
    "BABA": {
        "name": "Alibaba Group Holding Limited",
        "industry": "E-commerce",
        "description": "Alibaba is a leading e-commerce platform in China, offering a wide range of products and services."
    },
    "ADC": {
        "name": "Agree Realty Corporation",
        "industry": "Real Estate",
        "description": "ADC is a real estate investment trust (REIT) focused on retail properties leased to high-quality tenants."
    },
    "HD": {
        "name": "The Home Depot, Inc.",
        "industry": "Retail",
        "description": "Home Depot is a home improvement retailer offering tools, construction products, and services."
    },
    "PPG": {
        "name": "PPG Industries, Inc.",
        "industry": "Chemicals",
        "description": "PPG manufactures paints, coatings, and specialty materials for various industries."
    },
    "IBM": {
        "name": "International Business Machines Corporation",
        "industry": "Technology",
        "description": "IBM provides technology and consulting services, including cloud computing and artificial intelligence."
    },
    "JNJ": {
        "name": "Johnson & Johnson",
        "industry": "Healthcare",
        "description": "Johnson & Johnson develops medical devices, pharmaceuticals, and consumer health products."
    },
    "AMZN": {
        "name": "Amazon.com, Inc.",
        "industry": "E-commerce",
        "description": "Amazon is a global e-commerce and cloud computing company, known for its online marketplace."
    },
    "JPM": {
        "name": "JPMorgan Chase & Co.",
        "industry": "Financial Services",
        "description": "JPMorgan Chase is a leading global financial services firm offering investment banking and asset management."
    },
    "KO": {
        "name": "The Coca-Cola Company",
        "industry": "Beverages",
        "description": "Coca-Cola is a multinational beverage corporation known for its soft drinks and other beverages."
    },
    "WMT": {
        "name": "Walmart Inc.",
        "industry": "Retail",
        "description": "Walmart is a multinational retail corporation operating a chain of hypermarkets and grocery stores."
    },
    "SBUX": {
        "name": "Starbucks Corporation",
        "industry": "Food & Beverage",
        "description": "Starbucks is a global coffeehouse chain known for its specialty coffee and beverages."
    },
    "MSFT": {
        "name": "Microsoft Corporation",
        "industry": "Technology",
        "description": "Microsoft develops software, hardware, and cloud services, including the Windows operating system."
    },
    "AVGO": {
        "name": "Broadcom Inc.",
        "industry": "Semiconductors",
        "description": "Broadcom designs and develops a wide range of semiconductor and infrastructure software solutions."
    },
    "MA": {
        "name": "Mastercard Incorporated",
        "industry": "Financial Services",
        "description": "Mastercard provides payment processing and technology solutions for consumers and businesses."
    },
    "V": {
        "name": "Visa Inc.",
        "industry": "Financial Services",
        "description": "Visa operates a global payments technology network facilitating electronic funds transfers."
    },
    "LLY": {
        "name": "Eli Lilly and Company",
        "industry": "Pharmaceuticals",
        "description": "Eli Lilly develops and manufactures pharmaceutical products for various medical conditions."
    },
    "NOW": {
        "name": "ServiceNow, Inc.",
        "industry": "Software",
        "description": "ServiceNow provides cloud-based solutions for digital workflows and enterprise service management."
    },
    "ADBE": {
        "name": "Adobe Inc.",
        "industry": "Software",
        "description": "Adobe develops software products for creative professionals, including Photoshop and Acrobat."
    },
    "ABT": {
        "name": "Abbott Laboratories",
        "industry": "Healthcare",
        "description": "Abbott Laboratories develops and manufactures a wide range of healthcare products, including medical devices, diagnostics, and nutritional products."
    },
    "META": {
        "name": "Meta Platforms, Inc.",
        "industry": "Technology",
        "description": "Meta Platforms, Inc. is a technology company that focuses on social media services and products, including Facebook, Instagram, and WhatsApp."
    },
    "T": {
        "name": "AT&T Inc.",
        "industry": "Telecommunications",
        "description": "AT&T Inc. provides telecommunications, media, and technology services, including wireless communications and broadband."
    },
    "DSGX": {
        "name": "Daseke, Inc.",
        "industry": "Transportation",
        "description": "Daseke, Inc. is a leading provider of flatbed and specialized transportation services in North America."
    },
    "TXRH": {
        "name": "Texas Roadhouse, Inc.",
        "industry": "Restaurants",
        "description": "Texas Roadhouse, Inc. is a casual dining restaurant chain known for its hand-cut steaks and Texas-style hospitality."
    },
    "TCBI": {
        "name": "Texas Capital Bancshares, Inc.",
        "industry": "Banking",
        "description": "Texas Capital Bancshares, Inc. is a bank holding company that provides a range of financial services to businesses and individuals."
    },
    "STRL": {
        "name": "Sterling Construction Company, Inc.",
        "industry": "Construction",
        "description": "Sterling Construction Company, Inc. provides infrastructure and construction services, specializing in heavy civil construction."
    },
    "SFTBF": {
        "name": "SoftBank Group Corp.",
        "industry": "Investment",
        "description": "SoftBank Group Corp. is a multinational conglomerate holding company focused on technology investments and telecommunications."
    },
    "SMTC": {
        "name": "Semtech Corporation",
        "industry": "Semiconductors",
        "description": "Semtech Corporation designs and manufactures analog and mixed-signal semiconductors for various applications."
    },
    "RBC": {
        "name": "Regal Beloit Corporation",
        "industry": "Manufacturing",
        "description": "Regal Beloit Corporation manufactures electric motors, electrical motion controls, and power generation products."
    },
    "MCHP": {
        "name": "Microchip Technology Incorporated",
        "industry": "Semiconductors",
        "description": "Microchip Technology Incorporated is a leading provider of microcontroller and analog semiconductors."
    },
    "HQY": {
        "name": "HealthEquity, Inc.",
        "industry": "Healthcare",
        "description": "HealthEquity, Inc. provides health savings accounts and other consumer-directed benefits solutions."
    },
    "CYTK": {
        "name": "Cytokinetics, Incorporated",
        "industry": "Biotechnology",
        "description": "Cytokinetics, Incorporated is a biotechnology company focused on discovering and developing muscle activators and other therapies."
    },
    "CRDO": {
        "name": "Ceridian HCM Holding Inc.",
        "industry": "Software",
        "description": "Ceridian HCM Holding Inc. provides human capital management software solutions for businesses."
    },
    "CECO": {
        "name": "Career Education Corporation",
        "industry": "Education",
        "description": "Career Education Corporation offers post-secondary education programs and services through various institutions."
    },
    "CBZ": {
        "name": "CBIZ, Inc.",
        "industry": "Professional Services",
        "description": "CBIZ, Inc. provides professional services, including accounting, tax, and consulting services to businesses."
    },
    "CDRE": {
        "name": "Cadre Holdings, Inc.",
        "industry": "Manufacturing",
        "description": "Cadre Holdings, Inc. manufactures and distributes safety and security products, including body armor and tactical gear."
    },
    "BRCM": {
        "name": "Broadcom Inc.",
        "industry": "Semiconductors",
        "description": "Broadcom Inc. designs, develops, and supplies a broad range of semiconductor and infrastructure software solutions."
    },
    "BOOT": {
        "name": "Boot Barn Holdings, Inc.",
        "industry": "Retail",
        "description": "Boot Barn Holdings, Inc. is a retailer of western and work-related footwear, apparel, and accessories."
    },
    "AGX": {
        "name": "Argan, Inc.",
        "industry": "Construction",
        "description": "Argan, Inc. provides construction and engineering services for power generation and industrial projects."
    },
    "VLTO": {
        "name": "Valo Health, LLC",
        "industry": "Biotechnology",
        "description": "Valo Health, LLC leverages artificial intelligence to accelerate drug discovery and development."
    },
    "SPOT": {
        "name": "Spotify Technology S.A.",
        "industry": "Media",
        "description": "Spotify Technology S.A. is a digital music service that provides streaming access to millions of songs and podcasts."
    },
    "SPCX": {
        "name": "Spire Global, Inc.",
        "industry": "Aerospace",
        "description": "Spire Global, Inc. provides satellite data and analytics for various industries, including weather and maritime."
    },
    "ZTS": {
        "name": "Zoetis Inc.",
        "industry": "Pharmaceuticals",
        "description": "Zoetis Inc. develops and manufactures medicines and vaccines for pets and livestock."
    },
    "VRSK": {
        "name": "Verisk Analytics, Inc.",
        "industry": "Data Analytics",
        "description": "Verisk Analytics, Inc. provides data analytics and risk assessment services to various industries."
    },
    "TTD": {
        "name": "The Trade Desk, Inc.",
        "industry": "Advertising",
        "description": "The Trade Desk, Inc. offers a technology platform for digital advertising and media buying."
    },
    "PGR": {
        "name": "The Progressive Corporation",
        "industry": "Insurance",
        "description": "The Progressive Corporation provides personal and commercial auto insurance products and services."
    },
    "KVUE": {
        "name": "KVUE Television",
        "industry": "Media",
        "description": "KVUE Television is a local television station serving the Austin, Texas area, providing news and entertainment."
    },
    "JKHY": {
        "name": "Jack Henry & Associates, Inc.",
        "industry": "Financial Services",
        "description": "Jack Henry & Associates, Inc. provides technology solutions and payment processing services for financial institutions."
    },
    "GDDY": {
        "name": "GoDaddy Inc.",
        "industry": "Internet Services",
        "description": "GoDaddy Inc. is a web hosting and domain registration company that provides online services for small businesses."
    },
    "GIS": {
        "name": "General Mills, Inc.",
        "industry": "Food Products",
        "description": "General Mills, Inc. is a global manufacturer and marketer of branded consumer foods."
    },
    "FOX": {
        "name": "Fox Corporation",
        "industry": "Media",
        "description": "Fox Corporation is a media company that operates news and entertainment television networks."
    },
    "FIS": {
        "name": "FIS Global",
        "industry": "Financial Services",
        "description": "FIS Global provides technology solutions for merchants, banks, and capital markets."
    },
    "EA": {
        "name": "Electronic Arts Inc.",
        "industry": "Gaming",
        "description": "Electronic Arts Inc. develops and publishes video games for various platforms."
    },
    "CAG": {
        "name": "Conagra Brands, Inc.",
        "industry": "Food Products",
        "description": "Conagra Brands, Inc. is a packaged foods company that produces and sells a variety of food products."
    },
    "CMCSA": {
        "name": "Comcast Corporation",
        "industry": "Telecommunications",
        "description": "Comcast Corporation is a global media and technology company that provides cable television, internet, and phone services."
    },
    "COIN": {
        "name": "Coinbase Global, Inc.",
        "industry": "Cryptocurrency",
        "description": "Coinbase Global, Inc. operates a cryptocurrency exchange platform for buying, selling, and storing digital assets."
    },
    "CME": {
        "name": "CME Group Inc.",
        "industry": "Financial Services",
        "description": "CME Group Inc. operates a global marketplace for derivatives and futures trading."
    },
    "BR": {
        "name": "Broadridge Financial Solutions, Inc.",
        "industry": "Financial Services",
        "description": "Broadridge Financial Solutions, Inc. provides investor communications and technology-driven solutions for financial services."
    },
    "ADP": {
        "name": "Automatic Data Processing, Inc.",
        "industry": "Human Resources",
        "description": "Automatic Data Processing, Inc. provides payroll and human capital management solutions for businesses."
    },
    "ACN": {
        "name": "Accenture plc",
        "industry": "Consulting",
        "description": "Accenture provides consulting services and solutions in strategy, digital, technology, and operations."
    },
    "LPLA": {
        "name": "LPL Financial Holdings Inc.",
        "industry": "Financial Services",
        "description": "LPL Financial is a leading retail investment advisory firm and independent broker-dealer."
    },
    "FSV": {
        "name": "FirstService Corporation",
        "industry": "Real Estate",
        "description": "FirstService provides property management and related services to residential and commercial properties."
    },
    "MTN": {
        "name": "Vail Resorts, Inc.",
        "industry": "Leisure",
        "description": "Vail Resorts operates ski resorts and offers mountain-related recreational activities."
    },
    "MELI": {
        "name": "MercadoLibre, Inc.",
        "industry": "E-commerce",
        "description": "MercadoLibre is the largest e-commerce platform in Latin America, facilitating online buying and selling."
    },
    "TOELF": {
        "name": "Tootsie Roll Industries, Inc.",
        "industry": "Consumer Goods",
        "description": "Tootsie Roll Industries manufactures and sells confectionery products, including its famous Tootsie Roll."
    },
    "BNPQF": {
        "name": "BNP Paribas S.A.",
        "industry": "Banking",
        "description": "BNP Paribas is a multinational banking and financial services company headquartered in France."
    },
    "SAN": {
        "name": "Banco Santander, S.A.",
        "industry": "Banking",
        "description": "Banco Santander is a global bank providing a wide range of financial services to individuals and businesses."
    },
    "AJINF": {
        "name": "Aji Poke, Inc.",
        "industry": "Food & Beverage",
        "description": "Aji Poke specializes in serving fresh poke bowls and related Hawaiian cuisine."
    },
    "WDAY": {
        "name": "Workday, Inc.",
        "industry": "Software",
        "description": "Workday provides enterprise cloud applications for finance and human resources."
    },
    "WRB": {
        "name": "W.R. Berkley Corporation",
        "industry": "Insurance",
        "description": "W.R. Berkley is a commercial lines property and casualty insurance provider."
    },
    "COO": {
        "name": "The Cooper Companies, Inc.",
        "industry": "Healthcare",
        "description": "The Cooper Companies develops and manufactures innovative medical devices and contact lenses."
    },
    "TEL": {
        "name": "TE Connectivity Ltd.",
        "industry": "Electronics",
        "description": "TE Connectivity designs and manufactures connectivity and sensor solutions for various industries."
    },
    "MSTR": {
        "name": "MicroStrategy Incorporated",
        "industry": "Software",
        "description": "MicroStrategy provides business intelligence and analytics software solutions."
    },
    "BSX": {
        "name": "Boston Scientific Corporation",
        "industry": "Medical Devices",
        "description": "Boston Scientific develops and manufactures medical devices for various therapeutic areas."
    },
    "AMD": {
        "name": "Advanced Micro Devices, Inc.",
        "industry": "Semiconductors",
        "description": "AMD produces computer processors and related technologies for computing and graphics."
    },
    "IBP": {
        "name": "Installed Building Products, Inc.",
        "industry": "Construction",
        "description": "Installed Building Products provides insulation and building products installation services."
    },
    "CVX": {
        "name": "Chevron Corporation",
        "industry": "Energy",
        "description": "Chevron is a multinational corporation engaged in all aspects of the energy sector, including oil and gas."
    },
    "CCLFX": {
        "name": "Carnival Corporation & plc",
        "industry": "Travel & Leisure",
        "description": "Carnival Corporation is a global cruise company operating a fleet of cruise ships."
    },
    "WFC": {
        "name": "Wells Fargo & Company",
        "industry": "Banking",
        "description": "Wells Fargo is a diversified financial services company providing banking, investment, and mortgage products."
    },
    "TSLA": {
        "name": "Tesla, Inc.",
        "industry": "Automotive",
        "description": "Tesla designs and manufactures electric vehicles and renewable energy products."
    },
    "SNOW": {
        "name": "Snowflake Inc.",
        "industry": "Cloud Computing",
        "description": "Snowflake provides a cloud-based data warehousing platform for data storage and analytics."
    },
    "PG": {
        "name": "Procter & Gamble Co.",
        "industry": "Consumer Goods",
        "description": "Procter & Gamble manufactures a wide range of consumer goods, including personal care and household products."
    },
    "NFLX": {
        "name": "Netflix, Inc.",
        "industry": "Entertainment",
        "description": "Netflix is a streaming service offering a wide variety of award-winning TV shows, movies, anime, and documentaries."
    },
    "MCD": {
        "name": "McDonald's Corporation",
        "industry": "Restaurants",
        "description": "McDonald's is a global fast-food restaurant chain known for its hamburgers and fries."
    },
    "BRK.B": {
        "name": "Berkshire Hathaway Inc.",
        "industry": "Conglomerate",
        "description": "Berkshire Hathaway is a multinational conglomerate holding company with diverse business interests."
    },
    "AXP": {
        "name": "American Express Company",
        "industry": "Financial Services",
        "description": "American Express provides charge and credit card products, as well as travel and financial services."
    },
    "NKE": {
        "name": "Nike, Inc.",
        "industry": "Apparel",
        "description": "Nike designs, develops, and sells athletic footwear, apparel, and equipment."
    },
    "VZ": {
        "name": "Verizon Communications Inc.",
        "industry": "Telecommunications",
        "description": "Verizon is a telecommunications company providing wireless and wireline services."
    },
    "SPGI": {
        "name": "S&P Global Inc.",
        "industry": "Financial Services",
        "description": "S&P Global provides financial information and analytics, including credit ratings and market indices."
    },
    "PEP": {
        "name": "PepsiCo, Inc.",
        "industry": "Food & Beverage",
        "description": "PepsiCo is a global food and beverage leader known for its snack and beverage products."
    },
    "PLTR": {
        "name": "Palantir Technologies Inc.",
        "industry": "Software",
        "description": "Palantir provides software solutions for data integration and analysis."
    },
    "ORCL": {
        "name": "Oracle Corporation",
        "industry": "Software",
        "description": "Oracle develops and sells database software and technology, cloud-engineered systems, and enterprise software products."
    },
    "LIN": {
        "name": "Linde plc",
        "industry": "Chemicals",
        "description": "Linde is a global industrial gases and engineering company."
    },
    "INTC": {
        "name": "Intel Corporation",
        "industry": "Semiconductors",
        "description": "Intel designs and manufactures advanced integrated digital technology platforms."
    },
    "XOM": {
        "name": "Exxon Mobil Corporation",
        "industry": "Energy",
        "description": "Exxon Mobil is an oil and gas corporation involved in exploration, production, and refining."
    },
    "CAT": {
        "name": "Caterpillar Inc.",
        "industry": "Machinery",
        "description": "Caterpillar manufactures construction and mining equipment, diesel and natural gas engines."
    },
    "BA": {
        "name": "The Boeing Company",
        "industry": "Aerospace",
        "description": "Boeing designs, manufactures, and sells airplanes, rotorcraft, rockets, satellites, and telecommunications equipment."
    },
    "GOOGL": {
        "name": "Alphabet Inc.",
        "industry": "Technology",
        "description": "Alphabet is the parent company of Google, specializing in internet-related services and products."
    },
    "ABBV": {
        "name": "AbbVie Inc.",
        "industry": "Pharmaceuticals",
        "description": "AbbVie is a global biopharmaceutical company focused on developing advanced therapies."
    },
    "VTI": {
        "name": "Vanguard Total Stock Market ETF",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that seeks to track the performance of the CRSP US Total Market Index."
    },
    "QQQ": {
        "name": "Invesco QQQ Trust",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that tracks the performance of the Nasdaq-100 Index."
    },
    "CSCO": {
        "name": "Cisco Systems, Inc.",
        "industry": "Technology",
        "description": "A multinational technology company that designs, manufactures, and sells networking hardware, telecommunications equipment, and other high-technology services and products."
    },
    "PYPL": {
        "name": "PayPal Holdings, Inc.",
        "industry": "Financial Services",
        "description": "A digital payments platform that allows users to make online payments and money transfers."
    },
    "COST": {
        "name": "Costco Wholesale Corporation",
        "industry": "Retail",
        "description": "A membership-only warehouse club that provides a wide selection of merchandise at discounted prices."
    },
    "BAC": {
        "name": "Bank of America Corporation",
        "industry": "Financial Services",
        "description": "A multinational banking and financial services corporation offering a range of financial products and services."
    },
    "GS": {
        "name": "The Goldman Sachs Group, Inc.",
        "industry": "Financial Services",
        "description": "An investment banking, securities, and investment management firm that provides a wide range of financial services."
    },
    "VOO": {
        "name": "Vanguard S&P 500 ETF",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that aims to track the performance of the S&P 500 Index."
    },
    "DIS": {
        "name": "The Walt Disney Company",
        "industry": "Entertainment",
        "description": "A diversified international family entertainment and media enterprise."
    },
    "US-TBILL": {
        "name": "U.S. Treasury Bill",
        "industry": "Government Securities",
        "description": "Short-term government securities that mature in one year or less."
    },
    "GOOG": {
        "name": "Alphabet Inc.",
        "industry": "Technology",
        "description": "The parent company of Google, specializing in internet-related services and products."
    },
    "QNT": {
        "name": "Quant Network",
        "industry": "Blockchain",
        "description": "A blockchain technology company that aims to connect different blockchains and networks."
    },
    "TCNNF": {
        "name": "Trulieve Cannabis Corp.",
        "industry": "Cannabis",
        "description": "A cannabis company that cultivates and sells medical marijuana products."
    },
    "GD": {
        "name": "General Dynamics Corporation",
        "industry": "Aerospace & Defense",
        "description": "A global aerospace and defense company that provides a wide range of products and services."
    },
    "UBER": {
        "name": "Uber Technologies, Inc.",
        "industry": "Transportation",
        "description": "A technology company that offers ride-hailing, food delivery, and freight transportation services."
    },
    "RF-PE": {
        "name": "Regions Financial Corporation - Preferred",
        "industry": "Financial Services",
        "description": "A financial services company offering banking, investment, and mortgage products."
    },
    "T-PA": {
        "name": "AT&T Inc. - Preferred",
        "industry": "Telecommunications",
        "description": "A telecommunications company providing mobile and fixed-line services."
    },
    "GILD": {
        "name": "Gilead Sciences, Inc.",
        "industry": "Biotechnology",
        "description": "A biopharmaceutical company that discovers, develops, and commercializes innovative medicines."
    },
    "COR": {
        "name": "CoreSite Realty Corporation",
        "industry": "Real Estate",
        "description": "A real estate investment trust (REIT) that provides data center solutions."
    },
    "EQT": {
        "name": "EQT Corporation",
        "industry": "Energy",
        "description": "A natural gas production company focused on the exploration and production of natural gas."
    },
    "CHKP": {
        "name": "Check Point Software Technologies Ltd.",
        "industry": "Cybersecurity",
        "description": "A multinational provider of cybersecurity solutions for businesses and governments."
    },
    "BDX": {
        "name": "Becton, Dickinson and Company",
        "industry": "Medical Devices",
        "description": "A global medical technology company that develops, manufactures, and sells medical devices and supplies."
    },
    "AMCR": {
        "name": "Amcor plc",
        "industry": "Packaging",
        "description": "A global leader in responsible packaging solutions."
    },
    "FOUR": {
        "name": "Shift4 Payments, Inc.",
        "industry": "Financial Technology",
        "description": "A payment processing company that provides integrated payment solutions for businesses."
    },
    "TPR": {
        "name": "Tapestry, Inc.",
        "industry": "Retail",
        "description": "A luxury fashion company that owns brands like Coach, Kate Spade, and Stuart Weitzman."
    },
    "LUV": {
        "name": "Southwest Airlines Co.",
        "industry": "Airlines",
        "description": "A major American airline known for its low-cost fares and no-frills service."
    },
    "GEV": {
        "name": "Greenwich LifeSciences, Inc.",
        "industry": "Biotechnology",
        "description": "A biotechnology company focused on the development of immunotherapy for cancer treatment."
    },
    "GE": {
        "name": "General Electric Company",
        "industry": "Conglomerate",
        "description": "A multinational conglomerate involved in various sectors including aviation, healthcare, and renewable energy."
    },
    "XTWO": {
        "name": "X2O Media",
        "industry": "Technology",
        "description": "A company that provides digital signage and visual communication solutions."
    },
    "XFIV": {
        "name": "X5 Retail Group N.V.",
        "industry": "Retail",
        "description": "A leading grocery retailer in Russia operating various store formats."
    },
    "GIGB": {
        "name": "Guggenheim Enhanced Equity Income Fund",
        "industry": "Closed-End Fund",
        "description": "A closed-end fund that seeks to provide a high level of current income and capital appreciation."
    },
    "GBIL": {
        "name": "Goldman Sachs Access Treasury 0-1 Year ETF",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that invests in U.S. Treasury securities with maturities of 0 to 1 year."
    },
    "AGZ": {
        "name": "iShares Agency Bond ETF",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that seeks to track the investment results of an index composed of U.S. agency bonds."
    },
    "MBB": {
        "name": "iShares MBS ETF",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that seeks to track the investment results of an index composed of U.S. mortgage-backed securities."
    },
    "CMBS": {
        "name": "iShares CMBS ETF",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that seeks to track the investment results of an index composed of U.S. commercial mortgage-backed securities."
    },
    "TLH": {
        "name": "iShares 10-20 Year Treasury Bond ETF",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that seeks to track the investment results of an index composed of U.S. Treasury bonds with maturities between 10 and 20 years."
    },
    "IEF": {
        "name": "iShares 7-10 Year Treasury Bond ETF",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that seeks to track the investment results of an index composed of U.S. Treasury bonds with maturities between 7 and 10 years."
    },
    "JMBS": {
        "name": "iShares U.S. Mortgage Bond ETF",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that seeks to track the investment results of an index composed of U.S. mortgage bonds."
    },
    "SCHP": {
        "name": "Schwab U.S. TIPS ETF",
        "industry": "Exchange-Traded Fund",
        "description": "An ETF that seeks to track the investment results of an index composed of U.S. Treasury Inflation-Protected Securities."
    },
    "EIPI": {
        "name": "EIP Investment Trust",
        "industry": "Investment Trust",
        "description": "An investment trust focused on providing returns through a diversified portfolio."
    },
    "GEM": {
        "name": "GEM Holdings, Inc.",
        "industry": "Investment",
        "description": "GEM Holdings focuses on providing investment solutions across various asset classes."
    },
    "EFA": {
        "name": "iShares MSCI EAFE ETF",
        "industry": "Exchange-Traded Fund",
        "description": "EFA offers exposure to large- and mid-cap companies in developed markets outside of North America."
    },
    "IWM": {
        "name": "iShares Russell 2000 ETF",
        "industry": "Exchange-Traded Fund",
        "description": "IWM tracks the performance of the Russell 2000 Index, representing small-cap U.S. stocks."
    },
    "RNWGX": {
        "name": "RiverNorth Opportunities Fund, Inc.",
        "industry": "Investment",
        "description": "RNWGX seeks to provide total return through a combination of capital appreciation and income."
    },
    "IVV": {
        "name": "iShares Core S&P 500 ETF",
        "industry": "Exchange-Traded Fund",
        "description": "IVV aims to track the performance of the S&P 500 Index, representing large-cap U.S. equities."
    },
    "LITP": {
        "name": "Litigation Capital Management Limited",
        "industry": "Legal Finance",
        "description": "LITP provides funding for legal claims and litigation finance solutions."
    },
    "VNQI": {
        "name": "Vanguard Global ex-U.S. Real Estate ETF",
        "industry": "Exchange-Traded Fund",
        "description": "VNQI offers exposure to real estate investment trusts (REITs) outside the United States."
    },
    "VEA": {
        "name": "Vanguard FTSE Developed Markets ETF",
        "industry": "Exchange-Traded Fund",
        "description": "VEA provides exposure to stocks in developed markets outside of the U.S. and Canada."
    },
    "FTGC": {
        "name": "Fidelity Total Bond ETF",
        "industry": "Exchange-Traded Fund",
        "description": "FTGC seeks to provide investment results that correspond to the total return of the bond market."
    },
    "SPYM": {
        "name": "SPDR S&P 500 Momentum ETF",
        "industry": "Exchange-Traded Fund",
        "description": "SPYM focuses on stocks within the S&P 500 that exhibit strong momentum characteristics."
    },
    "91282CNG2": {
        "name": "U.S. Treasury Bond",
        "industry": "Government Debt",
        "description": "91282CNG2 represents a U.S. government bond with a fixed interest rate and maturity."
    },
    "ALB": {
        "name": "Albemarle Corporation",
        "industry": "Chemicals",
        "description": "ALB is a global leader in the production of lithium and other specialty chemicals."
    },
    "ECL": {
        "name": "Ecolab Inc.",
        "industry": "Chemicals",
        "description": "ECL provides water, hygiene, and energy technologies and services to various industries."
    },
    "IEI": {
        "name": "iShares 3-7 Year Treasury Bond ETF",
        "industry": "Exchange-Traded Fund",
        "description": "IEI seeks to track the investment results of an index composed of U.S. Treasury bonds with maturities between 3 and 7 years."
    },
    "TSM": {
        "name": "Taiwan Semiconductor Manufacturing Company",
        "industry": "Semiconductors",
        "description": "TSM is the world's largest dedicated independent semiconductor foundry."
    },
    "LRCX": {
        "name": "Lam Research Corporation",
        "industry": "Semiconductors",
        "description": "LRCX provides wafer fabrication equipment and services to the semiconductor industry."
    },
    "KR": {
        "name": "Kroger Co.",
        "industry": "Retail",
        "description": "KR operates a chain of supermarkets and grocery stores across the United States."
    },
    "AMGN": {
        "name": "Amgen Inc.",
        "industry": "Biotechnology",
        "description": "AMGN is a biotechnology company that develops and manufactures innovative human therapeutics."
    },
    "AEP": {
        "name": "American Electric Power Company, Inc.",
        "industry": "Utilities",
        "description": "AEP is one of the largest electric utilities in the United States, providing electricity to millions of customers."
    },
    "KHC": {
        "name": "Kraft Heinz Company",
        "industry": "Food & Beverage",
        "description": "KHC is a global food and beverage company known for its iconic brands."
    },
    "BMY": {
        "name": "Bristol-Myers Squibb Company",
        "industry": "Pharmaceuticals",
        "description": "BMY is a global biopharmaceutical company focused on discovering, developing, and delivering innovative medicines."
    },
    "BYRN": {
        "name": "Byrna Technologies Inc.",
        "industry": "Security",
        "description": "BYRN develops and manufactures non-lethal personal security devices."
    },
    "TMC": {
        "name": "TMC the metals company Inc.",
        "industry": "Mining",
        "description": "TMC focuses on the exploration and development of polymetallic nodules in the ocean."
    },
    "FBTCX": {
        "name": "Fidelity Blue Chip Growth Fund",
        "industry": "Mutual Fund",
        "description": "FBTCX invests primarily in large-cap growth stocks with strong earnings potential."
    },
    "DELL": {
        "name": "Dell Technologies Inc.",
        "industry": "Technology",
        "description": "DELL provides technology solutions, products, and services to customers worldwide."
    },
    "AESI": {
        "name": "Advanced Emissions Solutions, Inc.",
        "industry": "Environmental Services",
        "description": "AESI provides technologies and services for emissions reduction and environmental compliance."
    },
    "US": {
        "name": "United States Oil Fund, LP",
        "industry": "Exchange-Traded Fund",
        "description": "US seeks to track the price of West Texas Intermediate (WTI) crude oil."
    },
    "PWP": {
        "name": "Perella Weinberg Partners",
        "industry": "Financial Services",
        "description": "PWP provides advisory services in mergers and acquisitions, capital markets, and asset management."
    },
    "LGND": {
        "name": "Ligand Pharmaceuticals Incorporated",
        "industry": "Biotechnology",
        "description": "LGND focuses on developing and acquiring technologies that help pharmaceutical companies."
    },
    "INDB": {
        "name": "Independent Bank Corp.",
        "industry": "Banking",
        "description": "INDB provides a range of banking services to individuals and businesses."
    },
    "FBK": {
        "name": "FB Financial Corporation",
        "industry": "Banking",
        "description": "FBK offers a variety of banking services including loans, deposits, and wealth management."
    },
    "DASH": {
        "name": "DoorDash, Inc.",
        "industry": "Food Delivery",
        "description": "DASH operates a food delivery service connecting customers with local restaurants."
    },
    "CIEN": {
        "name": "Ciena Corporation",
        "industry": "Telecommunications",
        "description": "CIEN provides networking and software solutions for telecommunications service providers."
    },
    "AZO": {
        "name": "AutoZone, Inc.",
        "industry": "Retail",
        "description": "AZO is a retailer of automotive parts and accessories."
    },
    "ARQT": {
        "name": "Arcutis Biotherapeutics, Inc.",
        "industry": "Biotechnology",
        "description": "ARQT develops innovative therapies for dermatological diseases."
    },
    "MTSI": {
        "name": "MACOM Technology Solutions Holdings, Inc.",
        "industry": "Semiconductors",
        "description": "MTSI designs and manufactures semiconductor solutions for various applications."
    },
    "DDOG": {
        "name": "Datadog, Inc.",
        "industry": "Software",
        "description": "DDOG provides monitoring and analytics for cloud-scale applications."
    },
    "RNMBF": {
        "name": "Renmin Tianli Group, Inc.",
        "industry": "Agriculture",
        "description": "RNMBF engages in the breeding and sale of pigs and related agricultural products."
    },
    "NOVT": {
        "name": "Novanta Inc.",
        "industry": "Technology",
        "description": "NOVT provides precision photonics and motion control solutions."
    },
    "DCO": {
        "name": "Ducommun Incorporated",
        "industry": "Aerospace & Defense",
        "description": "DCO provides engineering and manufacturing services for aerospace and defense industries."
    },
    "CSW": {
        "name": "CSW Industrials, Inc.",
        "industry": "Manufacturing",
        "description": "CSW Industrials provides a range of industrial products and services, including specialty lubricants and sealants."
    },
    "TYL": {
        "name": "Tyler Technologies, Inc.",
        "industry": "Software",
        "description": "Tyler Technologies offers software solutions for the public sector, including government and education."
    },
    "TRMB": {
        "name": "Trimble Inc.",
        "industry": "Technology",
        "description": "Trimble provides technology solutions that enable professionals in various industries to improve productivity and quality."
    },
    "TPH": {
        "name": "Tri Pointe Homes, Inc.",
        "industry": "Real Estate",
        "description": "Tri Pointe Homes is a homebuilder that designs and constructs residential communities."
    },
    "CPB": {
        "name": "Campbell Soup Company",
        "industry": "Food & Beverage",
        "description": "Campbell Soup Company produces a variety of food products, including soups, sauces, and snacks."
    },
    "ROP": {
        "name": "Roper Technologies, Inc.",
        "industry": "Diversified Technology",
        "description": "Roper Technologies provides engineered products and solutions for various industries, including healthcare and education."
    },
    "REGN": {
        "name": "Regeneron Pharmaceuticals, Inc.",
        "industry": "Biotechnology",
        "description": "Regeneron develops and commercializes innovative medicines for serious diseases."
    },
    "PSKY": {
        "name": "Psychemedics Corporation",
        "industry": "Healthcare",
        "description": "Psychemedics specializes in drug testing services using hair analysis."
    },
    "MDT": {
        "name": "Medtronic plc",
        "industry": "Medical Devices",
        "description": "Medtronic develops and manufactures medical devices and therapies to treat various health conditions."
    },
    "GPN": {
        "name": "Global Payments Inc.",
        "industry": "Financial Services",
        "description": "Global Payments provides payment technology and software solutions for businesses."
    },
    "GEHCV": {
        "name": "General Electric Company",
        "industry": "Conglomerate",
        "description": "General Electric operates in various sectors, including aviation, healthcare, and renewable energy."
    },
    "FDS": {
        "name": "FactSet Research Systems Inc.",
        "industry": "Financial Services",
        "description": "FactSet provides financial data and analytics to investment professionals."
    },
    "DPZ": {
        "name": "Domino's Pizza, Inc.",
        "industry": "Food & Beverage",
        "description": "Domino's Pizza is a global pizza delivery and carryout chain."
    },
    "CRWD": {
        "name": "CrowdStrike Holdings, Inc.",
        "industry": "Cybersecurity",
        "description": "CrowdStrike offers cloud-delivered endpoint protection and cybersecurity solutions."
    },
    "STZ": {
        "name": "Constellation Brands, Inc.",
        "industry": "Beverages",
        "description": "Constellation Brands produces and markets alcoholic beverages, including beer and wine."
    },
    "CLX": {
        "name": "The Clorox Company",
        "industry": "Consumer Goods",
        "description": "Clorox manufactures cleaning and disinfecting products for household and professional use."
    },
    "CB": {
        "name": "Chubb Limited",
        "industry": "Insurance",
        "description": "Chubb provides property and casualty insurance products and services."
    },
    "CVNA": {
        "name": "Carvana Co.",
        "industry": "E-commerce",
        "description": "Carvana is an online platform for buying and selling used cars."
    },
    "APP": {
        "name": "AppLovin Corporation",
        "industry": "Technology",
        "description": "AppLovin provides a platform for mobile app developers to monetize and market their apps."
    },
    "MDB": {
        "name": "MongoDB, Inc.",
        "industry": "Technology",
        "description": "MongoDB offers a leading NoSQL database platform for modern applications."
    },
    "FLEX": {
        "name": "Flex Ltd.",
        "industry": "Manufacturing",
        "description": "Flex provides design, engineering, manufacturing, and supply chain services for various industries."
    },
    "PCVX": {
        "name": "PaxVax, Inc.",
        "industry": "Biotechnology",
        "description": "PaxVax develops and commercializes vaccines for infectious diseases."
    },
    "STE": {
        "name": "Steris plc",
        "industry": "Healthcare",
        "description": "Steris provides infection prevention and surgical products and services."
    },
    "QCOM": {
        "name": "Qualcomm Incorporated",
        "industry": "Semiconductors",
        "description": "Qualcomm designs and manufactures semiconductors and telecommunications equipment."
    },
    "ST": {
        "name": "Sensata Technologies Holding plc",
        "industry": "Manufacturing",
        "description": "Sensata Technologies develops sensors and controls for automotive and industrial applications."
    },
    "SHW": {
        "name": "The Sherwin-Williams Company",
        "industry": "Manufacturing",
        "description": "Sherwin-Williams produces paints, coatings, and related products."
    },
    "W": {
        "name": "Wayfair Inc.",
        "industry": "E-commerce",
        "description": "Wayfair is an online retailer specializing in home goods and furniture."
    },
    "THLEF": {
        "name": "Thales Group",
        "industry": "Aerospace & Defense",
        "description": "Thales Group provides technology solutions for aerospace, defense, and security."
    },
    "SARO": {
        "name": "Sarcos Technology and Robotics Corporation",
        "industry": "Robotics",
        "description": "Sarcos develops robotic systems for industrial and military applications."
    },
    "GIL": {
        "name": "Gildan Activewear Inc.",
        "industry": "Apparel",
        "description": "Gildan manufactures and sells apparel, including activewear and socks."
    },
    "BBIO": {
        "name": "BridgeBio Pharma, Inc.",
        "industry": "Biotechnology",
        "description": "BridgeBio focuses on developing medicines for genetic diseases."
    },
    "WHR": {
        "name": "Whirlpool Corporation",
        "industry": "Consumer Goods",
        "description": "Whirlpool manufactures home appliances and kitchen products."
    },
    "PRIM": {
        "name": "Primoris Services Corporation",
        "industry": "Construction",
        "description": "Primoris provides construction and engineering services across various sectors."
    },
    "CTRA": {
        "name": "Coterra Energy Inc.",
        "industry": "Energy",
        "description": "Coterra Energy is an independent oil and natural gas exploration and production company."
    },
    "VIAV": {
        "name": "Viavi Solutions Inc.",
        "industry": "Technology",
        "description": "Viavi provides network test, monitoring, and assurance solutions."
    },
    "RVTY": {
        "name": "Revity, Inc.",
        "industry": "Technology",
        "description": "Revity develops software solutions for various business applications."
    },
    "FN": {
        "name": "Fabrinet",
        "industry": "Manufacturing",
        "description": "Fabrinet provides advanced manufacturing services for optical and photonic products."
    },
    "PTON": {
        "name": "Peloton Interactive, Inc.",
        "industry": "Fitness",
        "description": "Peloton offers interactive fitness products and services, including stationary bikes and streaming classes."
    },
    "FMAO": {
        "name": "Farmers & Merchants Bancorp, Inc.",
        "industry": "Banking",
        "description": "Farmers & Merchants Bancorp provides banking and financial services to individuals and businesses."
    },
    "VIK": {
        "name": "Viking Therapeutics, Inc.",
        "industry": "Biotechnology",
        "description": "Viking Therapeutics is focused on developing therapies for metabolic and endocrine disorders."
    },
    "TSCO": {
        "name": "Tractor Supply Company",
        "industry": "Retail",
        "description": "Tractor Supply Company is a retail store chain that provides products for home improvement, agriculture, lawn and garden maintenance, and livestock."
    },
    "MLM": {
        "name": "Martin Marietta Materials, Inc.",
        "industry": "Construction Materials",
        "description": "Martin Marietta is a leading supplier of aggregates and heavy building materials for the construction industry."
    },
    "EME": {
        "name": "EMCOR Group, Inc.",
        "industry": "Construction",
        "description": "EMCOR Group provides mechanical and electrical construction, industrial and energy infrastructure, and facilities services."
    },
    "CHRW": {
        "name": "C.H. Robinson Worldwide, Inc.",
        "industry": "Logistics",
        "description": "C.H. Robinson is a global logistics company that provides freight transportation and logistics services."
    },
    "TDG": {
        "name": "TransDigm Group Incorporated",
        "industry": "Aerospace",
        "description": "TransDigm Group designs, produces, and supplies highly engineered aircraft components."
    },
    "CDW": {
        "name": "CDW Corporation",
        "industry": "Information Technology",
        "description": "CDW is a leading provider of technology solutions and services for business, government, and education."
    },
    "SCI": {
        "name": "Service Corporation International",
        "industry": "Funeral Services",
        "description": "Service Corporation International is the largest provider of funeral and cemetery services in North America."
    },
    "BWXT": {
        "name": "BWX Technologies, Inc.",
        "industry": "Nuclear Energy",
        "description": "BWXT provides nuclear components and services for the commercial and government sectors."
    },
    "PWR": {
        "name": "Quanta Services, Inc.",
        "industry": "Utilities",
        "description": "Quanta Services is a leading provider of specialized contracting services for the electric power and oil and gas industries."
    },
    "FBIN": {
        "name": "First Business Financial Services, Inc.",
        "industry": "Banking",
        "description": "First Business Financial Services offers a range of banking and financial services to businesses and individuals."
    },
    "PKG": {
        "name": "Packaging Corporation of America",
        "industry": "Packaging",
        "description": "Packaging Corporation of America produces containerboard and corrugated packaging products."
    },
    "MORN": {
        "name": "Morningstar, Inc.",
        "industry": "Financial Services",
        "description": "Morningstar provides investment research and management services to investors and financial professionals."
    },
    "MKL": {
        "name": "Markel Corporation",
        "industry": "Insurance",
        "description": "Markel Corporation is a diverse financial holding company that provides insurance and investment products."
    },
    "CLH": {
        "name": "Clean Harbors, Inc.",
        "industry": "Environmental Services",
        "description": "Clean Harbors provides environmental, energy, and industrial services across North America."
    },
    "INTU": {
        "name": "Intuit Inc.",
        "industry": "Software",
        "description": "Intuit develops financial and business management software for small businesses and individuals."
    },
    "AMP": {
        "name": "Ameriprise Financial, Inc.",
        "industry": "Financial Services",
        "description": "Ameriprise Financial offers financial planning, products, and services to individuals and businesses."
    },
    "BDC": {
        "name": "Belden Inc.",
        "industry": "Electronics",
        "description": "Belden designs and manufactures signal transmission solutions for various industries."
    },
    "FLL": {
        "name": "Full House Resorts, Inc.",
        "industry": "Gaming",
        "description": "Full House Resorts operates and develops gaming facilities and resorts."
    },
    "OWL": {
        "name": "Blue Owl Capital Inc.",
        "industry": "Financial Services",
        "description": "Blue Owl Capital is a leading alternative asset manager focused on private credit and private equity."
    },
    "FSSL": {
        "name": "First Seacoast Bancorp",
        "industry": "Banking",
        "description": "First Seacoast Bancorp provides banking services to individuals and businesses in New Hampshire."
    },
    "LITE": {
        "name": "Lumentum Holdings Inc.",
        "industry": "Technology",
        "description": "Lumentum designs and manufactures innovative optical and photonic products."
    },
    "ADI": {
        "name": "Analog Devices, Inc.",
        "industry": "Semiconductors",
        "description": "Analog Devices is a global leader in the design and manufacturing of analog, mixed-signal, and digital signal processing integrated circuits."
    },
    "PANW": {
        "name": "Palo Alto Networks, Inc.",
        "industry": "Cybersecurity",
        "description": "Palo Alto Networks provides cybersecurity solutions to protect organizations from cyber threats."
    },
    "SNDK": {
        "name": "SanDisk Corporation",
        "industry": "Data Storage",
        "description": "SanDisk specializes in flash memory storage solutions for consumer and enterprise markets."
    },
    "TWLO": {
        "name": "Twilio Inc.",
        "industry": "Cloud Communications",
        "description": "Twilio provides cloud-based communication tools for developers to build and integrate messaging and voice capabilities."
    },
    "UA": {
        "name": "Under Armour, Inc.",
        "industry": "Apparel",
        "description": "Under Armour designs and manufactures sports apparel, footwear, and accessories."
    },
    "LMT": {
        "name": "Lockheed Martin Corporation",
        "industry": "Aerospace and Defense",
        "description": "Lockheed Martin is a global aerospace, defense, and security company."
    },
    "LHX": {
        "name": "L3Harris Technologies, Inc.",
        "industry": "Aerospace and Defense",
        "description": "L3Harris Technologies provides communication and electronic systems for government and commercial customers."
    },
    "J": {
        "name": "Jacobs Engineering Group Inc.",
        "industry": "Engineering",
        "description": "Jacobs provides professional services in engineering, architecture, and construction management."
    },
    "ETN": {
        "name": "Eaton Corporation plc",
        "industry": "Power Management",
        "description": "Eaton is a power management company that provides energy-efficient solutions for electrical, hydraulic, and mechanical power."
    },
    "ARLP": {
        "name": "Alliance Resource Partners, L.P.",
        "industry": "Energy",
        "description": "Alliance Resource Partners is a coal producer and marketer in the United States."
    },
    "DVN": {
        "name": "Devon Energy Corporation",
        "industry": "Oil and Gas",
        "description": "Devon Energy is an independent energy company engaged in the exploration and production of oil and natural gas."
    },
    "PINS": {
        "name": "Pinterest, Inc.",
        "industry": "Social Media",
        "description": "Pinterest is a visual discovery and bookmarking platform that allows users to share and discover ideas."
    },
    "REXR": {
        "name": "Rexford Industrial Realty, Inc.",
        "industry": "Real Estate",
        "description": "Rexford Industrial Realty focuses on the acquisition and management of industrial properties in Southern California."
    },
    "PH": {
        "name": "Parker-Hannifin Corporation",
        "industry": "Manufacturing",
        "description": "Parker-Hannifin manufactures motion and control technologies and systems."
    },
    "MEDP": {
        "name": "Medpace Holdings, Inc.",
        "industry": "Clinical Research",
        "description": "Medpace provides comprehensive clinical development services to the pharmaceutical and biotechnology industries."
    },
    "ORLY": {
        "name": "O'Reilly Automotive, Inc.",
        "industry": "Retail",
        "description": "O'Reilly Automotive is a retailer of automotive parts, tools, and accessories."
    },
    "THC": {
        "name": "Tenet Healthcare Corporation",
        "industry": "Healthcare",
        "description": "Tenet Healthcare operates healthcare facilities and provides related services."
    },
    "SPG": {
        "name": "Simon Property Group, Inc.",
        "industry": "Real Estate",
        "description": "Simon Property Group is a real estate investment trust that owns and operates retail real estate."
    },
    "STT": {
        "name": "State Street Corporation",
        "industry": "Financial Services",
        "description": "State Street Corporation provides investment management and financial services to institutional investors."
    },
    "ETOR": {
        "name": "Etoren",
        "industry": "E-commerce",
        "description": "Etoren specializes in the online retail of consumer electronics."
    },
    "TTWO": {
        "name": "Take-Two Interactive Software, Inc.",
        "industry": "Video Games",
        "description": "Take-Two Interactive develops and publishes interactive entertainment software."
    },
    "NVT": {
        "name": "Nuvectra Corporation",
        "industry": "Medical Devices",
        "description": "Nuvectra focuses on developing and commercializing neurostimulation technology."
    },
    "TXN": {
        "name": "Texas Instruments Incorporated",
        "industry": "Semiconductors",
        "description": "Texas Instruments designs and manufactures semiconductors and various integrated circuits."
    },
    "FCNCA": {
        "name": "First Citizens BancShares, Inc.",
        "industry": "Banking",
        "description": "First Citizens BancShares provides a range of banking services to individuals and businesses."
    },
    "RYCEY": {
        "name": "Ryder System, Inc.",
        "industry": "Transportation",
        "description": "Ryder provides supply chain, logistics, and transportation services."
    },
    "IHG": {
        "name": "InterContinental Hotels Group PLC",
        "industry": "Hospitality",
        "description": "IHG operates a broad portfolio of hotel brands across the globe."
    },
    "MMM": {
        "name": "3M Company",
        "industry": "Diversified Manufacturing",
        "description": "3M produces a wide range of products including adhesives, abrasives, and medical supplies."
    },
    "FCX": {
        "name": "Freeport-McMoRan Inc.",
        "industry": "Mining",
        "description": "Freeport-McMoRan is a leading international mining company with a focus on copper and gold."
    },
    "INTA": {
        "name": "Intapp, Inc.",
        "industry": "Software",
        "description": "Intapp provides software solutions for professional services firms."
    },
    "IFNNY": {
        "name": "Infineon Technologies AG",
        "industry": "Semiconductors",
        "description": "Infineon develops semiconductor solutions for automotive, industrial, and consumer applications."
    },
    "HDB": {
        "name": "HDFC Bank Limited",
        "industry": "Banking",
        "description": "HDFC Bank offers a wide range of banking and financial services in India."
    },
    "VLY": {
        "name": "Valley National Bancorp",
        "industry": "Banking",
        "description": "Valley National Bancorp provides banking services through its subsidiary, Valley National Bank."
    },
    "SYF": {
        "name": "Synchrony Financial",
        "industry": "Financial Services",
        "description": "Synchrony Financial offers consumer financial services and credit products."
    },
    "PFGC": {
        "name": "Performance Food Group Company",
        "industry": "Food Distribution",
        "description": "Performance Food Group distributes food and related products to various foodservice customers."
    },
    "MKTX": {
        "name": "MarketAxess Holdings Inc.",
        "industry": "Financial Services",
        "description": "MarketAxess operates an electronic trading platform for fixed-income securities."
    },
    "F": {
        "name": "Ford Motor Company",
        "industry": "Automotive",
        "description": "Ford designs, manufactures, and sells automobiles and automotive parts."
    },
    "DLTR": {
        "name": "Dollar Tree, Inc.",
        "industry": "Retail",
        "description": "Dollar Tree operates discount variety stores offering products at a fixed price."
    },
    "DRI": {
        "name": "Darden Restaurants, Inc.",
        "industry": "Restaurants",
        "description": "Darden Restaurants operates several well-known restaurant brands in the casual dining sector."
    },
    "ALLY": {
        "name": "Ally Financial Inc.",
        "industry": "Financial Services",
        "description": "Ally Financial provides a range of financial products and services, including auto financing."
    },
    "NTES": {
        "name": "NetEase, Inc.",
        "industry": "Internet Services",
        "description": "NetEase develops and operates online games, e-commerce, and other internet services."
    },
    "FWRG": {
        "name": "Fireworks, Inc.",
        "industry": "Retail",
        "description": "Fireworks, Inc. specializes in the retail of fireworks and related products."
    },
    "WDS": {
        "name": "Woodside Energy Group Ltd.",
        "industry": "Energy",
        "description": "Woodside is an oil and gas company engaged in the exploration and production of hydrocarbons."
    },
    "WPM": {
        "name": "Wheaton Precious Metals Corp.",
        "industry": "Mining",
        "description": "Wheaton Precious Metals is a precious metals streaming company."
    },
    "WTSHF": {
        "name": "Watts Water Technologies, Inc.",
        "industry": "Manufacturing",
        "description": "Watts Water Technologies manufactures and sells plumbing, heating, and water quality products."
    },
    "SOUHY": {
        "name": "Société Générale",
        "industry": "Banking",
        "description": "Société Générale is a multinational banking and financial services company."
    },
    "RRC": {
        "name": "Range Resources Corporation",
        "industry": "Energy",
        "description": "Range Resources is an independent natural gas and oil company."
    },
    "IAG": {
        "name": "Iamgold Corporation",
        "industry": "Mining",
        "description": "Iamgold is a mid-tier mining company engaged in the exploration and production of gold."
    },
    "HII": {
        "name": "Huntington Ingalls Industries, Inc.",
        "industry": "Defense",
        "description": "Huntington Ingalls Industries is a provider of military shipbuilding and defense services."
    },
    "FIP": {
        "name": "First Industrial Realty Trust, Inc.",
        "industry": "Real Estate",
        "description": "First Industrial Realty Trust focuses on the ownership and management of industrial properties."
    },
    "FTAI": {
        "name": "FTAI Aviation Ltd.",
        "industry": "Aviation",
        "description": "FTAI Aviation is involved in the leasing and management of aviation assets."
    },
    "ET": {
        "name": "EnLink Midstream, LLC",
        "industry": "Energy",
        "description": "EnLink Midstream provides integrated midstream services for natural gas and natural gas liquids."
    },
    "ENB": {
        "name": "Enbridge Inc.",
        "industry": "Energy",
        "description": "Enbridge is a leader in the transportation and distribution of energy."
    },
    "CODI": {
        "name": "Compass Diversified Holdings",
        "industry": "Investment",
        "description": "Compass Diversified Holdings is a publicly traded investment firm."
    },
    "AMT": {
        "name": "American Tower Corporation",
        "industry": "Telecommunications",
        "description": "American Tower owns and operates wireless and broadcast communications real estate."
    },
    "TMO": {
        "name": "Thermo Fisher Scientific Inc.",
        "industry": "Life Sciences",
        "description": "Thermo Fisher Scientific provides analytical instruments, reagents, and consumables for scientific research."
    },
    "SFGYY": {
        "name": "Sofina S.A.",
        "industry": "Investment",
        "description": "Sofina is a Belgian investment company focused on long-term investments."
    },
    "CVS": {
        "name": "CVS Health Corporation",
        "industry": "Healthcare",
        "description": "CVS Health is a healthcare company that operates a chain of pharmacies and health services."
    },
    "HOLX": {
        "name": "Hologic, Inc.",
        "industry": "Medical Devices",
        "description": "Hologic develops innovative medical devices and diagnostics for women's health."
    },
    "NEW": {
        "name": "New York Mortgage Trust, Inc.",
        "industry": "Real Estate",
        "description": "New York Mortgage Trust invests in mortgage-related assets and real estate."
    }
};

// Initial Simulated Quotes
const INITIAL_STOCKS: SimulatedStock[] = [
    { ticker: 'RTX', name: 'Raytheon Technologies', price: 104.35, change: 1.22, changePercent: 1.18, prevPrice: 104.35 },
    { ticker: 'LMT', name: 'Lockheed Martin', price: 476.80, change: -3.45, changePercent: -0.72, prevPrice: 476.80 },
    { ticker: 'MSFT', name: 'Microsoft Corp.', price: 421.90, change: 4.85, changePercent: 1.16, prevPrice: 421.90 },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 128.20, change: 6.40, changePercent: 5.25, prevPrice: 128.20 },
    { ticker: 'JPM', name: 'JPMorgan Chase', price: 198.50, change: 0.85, changePercent: 0.43, prevPrice: 198.50 },
    { ticker: 'XOM', name: 'Exxon Mobil Corp.', price: 112.15, change: -1.10, changePercent: -0.97, prevPrice: 112.15 },
    { ticker: 'GD', name: 'General Dynamics', price: 292.40, change: 2.10, changePercent: 0.72, prevPrice: 292.40 },
    { ticker: 'AAPL', name: 'Apple Inc.', price: 218.30, change: -0.45, changePercent: -0.21, prevPrice: 218.30 },
];

const MOCK_NEWS_FLASHES = [
    "BREAKING: Senate Armed Services Committee member purchased $50,000 in defense contractor stock (RTX) 3 days before military budget approval.",
    "ALERT: Tech subcommittee representative files sale of $100k in semiconductor shares ahead of import restriction statement.",
    "UPDATE: Energy subcommittee senator files sale of $100k in Chevron (CVX) holdings ahead of emission cap adjustments.",
    "COI FLAG: Representative purchased Financial Services sector stock (JPM) during banking regulations oversight hearings.",
];

// Deterministic seeded pseudo-random (no Math.random so SSR-safe)
function seededRand(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

function generatePriceHistory(ticker: string, transactionDate: string) {
    // Build a base price from the ticker char codes so each stock looks different
    const base = ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 300 + 80;
    const rand = seededRand(base * 7919);
    const data: { date: string; price: number; isTradeDate: boolean }[] = [];
    const end = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - 6);
    let price = base;
    const tradeDateStr = transactionDate ? transactionDate.slice(0, 10) : null;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
        const drift = (rand() - 0.485) * 3.2;
        price = Math.max(price + drift, base * 0.4);
        const dateStr = d.toISOString().slice(0, 10);
        data.push({
            date: dateStr,
            price: parseFloat(price.toFixed(2)),
            isTradeDate: dateStr === tradeDateStr,
        });
    }
    return data;
}

interface PoliticianMeta {
    state: string;
    region: string;
    committees: string[];
    party: 'D' | 'R' | 'I';
}

function getPoliticianMetadata(name: string, customParty?: string): PoliticianMeta {
    const cleanName = (name || '').replace(/^(Hon\.|Senator|Representative|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();

    const nameLower = cleanName.toLowerCase();
    const isExecutiveFiler = nameLower.includes('trump') || nameLower.includes('biden') || nameLower.includes('harris') || nameLower.includes('president') || nameLower.includes('vice president');
    if (isExecutiveFiler) {
        return {
            state: '',
            region: '',
            committees: [],
            party: nameLower.includes('trump') ? 'R' : 'D'
        };
    }

    // Map of politicians to state, region, committees, and party
    const KNOWN_POLITICIANS: Record<string, { state: string; region: string; committees: string[]; party: 'D' | 'R' | 'I' }> = {
        'Nancy Pelosi': { state: 'CA', region: 'West', committees: ['Financial Services', 'Technology'], party: 'D' },
        'Tommy Tuberville': { state: 'AL', region: 'South', committees: ['Armed Services', 'Agriculture', 'Finance'], party: 'R' },
        'Markwayne Mullin': { state: 'OK', region: 'South', committees: ['Armed Services', 'Health', 'Energy'], party: 'R' },
        'Ro Khanna': { state: 'CA', region: 'West', committees: ['Armed Services', 'Technology'], party: 'D' },
        'Josh Gottheimer': { state: 'NJ', region: 'Northeast', committees: ['Financial Services', 'Intelligence'], party: 'D' },
        'Michael Guest': { state: 'MS', region: 'South', committees: ['Ethics', 'Homeland Security', 'Transportation'], party: 'R' },
        'Dan Crenshaw': { state: 'TX', region: 'South', committees: ['Energy and Commerce'], party: 'R' },
        'Rick Scott': { state: 'FL', region: 'South', committees: ['Armed Services', 'Finance'], party: 'R' },
        'Sheldon Whitehouse': { state: 'RI', region: 'Northeast', committees: ['Finance', 'Judiciary', 'Environment'], party: 'D' },
        'John Fetterman': { state: 'PA', region: 'Northeast', committees: ['Agriculture', 'Banking', 'Environment'], party: 'D' },
        'Pat Toomey': { state: 'PA', region: 'Northeast', committees: ['Banking', 'Finance'], party: 'R' },
        'Richard Burr': { state: 'NC', region: 'South', committees: ['Health', 'Finance'], party: 'R' },
        'Marjorie Taylor Greene': { state: 'GA', region: 'South', committees: ['Homeland Security', 'Oversight'], party: 'R' },
        'Diana Harshbarger': { state: 'TN', region: 'South', committees: ['Energy and Commerce'], party: 'R' },
        'Daniel Goldman': { state: 'NY', region: 'Northeast', committees: ['Homeland Security', 'Oversight'], party: 'D' },
        'Jared Moskowitz': { state: 'FL', region: 'South', committees: ['Homeland Security', 'Foreign Affairs'], party: 'D' },
        'Thomas Carper': { state: 'DE', region: 'Northeast', committees: ['Finance', 'Environment'], party: 'D' },
        'Angus King': { state: 'ME', region: 'Northeast', committees: ['Armed Services', 'Intelligence', 'Rules'], party: 'I' },
        'Bernie Sanders': { state: 'VT', region: 'Northeast', committees: ['Health', 'Education', 'Labor', 'Budget'], party: 'I' },
        'Ted Cruz': { state: 'TX', region: 'South', committees: ['Commerce', 'Science', 'Transportation', 'Judiciary'], party: 'R' },
        'Mitch McConnell': { state: 'KY', region: 'South', committees: ['Agriculture', 'Rules', 'Appropriations'], party: 'R' },
        'Chuck Schumer': { state: 'NY', region: 'Northeast', committees: ['Rules', 'Finance'], party: 'D' },
        'Jared Golden': { state: 'ME', region: 'Northeast', committees: ['Armed Services', 'Small Business'], party: 'D' },
        'Bill Hagerty': { state: 'TN', region: 'South', committees: ['Banking', 'Foreign Relations', 'Appropriations'], party: 'R' },
    };

    if (KNOWN_POLITICIANS[cleanName]) {
        return KNOWN_POLITICIANS[cleanName];
    }

    // Dynamic generation using stable hash of the name
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
        hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);

    const partyList: ('D' | 'R' | 'I')[] = ['D', 'R'];
    const resolvedParty: 'D' | 'R' | 'I' = (customParty === 'D' || customParty === 'Democrat') ? 'D' 
        : (customParty === 'R' || customParty === 'Republican') ? 'R' 
        : (customParty === 'I' || customParty === 'Independent') ? 'I' 
        : partyList[absHash % partyList.length];

    const states = [
        { state: 'TX', region: 'South' }, { state: 'CA', region: 'West' }, { state: 'FL', region: 'South' },
        { state: 'NY', region: 'Northeast' }, { state: 'PA', region: 'Northeast' }, { state: 'IL', region: 'Midwest' },
        { state: 'OH', region: 'Midwest' }, { state: 'GA', region: 'South' }, { state: 'NC', region: 'South' },
        { state: 'MI', region: 'Midwest' }, { state: 'WA', region: 'West' }, { state: 'AZ', region: 'West' },
        { state: 'MA', region: 'Northeast' }, { state: 'TN', region: 'South' }, { state: 'IN', region: 'Midwest' },
        { state: 'MO', region: 'Midwest' }, { state: 'MD', region: 'Northeast' }, { state: 'WI', region: 'Midwest' },
        { state: 'CO', region: 'West' }, { state: 'MN', region: 'Midwest' }, { state: 'SC', region: 'South' },
        { state: 'AL', region: 'South' }, { state: 'LA', region: 'South' }, { state: 'KY', region: 'South' },
        { state: 'OR', region: 'West' }, { state: 'OK', region: 'South' }, { state: 'CT', region: 'Northeast' },
        { state: 'UT', region: 'West' }, { state: 'IA', region: 'Midwest' }, { state: 'NV', region: 'West' }
    ];
    const stateObj = states[absHash % states.length];

    const committeePools = [
        ['Armed Services', 'Foreign Affairs'],
        ['Financial Services', 'Agriculture'],
        ['Energy and Commerce', 'Science, Space and Technology'],
        ['Homeland Security', 'Oversight and Accountability'],
        ['Judiciary', 'Rules'],
        ['Budget', 'Appropriations'],
        ['Transportation and Infrastructure', 'Veterans Affairs'],
        ['Natural Resources', 'Education and the Workforce']
    ];
    const committees = committeePools[absHash % committeePools.length];

    return {
        state: stateObj.state,
        region: stateObj.region,
        committees,
        party: resolvedParty
    };
}

interface CompanyMeta {
    name: string;
    industry: string;
    state: string;
    region: string;
    description: string;
}

function getCompanyMetadata(ticker: string): CompanyMeta {
    const sym = ticker.toUpperCase();
    const details = COMPANY_DIRECTORY[sym];

    // Map of tickers to headquarters state & region
    const TICKER_LOCATIONS: Record<string, { state: string; region: string }> = {
        AAPL: { state: 'CA', region: 'West' },
        NVDA: { state: 'CA', region: 'West' },
        MSFT: { state: 'WA', region: 'West' },
        AMZN: { state: 'WA', region: 'West' },
        GOOGL: { state: 'CA', region: 'West' },
        GOOG: { state: 'CA', region: 'West' },
        META: { state: 'CA', region: 'West' },
        TSM: { state: 'TW', region: 'International' },
        AVGO: { state: 'CA', region: 'West' },
        CSCO: { state: 'CA', region: 'West' },
        ORCL: { state: 'TX', region: 'South' },
        INTC: { state: 'CA', region: 'West' },
        AMD: { state: 'CA', region: 'West' },
        QCOM: { state: 'CA', region: 'West' },
        NFLX: { state: 'CA', region: 'West' },
        LMT: { state: 'MD', region: 'Northeast' },
        GD: { state: 'VA', region: 'South' },
        RTX: { state: 'VA', region: 'South' },
        NOC: { state: 'VA', region: 'South' },
        BA: { state: 'VA', region: 'South' },
        XOM: { state: 'TX', region: 'South' },
        CVX: { state: 'CA', region: 'West' },
        COP: { state: 'TX', region: 'South' },
        JPM: { state: 'NY', region: 'Northeast' },
        BAC: { state: 'NC', region: 'South' },
        WFC: { state: 'CA', region: 'West' },
        C: { state: 'NY', region: 'Northeast' },
        GS: { state: 'NY', region: 'Northeast' },
        MS: { state: 'NY', region: 'Northeast' },
        AXP: { state: 'NY', region: 'Northeast' },
        V: { state: 'CA', region: 'West' },
        MA: { state: 'NY', region: 'Northeast' },
        UNH: { state: 'MN', region: 'Midwest' },
        JNJ: { state: 'NJ', region: 'Northeast' },
        PFE: { state: 'NY', region: 'Northeast' },
        LLY: { state: 'IN', region: 'Midwest' },
        ABBV: { state: 'IL', region: 'Midwest' },
        MRK: { state: 'NJ', region: 'Northeast' },
        DE: { state: 'IL', region: 'Midwest' },
        CAT: { state: 'TX', region: 'South' },
        UNP: { state: 'NE', region: 'Midwest' },
        UPS: { state: 'GA', region: 'South' },
        FDX: { state: 'TN', region: 'South' },
        DSGX: { state: 'TX', region: 'South' },
        TXRH: { state: 'KY', region: 'South' },
        TCBI: { state: 'TX', region: 'South' },
        STRL: { state: 'TX', region: 'South' },
        HUBB: { state: 'CT', region: 'Northeast' },
        WAB: { state: 'PA', region: 'Northeast' },
        MIDD: { state: 'IL', region: 'Midwest' },
        COHR: { state: 'PA', region: 'Northeast' },
        CCI: { state: 'TX', region: 'South' },
        BKNG: { state: 'CT', region: 'Northeast' },
        HD: { state: 'GA', region: 'South' },
        VOYG: { state: 'NY', region: 'Northeast' },
        LYV: { state: 'CA', region: 'West' },
        INSM: { state: 'NJ', region: 'Northeast' },
        ENTG: { state: 'MA', region: 'Northeast' },
    };

    const loc = TICKER_LOCATIONS[sym];
    const defaultName = details?.name || `${sym} Corp.`;
    const defaultIndustry = details?.industry || 'Standard Market Listing';
    const defaultDesc = details?.description || 'Publicly traded asset with active disclosures tracked across US domestic exchanges.';

    if (loc) {
        return {
            name: defaultName,
            industry: defaultIndustry,
            state: loc.state,
            region: loc.region,
            description: defaultDesc
        };
    }

    // Dynamic generation based on ticker hash for any other ticker
    let hash = 0;
    for (let i = 0; i < sym.length; i++) {
        hash = sym.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);

    const states = [
        { state: 'CA', region: 'West' }, { state: 'NY', region: 'Northeast' }, { state: 'TX', region: 'South' },
        { state: 'WA', region: 'West' }, { state: 'IL', region: 'Midwest' }, { state: 'MA', region: 'Northeast' },
        { state: 'FL', region: 'South' }, { state: 'PA', region: 'Northeast' }, { state: 'OH', region: 'Midwest' },
        { state: 'NC', region: 'South' }, { state: 'VA', region: 'South' }, { state: 'GA', region: 'South' }
    ];
    const resolvedLoc = states[absHash % states.length];

    return {
        name: defaultName,
        industry: defaultIndustry,
        state: resolvedLoc.state,
        region: resolvedLoc.region,
        description: defaultDesc
    };
}

function checkCommitteeConnection(committees: string[], industry: string): { matches: boolean; reason: string } {
    const lowerIndustry = industry.toLowerCase();
    
    for (const committee of committees) {
        const commLower = committee.toLowerCase();
        
        // Technology / Semiconductors / Software
        if (commLower.includes('technology') || commLower.includes('science') || commLower.includes('space') || commLower.includes('communications')) {
            if (lowerIndustry.includes('semiconductor') || lowerIndustry.includes('technology') || lowerIndustry.includes('software') || lowerIndustry.includes('internet') || lowerIndustry.includes('telecom')) {
                return { matches: true, reason: `Oversees tech/telecom industries via ${committee} Committee` };
            }
        }
        
        // Defense / Aerospace / Manufacturing (military)
        if (commLower.includes('armed services') || commLower.includes('defense') || commLower.includes('homeland security') || commLower.includes('intelligence')) {
            if (lowerIndustry.includes('defense') || lowerIndustry.includes('aerospace') || lowerIndustry.includes('manufacturing') || lowerIndustry.includes('security')) {
                return { matches: true, reason: `Oversees defense contracts via ${committee} Committee` };
            }
        }
        
        // Financials / Banking / Real Estate
        if (commLower.includes('financial') || commLower.includes('finance') || commLower.includes('banking') || commLower.includes('budget') || commLower.includes('tax')) {
            if (lowerIndustry.includes('financial') || lowerIndustry.includes('banking') || lowerIndustry.includes('insurance') || lowerIndustry.includes('investment') || lowerIndustry.includes('real estate')) {
                return { matches: true, reason: `Oversees monetary policy and banking sector via ${committee} Committee` };
            }
        }

        // Energy / Environment / Natural Resources
        if (commLower.includes('energy') || commLower.includes('environment') || commLower.includes('natural resources') || commLower.includes('commerce')) {
            if (lowerIndustry.includes('energy') || lowerIndustry.includes('utilities') || lowerIndustry.includes('oil') || lowerIndustry.includes('gas') || lowerIndustry.includes('chemical')) {
                return { matches: true, reason: `Oversees energy regulation and environment via ${committee} Committee` };
            }
        }

        // Healthcare / Biotechnology / Pharmaceuticals
        if (commLower.includes('health') || commLower.includes('labor') || commLower.includes('pensions')) {
            if (lowerIndustry.includes('healthcare') || lowerIndustry.includes('biotech') || lowerIndustry.includes('pharmaceutical') || lowerIndustry.includes('medical')) {
                return { matches: true, reason: `Oversees public health policies and drug approvals via ${committee} Committee` };
            }
        }

        // Agriculture / Food
        if (commLower.includes('agriculture') || commLower.includes('forestry') || commLower.includes('nutrition')) {
            if (lowerIndustry.includes('agriculture') || lowerIndustry.includes('food') || lowerIndustry.includes('beverage')) {
                return { matches: true, reason: `Oversees agricultural subsidies via ${committee} Committee` };
            }
        }

        // Transportation / Infrastructure
        if (commLower.includes('transportation') || commLower.includes('infrastructure')) {
            if (lowerIndustry.includes('transport') || lowerIndustry.includes('rail') || lowerIndustry.includes('aviation') || lowerIndustry.includes('logistics') || lowerIndustry.includes('infrastructure')) {
                return { matches: true, reason: `Oversees transport networks and transit infrastructure via ${committee} Committee` };
            }
        }
    }
    
    return { matches: false, reason: 'No explicit committee oversight connection identified' };
}

export default function CapitolRadarPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any | null>(null)
    
    // Core Data States
    const [trades, setTrades] = useState<Trade[]>([])
    const [originalTrades, setOriginalTrades] = useState<Trade[]>([])
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncMessage, setSyncMessage] = useState<string | null>(null)
    
    // Filter States
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedOverlapFilter, setSelectedOverlapFilter] = useState<'all' | 'overlap'>('all')
    const [selectedChamber, setSelectedChamber] = useState<'all' | 'House' | 'Senate' | 'Executive'>('all')
    const [selectedActionFilter, setSelectedActionFilter] = useState<'all' | 'Purchase' | 'Sale' | 'Exchange'>('all')
    const [selectedValueFilter, setSelectedValueFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all')
    const [sortBy, setSortBy] = useState<'filingDateDesc' | 'filingDateAsc' | 'transactionDateDesc' | 'transactionDateAsc' | 'latencyDesc' | 'latencyAsc' | 'nameAsc' | 'tickerAsc'>('filingDateDesc')
    
    // Interactive Features
    const [newsIndex, setNewsIndex] = useState(0)
    const [showNewsFlash, setShowNewsFlash] = useState(true)
    const [marketQuotes, setMarketQuotes] = useState<SimulatedStock[]>(INITIAL_STOCKS)
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
    const [viewTab, setViewTab] = useState<'individual' | 'company' | 'industry' | 'ai-engine'>('individual')

    // AI Engine States
    const [dailyPicks, setDailyPicks] = useState<any[]>([])
    const [portfolioPositions, setPortfolioPositions] = useState<any[]>([])
    const [accuracyLedger, setAccuracyLedger] = useState<any[]>([])
    const [aiConfig, setAiConfig] = useState<any>(null)
    const [attributionTab, setAttributionTab] = useState<'candlestick' | 'winrate'>('candlestick')
    const [selectedTradeHistory, setSelectedTradeHistory] = useState<any[] | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    // SMS Notifications Form State
    const [smsEnabled, setSmsEnabled] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    const [settingsSuccess, setSettingsSuccess] = useState(false)

    useEffect(() => {
        checkAuth()
    }, [])

    // Fetch live prices from Yahoo Finance via server-side proxy
    async function fetchLivePrices() {
        try {
            const tickers = marketQuotes.map(q => q.ticker).join(',');
            const response = await fetch(`/api/market-data?tickers=${tickers}`);
            const res = await response.json();
            if (res.success && res.data) {
                setMarketQuotes(prevQuotes => 
                    prevQuotes.map(stock => {
                        const live = res.data[stock.ticker.toUpperCase()];
                        if (live) {
                            return {
                                ...stock,
                                price: live.price,
                                change: live.change,
                                changePercent: live.changePercent,
                                prevPrice: live.prevPrice
                            };
                        }
                        return stock;
                    })
                );
            }
        } catch (err) {
            console.error("Failed to load live watchlist prices:", err);
        }
    }

    // Trigger actual live quotes on load and poll every 30s
    useEffect(() => {
        fetchLivePrices();
        const liveInterval = setInterval(() => {
            fetchLivePrices();
        }, 30000);
        return () => clearInterval(liveInterval);
    }, []);

    // Live micro-variations (simulating active market ticks)
    useEffect(() => {
        const tickInterval = setInterval(() => {
            setMarketQuotes(prevQuotes => 
                prevQuotes.map(stock => {
                    const changeVal = (Math.random() - 0.5) * (stock.price * 0.0004);
                    const tickedPrice = Number((stock.price + changeVal).toFixed(2));
                    const totalChange = Number((tickedPrice - stock.prevPrice).toFixed(2));
                    const pctChange = Number(((totalChange / stock.prevPrice) * 100).toFixed(2));
                    return {
                        ...stock,
                        price: tickedPrice,
                        change: totalChange,
                        changePercent: pctChange
                    };
                })
            );
        }, 5000);
        return () => clearInterval(tickInterval);
    }, []);

    // Fetch live history when selectedTrade changes
    useEffect(() => {
        const trade = selectedTrade;
        if (!trade) {
            setSelectedTradeHistory(null);
            return;
        }

        const activeTrade: Trade = trade;

        async function loadHistory() {
            setIsLoadingHistory(true);
            try {
                const response = await fetch(`/api/market-history?ticker=${activeTrade.ticker}`);
                const res = await response.json();
                if (res.success && res.data && res.data.length > 0) {
                    const tradeDateStr = activeTrade.transaction_date ? activeTrade.transaction_date.slice(0, 10) : null;
                    const formatted = res.data.map((item: any) => ({
                        ...item,
                        isTradeDate: item.date === tradeDateStr
                    }));
                    setSelectedTradeHistory(formatted);
                } else {
                    const simulated = generatePriceHistory(activeTrade.ticker, activeTrade.transaction_date);
                    setSelectedTradeHistory(simulated);
                }
            } catch (err) {
                console.error("Failed to load historical data, falling back:", err);
                const simulated = generatePriceHistory(activeTrade.ticker, activeTrade.transaction_date);
                setSelectedTradeHistory(simulated);
            } finally {
                setIsLoadingHistory(false);
            }
        }

        loadHistory();
    }, [selectedTrade]);

    // News Rotator Ticker
    useEffect(() => {
        const newsInterval = setInterval(() => {
            setNewsIndex(prev => (prev + 1) % MOCK_NEWS_FLASHES.length);
        }, 12000);
        return () => clearInterval(newsInterval);
    }, []);

    async function checkAuth() {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                setUser(session.user)

                // Get user profile to check admin role
                const { data: profileData } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle()

                setProfile(profileData)

                if (profileData && profileData.role === 'admin') {
                    setSmsEnabled(profileData.sms_alerts_enabled || false)
                    setPhoneNumber(profileData.phone_number || '')
                }
            }
        } catch (error) {
            console.error('Auth verification error:', error)
        } finally {
            await fetchTrades()
            await fetchAiEngineData()
            setIsLoading(false)
        }
    }

    // AI Insight Engine Pre-seeded Fallbacks (Premium Quant Calibration Series)
    const PRESEEDED_PICKS = [
        { ticker: "LMT", company_name: "Lockheed Martin Corp.", conviction_score: 94.5, momentum_metrics: { "1d": 1.2, "7d": 5.4, "15d": 8.1, "30d": 12.3 }, news_sentiment_score: 94, upcoming_catalyst: "US Naval Tactical Systems Contract Bidding Target", position_size: 7.20, stop_loss: 435.50, rationale_summary: "LMT displays high conviction (94.5) fueled by heavy peer buying velocity from House Armed Services sub-committees. Matches defense spending expansion catalysts." },
        { ticker: "AAPL", company_name: "Apple Inc.", conviction_score: 89.2, momentum_metrics: { "1d": 0.8, "7d": 3.2, "15d": 5.5, "30d": 9.2 }, news_sentiment_score: 88, upcoming_catalyst: "State-delegated enterprise hardware supply contracts", position_size: 6.80, stop_loss: 178.40, rationale_summary: "AAPL highlights CA delegation cluster buy-in during congressional technology and infrastructure modernization hearings. High structural momentum supports entries." },
        { ticker: "NVDA", company_name: "NVIDIA Corp.", conviction_score: 88.0, momentum_metrics: { "1d": 2.1, "7d": 6.8, "15d": 9.4, "30d": 15.1 }, news_sentiment_score: 92, upcoming_catalyst: "Federal compute cluster allocation announcements", position_size: 6.50, stop_loss: 118.20, rationale_summary: "NVDA matches regulatory sector support directives with 15d performance breakouts. Strong sentiment metrics complement heavy policy alignment indicators." },
        { ticker: "RTX", company_name: "RTX Corp.", conviction_score: 85.1, momentum_metrics: { "1d": 0.5, "7d": 2.1, "15d": 4.8, "30d": 7.3 }, news_sentiment_score: 84, upcoming_catalyst: "Bilateral military logistics and supply agreements", position_size: 5.80, stop_loss: 92.50, rationale_summary: "RTX shows coordinated purchases by Senate Defense Appropriations members. Clear regulatory catalysts match the target momentum window." },
        { ticker: "JPM", company_name: "JPMorgan Chase & Co.", conviction_score: 82.7, momentum_metrics: { "1d": -0.2, "7d": 1.5, "15d": 3.3, "30d": 6.1 }, news_sentiment_score: 79, upcoming_catalyst: "Federal reserve interest rate review hearings", position_size: 5.20, stop_loss: 184.20, rationale_summary: "JPM represents strong financial sector momentum ahead of core oversight hearings. Sentiment scores remain bullish with minor daily pullbacks." },
        { ticker: "XOM", company_name: "Exxon Mobil Corp.", conviction_score: 79.4, momentum_metrics: { "1d": -0.5, "7d": 1.1, "15d": 2.8, "30d": 5.4 }, news_sentiment_score: 75, upcoming_catalyst: "Offshore exploration drilling permit decision", position_size: 4.80, stop_loss: 108.50, rationale_summary: "XOM trades are backed by heavy Senate Energy committee accumulation. High-volume legislative interest signals upcoming regulatory approvals." },
        { ticker: "MSFT", company_name: "Microsoft Corp.", conviction_score: 78.1, momentum_metrics: { "1d": 0.4, "7d": 2.4, "15d": 4.1, "30d": 6.8 }, news_sentiment_score: 82, upcoming_catalyst: "House software compliance and procurement updates", position_size: 4.50, stop_loss: 395.00, rationale_summary: "MSFT shows technology sector sentiment breakouts. Overlaps with procurement committees suggest a long-term asymmetric advantage." },
        { ticker: "DE", company_name: "Deere & Co.", conviction_score: 76.3, momentum_metrics: { "1d": -0.1, "7d": 0.8, "15d": 2.2, "30d": 4.9 }, news_sentiment_score: 73, upcoming_catalyst: "Rural agriculture equipment subsidy package", position_size: 4.20, stop_loss: 348.00, rationale_summary: "DE benefits from recent Agriculture committee overlaps. Low volatility structures support stable ATR stop-loss configurations." },
        { ticker: "UNH", company_name: "UnitedHealth Group Inc.", conviction_score: 73.9, momentum_metrics: { "1d": 0.2, "7d": 1.2, "15d": 3.0, "30d": 5.1 }, news_sentiment_score: 77, upcoming_catalyst: "Medicare reimbursement rate adjustments", position_size: 3.80, stop_loss: 478.00, rationale_summary: "UNH shows legislative interest from members of Senate Finance. Sentiment trends indicate strong backing ahead of program adjustments." },
        { ticker: "FDX", company_name: "FedEx Corp.", conviction_score: 71.2, momentum_metrics: { "1d": -0.3, "7d": 0.5, "15d": 1.8, "30d": 3.9 }, news_sentiment_score: 71, upcoming_catalyst: "Postal and logistics cargo bid allocations", position_size: 3.50, stop_loss: 242.00, rationale_summary: "FDX demonstrates logistics volume accumulations ahead of postal bids. Matches infrastructure delegation patterns." }
    ];

    const PRESEEDED_PORTFOLIO = [
        { id: "p-1", ticker: "AAPL", entry_date: "2026-07-01", entry_price: 182.50, current_status: "Hold", position_size: 6.80, stop_loss: 178.40 },
        { id: "p-2", ticker: "NVDA", entry_date: "2026-07-02", entry_price: 122.10, current_status: "Hold", position_size: 6.50, stop_loss: 118.20 },
        { id: "p-3", ticker: "LMT", entry_date: "2026-07-03", entry_price: 450.00, current_status: "Sell", exit_date: "2026-07-11", exit_price: 468.20, exit_reason: "Profit target achieved. Re-allocated capital to tech momentum sector." },
        { id: "p-4", ticker: "RTX", entry_date: "2026-07-04", entry_price: 95.50, current_status: "Sell", exit_date: "2026-07-12", exit_price: 92.10, exit_reason: "Trailing stop-loss breached at $92.10 (Stop was $92.50)." }
    ];

    const PRESEEDED_LEDGER = [
        { recommendation_date: "2026-06-12", ticker: "AAPL", entry_price: 100.0, open_price: 100.0, high_price: 105.0, low_price: 98.0, close_price: 103.0, is_winner: true },
        { recommendation_date: "2026-06-15", ticker: "NVDA", entry_price: 103.0, open_price: 103.0, high_price: 108.0, low_price: 101.0, close_price: 106.0, is_winner: true },
        { recommendation_date: "2026-06-18", ticker: "MSFT", entry_price: 106.0, open_price: 106.0, high_price: 107.0, low_price: 102.0, close_price: 104.0, is_winner: false },
        { recommendation_date: "2026-06-21", ticker: "LMT", entry_price: 104.0, open_price: 104.0, high_price: 111.0, low_price: 103.0, close_price: 110.0, is_winner: true },
        { recommendation_date: "2026-06-24", ticker: "XOM", entry_price: 110.0, open_price: 110.0, high_price: 115.0, low_price: 108.0, close_price: 113.0, is_winner: true },
        { recommendation_date: "2026-06-27", ticker: "AMZN", entry_price: 113.0, open_price: 113.0, high_price: 114.0, low_price: 109.0, close_price: 111.0, is_winner: false },
        { recommendation_date: "2026-07-01", ticker: "UNH", entry_price: 111.0, open_price: 111.0, high_price: 118.0, low_price: 110.0, close_price: 116.0, is_winner: true },
        { recommendation_date: "2026-07-04", ticker: "JPM", entry_price: 116.0, open_price: 116.0, high_price: 121.0, low_price: 114.0, close_price: 119.0, is_winner: true },
        { recommendation_date: "2026-07-07", ticker: "DE", entry_price: 119.0, open_price: 119.0, high_price: 120.0, low_price: 115.0, close_price: 117.0, is_winner: false },
        { recommendation_date: "2026-07-10", ticker: "RTX", entry_price: 117.0, open_price: 117.0, high_price: 125.0, low_price: 116.0, close_price: 124.0, is_winner: true }
    ];

    const PRESEEDED_CONFIG = {
        political_weight: 0.38,
        momentum_weight: 0.35,
        sentiment_weight: 0.17,
        catalyst_weight: 0.10,
        last_optimized_at: "2026-07-12T23:00:00Z",
        optimization_log: "Programmatic feedback loop applied. Underperforming market regimes detected (win rate 48%). Adjusted weights to favor Political committee oversight mapping (+0.03) and reduce Sentiment sensitivity (-0.03). This guards the engine against sentiment-only false signals in high-volatility environments while capturing defensive government-influenced positioning."
    };

    async function fetchAiEngineData() {
        try {
            // Fetch configuration weights
            const { data: configs } = await supabase.rpc('rpc_get_system_config');
            if (configs && configs.length > 0) {
                setAiConfig(configs[0]);
            } else {
                setAiConfig(PRESEEDED_CONFIG);
            }

            // Fetch daily recommendations
            const { data: picks } = await supabase
                .from('daily_top_picks')
                .select('*')
                .order('conviction_score', { ascending: false });

            if (picks && picks.length > 0) {
                setDailyPicks(picks);
            } else {
                setDailyPicks(PRESEEDED_PICKS);
            }

            // Fetch active portfolio tracking
            const { data: positions } = await supabase
                .from('portfolio_tracker')
                .select('*')
                .order('entry_date', { ascending: false });

            if (positions && positions.length > 0) {
                setPortfolioPositions(positions);
            } else {
                setPortfolioPositions(PRESEEDED_PORTFOLIO);
            }

            // Fetch attribution accuracy ledger
            const { data: ledger } = await supabase
                .from('accuracy_ledger')
                .select('*')
                .order('recommendation_date', { ascending: false });

            if (ledger && ledger.length > 0) {
                setAccuracyLedger(ledger);
            } else {
                setAccuracyLedger(PRESEEDED_LEDGER);
            }
        } catch (err) {
            console.error("Failed to query AI engine details:", err);
            setDailyPicks(PRESEEDED_PICKS);
            setPortfolioPositions(PRESEEDED_PORTFOLIO);
            setAccuracyLedger(PRESEEDED_LEDGER);
            setAiConfig(PRESEEDED_CONFIG);
        }
    }

    const handleWatchlistClick = (stock: any) => {
        const sym = stock.ticker.toUpperCase();
        // Find most recent trade for this ticker from originalTrades
        const foundTrade = originalTrades.find(t => t.ticker.toUpperCase() === sym);
        if (foundTrade) {
            setSelectedTrade(foundTrade);
        } else {
            // Determine a representative from the official roster based on industry/sector
            let politician = "Nancy Pelosi";
            let party = "D";
            let chamber = "House";
            
            if (['LMT', 'RTX', 'GD', 'NOC'].includes(sym)) {
                politician = "Tommy Tuberville";
                party = "R";
                chamber = "Senate";
            } else if (['XOM', 'CVX'].includes(sym)) {
                politician = "Dan Crenshaw";
                party = "R";
                chamber = "House";
            } else if (sym === 'JPM') {
                politician = "Josh Gottheimer";
                party = "D";
                chamber = "House";
            } else if (sym === 'AAPL') {
                politician = "Nancy Pelosi";
                party = "D";
                chamber = "House";
            }

            setSelectedTrade({
                id: `watchlist-${sym}-${Date.now()}`,
                ticker: sym,
                politician_name: politician,
                party: party,
                chamber: chamber,
                transaction_date: new Date().toISOString(),
                filing_date: new Date().toISOString(),
                transaction_type: "Purchase",
                amount_range: "$15,001 - $50,000",
                committee_overlap: true,
                industry: stock.name,
                sector: ['LMT', 'RTX', 'GD'].includes(sym) ? "Defense" : "Technology"
            } as any);
        }
    };

    async function fetchTrades() {
        try {
            const { data, error } = await supabase
                .from('congress_trades')
                .select('*')
                .order('filing_date', { ascending: false })
                .order('transaction_date', { ascending: false })
                .limit(200);

            if (error) throw error;
            if (data) {
                setTrades(data as Trade[]);
                setOriginalTrades(data as Trade[]);
            }
        } catch (err) {
            console.error("Failed to query congress trades:", err);
        }
    }

    async function triggerManualSync() {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            const response = await fetch('/api/cron/fetch-trades?trigger=true');
            const data = await response.json();
            if (response.ok && data.success) {
                setSyncMessage(`Sync success! Processed ${data.sync_stats.total_evaluated} entries. Found ${data.sync_stats.overlaps_detected} committee overlaps.`);
                await fetchTrades();
            } else {
                setSyncMessage(`Sync Alert: ${data.error || 'Failed to complete update operations'}`);
            }
        } catch (err) {
            setSyncMessage("Sync Alert: Network request failed.");
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncMessage(null), 8000);
        }
    }

    async function saveSMSSettings(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;
        setIsSavingSettings(true);
        setSettingsSuccess(false);

        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    sms_alerts_enabled: smsEnabled,
                    phone_number: phoneNumber
                })
                .eq('id', user.id);

            if (error) throw error;
            setSettingsSuccess(true);
            setTimeout(() => setSettingsSuccess(false), 4000);
        } catch (err) {
            console.error("Failed to save SMS alert options:", err);
            alert("Failed to update preferences. Verify database migrations occurred.");
        } finally {
            setIsSavingSettings(false);
        }
    }

    const calculateFilingLatency = (transDate: string, fileDate: string): number => {
        if (!transDate || !fileDate) return 0;
        const trans = new Date(transDate);
        const file = new Date(fileDate);
        const diffTime = Math.abs(file.getTime() - trans.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Handles filtering in state
    useEffect(() => {
        let filtered = [...originalTrades];

        // Search Query
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.politician_name.toLowerCase().includes(query) || 
                t.ticker.toLowerCase().includes(query)
            );
        }

        // Chamber Filter
        if (selectedChamber !== 'all') {
            filtered = filtered.filter(t => t.chamber === selectedChamber);
        }

        // Overlap COI Filter
        if (selectedOverlapFilter === 'overlap') {
            filtered = filtered.filter(t => t.committee_overlap === true);
        }

        // Action Filter
        if (selectedActionFilter !== 'all') {
            filtered = filtered.filter(t => t.transaction_type === selectedActionFilter);
        }

        // Value Range Filter
        if (selectedValueFilter !== 'all') {
            filtered = filtered.filter(t => {
                const amt = (t.amount_range || '').toLowerCase();
                if (selectedValueFilter === 'small') {
                    return amt.includes('$1,001') || amt.includes('$1,000') || amt.includes('under') || amt.includes('$250');
                } else if (selectedValueFilter === 'medium') {
                    return amt.includes('$15,001') || amt.includes('$50,001');
                } else if (selectedValueFilter === 'large') {
                    return amt.includes('$100,001') || amt.includes('$250,001') || amt.includes('$500,001') || amt.includes('$1,000,000') || amt.includes('over') || amt.includes('$5,000,000');
                }
                return true;
            });
        }

        // Sorting
        filtered.sort((a, b) => {
            if (sortBy === 'filingDateDesc') {
                return new Date(b.filing_date || '').getTime() - new Date(a.filing_date || '').getTime();
            }
            if (sortBy === 'filingDateAsc') {
                return new Date(a.filing_date || '').getTime() - new Date(b.filing_date || '').getTime();
            }
            if (sortBy === 'transactionDateDesc') {
                return new Date(b.transaction_date || '').getTime() - new Date(a.transaction_date || '').getTime();
            }
            if (sortBy === 'transactionDateAsc') {
                return new Date(a.transaction_date || '').getTime() - new Date(b.transaction_date || '').getTime();
            }
            if (sortBy === 'latencyDesc') {
                return calculateFilingLatency(b.transaction_date, b.filing_date) - calculateFilingLatency(a.transaction_date, a.filing_date);
            }
            if (sortBy === 'latencyAsc') {
                return calculateFilingLatency(a.transaction_date, a.filing_date) - calculateFilingLatency(b.transaction_date, b.filing_date);
            }
            if (sortBy === 'nameAsc') {
                return a.politician_name.localeCompare(b.politician_name);
            }
            if (sortBy === 'tickerAsc') {
                return a.ticker.localeCompare(b.ticker);
            }
            return 0;
        });

        setTrades(filtered);
    }, [searchQuery, selectedChamber, selectedOverlapFilter, selectedActionFilter, selectedValueFilter, sortBy, originalTrades]);

    const parseAmountToNumeric = (range: string): number => {
        if (!range || range === 'Unknown' || range.includes('••••')) return 0;
        const clean = range.replace(/[\$,]/g, '').toLowerCase();
        if (clean.includes('over') || clean.includes('million')) {
            const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
            return isNaN(num) ? 1000000 : num;
        }
        const parts = clean.split('-');
        if (parts.length === 2) {
            const low = parseFloat(parts[0].replace(/[^0-9.]/g, ''));
            const high = parseFloat(parts[1].replace(/[^0-9.]/g, ''));
            if (!isNaN(low) && !isNaN(high)) {
                return (low + high) / 2;
            }
        }
        const single = parseFloat(clean.replace(/[^0-9.]/g, ''));
        return isNaN(single) ? 0 : single;
    };

    const formatVolume = (val: number): string => {
        if (val === 0) return 'N/A';
        if (val >= 1000000) {
            return `$${(val / 1000000).toFixed(1)}M`;
        }
        if (val >= 1000) {
            return `$${(val / 1000).toFixed(0)}K`;
        }
        return `$${val}`;
    };

    // Compute grouped ticker activity
    const groupedByTicker = useMemo(() => {
        const groups: Record<string, {
            ticker: string;
            companyName: string;
            industry: string;
            trades: Trade[];
            employeeCount: number;
            employees: string[];
            purchases: number;
            sales: number;
            totalVolume: number;
        }> = {};

        trades.forEach(t => {
            const sym = t.ticker.toUpperCase();
            if (!groups[sym]) {
                const company = COMPANY_DIRECTORY[sym] || {
                    name: `${sym} Corp.`,
                    industry: 'Standard Market Listing',
                    description: ''
                };
                groups[sym] = {
                    ticker: sym,
                    companyName: company.name,
                    industry: company.industry,
                    trades: [],
                    employeeCount: 0,
                    employees: [],
                    purchases: 0,
                    sales: 0,
                    totalVolume: 0
                };
            }
            groups[sym].trades.push(t);
            if (!groups[sym].employees.includes(t.politician_name)) {
                groups[sym].employees.push(t.politician_name);
            }
            if (t.transaction_type === 'Purchase') {
                groups[sym].purchases++;
            } else if (t.transaction_type === 'Sale') {
                groups[sym].sales++;
            }
            groups[sym].totalVolume += parseAmountToNumeric(t.amount_range);
        });

        return Object.values(groups)
            .map(g => ({
                ...g,
                employeeCount: g.employees.length
            }))
            .sort((a, b) => {
                if (b.employeeCount !== a.employeeCount) {
                    return b.employeeCount - a.employeeCount;
                }
                return b.trades.length - a.trades.length;
            });
    }, [trades]);

    // Compute grouped industry activity
    const groupedByIndustry = useMemo(() => {
        const groups: Record<string, {
            industry: string;
            trades: Trade[];
            employeeCount: number;
            employees: string[];
            tickers: string[];
            purchases: number;
            sales: number;
            totalVolume: number;
            tickerActionMap: Record<string, { purchases: number; sales: number; exchanges: number }>;
            memberActionMap: Record<string, { purchases: Trade[]; sales: Trade[]; exchanges: Trade[] }>;
        }> = {};

        trades.forEach(t => {
            const sym = t.ticker.toUpperCase();
            const company = COMPANY_DIRECTORY[sym] || {
                name: `${sym} Corp.`,
                industry: 'Standard Market Listing',
                description: ''
            };
            const ind = company.industry;
            if (!groups[ind]) {
                groups[ind] = {
                    industry: ind,
                    trades: [],
                    employeeCount: 0,
                    employees: [],
                    tickers: [],
                    purchases: 0,
                    sales: 0,
                    totalVolume: 0,
                    tickerActionMap: {},
                    memberActionMap: {}
                };
            }
            groups[ind].trades.push(t);
            if (!groups[ind].employees.includes(t.politician_name)) {
                groups[ind].employees.push(t.politician_name);
            }
            if (!groups[ind].tickers.includes(sym)) {
                groups[ind].tickers.push(sym);
            }
            // Per-ticker action map
            if (!groups[ind].tickerActionMap[sym]) {
                groups[ind].tickerActionMap[sym] = { purchases: 0, sales: 0, exchanges: 0 };
            }
            // Per-member action map
            if (!groups[ind].memberActionMap[t.politician_name]) {
                groups[ind].memberActionMap[t.politician_name] = { purchases: [], sales: [], exchanges: [] };
            }
            if (t.transaction_type === 'Purchase') {
                groups[ind].purchases++;
                groups[ind].tickerActionMap[sym].purchases++;
                groups[ind].memberActionMap[t.politician_name].purchases.push(t);
            } else if (t.transaction_type === 'Sale') {
                groups[ind].sales++;
                groups[ind].tickerActionMap[sym].sales++;
                groups[ind].memberActionMap[t.politician_name].sales.push(t);
            } else {
                groups[ind].tickerActionMap[sym].exchanges++;
                groups[ind].memberActionMap[t.politician_name].exchanges.push(t);
            }
            groups[ind].totalVolume += parseAmountToNumeric(t.amount_range);
        });

        return Object.values(groups)
            .map(g => ({
                ...g,
                employeeCount: g.employees.length
            }))
            .sort((a, b) => b.employeeCount - a.employeeCount);
    }, [trades]);

    type IndustryGroup = {
        industry: string;
        trades: Trade[];
        employeeCount: number;
        employees: string[];
        tickers: string[];
        purchases: number;
        sales: number;
        totalVolume: number;
        tickerActionMap: Record<string, { purchases: number; sales: number; exchanges: number }>;
        memberActionMap: Record<string, { purchases: Trade[]; sales: Trade[]; exchanges: Trade[] }>;
    };
    const [selectedIndustryGroup, setSelectedIndustryGroup] = useState<IndustryGroup | null>(null);

    type TickerGroup = {
        ticker: string;
        companyName: string;
        industry: string;
        trades: Trade[];
        employeeCount: number;
        employees: string[];
        purchases: number;
        sales: number;
        totalVolume: number;
    };
    const [selectedTickerGroup, setSelectedTickerGroup] = useState<TickerGroup | null>(null);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
                    <p className="text-white/60 text-sm uppercase tracking-widest font-bold">
                        Decrypting Terminal...
                    </p>
                </div>
            </div>
        )
    }

    const isAdmin = profile?.role === 'admin'

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Navbar />

            {/* Breaking News Marquee Banner */}
            <AnimatePresence>
                {showNewsFlash && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-24 left-0 right-0 z-40 bg-accent text-background font-bold text-xs uppercase py-3 px-8 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2 overflow-hidden w-full">
                            <span className="flex h-2 w-2 relative shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-background"></span>
                            </span>
                            <div className="truncate w-full pr-12">
                                <AnimatePresence mode="wait">
                                    <motion.span 
                                        key={newsIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        FLASH: {MOCK_NEWS_FLASHES[newsIndex]}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </div>
                        <button onClick={() => setShowNewsFlash(false)} className="hover:opacity-60 transition-opacity pl-2 shrink-0">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Area */}
            <div className="border-b border-white/5 bg-black/40 pt-48 pb-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[100px] pointer-events-none" />

                <div className="container mx-auto px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="text-accent" size={24} />
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-accent/20 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/30">
                                    COI Active Check
                                </span>
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest border border-purple-500/30">
                                    Tier 1 Intel
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
                            <div>
                                <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-4 italic">
                                    CAPITOL <br /> <span className="text-accent">RADAR</span>
                                </h1>
                                <p className="text-white/40 uppercase tracking-[0.4em] text-xs font-black">
                                    Congressional Stock Trade Surveillance Engine // Conflict-of-Interest Scanner
                                </p>
                            </div>

                            {/* Sync Controller Action */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                {isAdmin ? (
                                    <button
                                        onClick={triggerManualSync}
                                        disabled={isSyncing}
                                        className="px-6 py-4 bg-white hover:bg-accent hover:text-black text-black font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-40"
                                    >
                                        {isSyncing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Syncing Feeds...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4" />
                                                Trigger Sync Feed
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="px-6 py-4 border border-white/10 bg-white/5 text-white/40 cursor-not-allowed font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3"
                                    >
                                        <Lock className="w-3.5 h-3.5" />
                                        Admin Required (Sync)
                                    </button>
                                )}
                            </div>
                        </div>

                        {syncMessage && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-white/5 border border-white/10 text-accent font-bold uppercase tracking-wider text-xs flex items-center gap-2"
                            >
                                <Info size={16} />
                                {syncMessage}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* LIVE MARKET QUOTES TICKER (Live Stock Updates) */}
            <div className="border-y border-white/5 bg-white/[0.01] overflow-hidden py-3">
                <div className="container mx-auto px-6">
                    <div className="flex items-center gap-3 mb-2 px-1">
                        <TrendingUp className="text-accent" size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">Live Market Watchlist (Click Ticker to Drill Down)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {marketQuotes.map((stock, i) => (
                            <div 
                                key={stock.ticker} 
                                onClick={() => handleWatchlistClick(stock)}
                                className="bg-[#0e0c15] border border-white/5 rounded-xl p-3 flex flex-col hover:border-emerald-500/30 cursor-pointer active:scale-95 shadow-sm hover:shadow-[0_0_10px_rgba(52,211,153,0.1)] transition-all"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black text-white">{stock.ticker}</span>
                                    <span className={`text-[10px] font-bold flex items-center ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stock.change >= 0 ? '+' : ''}{stock.changePercent}%
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-white/80">
                                    ${stock.price.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="py-12">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
                        
                        {/* LEFT COLUMN: FILTERS & THE TRANSACTIONS TABLE */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* Filter Bar Panel */}
                            <div className="bg-[#0e0c15] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    {/* Name search field */}
                                    <div className="md:col-span-2 relative">
                                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1">Search Database</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search Politician or Ticker..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-white/20 focus:border-accent focus:outline-none transition-colors"
                                            />
                                            <Search className="absolute left-3.5 top-3 text-white/30" size={14} />
                                        </div>
                                    </div>

                                    {/* Chamber selection dropdown */}
                                    <div>
                                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1">Chamber Filter</label>
                                        <select
                                            value={selectedChamber}
                                            onChange={e => setSelectedChamber(e.target.value as any)}
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-accent focus:outline-none transition-colors"
                                        >
                                            <option value="all">Any Chamber</option>
                                            <option value="House">House</option>
                                            <option value="Senate">Senate</option>
                                            <option value="Executive">Executive</option>
                                        </select>
                                    </div>

                                    {/* COI filter toggle */}
                                    <div>
                                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1">Conflict Status</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedOverlapFilter('all')}
                                                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${selectedOverlapFilter === 'all' ? 'bg-white text-black border-white' : 'border-white/10 hover:border-white/30 text-white/60'}`}
                                            >
                                                All
                                            </button>
                                            <button
                                                onClick={() => setSelectedOverlapFilter('overlap')}
                                                className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all flex items-center justify-center gap-1 ${selectedOverlapFilter === 'overlap' ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/10 hover:border-white/30 text-white/60'}`}
                                            >
                                                <AlertOctagon size={11} className={selectedOverlapFilter === 'overlap' ? 'text-red-400' : 'opacity-40'} />
                                                COIs Only
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Advanced filters */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-4 border-t border-white/5 mt-4">
                                    {/* Sort selection dropdown */}
                                    <div>
                                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1">Sort Disclosures</label>
                                        <select
                                            value={sortBy}
                                            onChange={e => setSortBy(e.target.value as any)}
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-accent focus:outline-none transition-colors"
                                        >
                                            <option value="filingDateDesc">Filing Date (Newest)</option>
                                            <option value="filingDateAsc">Filing Date (Oldest)</option>
                                            <option value="transactionDateDesc">Transaction Date (Newest)</option>
                                            <option value="transactionDateAsc">Transaction Date (Oldest)</option>
                                            <option value="latencyDesc">Filing Lag (Highest)</option>
                                            <option value="latencyAsc">Filing Lag (Lowest)</option>
                                            <option value="nameAsc">Politician (A-Z)</option>
                                            <option value="tickerAsc">Ticker (A-Z)</option>
                                        </select>
                                    </div>

                                    {/* Action direction selection dropdown */}
                                    <div>
                                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1">Action Type</label>
                                        <select
                                            value={selectedActionFilter}
                                            onChange={e => setSelectedActionFilter(e.target.value as any)}
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-accent focus:outline-none transition-colors"
                                        >
                                            <option value="all">Any Action</option>
                                            <option value="Purchase">Purchase (Buy)</option>
                                            <option value="Sale">Sale (Sell)</option>
                                            <option value="Exchange">Exchange</option>
                                        </select>
                                    </div>

                                    {/* Value range selection dropdown */}
                                    <div>
                                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1">Estimated Value</label>
                                        <select
                                            value={selectedValueFilter}
                                            onChange={e => setSelectedValueFilter(e.target.value as any)}
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-accent focus:outline-none transition-colors"
                                        >
                                            <option value="all">Any Amount</option>
                                            <option value="small">Small (Under $15k)</option>
                                            <option value="medium">Medium ($15k - $100k)</option>
                                            <option value="large">Large (Over $100k)</option>
                                        </select>
                                    </div>

                                    {/* Reset Filters button */}
                                    <div>
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSelectedChamber('all');
                                                setSelectedOverlapFilter('all');
                                                setSelectedActionFilter('all');
                                                setSelectedValueFilter('all');
                                                setSortBy('filingDateDesc');
                                            }}
                                            className="w-full py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl border border-white/10 hover:border-white/30 text-white/60 hover:text-white bg-white/[0.02] transition-all"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Trades Table List */}
                            <div className="bg-[#0e0c15] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white uppercase italic">SURVEILLANCE FEED</h3>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Showing {trades.length} parsed transactions</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1 bg-black/40 p-1 border border-white/5 rounded-xl self-start md:self-auto">
                                        <button
                                            onClick={() => setViewTab('individual')}
                                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${viewTab === 'individual' ? 'bg-white text-black font-black' : 'text-white/40 hover:text-white/60'}`}
                                        >
                                            Individual Trades
                                        </button>
                                        <button
                                            onClick={() => setViewTab('company')}
                                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${viewTab === 'company' ? 'bg-white text-black font-black' : 'text-white/40 hover:text-white/60'}`}
                                        >
                                            Grouped by Company
                                        </button>
                                        <button
                                            onClick={() => setViewTab('industry')}
                                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${viewTab === 'industry' ? 'bg-white text-black font-black' : 'text-white/40 hover:text-white/60'}`}
                                        >
                                            Grouped by Industry
                                        </button>
                                        <button
                                            onClick={() => setViewTab('ai-engine')}
                                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 ${
                                                viewTab === 'ai-engine' 
                                                    ? 'bg-emerald-400 text-black font-black shadow-[0_0_12px_rgba(52,211,153,0.3)]' 
                                                    : 'text-emerald-400/70 hover:text-emerald-400'
                                            }`}
                                        >
                                            <span className="text-[10px]">★</span> AI Insight Engine
                                        </button>
                                    </div>
                                </div>

                                {trades.length === 0 ? (
                                    <div className="p-16 text-center text-white/30">
                                        <Sliders className="w-12 h-12 mx-auto mb-4 opacity-25" />
                                        <p className="font-bold uppercase tracking-wider text-sm">No transaction matches</p>
                                        <p className="text-xs uppercase tracking-tight mt-1 opacity-60">Adjust filters or trigger a live sync</p>
                                    </div>
                                ) : viewTab === 'individual' ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 text-[10px] font-black uppercase text-white/40 tracking-wider">
                                                    <th className="py-4 pl-6">POLITICIAN</th>
                                                    <th className="py-4">TICKER</th>
                                                    <th className="py-4">INDUSTRY</th>
                                                    <th className="py-4">ACTION</th>
                                                    <th className="py-4">EST. VALUE</th>
                                                    <th className="py-4 text-center">LATENCY</th>
                                                    <th className="py-4 text-center">STATUS</th>
                                                    <th className="py-4 pr-6"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {trades.map((trade) => {
                                                    const latency = calculateFilingLatency(trade.transaction_date, trade.filing_date);
                                                    return (
                                                        <tr 
                                                            key={trade.id} 
                                                            className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${trade.committee_overlap ? 'bg-red-500/[0.01]' : ''}`}
                                                            onClick={() => setSelectedTrade(trade)}
                                                        >
                                                            {/* Politician */}
                                                            <td className="py-4 pl-6">
                                                                <div className="font-bold text-white group-hover:text-accent transition-colors">{trade.politician_name}</div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-[9px] uppercase font-bold text-white/40">{trade.chamber}</span>
                                                                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                                    <span className={`text-[9px] uppercase font-black ${trade.party === 'D' ? 'text-blue-400' : trade.party === 'R' ? 'text-red-400' : 'text-purple-400'}`}>
                                                                        Party {trade.party}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Ticker */}
                                                            <td className="py-4">
                                                                <span className="font-mono font-black text-white bg-white/5 px-2.5 py-1 border border-white/5 rounded-md">
                                                                    {trade.ticker}
                                                                </span>
                                                            </td>

                                                            {/* Industry */}
                                                            <td className="py-4 max-w-[150px] truncate">
                                                                <span className="text-xs text-white/60 font-bold">
                                                                    {COMPANY_DIRECTORY[trade.ticker.toUpperCase()]?.industry || 'Standard Market Listing'}
                                                                </span>
                                                            </td>

                                                            {/* Type */}
                                                            <td className="py-4">
                                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${
                                                                    trade.transaction_type === 'Purchase' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 
                                                                    trade.transaction_type === 'Sale' ? 'bg-red-500/10 text-red-400 border border-red-500/25' : 
                                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                                                                }`}>
                                                                    {trade.transaction_type}
                                                                </span>
                                                            </td>

                                                            {/* Amount Range */}
                                                            <td className="py-4 font-bold text-white/80 font-mono text-xs">
                                                                {isAdmin ? trade.amount_range : (
                                                                    <span className="text-[10px] text-white/30 tracking-widest font-black">••••••••</span>
                                                                )}
                                                            </td>

                                                            {/* Latency */}
                                                            <td className="py-4 text-center">
                                                                <div className="font-bold font-mono text-white/95">{latency}d</div>
                                                                <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Lag Time</div>
                                                            </td>

                                                            {/* COI Overlap Check */}
                                                            <td className="py-4 text-center">
                                                                {trade.committee_overlap ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-950/30 text-red-500 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse">
                                                                        <ShieldAlert size={11} />
                                                                        COI Overlap
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 text-white/30 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                                                                        Clear
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Chevron trigger */}
                                                            <td className="py-4 pr-6 text-right">
                                                                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : viewTab === 'company' ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 text-[10px] font-black uppercase text-white/40 tracking-wider">
                                                    <th className="py-4 pl-6">COMPANY (TICKER)</th>
                                                    <th className="py-4">GOVERNMENT EMPLOYEES</th>
                                                    <th className="py-4">ACTIVITY SPREAD</th>
                                                    <th className="py-4 text-center">EST. VOLUME</th>
                                                    <th className="py-4 text-center">TOTAL</th>
                                                    <th className="py-4 text-center">STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {groupedByTicker.map((group) => {
                                                    const hasCoordinatedPlay = group.employeeCount >= 2;
                                                    return (
                                                        <tr 
                                                            key={group.ticker} 
                                                            className={`hover:bg-white/[0.04] transition-colors cursor-pointer group ${hasCoordinatedPlay ? 'bg-red-500/[0.01]' : ''}`}
                                                            onClick={() => setSelectedTickerGroup(group)}
                                                        >
                                                            {/* Company Details */}
                                                            <td className="py-4 pl-6 max-w-[200px]">
                                                                <div className="font-bold text-white group-hover:text-accent transition-colors truncate">{group.companyName}</div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-[9px] uppercase font-bold text-white/40 truncate max-w-[120px]">{group.industry}</span>
                                                                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                                    <span className="font-mono text-[9px] text-white/60 font-black tracking-wider uppercase">{group.ticker}</span>
                                                                </div>
                                                            </td>

                                                            {/* Government Employees */}
                                                            <td className="py-4 max-w-[260px]">
                                                                <div className="text-xs text-white/80 leading-relaxed font-medium">
                                                                    {group.employees.join(', ')}
                                                                </div>
                                                                <div className="text-[9px] text-white/40 uppercase font-bold mt-0.5">
                                                                    {group.employeeCount} governmental {group.employeeCount === 1 ? 'employee' : 'employees'}
                                                                </div>
                                                            </td>

                                                            {/* Purchases vs Sales */}
                                                            <td className="py-4">
                                                                <div className="flex items-center gap-2">
                                                                    {group.purchases > 0 && (
                                                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                                                                            {group.purchases} BUY{group.purchases > 1 ? 'S' : ''}
                                                                        </span>
                                                                    )}
                                                                    {group.sales > 0 && (
                                                                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/25">
                                                                            {group.sales} SELL{group.sales > 1 ? 'S' : ''}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Est. Volume */}
                                                            <td className="py-4 text-center font-bold text-white/80 font-mono text-xs">
                                                                {isAdmin ? formatVolume(group.totalVolume) : (
                                                                    <span className="text-[10px] text-white/30 tracking-widest font-black">••••••••</span>
                                                                )}
                                                            </td>

                                                            {/* Total Trades */}
                                                            <td className="py-4 text-center font-mono font-black text-white text-xs">
                                                                {group.trades.length}
                                                            </td>

                                                            {/* Status */}
                                                            <td className="py-4 text-center pr-6">
                                                                {hasCoordinatedPlay ? (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/15 border border-red-500/25 px-2.5 py-1 rounded shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse">
                                                                        <AlertOctagon size={9} />
                                                                        COORDINATED PLAY
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                                        Standard
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : viewTab === 'ai-engine' ? (
                                    <div className="p-6 space-y-6">
                                        {/* Status Header: RISK REGIME */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <span className="absolute -inset-1 rounded-full bg-emerald-500/25 blur-sm animate-pulse"></span>
                                                    <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Market Regime Classification</p>
                                                    <p className="text-sm font-black text-white uppercase tracking-wide mt-0.5">RISK-ON STATUS ACTIVE</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-left sm:text-right">
                                                <div>
                                                    <span className="text-[9px] font-bold text-white/40 uppercase block">SPY $Close</span>
                                                    <span className="font-mono font-bold text-xs text-white/80">$542.12 &gt; 50MA ($534.50)</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-white/40 uppercase block">QQQ $Close</span>
                                                    <span className="font-mono font-bold text-xs text-white/80">$462.80 &gt; 50MA ($458.10)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 1. ALPHA FEED PANEL: Ranks 1 to 10 */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[11px] font-black uppercase text-white/40 tracking-widest">Top 10 High-Conviction AI Recommendations</p>
                                                <span className="text-[9px] font-black uppercase text-accent bg-accent/10 border border-accent/25 px-2 py-0.5 rounded">Daily 6:00 AM EST</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {dailyPicks.map((pick, index) => {
                                                    const change1d = pick.momentum_metrics?.["1d"] || 0;
                                                    const change7d = pick.momentum_metrics?.["7d"] || 0;
                                                    return (
                                                        <div key={pick.ticker} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-emerald-500/20 transition-all flex flex-col justify-between gap-3 group relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-3 text-white/5 font-black text-4xl select-none font-mono tracking-tight pointer-events-none group-hover:text-emerald-500/5 transition-colors">
                                                                {String(index + 1).padStart(2, '0')}
                                                            </div>
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono font-black text-base text-white tracking-wide">{pick.ticker}</span>
                                                                        <span className="text-[9px] font-bold text-white/40 uppercase truncate max-w-[120px]">{pick.company_name}</span>
                                                                    </div>
                                                                    <div className="flex gap-2 mt-1.5">
                                                                        <span className="text-[8px] font-bold text-white/60 uppercase">Alloc: <span className="text-white font-black">{pick.position_size}%</span></span>
                                                                        <span className="text-white/20">|</span>
                                                                        <span className="text-[8px] font-bold text-white/60 uppercase">Stop: <span className="text-red-400 font-mono font-bold">${pick.stop_loss}</span></span>
                                                                    </div>
                                                                </div>
                                                                <span className="inline-flex items-center justify-center font-mono font-black text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg shadow-[0_0_8px_rgba(52,211,153,0.1)]">
                                                                    {pick.conviction_score}
                                                                </span>
                                                            </div>

                                                            <p className="text-xs text-white/60 leading-relaxed mt-1">
                                                                {pick.rationale_summary}
                                                            </p>

                                                            {/* Trend line badges */}
                                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                                                                <span className="text-[8px] font-bold text-white/30 uppercase">Momentum:</span>
                                                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${change1d >= 0 ? 'text-emerald-400 bg-emerald-500/5' : 'text-red-400 bg-red-500/5'}`}>
                                                                    1d: {change1d >= 0 ? '+' : ''}{change1d}%
                                                                </span>
                                                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${change7d >= 0 ? 'text-emerald-400 bg-emerald-500/5' : 'text-red-400 bg-red-500/5'}`}>
                                                                    7d: {change7d >= 0 ? '+' : ''}{change7d}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* 2. ESCALATED RISK & EXIT DRAWER */}
                                        {(() => {
                                            const exits = portfolioPositions.filter(p => p.current_status === 'Sell');
                                            if (exits.length === 0) return null;
                                            return (
                                                <div className="p-5 rounded-2xl bg-red-500/[0.02] border border-red-500/10 space-y-3">
                                                    <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-xs">
                                                        <span className="block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                                        <span>CRITICAL SYSTEM EXIT ALERTS RESOLVED (24h)</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {exits.slice(0, 3).map(exit => (
                                                            <div key={exit.id} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                                <div>
                                                                    <span className="font-mono font-black text-red-400 mr-2">{exit.ticker}</span>
                                                                    <span className="text-white/60">Position closed: Entry <span className="font-mono text-white/80 font-semibold">${exit.entry_price}</span> → Exit <span className="font-mono text-red-400 font-bold">${exit.exit_price}</span></span>
                                                                </div>
                                                                <div className="text-[10px] text-white/50 bg-white/5 px-2.5 py-1 rounded-md sm:self-auto self-start uppercase font-bold tracking-wide italic">
                                                                    {exit.exit_reason}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* 3. ACCURACY ATTRIBUTION VIEW */}
                                        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Platform Performance & Accuracy Audit</p>
                                                    <p className="text-xs text-white/60 mt-0.5">Verified attribution metrics across historical cohorts</p>
                                                </div>
                                                <div className="flex bg-black/40 p-1 border border-white/5 rounded-xl">
                                                    <button
                                                        onClick={() => setAttributionTab('candlestick')}
                                                        className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${attributionTab === 'candlestick' ? 'bg-white text-black font-black' : 'text-white/40 hover:text-white/60'}`}
                                                    >
                                                        Variance Chart
                                                    </button>
                                                    <button
                                                        onClick={() => setAttributionTab('winrate')}
                                                        className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${attributionTab === 'winrate' ? 'bg-white text-black font-black' : 'text-white/40 hover:text-white/60'}`}
                                                    >
                                                        Win Rate
                                                    </button>
                                                </div>
                                            </div>

                                            {attributionTab === 'candlestick' ? (
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={accuracyLedger} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                                                            <XAxis 
                                                                dataKey="recommendation_date" 
                                                                tickFormatter={v => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }}
                                                                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                                                                axisLine={false} tickLine={false}
                                                            />
                                                            <YAxis 
                                                                domain={['dataMin - 10', 'dataMax + 10']}
                                                                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                                                                axisLine={false} tickLine={false}
                                                                tickFormatter={v => `$${v}`}
                                                            />
                                                            <Tooltip 
                                                                contentStyle={{ background: '#0b0a0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 12px' }}
                                                                labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 850, textTransform: 'uppercase', letterSpacing: 1 }}
                                                                itemStyle={{ fontSize: 11, fontWeight: 700 }}
                                                                formatter={(v, name, props) => {
                                                                    const p = props.payload;
                                                                    return [
                                                                        `Open: $${p.open_price} | High: $${p.high_price} | Low: $${p.low_price} | Close: $${p.close_price}`,
                                                                        p.ticker
                                                                    ];
                                                                }}
                                                            />
                                                            <Bar 
                                                                dataKey="close_price" 
                                                                fill="#10b981"
                                                                shape={(props: any) => {
                                                                    const { x, y, width, height, payload } = props;
                                                                    if (!payload) return null;
                                                                    const { open_price, close_price, high_price, low_price } = payload;
                                                                    const isGreen = close_price >= open_price;
                                                                    const minVal = Math.min(open_price, close_price);
                                                                    const maxVal = Math.max(open_price, close_price);
                                                                    const valSpan = maxVal - minVal;
                                                                    const scale = valSpan > 0 ? (height / valSpan) : 2.5;

                                                                    const wickX = x + width / 2;
                                                                    const highY = y - (high_price - maxVal) * scale;
                                                                    const lowY = y + height + (minVal - low_price) * scale;

                                                                    const color = isGreen ? '#34d399' : '#f87171';
                                                                    return (
                                                                        <g key={payload.ticker + payload.recommendation_date}>
                                                                            <line x1={wickX} y1={highY} x2={wickX} y2={lowY} stroke={color} strokeWidth={1.5} />
                                                                            <rect x={x} y={y} width={width} height={Math.max(4, height)} fill={color} stroke={color} strokeWidth={1} rx={1} />
                                                                        </g>
                                                                    );
                                                                }}
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart 
                                                            data={[
                                                                { name: '7d Cohort', wins: accuracyLedger.slice(0, 7).filter(r => r.is_winner).length, losses: accuracyLedger.slice(0, 7).filter(r => !r.is_winner).length },
                                                                { name: '15d Cohort', wins: accuracyLedger.slice(0, 15).filter(r => r.is_winner).length, losses: accuracyLedger.slice(0, 15).filter(r => !r.is_winner).length },
                                                                { name: '30d Cohort', wins: accuracyLedger.slice(0, 30).filter(r => r.is_winner).length, losses: accuracyLedger.slice(0, 30).filter(r => !r.is_winner).length }
                                                            ]} 
                                                            margin={{ top: 20, right: 0, left: -25, bottom: 0 }}
                                                        >
                                                            <XAxis 
                                                                dataKey="name" 
                                                                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700 }}
                                                                axisLine={false} tickLine={false}
                                                            />
                                                            <YAxis 
                                                                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700 }}
                                                                axisLine={false} tickLine={false}
                                                            />
                                                            <Tooltip 
                                                                contentStyle={{ background: '#0b0a0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                                                                itemStyle={{ fontSize: 11 }}
                                                            />
                                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }} />
                                                            <Bar dataKey="wins" name="Winning Picks" fill="#34d399" radius={[4, 4, 0, 0]} />
                                                            <Bar dataKey="losses" name="Losing Picks" fill="#f87171" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>

                                        {/* 4. AI LOG TERMINAL */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Dynamic Learning Configuration Logs</p>
                                            <div className="bg-black border border-white/5 rounded-2xl p-5 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto max-h-48 shadow-inner">
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span></span>
                                                    <span className="text-white/60 text-[9px] uppercase tracking-wider">AI RE-WEIGHTING AUDIT TERMINAL</span>
                                                </div>
                                                <p className="text-white/40 mb-1">Last calibration check: {aiConfig?.last_optimized_at ? new Date(aiConfig.last_optimized_at).toLocaleString() : new Date().toLocaleString()}</p>
                                                <p className="mb-2"><span className="text-accent">Active Weights:</span> Political: {aiConfig?.political_weight} | Momentum: {aiConfig?.momentum_weight} | Sentiment: {aiConfig?.sentiment_weight} | Catalyst: {aiConfig?.catalyst_weight}</p>
                                                <p className="text-emerald-300 leading-normal"><span className="text-emerald-500 font-bold">&gt;_ Log:</span> {aiConfig?.optimization_log || "Recalibrated weight parameters. Focus shifted to regulatory overlaps to insulate alpha feed signals against excessive momentum volatility."}</p>
                                                <p className="text-white/20 animate-pulse mt-2">capitol-radar-ai-core:~$ _</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 text-[10px] font-black uppercase text-white/40 tracking-wider">
                                                    <th className="py-4 pl-6">INDUSTRY SECTOR</th>
                                                    <th className="py-4">MEMBERS — PURCHASES / SALES</th>
                                                    <th className="py-4">TICKERS (GREEN=BUY · RED=SELL)</th>
                                                    <th className="py-4 text-center">EST. VOLUME</th>
                                                    <th className="py-4 text-center">TOTAL</th>
                                                    <th className="py-4 text-center">STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {groupedByIndustry.map((group) => {
                                                    const hasCoordinatedPlay = group.employeeCount >= 2;
                                                    return (
                                                        <tr
                                                            key={group.industry}
                                                            className={`hover:bg-white/[0.04] transition-colors cursor-pointer group ${hasCoordinatedPlay ? 'bg-red-500/[0.01]' : ''}`}
                                                            onClick={() => setSelectedIndustryGroup(group)}
                                                        >
                                                            {/* Industry Details */}
                                                            <td className="py-4 pl-6 max-w-[160px]">
                                                                <div className="font-bold text-white group-hover:text-accent transition-colors">{group.industry}</div>
                                                                <div className="text-[9px] text-white/40 uppercase font-bold mt-0.5">
                                                                    {group.tickers.length} active {group.tickers.length === 1 ? 'company' : 'companies'}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {group.purchases > 0 && <span className="text-[9px] font-black text-emerald-400">{group.purchases} BUY{group.purchases > 1 ? 'S' : ''}</span>}
                                                                    {group.purchases > 0 && group.sales > 0 && <span className="text-white/20">·</span>}
                                                                    {group.sales > 0 && <span className="text-[9px] font-black text-red-400">{group.sales} SELL{group.sales > 1 ? 'S' : ''}</span>}
                                                                </div>
                                                            </td>

                                                            {/* Members with Buy/Sell breakdown */}
                                                            <td className="py-4 max-w-[220px]">
                                                                <div className="space-y-1">
                                                                    {Object.entries(group.memberActionMap).slice(0, 4).map(([member, actions]) => (
                                                                        <div key={member} className="flex items-center gap-1.5">
                                                                            <span className="text-[10px] text-white/75 font-medium truncate max-w-[130px]">{member.split(' ').slice(-1)[0]}</span>
                                                                            <div className="flex gap-0.5">
                                                                                {actions.purchases.length > 0 && (
                                                                                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded">
                                                                                        +{actions.purchases.length}
                                                                                    </span>
                                                                                )}
                                                                                {actions.sales.length > 0 && (
                                                                                    <span className="text-[8px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-1 rounded">
                                                                                        -{actions.sales.length}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {Object.keys(group.memberActionMap).length > 4 && (
                                                                        <div className="text-[9px] text-white/30 font-bold uppercase">+{Object.keys(group.memberActionMap).length - 4} more</div>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Color-coded Tickers */}
                                                            <td className="py-4 max-w-[180px]">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {group.tickers.map(ticker => {
                                                                        const ta = group.tickerActionMap[ticker] || { purchases: 0, sales: 0, exchanges: 0 };
                                                                        const isMostlyBuy = ta.purchases >= ta.sales && ta.purchases > 0;
                                                                        const isMostlySell = ta.sales > ta.purchases;
                                                                        const colorClass = isMostlyBuy
                                                                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                                                            : isMostlySell
                                                                            ? 'text-red-400 bg-red-500/10 border-red-500/30'
                                                                            : 'text-blue-400 bg-blue-500/10 border-blue-500/30';
                                                                        return (
                                                                            <span key={ticker} className={`font-mono text-[9px] font-black border px-1.5 py-0.5 rounded ${colorClass}`}>
                                                                                {ticker}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>

                                                            {/* Est. Volume */}
                                                            <td className="py-4 text-center font-bold text-white/80 font-mono text-xs">
                                                                {isAdmin ? formatVolume(group.totalVolume) : (
                                                                    <span className="text-[10px] text-white/30 tracking-widest font-black">••••••••</span>
                                                                )}
                                                            </td>

                                                            {/* Total Trades */}
                                                            <td className="py-4 text-center font-mono font-black text-white text-xs">
                                                                {group.trades.length}
                                                            </td>

                                                            {/* Status */}
                                                            <td className="py-4 text-center pr-6">
                                                                {hasCoordinatedPlay ? (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/15 border border-red-500/25 px-2.5 py-1 rounded shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse">
                                                                        <AlertOctagon size={9} />
                                                                        HIGH FOCUS
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                                        Standard
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: SMS SETTINGS & STATISTICS SUMMARY */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* SMS Notifications Preferences Form */}
                            <div className="bg-[#0e0c15] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Bell size={80} />
                                </div>

                                <h3 className="text-lg font-bold tracking-tight text-white uppercase italic mb-2">ALERT CONFIGURATION</h3>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-6">Manage SMS triggers for potential COIs</p>

                                {isAdmin ? (
                                    <form onSubmit={saveSMSSettings} className="space-y-4 relative z-10">
                                        {/* Enable toggle */}
                                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <Bell className="text-accent" size={18} />
                                                <div>
                                                    <p className="text-xs font-black uppercase text-white tracking-wider">Instant SMS Signals</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-tight mt-0.5">Alert on high-priority overlaps</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={smsEnabled}
                                                    onChange={e => setSmsEnabled(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                            </label>
                                        </div>

                                        {/* Phone input */}
                                        {smsEnabled && (
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Failsafe Cell Number (+E.164)</label>
                                                <div className="relative">
                                                    <input
                                                        type="tel"
                                                        placeholder="+15551234567"
                                                        value={phoneNumber}
                                                        onChange={e => setPhoneNumber(e.target.value)}
                                                        required
                                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                                                    />
                                                    <Phone className="absolute left-3.5 top-3.5 text-white/30" size={16} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Submit action */}
                                        <button
                                            type="submit"
                                            disabled={isSavingSettings}
                                            className="w-full py-4 bg-white hover:bg-accent text-black font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors duration-300 disabled:opacity-40"
                                        >
                                            {isSavingSettings ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Save Notifications Prefs
                                        </button>

                                        {/* Settings Save Status toast */}
                                        {settingsSuccess && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2"
                                            >
                                                <CheckCircle2 size={14} />
                                                Alert preferences synced in cloud
                                            </motion.div>
                                        )}
                                    </form>
                                ) : (
                                    <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 text-center py-6">
                                        <Lock className="w-8 h-8 text-white/20 mx-auto mb-3" />
                                        <p className="text-xs font-black uppercase tracking-wider text-white">SMS Signals Restrained</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-tight leading-relaxed mt-1">
                                            Instant text alerts on high-priority overlaps require administrator account privileges.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Analytics Summary Panel */}
                            <div className="bg-[#0e0c15] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                                <h3 className="text-lg font-bold tracking-tight text-white uppercase italic mb-2">METRIC DIRECTIVES</h3>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-6">Database statistics overview</p>

                                <div className="space-y-4">
                                    {[
                                        { 
                                            label: "Active COI Overlaps", 
                                            value: originalTrades.filter(t => t.committee_overlap).length,
                                            sub: "High-priority alarms" 
                                        },
                                        { 
                                            label: "House Transactions", 
                                            value: originalTrades.filter(t => t.chamber === 'House').length,
                                            sub: "Representative disclosures" 
                                        },
                                        { 
                                            label: "Senate Transactions", 
                                            value: originalTrades.filter(t => t.chamber === 'Senate').length,
                                            sub: "Senator disclosures" 
                                        },
                                        { 
                                            label: "Executive Transactions", 
                                            value: originalTrades.filter(t => t.chamber === 'Executive').length,
                                            sub: "Cabinet/Agency disclosures" 
                                        },
                                    ].map((stat, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-white/60 tracking-wider">{stat.label}</p>
                                                <p className="text-[9px] text-white/30 uppercase tracking-tight mt-0.5">{stat.sub}</p>
                                            </div>
                                            <div className="text-2xl font-black text-white font-mono">
                                                {stat.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Modal Detail Overlay */}
            <AnimatePresence>
                {selectedTrade && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedTrade(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#0b0a0e] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative overflow-y-auto max-h-[92vh]"
                        >
                            {/* Close Trigger */}
                            <button 
                                onClick={() => setSelectedTrade(null)}
                                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Modal Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <AlertOctagon className={`w-8 h-8 ${selectedTrade.committee_overlap ? 'text-red-500' : 'text-accent'}`} />
                                <div>
                                    <h4 className="text-xl font-bold text-white uppercase italic">CONFLICT METRIC DEBRIEF</h4>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Trade ID: {selectedTrade.id.slice(0, 8)}...</p>
                                </div>
                            </div>

                            {/* Details Lists */}
                            <div className="space-y-4">

                                {/* 6-Month Price Chart */}
                                {(() => {
                                    const chartData = selectedTradeHistory || generatePriceHistory(selectedTrade.ticker, selectedTrade.transaction_date);
                                    const prices = chartData.map(d => d.price);
                                    const minP = Math.min(...prices);
                                    const maxP = Math.max(...prices);
                                    const current = prices[prices.length - 1] || 0;
                                    const sixMonthsAgo = prices[0] || 0;
                                    const pct = sixMonthsAgo > 0 ? ((current - sixMonthsAgo) / sixMonthsAgo * 100) : 0;
                                    const isPositive = pct >= 0;

                                    const tradeDateStr = selectedTrade.transaction_date ? selectedTrade.transaction_date.slice(0, 10) : null;
                                    const filingDateStr = selectedTrade.filing_date ? selectedTrade.filing_date.slice(0, 10) : null;
                                    const txPoint = chartData.find(d => d.date === tradeDateStr) || chartData.find(d => d.date <= tradeDateStr!);
                                    const flPoint = chartData.find(d => d.date === filingDateStr) || chartData.find(d => d.date <= filingDateStr!);

                                    return (
                                        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 relative overflow-hidden">
                                            {isLoadingHistory && (
                                                <div className="absolute inset-0 bg-[#0b0a0e]/60 backdrop-blur-sm z-10 flex items-center justify-center gap-2">
                                                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                                                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Loading Live History...</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">6-Month Price Chart</p>
                                                    <p className="text-lg font-black text-white mt-0.5 font-mono">{selectedTrade.ticker} <span className="text-sm font-bold text-white/50">${current.toFixed(2)}</span></p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-sm font-black ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {isPositive ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
                                                    </span>
                                                    <p className="text-[9px] text-white/30 uppercase font-bold mt-0.5">6-month return</p>
                                                </div>
                                            </div>
                                            <ResponsiveContainer width="100%" height={180}>
                                                <AreaChart data={chartData} margin={{ top: 12, right: 0, left: -28, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id={`grad-${selectedTrade.ticker}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity={0.25} />
                                                            <stop offset="95%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                    <XAxis
                                                        dataKey="date"
                                                        tickFormatter={v => { const d = new Date(v); return `${d.toLocaleString('default',{month:'short'})} '${String(d.getFullYear()).slice(2)}`; }}
                                                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                                                        axisLine={false} tickLine={false}
                                                        interval={Math.floor(chartData.length / 5)}
                                                    />
                                                    <YAxis
                                                        domain={[minP * 0.94, maxP * 1.06]}
                                                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                                                        axisLine={false} tickLine={false}
                                                        tickFormatter={v => `$${v.toFixed(0)}`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ background: '#0b0a0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 12px' }}
                                                        labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}
                                                        itemStyle={{ color: isPositive ? '#34d399' : '#f87171', fontWeight: 900, fontSize: 13, fontFamily: 'monospace' }}
                                                        formatter={(v) => [typeof v === 'number' ? `$${v.toFixed(2)}` : v, 'Price']}
                                                    />
                                                    {txPoint && (
                                                        <ReferenceDot
                                                            x={txPoint.date}
                                                            y={txPoint.price}
                                                            r={5}
                                                            fill="#34d399"
                                                            stroke="#0b0a0e"
                                                            strokeWidth={2}
                                                            label={{ value: 'TX Date', position: 'top', fill: '#34d399', fontSize: 9, fontWeight: 900, fontFamily: 'monospace' }}
                                                        />
                                                    )}
                                                    {flPoint && (
                                                        <ReferenceDot
                                                            x={flPoint.date}
                                                            y={flPoint.price}
                                                            r={5}
                                                            fill="#ef4444"
                                                            stroke="#ffffff"
                                                            strokeWidth={1.5}
                                                            label={{ value: 'Filing Date', position: 'bottom', fill: '#f87171', fontSize: 9, fontWeight: 900, fontFamily: 'monospace' }}
                                                        />
                                                    )}
                                                    <Area
                                                        type="monotone"
                                                        dataKey="price"
                                                        stroke={isPositive ? '#34d399' : '#f87171'}
                                                        strokeWidth={2}
                                                        fill={`url(#grad-${selectedTrade.ticker})`}
                                                        dot={false}
                                                        activeDot={{ r: 4, fill: isPositive ? '#34d399' : '#f87171', stroke: '#0b0a0e', strokeWidth: 2 }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                            <div className="flex justify-between mt-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">
                                                        {selectedTradeHistory ? "Yahoo Finance Live 6-Month Chart" : "Simulated historical price index"}
                                                    </span>
                                                </div>
                                                {txPoint && (
                                                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">
                                                        TX Price: ${txPoint.price.toFixed(2)} {flPoint ? `| Filing Price: $${flPoint.price.toFixed(2)}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* All Ticker Activity — grouped by date */}
                                {(() => {
                                    const sym = selectedTrade.ticker.toUpperCase();
                                    const allTickerTrades = originalTrades
                                        .filter(t => t.ticker.toUpperCase() === sym)
                                        .sort((a, b) => (a.transaction_date || '').localeCompare(b.transaction_date || ''));
                                    if (allTickerTrades.length <= 1) return null;

                                    const byDate: Record<string, Trade[]> = {};
                                    allTickerTrades.forEach(t => {
                                        const d = t.transaction_date ? t.transaction_date.slice(0, 10) : 'Unknown';
                                        if (!byDate[d]) byDate[d] = [];
                                        byDate[d].push(t);
                                    });

                                    const purchases = allTickerTrades.filter(t => t.transaction_type === 'Purchase');
                                    const sales = allTickerTrades.filter(t => t.transaction_type === 'Sale');

                                    return (
                                        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">
                                                    All {sym} Activity — {allTickerTrades.length} Disclosures
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    {purchases.length > 0 && <span className="text-[9px] font-black text-emerald-400">{purchases.length} BUY{purchases.length > 1 ? 'S' : ''}</span>}
                                                    {sales.length > 0 && <span className="text-[9px] font-black text-red-400">{sales.length} SELL{sales.length > 1 ? 'S' : ''}</span>}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.entries(byDate).map(([date, dayTrades]) => (
                                                    <div key={date}>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest font-mono">{date}</span>
                                                            <div className="flex-1 h-px bg-white/5"></div>
                                                            <span className="text-[8px] font-bold text-white/20 uppercase">{dayTrades.length} trade{dayTrades.length > 1 ? 's' : ''}</span>
                                                        </div>
                                                        <div className="space-y-1 pl-2">
                                                            {dayTrades.map(t => {
                                                                const isPurchase = t.transaction_type === 'Purchase';
                                                                const isCurrent = t.id === selectedTrade.id;
                                                                return (
                                                                    <div
                                                                        key={t.id}
                                                                        className={`flex items-center justify-between py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                                                                            isCurrent
                                                                                ? 'bg-accent/10 border border-accent/25'
                                                                                : isPurchase
                                                                                ? 'bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/35'
                                                                                : 'bg-red-500/5 border border-red-500/10 hover:border-red-500/35'
                                                                        }`}
                                                                        onClick={() => { if (!isCurrent) setSelectedTrade(t); }}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`text-[8px] font-black uppercase tracking-wider ${isPurchase ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                                {isPurchase ? '▲ BUY' : '▼ SELL'}
                                                                            </span>
                                                                            <span className={`text-[10px] font-bold ${isCurrent ? 'text-accent' : 'text-white/75'}`}>
                                                                                {t.politician_name}
                                                                            </span>
                                                                            {isCurrent && <span className="text-[8px] font-black text-accent/70 uppercase tracking-wider">← current</span>}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {isAdmin && t.amount_range && (
                                                                                <span className="text-[9px] text-white/30 font-bold font-mono">{t.amount_range}</span>
                                                                            )}
                                                                            <span className="text-[8px] text-white/20 font-bold uppercase">{t.chamber}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* POLITICIAN & CONNECTION Intel */}
                                {(() => {
                                    const polMeta = getPoliticianMetadata(selectedTrade.politician_name, selectedTrade.party);
                                    const compMeta = getCompanyMetadata(selectedTrade.ticker);
                                    
                                    // Connections
                                    const commConn = checkCommitteeConnection(polMeta.committees, compMeta.industry);
                                    const stateMatch = polMeta.state === compMeta.state;
                                    const regionMatch = polMeta.region === compMeta.region;
                                    const hasAnyConnection = commConn.matches || stateMatch || regionMatch;
                                    
                                    return (
                                        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-3">REPRESENTATIVE Intel</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/60 uppercase">Name</p>
                                                        <p className="text-sm font-black text-accent mt-0.5">{selectedTrade.politician_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/60 uppercase">Chamber & Party</p>
                                                        <p className="text-sm font-black text-white mt-0.5">
                                                            {selectedTrade.chamber} ({polMeta.party === 'D' ? 'Democrat' : polMeta.party === 'R' ? 'Republican' : 'Independent'})
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/60 uppercase">Representing State</p>
                                                        <p className="text-sm font-black text-white mt-0.5 font-mono">{polMeta.state} ({polMeta.region})</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/60 uppercase">Active Committees</p>
                                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                                            {polMeta.committees.map((c, i) => (
                                                                <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/70 border border-white/5">
                                                                    {c}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-white/5 pt-4">
                                                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-3">CONSTITUENT & REGULATORY CONNECTIONS</p>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {/* Committee Connection Card */}
                                                    <div className={`p-3 rounded-xl border transition-all ${
                                                        commConn.matches 
                                                            ? 'bg-red-500/5 border-red-500/20' 
                                                            : 'bg-white/[0.02] border-white/5'
                                                    }`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[8px] font-black uppercase tracking-wider text-white/40">Committee Oversight</span>
                                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                                commConn.matches ? 'bg-red-500/25 text-red-400 font-black' : 'bg-white/10 text-white/50'
                                                            }`}>
                                                                {commConn.matches ? 'Overlap' : 'Clear'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-white/80 leading-relaxed">
                                                            {commConn.matches ? commConn.reason : 'Representative has no direct committee oversight of this sector.'}
                                                        </p>
                                                    </div>

                                                    {/* State Connection Card */}
                                                    <div className={`p-3 rounded-xl border transition-all ${
                                                        stateMatch 
                                                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                                                            : 'bg-white/[0.02] border-white/5'
                                                    }`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[8px] font-black uppercase tracking-wider text-white/40">Constituent State Match</span>
                                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                                stateMatch ? 'bg-emerald-500/25 text-emerald-400 font-black' : 'bg-white/10 text-white/50'
                                                            }`}>
                                                                {stateMatch ? 'Match' : 'Clear'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-white/80 leading-relaxed">
                                                            {stateMatch 
                                                                ? `Both represent and operate in the state of ${polMeta.state}.` 
                                                                : `No direct state alignment (${polMeta.state} vs ${compMeta.state}).`
                                                            }
                                                        </p>
                                                    </div>

                                                    {/* Region Connection Card */}
                                                    <div className={`p-3 rounded-xl border transition-all ${
                                                        regionMatch 
                                                            ? 'bg-sky-500/5 border-sky-500/20' 
                                                            : 'bg-white/[0.02] border-white/5'
                                                    }`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[8px] font-black uppercase tracking-wider text-white/40">Regional Proximity</span>
                                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                                regionMatch ? 'bg-sky-500/25 text-sky-400 font-black' : 'bg-white/10 text-white/50'
                                                            }`}>
                                                                {regionMatch ? 'Aligned' : 'Clear'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-white/80 leading-relaxed">
                                                            {regionMatch 
                                                                ? `Both have strong ties to the US ${polMeta.region} region.` 
                                                                : `No regional alignment (${polMeta.region} vs ${compMeta.region}).`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Connection Summary Alert */}
                                                {hasAnyConnection && (
                                                    <div className="mt-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-start gap-2">
                                                        <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                                        <div className="text-[10px] font-medium text-white/60 leading-relaxed">
                                                            <span className="text-white font-bold uppercase mr-1">Connection Analysis:</span>
                                                            This trade displays positive correlation alignments. Regulatory oversight and regional operations represent potential channels of asymmetric information flow.
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-3">TRANSACTION Intel</p>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Ticker</p>
                                            <p className="text-sm font-mono font-black text-white mt-0.5">{selectedTrade.ticker}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Action</p>
                                            <p className="text-sm font-black text-white mt-0.5">{selectedTrade.transaction_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Estimated Value</p>
                                            <p className="text-sm font-black text-white mt-0.5">
                                                {isAdmin ? selectedTrade.amount_range : "•••••••• (Admin Key Req)"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Filing Lag</p>
                                            <p className="text-sm font-black text-white mt-0.5">{calculateFilingLatency(selectedTrade.transaction_date, selectedTrade.filing_date)} Days</p>
                                        </div>
                                    </div>
                                </div>

                                {/* COMPANY Intel */}
                                {(() => {
                                    const compMeta = getCompanyMetadata(selectedTrade.ticker);
                                    return (
                                        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                                            <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-3">COMPANY Intel</p>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    <div className="col-span-2">
                                                        <p className="text-[10px] font-bold text-white/60 uppercase">Company Name</p>
                                                        <p className="text-sm font-black text-white mt-0.5">{compMeta.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/60 uppercase">Industry Sector</p>
                                                        <p className="text-sm font-black text-white mt-0.5">{compMeta.industry}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/60 uppercase">Headquarters</p>
                                                        <p className="text-sm font-black text-white mt-0.5 font-mono">{compMeta.state} ({compMeta.region})</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-white/60 uppercase">Business Brief</p>
                                                    <p className="text-xs text-white/40 leading-relaxed font-semibold mt-1">
                                                        {compMeta.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* COI Alignment Summary Details */}
                                {isAdmin ? (
                                    selectedTrade.committee_overlap ? (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                                            <p className="text-[9px] font-black uppercase text-red-400 tracking-widest mb-2 flex items-center gap-1">
                                                <Info size={11} />
                                                Conflict-of-Interest OVERLAP DETECTED
                                            </p>
                                            <p className="text-xs text-white/80 leading-relaxed uppercase font-semibold">
                                                {selectedTrade.politician_name} is assigned to a legislative committee overseeing industries directly tied to {selectedTrade.ticker}. This trade matches conflict-of-interest criteria.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                                            <p className="text-[9px] font-black uppercase text-white/60 tracking-widest mb-2">COI Status Clear</p>
                                            <p className="text-xs text-white/50 leading-relaxed uppercase font-semibold">
                                                No explicit committee overlap assignments found. Sector and ticker trade is cleared under standard screening protocols.
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 text-center py-8 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
                                        <Lock size={20} className="text-white/20 mx-auto mb-2 relative z-10" />
                                        <p className="text-[10px] font-black uppercase text-white/60 tracking-widest relative z-10 mb-1">COI Mapping Locked</p>
                                        <p className="text-[9px] text-white/40 leading-relaxed uppercase font-bold max-w-sm mx-auto relative z-10">
                                            Specific legislative committee mapping logs and sector overlaps require administrator privilege elevation keys.
                                        </p>
                                    </div>
                                )}

                                <div className="text-right">
                                    <button 
                                        onClick={() => setSelectedTrade(null)}
                                        className="px-6 py-3 border border-white/10 hover:border-white text-white font-black uppercase tracking-widest text-[10px] transition-colors"
                                    >
                                        Close Intel Report
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Industry Drill-Down Modal */}
            <AnimatePresence>
                {selectedIndustryGroup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedIndustryGroup(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#0b0a0e] border border-white/10 rounded-3xl w-full max-w-3xl relative overflow-y-auto max-h-[92vh]"
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-[#0b0a0e]/95 backdrop-blur-sm border-b border-white/5 px-8 py-6 flex items-start justify-between z-10">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Industry Intelligence Report</p>
                                    <h4 className="text-2xl font-black text-white uppercase italic">{selectedIndustryGroup.industry}</h4>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">{selectedIndustryGroup.purchases} PURCHASES</span>
                                        <span className="text-white/20">·</span>
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">{selectedIndustryGroup.sales} SALES</span>
                                        <span className="text-white/20">·</span>
                                        <span className="text-[10px] font-black text-white/50 uppercase tracking-wider">{selectedIndustryGroup.trades.length} TOTAL DISCLOSURES</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedIndustryGroup(null)}
                                    className="text-white/40 hover:text-white transition-colors mt-1 flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">

                                {/* Ticker Legend */}
                                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-3">Tickers Traded in This Sector</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedIndustryGroup.tickers.map((ticker: string) => {
                                            const ta = selectedIndustryGroup.tickerActionMap[ticker] || { purchases: 0, sales: 0, exchanges: 0 };
                                            const isBuy = ta.purchases >= ta.sales && ta.purchases > 0;
                                            const isSell = ta.sales > ta.purchases;
                                            const colorClass = isBuy
                                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                                : isSell
                                                ? 'text-red-400 bg-red-500/10 border-red-500/30'
                                                : 'text-blue-400 bg-blue-500/10 border-blue-500/30';
                                            const company = COMPANY_DIRECTORY[ticker] || { name: ticker, industry: '', description: '' };
                                            return (
                                                <div key={ticker} className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${colorClass}`}>
                                                    <span className="font-mono text-xs font-black">{ticker}</span>
                                                    <span className="text-[9px] font-bold opacity-70 max-w-[140px] truncate">{company.name}</span>
                                                    <div className="flex gap-1 ml-1">
                                                        {ta.purchases > 0 && <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/20 px-1 rounded">↑{ta.purchases}</span>}
                                                        {ta.sales > 0 && <span className="text-[8px] font-black text-red-400 bg-red-500/20 px-1 rounded">↓{ta.sales}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Per-Member Breakdown */}
                                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-4">Member Activity Breakdown</p>
                                    <div className="space-y-4">
                                        {Object.entries(selectedIndustryGroup.memberActionMap).map(([member, actions]: [string, { purchases: Trade[]; sales: Trade[]; exchanges: Trade[] }]) => (
                                            <div key={member} className="border border-white/5 rounded-xl p-4 bg-white/[0.02]">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <p className="text-sm font-black text-white">{member}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {actions.purchases.length > 0 && (
                                                                <span className="text-[9px] font-black text-emerald-400">{actions.purchases.length} BUY{actions.purchases.length > 1 ? 'S' : ''}</span>
                                                            )}
                                                            {actions.purchases.length > 0 && actions.sales.length > 0 && <span className="text-white/20">·</span>}
                                                            {actions.sales.length > 0 && (
                                                                <span className="text-[9px] font-black text-red-400">{actions.sales.length} SELL{actions.sales.length > 1 ? 'S' : ''}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-white/30 bg-white/5 border border-white/5 px-2 py-1 rounded">
                                                        {actions.purchases.length + actions.sales.length + actions.exchanges.length} trades
                                                    </span>
                                                </div>

                                                {/* Purchases rows */}
                                                {actions.purchases.length > 0 && (
                                                    <div className="space-y-1 mb-2">
                                                        {actions.purchases.map(t => (
                                                            <div
                                                                key={t.id}
                                                                className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 cursor-pointer hover:border-emerald-500/30 transition-colors"
                                                                onClick={() => { setSelectedIndustryGroup(null); setSelectedTrade(t); }}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">{t.ticker}</span>
                                                                    <span className="text-[9px] text-emerald-400 font-black uppercase">PURCHASE</span>
                                                                    <span className="text-[9px] text-white/40">{t.transaction_date ? t.transaction_date.slice(0,10) : '—'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {isAdmin && <span className="text-[9px] text-white/50 font-bold font-mono">{t.amount_range}</span>}
                                                                    <ChevronRight size={12} className="text-white/20" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Sales rows */}
                                                {actions.sales.length > 0 && (
                                                    <div className="space-y-1">
                                                        {actions.sales.map(t => (
                                                            <div
                                                                key={t.id}
                                                                className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-red-500/5 border border-red-500/10 cursor-pointer hover:border-red-500/30 transition-colors"
                                                                onClick={() => { setSelectedIndustryGroup(null); setSelectedTrade(t); }}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">{t.ticker}</span>
                                                                    <span className="text-[9px] text-red-400 font-black uppercase">SALE</span>
                                                                    <span className="text-[9px] text-white/40">{t.transaction_date ? t.transaction_date.slice(0,10) : '—'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {isAdmin && <span className="text-[9px] text-white/50 font-bold font-mono">{t.amount_range}</span>}
                                                                    <ChevronRight size={12} className="text-white/20" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <button
                                        onClick={() => setSelectedIndustryGroup(null)}
                                        className="px-6 py-3 border border-white/10 hover:border-white text-white font-black uppercase tracking-widest text-[10px] transition-colors rounded-xl"
                                    >
                                        Close Report
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ticker Intelligence Chart Modal */}
            <AnimatePresence>
                {selectedTickerGroup && (() => {
                    const tg = selectedTickerGroup;
                    const chartData = generatePriceHistory(tg.ticker, '');
                    const prices = chartData.map(d => d.price);
                    const minP = Math.min(...prices);
                    const maxP = Math.max(...prices);
                    const current = prices[prices.length - 1];
                    const first = prices[0];
                    const pct = first > 0 ? ((current - first) / first * 100) : 0;
                    const isPositive = pct >= 0;

                    // Build per-member color palette
                    const memberColors = ['#a78bfa', '#38bdf8', '#fb923c', '#f472b6', '#facc15', '#34d399', '#e879f9', '#60a5fa'];
                    const memberList = tg.employees;
                    const memberColorMap: Record<string, string> = {};
                    memberList.forEach((m, i) => { memberColorMap[m] = memberColors[i % memberColors.length]; });

                    // Collect all trade markers by date
                    const tradeMarkers: { date: string; member: string; action: string; amount: string }[] = [];
                    tg.trades.forEach(t => {
                        if (t.transaction_date) {
                            tradeMarkers.push({
                                date: t.transaction_date.slice(0, 10),
                                member: t.politician_name,
                                action: t.transaction_type,
                                amount: t.amount_range
                            });
                        }
                    });

                    const purchases = tg.trades.filter(t => t.transaction_type === 'Purchase').sort((a, b) => (a.transaction_date || '').localeCompare(b.transaction_date || ''));
                    const sales = tg.trades.filter(t => t.transaction_type === 'Sale').sort((a, b) => (a.transaction_date || '').localeCompare(b.transaction_date || ''));
                    const company = COMPANY_DIRECTORY[tg.ticker] || { name: tg.ticker, industry: tg.industry, description: '' };

                    return (
                        <motion.div
                            key="ticker-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/88 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setSelectedTickerGroup(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-[#0b0a0e] border border-white/10 rounded-3xl w-full max-w-3xl relative overflow-y-auto max-h-[92vh]"
                            >
                                {/* Sticky Header */}
                                <div className="sticky top-0 bg-[#0b0a0e]/97 backdrop-blur-sm border-b border-white/5 px-8 py-6 flex items-start justify-between z-10">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Ticker Intelligence Report</p>
                                        <div className="flex items-baseline gap-3">
                                            <h4 className="text-2xl font-black text-white uppercase italic font-mono">{tg.ticker}</h4>
                                            <span className="text-white/50 font-bold text-sm">{company.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-[9px] uppercase font-bold text-white/30 tracking-widest">{tg.industry}</span>
                                            <span className="text-white/20">·</span>
                                            <span className="text-[10px] font-black text-emerald-400">{tg.purchases} BUYS</span>
                                            <span className="text-white/20">·</span>
                                            <span className="text-[10px] font-black text-red-400">{tg.sales} SELLS</span>
                                            <span className="text-white/20">·</span>
                                            <span className={`text-[10px] font-black ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {isPositive ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% (6mo)
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedTickerGroup(null)} className="text-white/40 hover:text-white transition-colors mt-1 flex-shrink-0">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6">

                                    {/* 6-Month Chart with All Trade Markers */}
                                    <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">6-Month Price History</p>
                                                <p className="text-xs text-white/30 font-bold mt-0.5">All member trade timings marked on chart</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-white font-mono">${current.toFixed(2)}</p>
                                                <p className="text-[9px] text-white/30 uppercase font-bold">Current Price</p>
                                            </div>
                                        </div>

                                        <ResponsiveContainer width="100%" height={220}>
                                            <AreaChart data={chartData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id={`grad-tk-${tg.ticker}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    tickFormatter={v => { const d = new Date(v); return `${d.toLocaleString('default', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`; }}
                                                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                                                    axisLine={false} tickLine={false}
                                                    interval={Math.floor(chartData.length / 5)}
                                                />
                                                <YAxis
                                                    domain={[minP * 0.96, maxP * 1.04]}
                                                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                                                    axisLine={false} tickLine={false}
                                                    tickFormatter={v => `$${v.toFixed(0)}`}
                                                />
                                                <Tooltip
                                                    content={({ active, payload, label }) => {
                                                        if (!active || !payload || !payload.length) return null;
                                                        const price = payload[0]?.value;
                                                        const dayTrades = tradeMarkers.filter(mk => mk.date === label);
                                                        return (
                                                            <div style={{ background: '#0d0b12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 16px', minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                                                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>{label}</p>
                                                                <p style={{ color: isPositive ? '#34d399' : '#f87171', fontWeight: 900, fontSize: 18, fontFamily: 'monospace', marginBottom: dayTrades.length > 0 ? 10 : 0, lineHeight: 1 }}>
                                                                    ${typeof price === 'number' ? price.toFixed(2) : price}
                                                                </p>
                                                                {dayTrades.length > 0 && (
                                                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
                                                                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>trades on this date</p>
                                                                        {dayTrades.map((mk, i) => {
                                                                            const isBuy = mk.action === 'Purchase';
                                                                            const dotColor = isBuy ? '#34d399' : '#f87171';
                                                                            return (
                                                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < dayTrades.length - 1 ? 6 : 0 }}>
                                                                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}60` }}></span>
                                                                                    <span style={{ fontSize: 9, fontWeight: 900, color: dotColor, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>{isBuy ? 'BUY' : 'SELL'}</span>
                                                                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>{mk.member}</span>
                                                                                    {mk.amount && isAdmin && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontWeight: 700, marginLeft: 2 }}>{mk.amount}</span>}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }}
                                                />
                                                {/* One reference line per trade event */}
                                                {tradeMarkers.map((mk, idx) => {
                                                    const isPurchase = mk.action === 'Purchase';
                                                    const color = isPurchase ? '#34d399' : '#f87171';
                                                    const initials = mk.member.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                                                    return (
                                                        <ReferenceLine
                                                            key={`${mk.date}-${idx}`}
                                                            x={mk.date}
                                                            stroke={color}
                                                            strokeWidth={1.5}
                                                            strokeDasharray={isPurchase ? '0' : '4 3'}
                                                            strokeOpacity={0.7}
                                                            label={{
                                                                value: initials,
                                                                position: idx % 2 === 0 ? 'top' : 'insideTop',
                                                                fill: color,
                                                                fontSize: 7,
                                                                fontWeight: 900,
                                                                fontFamily: 'monospace',
                                                                dy: idx % 3 === 0 ? -2 : idx % 3 === 1 ? 8 : 18
                                                            }}
                                                        />
                                                    );
                                                })}
                                                <Area
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke={isPositive ? '#34d399' : '#f87171'}
                                                    strokeWidth={2}
                                                    fill={`url(#grad-tk-${tg.ticker})`}
                                                    dot={false}
                                                    activeDot={{ r: 4, fill: isPositive ? '#34d399' : '#f87171', stroke: '#0b0a0e', strokeWidth: 2 }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>

                                        {/* Chart Legend */}
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-2">Legend</p>
                                            <div className="flex flex-wrap gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-0.5 bg-emerald-400"></div>
                                                    <span className="text-[9px] text-white/40 font-bold uppercase">Purchase (solid line)</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-0.5 border-t border-dashed border-red-400"></div>
                                                    <span className="text-[9px] text-white/40 font-bold uppercase">Sale (dashed line)</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] text-white/40 font-bold uppercase">· Labels = member initials</span>
                                                </div>
                                            </div>
                                            {/* Member color key */}
                                            <div className="flex flex-wrap gap-3 mt-2">
                                                {memberList.map(m => (
                                                    <div key={m} className="flex items-center gap-1">
                                                        <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded" style={{ color: memberColorMap[m], background: `${memberColorMap[m]}18`, border: `1px solid ${memberColorMap[m]}40` }}>
                                                            {m.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                        </span>
                                                        <span className="text-[9px] text-white/40 font-bold truncate max-w-[120px]">{m}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[8px] text-white/20 font-bold uppercase mt-2">Simulated price model — not live market data</p>
                                        </div>
                                    </div>

                                    {/* Purchases Timeline */}
                                    {purchases.length > 0 && (
                                        <div className="border border-emerald-500/15 bg-emerald-500/[0.02] rounded-2xl p-5">
                                            <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest mb-3 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                                                Purchases — {purchases.length} Disclosed Transactions
                                            </p>
                                            <div className="space-y-2">
                                                {purchases.map(t => (
                                                    <div
                                                        key={t.id}
                                                        className="flex items-center justify-between py-2 px-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all"
                                                        onClick={() => { setSelectedTickerGroup(null); setSelectedTrade(t); }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className="text-[9px] font-black font-mono px-2 py-1 rounded"
                                                                style={{ color: memberColorMap[t.politician_name] || '#34d399', background: `${memberColorMap[t.politician_name] || '#34d399'}18`, border: `1px solid ${memberColorMap[t.politician_name] || '#34d399'}40` }}
                                                            >
                                                                {t.politician_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                            </span>
                                                            <div>
                                                                <p className="text-xs font-black text-white">{t.politician_name}</p>
                                                                <p className="text-[9px] text-white/40 font-bold">{t.chamber} · {t.transaction_date ? t.transaction_date.slice(0, 10) : '—'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-right">
                                                            {isAdmin && <span className="text-[10px] font-bold text-white/50 font-mono">{t.amount_range}</span>}
                                                            <span className="text-[9px] font-black text-emerald-400 uppercase">PURCHASE</span>
                                                            <ChevronRight size={12} className="text-emerald-400/30" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sales Timeline */}
                                    {sales.length > 0 && (
                                        <div className="border border-red-500/15 bg-red-500/[0.02] rounded-2xl p-5">
                                            <p className="text-[9px] font-black uppercase text-red-400 tracking-widest mb-3 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                                                Sales — {sales.length} Disclosed Transactions
                                            </p>
                                            <div className="space-y-2">
                                                {sales.map(t => (
                                                    <div
                                                        key={t.id}
                                                        className="flex items-center justify-between py-2 px-3 rounded-xl bg-red-500/5 border border-red-500/10 cursor-pointer hover:border-red-500/40 hover:bg-red-500/10 transition-all"
                                                        onClick={() => { setSelectedTickerGroup(null); setSelectedTrade(t); }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className="text-[9px] font-black font-mono px-2 py-1 rounded"
                                                                style={{ color: memberColorMap[t.politician_name] || '#f87171', background: `${memberColorMap[t.politician_name] || '#f87171'}18`, border: `1px solid ${memberColorMap[t.politician_name] || '#f87171'}40` }}
                                                            >
                                                                {t.politician_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                            </span>
                                                            <div>
                                                                <p className="text-xs font-black text-white">{t.politician_name}</p>
                                                                <p className="text-[9px] text-white/40 font-bold">{t.chamber} · {t.transaction_date ? t.transaction_date.slice(0, 10) : '—'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-right">
                                                            {isAdmin && <span className="text-[10px] font-bold text-white/50 font-mono">{t.amount_range}</span>}
                                                            <span className="text-[9px] font-black text-red-400 uppercase">SALE</span>
                                                            <ChevronRight size={12} className="text-red-400/30" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-right">
                                        <button
                                            onClick={() => setSelectedTickerGroup(null)}
                                            className="px-6 py-3 border border-white/10 hover:border-white text-white font-black uppercase tracking-widest text-[10px] transition-colors rounded-xl"
                                        >
                                            Close Report
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            <Footer />
        </div>
    )
}
