import React from 'react';
import type { AppearancePrefs, WallpaperId } from '../../types/os';
import { resolvePublicAssetUrl } from '../../utils/assetUrl';

export interface WallpaperOption {
  id: WallpaperId;
  label: string;
  src: string | null;
}

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  { id: 'bliss', label: 'Bliss', src: '/assets/aistudio/-windowsxpaa_800x450_feb210db.jpg' },
  { id: 'none', label: '(None)', src: null },
  { id: 'ascent', label: 'Ascent', src: '/assets/aistudio/Ascent_6b5e3866.jpg' },
  { id: 'atacama_licancabur', label: 'Atacama Licancabur', src: '/assets/aistudio/Atacama_Licancabur_b669731f.png' },
  { id: 'autumn', label: 'Autumn', src: '/assets/aistudio/Autumn_1d9986cf.jpg' },
  { id: 'auyantepui_canaima', label: 'Auyantepui Canaima', src: '/assets/aistudio/Auyantepui_Canaima_5a15b61f.png' },
  { id: 'azul', label: 'Azul', src: '/assets/aistudio/Azul_73eace3d.jpg' },
  { id: 'bengal_tiger', label: 'Bengal Tiger', src: '/assets/aistudio/Bengal_Tiger_000dbe39.png' },
  { id: 'bodrum_castle', label: 'Bodrum Castle St. Peter', src: '/assets/aistudio/Bodrum_CastleStPeter_48606d40.png' },
  { id: 'borobudur', label: 'Borobudur', src: '/assets/aistudio/Borobudur_bc78188b.png' },
  { id: 'calzada_de_los_muertos', label: 'Calzada de los Muertos', src: '/assets/aistudio/Calzada_de_los_Muertos_4ca9fbcf.png' },
  { id: 'cameron', label: 'Cameron', src: '/assets/aistudio/Cameron_d7cc3f02.png' },
  { id: 'canal_de_panama', label: 'Canal de Panama', src: '/assets/aistudio/Canal_de_Panama_bcefed98.png' },
  { id: 'cerros_torre_y_fitz_roy', label: 'Cerros Torre y Fitz Roy', src: '/assets/aistudio/Cerros_Torre_y_Fitz_Roy_1eb5457e.png' },
  { id: 'colonia', label: 'Colonia', src: '/assets/aistudio/Colonia_8dffb1b6.png' },
  { id: 'crystal', label: 'Crystal', src: '/assets/aistudio/Crystal_8a4aa3b1.jpg' },
  { id: 'dunagiri', label: 'Dunagiri', src: '/assets/aistudio/Dunagiri_3f8e8500.png' },
  { id: 'ephesus_hadrian', label: 'Ephesus Hadrian', src: '/assets/aistudio/Ephesus_Hadrian_a52b15bd.png' },
  { id: 'floriano_falls', label: 'Floriano Falls', src: '/assets/aistudio/Floriano_Falls_44e86398.png' },
  { id: 'follow', label: 'Follow', src: '/assets/aistudio/Follow_50e28375.jpg' },
  { id: 'friend', label: 'Friend', src: '/assets/aistudio/Friend_36cdbf79.jpg' },
  { id: 'home', label: 'Home', src: '/assets/aistudio/Home_0b337b96.jpg' },
  { id: 'isla_providencia', label: 'Isla Providencia', src: '/assets/aistudio/Isla_Providencia_029f7fa5.png' },
  { id: 'isla_saona', label: 'Isla Saona', src: '/assets/aistudio/Isla_Saona_7624e25b.png' },
  { id: 'jakarta_windows_xp', label: 'Jakarta (Windows XP)', src: '/assets/aistudio/Jakarta__Windows_XP__bed8f25b.png' },
  { id: 'kuala_lumpur_blue', label: 'Kuala Lumpur Blue', src: '/assets/aistudio/Kuala_Lumpur_Blue_125f7359.png' },
  { id: 'kuala_lumpur_purple', label: 'Kuala Lumpur Purple', src: '/assets/aistudio/Kuala_Lumpur_Purple_f1ac635f.png' },
  { id: 'lake_bratan', label: 'Lake Bratan', src: '/assets/aistudio/Lake_Bratan_4a888ab1.png' },
  { id: 'moon_flower', label: 'Moon flower', src: '/assets/aistudio/Moon_flower_f41d62dc.jpg' },
  { id: 'peace', label: 'Peace', src: '/assets/aistudio/Peace_c52887b2.jpg' },
  { id: 'plus_aquarium', label: 'Plus! Aquarium', src: '/assets/aistudio/Plus__Aquarium_c21fedf1.jpg' },
  { id: 'plus_aquarium_2', label: 'Plus! Aquarium 2', src: '/assets/aistudio/Plus__Aquarium2_d9299b74.jpg' },
  { id: 'plus_davinci', label: 'Plus! daVinci', src: '/assets/aistudio/Plus__daVinci_067bee78.jpg' },
  { id: 'plus_nature', label: 'Plus! Nature', src: '/assets/aistudio/Plus__Nature_490e055c.jpg' },
  { id: 'plus_nature_2', label: 'Plus! Nature 2', src: '/assets/aistudio/Plus__Nature2_d3f8da33.jpg' },
  { id: 'plus_space', label: 'Plus! Space', src: '/assets/aistudio/Plus__Space_fe2f1c20.jpg' },
  { id: 'plus_space_2', label: 'Plus! Space 2', src: '/assets/aistudio/Plus__Space2_838ac0aa.jpg' },
  { id: 'power', label: 'Power', src: '/assets/aistudio/Power_151982ef.jpg' },
  { id: 'purple_flower', label: 'Purple flower', src: '/assets/aistudio/Purple_flower_c2dadf25.jpg' },
  { id: 'radiance', label: 'Radiance', src: '/assets/aistudio/Radiance_e5a9b225.jpg' },
  { id: 'desert', label: 'Red Moon Desert', src: '/assets/aistudio/Red_moon_desert_21ca3741.jpg' },
  { id: 'ripple', label: 'Ripple', src: '/assets/aistudio/Ripple_dbc0aa79.jpg' },
  { id: 'stonehenge', label: 'Stonehenge', src: '/assets/aistudio/Stonehenge_95d26f5c.jpg' },
  { id: 'tulips', label: 'Tulips', src: '/assets/aistudio/Tulips_9a6924e7.jpg' },
  { id: 'vortec_space', label: 'Vortec space', src: '/assets/aistudio/Vortec_space_7b4fd2a5.jpg' },
  { id: 'wind', label: 'Wind', src: '/assets/aistudio/Wind_abf1dae6.jpg' },
  { id: 'windows_energy_bliss', label: 'Windows Energy Bliss', src: '/assets/aistudio/Windows_Energy_Bliss_da3bfe45.webp' },
  { id: 'windows_xp_home_edition', label: 'Windows XP Home Edition', src: '/assets/aistudio/Windows_XP_Home_Edition_c175a965.jpg' },
  { id: 'windows_xp_media_center_edition', label: 'Windows XP Media Center Edition', src: '/assets/aistudio/Windows_XP_Media_Center_Edition_d6ca933f.jpg' },
  { id: 'windows_xp_professional', label: 'Windows XP Professional', src: '/assets/aistudio/Windows_XP_Professional_b8753e74.jpg' },
];

const WALLPAPER_SRC_MAP: Record<WallpaperId, string | null> = Object.fromEntries(
  WALLPAPER_OPTIONS.map((opt) => [opt.id, opt.src])
) as Record<WallpaperId, string | null>;

export const BACKGROUND_COLOR_SWATCHES = [
  '#004e98',
  '#3a6ea5',
  '#1f497d',
  '#008080',
  '#2c5f2d',
  '#5a3e7a',
  '#6e2c23',
  '#1b2631',
];

export function isValidWallpaperId(value: unknown): value is WallpaperId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(WALLPAPER_SRC_MAP, value);
}

export function getWallpaperSrc(id: WallpaperId): string | null {
  const raw = isValidWallpaperId(id) ? WALLPAPER_SRC_MAP[id] : WALLPAPER_SRC_MAP.bliss;
  return raw ? resolvePublicAssetUrl(raw) : null;
}

interface WallpaperLayerProps {
  appearance: AppearancePrefs;
  className?: string;
}

export const WallpaperLayer: React.FC<WallpaperLayerProps> = ({ appearance, className = '' }) => {
  const src = getWallpaperSrc(appearance.wallpaper);
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ backgroundColor: appearance.backgroundColor }}
      data-wallpaper={appearance.wallpaper}
      data-bg-color={appearance.backgroundColor}
    >
      {src && (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center select-none"
          style={{ objectPosition: appearance.wallpaper === 'bliss' ? '50% 64%' : '50% 50%' }}
        />
      )}
    </div>
  );
};
