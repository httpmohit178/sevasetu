import { cn } from '../../lib/utils';

export type SceneId =
  | 'rural' | 'urban' | 'voice' | 'plumbing' | 'electrical' | 'cleaning' | 'painting'
  | 'carpentry' | 'cooking' | 'tutoring' | 'driving' | 'beauty' | 'ac' | 'gardening'
  | 'security' | 'craft' | 'home' | 'agri' | 'health' | 'edu' | 'transport' | 'food'
  | 'solar' | 'dairy' | 'soil' | 'tractor' | 'veterinary' | 'pump' | 'biogas' | 'crop'
  | 'rewards' | 'gps' | 'handicraft';

const themes: Record<SceneId, { from: string; to: string; mark: string; title: string }> = {
  rural: { from: '#14532d', to: '#a3e635', mark: '🌾', title: 'Rural Bharat' },
  urban: { from: '#1e3a8a', to: '#fb923c', mark: '🏙️', title: 'Urban Bharat' },
  voice: { from: '#7c2d12', to: '#fdba74', mark: '🎙️', title: 'Voice search' },
  plumbing: { from: '#0e7490', to: '#67e8f9', mark: '🔧', title: 'Plumbing' },
  electrical: { from: '#854d0e', to: '#fde047', mark: '⚡', title: 'Electrical' },
  cleaning: { from: '#0f766e', to: '#99f6e4', mark: '🧹', title: 'Cleaning' },
  painting: { from: '#9d174d', to: '#f9a8d4', mark: '🎨', title: 'Painting' },
  carpentry: { from: '#78350f', to: '#fdba74', mark: '🪚', title: 'Carpentry' },
  cooking: { from: '#9a3412', to: '#fed7aa', mark: '🍲', title: 'Cooking' },
  tutoring: { from: '#1e3a8a', to: '#93c5fd', mark: '📚', title: 'Tutoring' },
  driving: { from: '#334155', to: '#fbbf24', mark: '🚗', title: 'Driving' },
  beauty: { from: '#831843', to: '#fbcfe8', mark: '💇', title: 'Beauty' },
  ac: { from: '#0369a1', to: '#bae6fd', mark: '❄️', title: 'AC repair' },
  gardening: { from: '#166534', to: '#bbf7d0', mark: '🌱', title: 'Gardening' },
  security: { from: '#1e293b', to: '#94a3b8', mark: '🛡️', title: 'Security' },
  craft: { from: '#9a3412', to: '#fcd34d', mark: 'Pottery', title: 'Handicrafts' },
  handicraft: { from: '#9a3412', to: '#fcd34d', mark: '🧵', title: 'Handicrafts' },
  home: { from: '#c2410c', to: '#fed7aa', mark: '🏠', title: 'Home' },
  agri: { from: '#365314', to: '#d9f99d', mark: '🚜', title: 'Agriculture' },
  health: { from: '#115e59', to: '#5eead4', mark: '🏥', title: 'Healthcare' },
  edu: { from: '#1d4ed8', to: '#bfdbfe', mark: '🎓', title: 'Education' },
  transport: { from: '#1f2937', to: '#f59e0b', mark: '🚌', title: 'Transport' },
  food: { from: '#b45309', to: '#fde68a', mark: '🍛', title: 'Food' },
  solar: { from: '#a16207', to: '#fef08a', mark: '☀️', title: 'Solar' },
  dairy: { from: '#1d4ed8', to: '#e0f2fe', mark: '🥛', title: 'Dairy' },
  soil: { from: '#78350f', to: '#d6d3d1', mark: '🧪', title: 'Soil testing' },
  tractor: { from: '#3f6212', to: '#facc15', mark: '🚜', title: 'Tractor' },
  veterinary: { from: '#14532d', to: '#86efac', mark: '🐄', title: 'Veterinary' },
  pump: { from: '#0c4a6e', to: '#7dd3fc', mark: '💧', title: 'Water pump' },
  biogas: { from: '#14532d', to: '#bef264', mark: '🔥', title: 'Biogas' },
  crop: { from: '#3f6212', to: '#fde047', mark: '🌽', title: 'Crop advisory' },
  rewards: { from: '#5b21b6', to: '#f9a8d4', mark: '🎁', title: 'Rewards' },
  gps: { from: '#0f172a', to: '#38bdf8', mark: '📍', title: 'Live GPS' },
};

const serviceScenes: Record<string, SceneId> = {
  plumbing: 'plumbing', electrical: 'electrical', cleaning: 'cleaning', painting: 'painting',
  carpentry: 'carpentry', cooking: 'cooking', tutoring: 'tutoring', driving: 'driving',
  beauty: 'beauty', ac: 'ac', gardening: 'gardening', security: 'security', handicraft: 'handicraft',
  soil: 'soil', tractor: 'tractor', dairy: 'dairy', veterinary: 'veterinary', pump: 'pump',
  solar: 'solar', biogas: 'biogas', crop: 'crop',
};

export function sceneForService(id: string, category = ''): SceneId {
  if (serviceScenes[id]) return serviceScenes[id];
  if (category === 'agri') return 'agri';
  if (category === 'edu') return 'edu';
  if (category === 'food') return 'food';
  if (category === 'transport') return 'transport';
  if (category === 'beauty') return 'beauty';
  if (category === 'health') return 'health';
  return 'home';
}

export function SceneCard({ scene, alt, className }: { scene: SceneId; alt: string; className?: string }) {
  const theme = themes[scene];
  return (
    <div role="img" aria-label={alt} className={cn('scene-card relative overflow-hidden', className)} style={{ background: `linear-gradient(145deg, ${theme.from}, ${theme.to})` }}>
      <span className="scene-orb scene-float" />
      <span className="scene-cloud scene-drift" />
      <span className="scene-cloud scene-drift scene-cloud-late" />
      <span className="scene-ground" />
      <div className="relative z-[1] flex h-full flex-col items-start justify-end p-4 text-white">
        <span className="scene-float mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-3xl shadow-lg backdrop-blur-sm">{theme.mark}</span>
        <p className="text-sm font-bold drop-shadow">{theme.title}</p>
      </div>
    </div>
  );
}
