/**
 * analyticsService.js
 * Records and retrieves analytics metrics per project.
 */
import { supabase, isMockMode } from '../lib/supabase';

const MOCK_ANALYTICS = [
  { metric_name: 'brand_score',         metric_value: 92,   period_start: null, period_end: null },
  { metric_name: 'engagement_rate',     metric_value: 4.8,  period_start: null, period_end: null },
  { metric_name: 'reach',               metric_value: 124500, period_start: null, period_end: null },
  { metric_name: 'profile_views',       metric_value: 12100, period_start: null, period_end: null },
  { metric_name: 'content_consistency', metric_value: 78,   period_start: null, period_end: null },
  { metric_name: 'posting_frequency',   metric_value: 5.2,  period_start: null, period_end: null },
];

const MOCK_WEEKLY = [
  { name: 'Mon', views: 4000, engagement: 240, shares: 120 },
  { name: 'Tue', views: 3000, engagement: 139, shares: 80 },
  { name: 'Wed', views: 2000, engagement: 980, shares: 450 },
  { name: 'Thu', views: 2780, engagement: 390, shares: 190 },
  { name: 'Fri', views: 1890, engagement: 480, shares: 250 },
  { name: 'Sat', views: 2390, engagement: 380, shares: 170 },
  { name: 'Sun', views: 3490, engagement: 430, shares: 210 },
];

export const getMetrics = async (projectId, metricNames = []) => {
  if (isMockMode) {
    const data = metricNames.length
      ? MOCK_ANALYTICS.filter(a => metricNames.includes(a.metric_name))
      : MOCK_ANALYTICS;
    return { data, error: null };
  }
  let q = supabase.from('analytics').select('*').eq('project_id', projectId).order('recorded_at', { ascending: false });
  if (metricNames.length) q = q.in('metric_name', metricNames);
  return q;
};

export const getWeeklyPerformance = async (projectId) => {
  // In production this would aggregate social platform webhooks or platform API data
  if (isMockMode) return { data: MOCK_WEEKLY, error: null };
  return supabase
    .from('analytics')
    .select('*')
    .eq('project_id', projectId)
    .gte('recorded_at', new Date(Date.now() - 7 * 86400000).toISOString())
    .order('recorded_at', { ascending: true });
};

export const recordMetric = async (projectId, metricName, metricValue, periodStart = null, periodEnd = null) => {
  if (isMockMode) return { data: { project_id: projectId, metric_name: metricName, metric_value: metricValue }, error: null };
  return supabase
    .from('analytics')
    .insert({ project_id: projectId, metric_name: metricName, metric_value: metricValue, period_start: periodStart, period_end: periodEnd })
    .select()
    .single();
};

export const recordExport = async (userId, templateId, exportType, fileUrl = null) => {
  if (isMockMode) return { data: { id: `exp-${Date.now()}`, user_id: userId, template_id: templateId, export_type: exportType }, error: null };
  return supabase
    .from('exports')
    .insert({ user_id: userId, template_id: templateId, export_type: exportType, file_url: fileUrl })
    .select()
    .single();
};
