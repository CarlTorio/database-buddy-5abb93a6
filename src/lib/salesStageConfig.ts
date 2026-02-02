// Phase-based sales stage configuration

export const PHASE_1_STAGES = [
  'Lead',
  'Approached', 
  'Not Interested',
  'Demo Stage', // Triggers move to Phase 2
] as const;

export const PHASE_2_STAGES = [
  'Request Demo',
  'Demo Created',
  'Decision Pending',
  'Approved', // Triggers move to Phase 3
  'Undecided',
  'Rejected',
] as const;

export const PHASE_3_STAGES = [
  'Negotiating',
  'Closed Won',
  'In Development', 
  'Completed',
  'Closed Lost',
] as const;

export type Phase1Stage = typeof PHASE_1_STAGES[number];
export type Phase2Stage = typeof PHASE_2_STAGES[number];
export type Phase3Stage = typeof PHASE_3_STAGES[number];
export type SalesStage = Phase1Stage | Phase2Stage | Phase3Stage;

export type Phase = 'lead' | 'presentation' | 'conversion';

// Get sales stages for a specific phase
export const getSalesStagesForPhase = (phase: Phase): readonly string[] => {
  switch (phase) {
    case 'lead':
      return PHASE_1_STAGES;
    case 'presentation':
      return PHASE_2_STAGES;
    case 'conversion':
      return PHASE_3_STAGES;
    default:
      return PHASE_1_STAGES;
  }
};

// Get the phase number (1, 2, or 3) from the phase string
export const getPhaseNumber = (phase: Phase): number => {
  switch (phase) {
    case 'lead': return 1;
    case 'presentation': return 2;
    case 'conversion': return 3;
    default: return 1;
  }
};

// Get phase name from phase number
export const getPhaseName = (phaseNumber: number): Phase => {
  switch (phaseNumber) {
    case 1: return 'lead';
    case 2: return 'presentation';
    case 3: return 'conversion';
    default: return 'lead';
  }
};

// Check if a sales stage triggers a phase transition
export const getPhaseTransition = (salesStage: string): { targetPhase: number; newStage: string } | null => {
  // Phase 1 → Phase 2 trigger
  if (salesStage === 'Demo Stage') {
    return { targetPhase: 2, newStage: 'Request Demo' };
  }
  // Phase 2 → Phase 3 trigger
  if (salesStage === 'Approved') {
    return { targetPhase: 3, newStage: 'Negotiating' };
  }
  return null;
};

// Check if a stage should be archived (not shown in active phases)
export const isArchivedStage = (salesStage: string): boolean => {
  return ['Not Interested', 'Rejected', 'Closed Lost', 'Completed'].includes(salesStage);
};

// Sales stage color mapping
export const salesStageColors: Record<string, string> = {
  // Phase 1
  Lead: "bg-slate-100 text-slate-700 border-slate-300",
  Approached: "bg-blue-100 text-blue-700 border-blue-300",
  "Not Interested": "bg-gray-100 text-gray-700 border-gray-300",
  "Demo Stage": "bg-purple-100 text-purple-700 border-purple-300",
  // Phase 2
  "Request Demo": "bg-amber-100 text-amber-700 border-amber-300",
  "Demo Created": "bg-indigo-100 text-indigo-700 border-indigo-300",
  "Decision Pending": "bg-orange-100 text-orange-700 border-orange-300",
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Undecided: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Rejected: "bg-red-100 text-red-700 border-red-300",
  // Phase 3
  Negotiating: "bg-cyan-100 text-cyan-700 border-cyan-300",
  "Closed Won": "bg-green-100 text-green-700 border-green-300",
  "In Development": "bg-violet-100 text-violet-700 border-violet-300",
  Completed: "bg-teal-100 text-teal-700 border-teal-300",
  "Closed Lost": "bg-gray-100 text-gray-700 border-gray-300",
};

export const leadSourceColors: Record<string, string> = {
  "Cold Call": "bg-blue-100 text-blue-700 border-blue-300",
  Messenger: "bg-indigo-100 text-indigo-700 border-indigo-300",
  Referral: "bg-green-100 text-green-700 border-green-300",
  Ads: "bg-orange-100 text-orange-700 border-orange-300",
};
