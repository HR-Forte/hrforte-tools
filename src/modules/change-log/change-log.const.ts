export const REPO_NAME_ENUM = {
  'Web App': 'HR-Forte/hrforte-web-app',
  'Services API': 'HR-Forte/hrforte-services-api',
  'E-Smart Time API': 'HR-Forte/hrforte-esmart-time-api',
  Mobile: 'HR-Forte/hrforte-mobile-v2',
  Octopro: 'HR-Forte/hrforte-octopro-v2',
  '.NET API': 'HR-Forte/hrf-back-dnc',
  'RAG Chatbot UI Widget': 'HR-Forte/rag-chatbot-ui-widget',
  'External API': 'HR-Forte/hrforte-external-api',
  'Web App V2': 'HR-Forte/hrforte-web-app-v2',
  'Micro Frontend Root Config': 'HR-Forte/hrforte-mfe-root-config ',
};

export const REPO_NAME_MAPPING: Record<string, { name: string; color: string }> = {
  [REPO_NAME_ENUM['Web App']]: {
    name: 'Web App',
    color: '#FF6600',
  },
  [REPO_NAME_ENUM['Services API']]: {
    name: 'Services API',
    color: '#3389d4',
  },
  [REPO_NAME_ENUM['E-Smart Time API']]: {
    name: 'E-Smart Time API',
    color: '#a7d62f',
  },
  [REPO_NAME_ENUM['Mobile']]: {
    name: 'Mobile',
    color: '#6a1c47',
  },
  [REPO_NAME_ENUM['Octopro']]: {
    name: 'Octopro',
    color: '#5e6c52',
  },
  [REPO_NAME_ENUM['.NET API']]: {
    name: '.NET API',
    color: '#666666',
  },
  [REPO_NAME_ENUM['RAG Chatbot UI Widget']]: {
    name: 'RAG Chatbot UI Widget',
    color: '#42b883',
  },
  [REPO_NAME_ENUM['External API']]: {
    name: 'External API',
    color: '#f59e0b',
  },
  [REPO_NAME_ENUM['Web App V2']]: {
    name: 'Web App V2',
    color: '#41f918',
  },
  [REPO_NAME_ENUM['Micro Frontend Root Config']]: {
    name: 'Micro Frontend Root Config',
    color: '#c731a6',
  },
};

export const MANAGED_REPO_NAMES = Object.keys(REPO_NAME_MAPPING) as string[];
