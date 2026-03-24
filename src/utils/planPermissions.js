/**
 * Plan Permission Utility
 * Centralizes the logic for Free vs Pro plan limits.
 */

export const PLAN_LIMITS = {
  FREE: {
    maxBrands: 1,
    maxTemplateExports: 3,
    maxGenerationsPerMonth: 3,
    visibleHooks: 3,
    captionVariations: ['short'],
    hasWatermark: true,
    features: {
      hashtagStrategy: false,
      brandVoice: false,
      versionHistory: false,
      shareLink: false,
      editorAIFeature: false,
      editorEmojiPng: false,
    }
  },
  PRO: {
    maxBrands: 5,
    maxTemplateExports: Infinity,
    maxGenerationsPerMonth: Infinity,
    visibleHooks: Infinity,
    captionVariations: ['short', 'medium', 'story'],
    hasWatermark: false,
    features: {
      hashtagStrategy: true,
      brandVoice: true,
      versionHistory: true,
      shareLink: true,
      editorAIFeature: true,
      editorEmojiPng: true,
    }
  }
};

export const getPlanStatus = () => {
  const isPro = localStorage.getItem('kreavia_pro_user') === 'true';
  return isPro ? PLAN_LIMITS.PRO : PLAN_LIMITS.FREE;
};

export const isFeatureLocked = (featureKey) => {
  const status = getPlanStatus();
  return status.features[featureKey] === false;
};

export const getRemainingGenerations = () => {
  const status = getPlanStatus();
  if (status.maxGenerationsPerMonth === Infinity) return Infinity;
  
  const used = parseInt(localStorage.getItem('kreavia_gen_count') || '0', 10);
  return Math.max(0, status.maxGenerationsPerMonth - used);
};

export const incrementGenerationCount = () => {
  const used = parseInt(localStorage.getItem('kreavia_gen_count') || '0', 10);
  localStorage.setItem('kreavia_gen_count', (used + 1).toString());
};

export const getExportCount = () => {
  return parseInt(localStorage.getItem('kreavia_export_count') || '0', 10);
};

export const incrementExportCount = () => {
  const used = getExportCount();
  localStorage.setItem('kreavia_export_count', (used + 1).toString());
};

export const canExportTemplate = () => {
  const status = getPlanStatus();
  if (status.maxTemplateExports === Infinity) return true;
  return getExportCount() < status.maxTemplateExports;
};

export const getExportLimitInfo = () => {
  const status = getPlanStatus();
  const count = getExportCount();
  return {
    used: count,
    total: status.maxTemplateExports,
    remaining: status.maxTemplateExports === Infinity ? Infinity : Math.max(0, status.maxTemplateExports - count)
  };
};
