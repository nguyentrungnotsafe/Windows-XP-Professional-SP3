import React from 'react';

export type XpIconName =
  | 'my_documents'
  | 'my_computer'
  | 'my_pictures'
  | 'my_music'
  | 'network'
  | 'network_wizard'
  | 'recycle_bin_empty'
  | 'recycle_bin_full'
  | 'internet_explorer'
  | 'notepad'
  | 'wordpad'
  | 'paint'
  | 'calculator'
  | 'charmap'
  | 'address_book'
  | 'cmd'
  | 'scanner'
  | 'printer'
  | 'compat'
  | 'sync'
  | 'control_panel'
  | 'display'
  | 'run'
  | 'drive'
  | 'cd_drive'
  | 'folder'
  | 'archive_zip'
  | 'text_file'
  | 'image_file'
  | 'windows_flag'
  | 'user_avatar'
  | 'log_off'
  | 'turn_off'
  | 'alert_error'
  | 'alert_warning'
  | 'alert_info'
  | 'alert_question'
  | 'search'
  | 'help'
  | 'windows_update'
  | 'outlook_express'
  | 'messenger'
  | 'msn_butterfly'
  | 'remote_desktop'
  | 'remote_assistance'
  | 'wireless'
  | 'hypertrm'
  | 'phone'
  | 'fax'
  | 'wmp'
  | 'movie_maker'
  | 'sound_recorder'
  | 'volume'
  | 'game_solitaire'
  | 'game_spider'
  | 'game_freecell'
  | 'game_minesweeper'
  | 'game_hearts'
  | 'game_pinball'
  | 'game_internet'
  | 'accessibility'
  | 'magnifier'
  | 'narrator'
  | 'keyboard'
  | 'sysinfo'
  | 'dxdiag'
  | 'cleanmgr'
  | 'defrag'
  | 'restore'
  | 'backup'
  | 'migwiz'
  | 'schtasks'
  | 'taskmgr'
  | 'msconfig'
  | 'regedit'
  | 'appwiz'
  | 'timedate'
  | 'intl'
  | 'users'
  | 'taskbar'
  | 'fonts'
  | 'mouse'
  | 'power'
  | 'security_shield'
  | 'firewall'
  | 'hardware'
  | 'mmc'
  | 'admin_tools'
  | 'eventvwr'
  | 'services'
  | 'game_controller'
  | 'regional'
  | 'sysdm'
  | 'tour'
  | 'iis';

export const XP_PNG_ICONS: Partial<Record<XpIconName, string>> = {
  my_computer: '/assets/aistudio/explorer.exe_14_100-8_460884f4.png',
  sysdm: '/assets/aistudio/explorer.exe_14_100-8_460884f4.png',
  my_documents: '/assets/aistudio/mydocs.dll_14_100-8_233c16b7.png',
  my_pictures: '/assets/aistudio/mydocs.dll_14_101-8_162c0557.png',
  my_music: '/assets/aistudio/shell32.dll_14_237-8_039340c8.png',
  folder: '/assets/aistudio/explorer.exe_14_252-3_354e7a2f.png',
  archive_zip: '/assets/aistudio/zipfldr.dll_14_123-4_98832dec.png',
  recycle_bin_empty: '/assets/aistudio/shell32.dll_14_32-6_3e00551e.png',
  recycle_bin_full: '/assets/aistudio/explorer.exe_14_108-6_2eb860c3.png',
  drive: '/assets/aistudio/shell32.dll_14_8-3_898b5ad5.png',
  cd_drive: '/assets/aistudio/newdev.dll_14_201-6_e2150593.png',
  control_panel: '/assets/aistudio/shell32.dll_14_22-8_3745cac1.png',
  search: '/assets/aistudio/shell32.dll_14_23-8_c2235839.png',
  help: '/assets/aistudio/HelpCtr.exe_14_200-8_17050d75.png',
  run: '/assets/aistudio/shell32.dll_14_25-7_9d974cc9.png',
  log_off: '/assets/aistudio/shell32.dll_14_45-8_e5d551fc.png',
  turn_off: '/assets/aistudio/shell32.dll_14_28-8_a0c58515.png',
  text_file: '/assets/aistudio/cabview.dll_14_105-5_965f4907.png',
  image_file: '/assets/aistudio/shimgvw.dll_14_4-5_a017e695.png',
  internet_explorer: '/assets/aistudio/iexplore.exe_14_32528-6_8db2e3f5.png',
  outlook_express: '/assets/aistudio/msoeres.dll_14_2-6_826f30a7.png',
  address_book: '/assets/aistudio/wab.exe_14_IDI_ICON_ABOOK-5_6ddc0b16.png',
  notepad: '/assets/aistudio/NOTEPAD.EXE_14_2-6_9b28c2fc.png',
  wordpad: '/assets/aistudio/wordpad.exe_14_128-5_3c4b2f8c.png',
  paint: '/assets/aistudio/mspaint.exe_14_2-6_50397135.png',
  calculator: '/assets/aistudio/calc.exe_14_SC-5_90ee24be.png',
  charmap: '/assets/aistudio/charmap.exe_14_111-5_0d32c493.png',
  cmd: '/assets/aistudio/console.dll_14_1-5_5c066dc5.png',
  wmp: '/assets/aistudio/setup_wm.exe_14_70-6_5d604a94.png',
  movie_maker: '/assets/aistudio/moviemk.exe_14_128-6_9efb956c.png',
  volume: '/assets/aistudio/mmsys.cpl_14_3004-5_b49a8c07.png',
  msn_butterfly: '/assets/aistudio/shell32.dll_14_239-6_ea4b3fac.png',
  fax: '/assets/aistudio/shell32.dll_14_196-5_5ea989ae.png',
  phone: '/assets/aistudio/irprops.cpl_14_159-3_cc6eaee1.png',
  scanner: '/assets/aistudio/irprops.cpl_14_168-6_4d2cc861.png',
  printer: '/assets/aistudio/comdlg32.dll_14_540-3_cd4653b0.png',
  sync: '/assets/aistudio/syncapp.exe_14_100-6_9c33ff9c.png',
  wireless: '/assets/aistudio/sprc040D.dll_14_100_1037-8_0ab3dee5.png',
  tour: '/assets/aistudio/tourstrt.exe_14_100-6_a4661ac5.png',
  game_solitaire: '/assets/aistudio/sol.exe_14_500-5_cf3ddaaa.png',
  game_spider: '/assets/aistudio/spider.exe_14_103-3_cbab745e.png',
  game_freecell: '/assets/aistudio/freecell.exe_14_601-5_9a96c66d.png',
  game_hearts: '/assets/aistudio/mshearts.exe_14_31234-4_14cd31b4.png',
  game_minesweeper: '/assets/aistudio/winmine.exe_14_100-5_27b9d867.png',
  game_pinball: '/assets/aistudio/pinball.exe_14_ICON_1-6_0e0b518a.png',
  game_controller: '/assets/aistudio/gcdef.dll_14_108-6_843babb0.png',
  accessibility: '/assets/aistudio/shell32.dll_14_268-6_7b3ef42f.png',
  magnifier: '/assets/aistudio/magnify.exe_14_128-5_72803794.png',
  narrator: '/assets/aistudio/narrator.exe_14_102-5_7e080a1e.png',
  keyboard: '/assets/aistudio/main.cpl_14_200-7_919d3a3c.png',
  mouse: '/assets/aistudio/main.cpl_14_100-6_39ef4e81.png',
  fonts: '/assets/aistudio/fontext.dll_14_1-6_e6313dec.png',
  users: '/assets/aistudio/nusrmgr.cpl_14_200-6_69129bda.png',
  appwiz: '/assets/aistudio/appwiz.cpl_14_1500-6_1b00c26b.png',
  defrag: '/assets/aistudio/dfrgres.dll_14_106-5_a1f8dd0f.png',
  schtasks: '/assets/aistudio/mstask.dll_14_100-6_77f92e7d.png',
  security_shield: '/assets/aistudio/msshamsg.dll_14_200-3_dd838f88.png',
  intl: '/assets/aistudio/explorer.exe_14_253-6_938b5840.png',
  regional: '/assets/aistudio/explorer.exe_14_253-6_938b5840.png',
  display: '/assets/aistudio/irprops.cpl_14_161-6_b5ac78d1.png',
  hardware: '/assets/aistudio/shell32.dll_14_278-5_3ed2f407.png',
  mmc: '/assets/aistudio/shell32.dll_14_278-5_3ed2f407.png',
  admin_tools: '/assets/aistudio/shell32.dll_14_278-5_3ed2f407.png',
  services: '/assets/aistudio/shell32.dll_14_278-5_3ed2f407.png',
  iis: '/assets/aistudio/shell32.dll_14_278-5_3ed2f407.png',
  alert_warning: '/assets/aistudio/comctl32.dll_14_20482-6_c6f8266f.png',
  alert_info: '/assets/aistudio/ahui.exe_14_2006-3_d13376b6.png',
  alert_question: '/assets/aistudio/user32.dll_14_102-5_a785dc6f.png',
};

interface XpIconProps {
  name: XpIconName | string;
  size?: number;
  className?: string;
}

export const XpIcon: React.FC<XpIconProps> = ({ name, size = 32, className = '' }) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  React.useEffect(() => {
    setImgFailed(false);
  }, [name]);

  const pngSrc = XP_PNG_ICONS[name as XpIconName];
  if (pngSrc && !imgFailed) {
    return (
      <img
        src={pngSrc}
        alt=""
        width={size}
        height={size}
        draggable={false}
        aria-hidden="true"
        onError={() => setImgFailed(true)}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
        className={`select-none ${className}`.trim()}
      />
    );
  }

  const style: React.CSSProperties = { width: size, height: size, flexShrink: 0 };

  switch (name) {
    case 'windows_flag':
    case 'tour':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M4 6.5 C8 4.8 12.2 5.2 15.2 6.8 L13.6 15.1 C10.6 13.7 6.8 13.4 2.5 14.8 Z" fill="#ef4928" />
          <path d="M17.2 7.5 C21 9 25 8.8 29 7.2 L27.4 15.5 C23.6 17 19.6 17.2 15.6 15.7 Z" fill="#68bf31" />
          <path d="M2.2 16.8 C6.4 15.4 10.3 15.6 13.3 17 L11.7 25.3 C8.7 23.9 5 23.6 0.8 25 Z" fill="#2c8df2" />
          <path d="M15.2 17.7 C19.2 19.2 23.2 19 27 17.5 L25.4 25.8 C21.6 27.3 17.6 27.5 13.6 26 Z" fill="#f7b922" />
        </svg>
      );

    case 'my_computer':
    case 'sysdm':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="20" y="6" width="9" height="19" rx="1.2" fill="#d9e2ee" stroke="#536b8a" strokeWidth="1.1" />
          <rect x="22" y="8.5" width="5" height="2" fill="#6b84a4" />
          <rect x="22" y="12" width="5" height="1.5" fill="#8fa4be" />
          <circle cx="24.5" cy="19.5" r="1.2" fill="#4dbd4d" />
          <path d="M8 25 L18 25 L20 28.5 L6 28.5 Z" fill="#9fb2c9" stroke="#4f6480" strokeWidth="1" />
          <rect x="10.5" y="22.5" width="5" height="3" fill="#899eb8" />
          <rect x="2.5" y="4" width="21" height="18.5" rx="2" fill="#dce6f4" stroke="#486080" strokeWidth="1.2" />
          <rect x="5" y="6.5" width="16" height="12.5" rx="0.8" fill="#2a86e8" stroke="#2f4d73" strokeWidth="1" />
          <path d="M6 7.5 L15 7.5 L8 16 L6 16 Z" fill="rgba(255,255,255,0.28)" />
        </svg>
      );

    case 'my_documents':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M3 8.5 L3 25 C3 26 3.8 26.8 4.8 26.8 L26 26.8 C27 26.8 27.8 26 27.8 25 L27.8 10.5 C27.8 9.5 27 8.8 26 8.8 L14.5 8.8 L12.5 6.2 L5 6.2 C3.8 6.2 3 7.2 3 8.5 Z" fill="#f5cc58" stroke="#9e6d0b" strokeWidth="1.1" />
          <rect x="11" y="4.5" width="13.5" height="16.5" rx="0.8" fill="#ffffff" stroke="#5b7aa8" strokeWidth="1" transform="rotate(6 17 12)" />
          <line x1="13.5" y1="9" x2="21.5" y2="9.8" stroke="#85a6d4" strokeWidth="1.1" />
          <line x1="13.2" y1="12" x2="21.2" y2="12.8" stroke="#85a6d4" strokeWidth="1.1" />
          <path d="M3 13 L25.5 13 L29 25.5 C29 26.3 28.2 26.8 27.2 26.8 L4.5 26.8 C3.6 26.8 3 26.1 3 25.2 Z" fill="#ffd966" stroke="#9e6d0b" strokeWidth="1.1" />
        </svg>
      );

    case 'folder':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M3 8.5 L3 25 C3 26 3.8 26.8 4.8 26.8 L26.5 26.8 C27.5 26.8 28.3 26 28.3 25 L28.3 10.2 C28.3 9.2 27.5 8.5 26.5 8.5 L14.5 8.5 L12.3 5.8 L4.8 5.8 C3.8 5.8 3 6.8 3 8.5 Z" fill="#f3c548" stroke="#9e6c0a" strokeWidth="1.1" />
          <path d="M3 12.2 L28.3 12.2 L26.8 25.8 C26.6 26.4 26 26.8 25.3 26.8 L4.8 26.8 C3.8 26.8 3 26 3 25 Z" fill="#ffdc6b" stroke="#9e6c0a" strokeWidth="1.1" />
        </svg>
      );

    case 'archive_zip':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M3 8.5 L3 25 C3 26 3.8 26.8 4.8 26.8 L26.5 26.8 C27.5 26.8 28.3 26 28.3 25 L28.3 10.2 C28.3 9.2 27.5 8.5 26.5 8.5 L14.5 8.5 L12.3 5.8 L4.8 5.8 C3.8 5.8 3 6.8 3 8.5 Z" fill="#f3c548" stroke="#9e6c0a" strokeWidth="1.1" />
          <path d="M3 12.2 L28.3 12.2 L26.8 25.8 C26.6 26.4 26 26.8 25.3 26.8 L4.8 26.8 C3.8 26.8 3 26 3 25 Z" fill="#ffe17d" stroke="#9e6c0a" strokeWidth="1.1" />
          <rect x="13" y="12" width="5" height="14.5" fill="#7c5617" />
          <rect x="14" y="13.5" width="3" height="2" fill="#ffffff" />
          <rect x="14" y="17" width="3" height="2" fill="#ffffff" />
          <rect x="14" y="20.5" width="3" height="2" fill="#ffffff" />
        </svg>
      );

    case 'my_pictures':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M3 8.5 L3 25 C3 26 3.8 26.8 4.8 26.8 L26.5 26.8 C27.5 26.8 28.3 26 28.3 25 L28.3 10.2 C28.3 9.2 27.5 8.5 26.5 8.5 L14.5 8.5 L12.3 5.8 L4.8 5.8 C3.8 5.8 3 6.8 3 8.5 Z" fill="#ffd966" stroke="#9e6c0a" strokeWidth="1.1" />
          <rect x="10" y="9" width="16" height="14" rx="1" fill="#ffffff" stroke="#4f74a8" strokeWidth="1.1" />
          <rect x="12" y="11" width="12" height="8.5" fill="#70b9f7" />
          <path d="M12 19.5 L16 14.5 L19 17.5 L21.5 15 L24 19.5 Z" fill="#469e38" />
          <circle cx="15" cy="13.2" r="1.4" fill="#ffe14f" />
        </svg>
      );

    case 'my_music':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M3 8.5 L3 25 C3 26 3.8 26.8 4.8 26.8 L26.5 26.8 C27.5 26.8 28.3 26 28.3 25 L28.3 10.2 C28.3 9.2 27.5 8.5 26.5 8.5 L14.5 8.5 L12.3 5.8 L4.8 5.8 C3.8 5.8 3 6.8 3 8.5 Z" fill="#ffd966" stroke="#9e6c0a" strokeWidth="1.1" />
          <path d="M16 9 L26 7.5 L26 20" fill="none" stroke="#1f5fb8" strokeWidth="2.2" />
          <line x1="16" y1="9" x2="16" y2="22" stroke="#1f5fb8" strokeWidth="2" />
          <ellipse cx="14" cy="22.5" rx="3" ry="2.2" fill="#2c7ce5" />
          <ellipse cx="24" cy="20.5" rx="3" ry="2.2" fill="#2c7ce5" />
        </svg>
      );

    case 'network':
    case 'network_wizard':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="18" cy="11" r="7.5" fill="#3b94f0" stroke="#144d94" strokeWidth="1.1" />
          <path d="M13 8 C17 7 21 9 23 13 M12 13 C16 14 20 12 24 9" stroke="#95dc74" strokeWidth="2" fill="none" />
          <rect x="4" y="16" width="11" height="9" rx="1" fill="#dbe6f4" stroke="#476082" strokeWidth="1.1" />
          <rect x="6" y="18" width="7" height="5" fill="#2a86e8" />
          <line x1="9.5" y1="25" x2="9.5" y2="28" stroke="#476082" strokeWidth="1.6" />
          <line x1="4" y1="28" x2="27" y2="28" stroke="#2c7ce5" strokeWidth="1.8" />
          {name === 'network_wizard' && <polygon points="24,18 26,22 30,22.5 27,25 27.8,29 24,27 20.2,29 21,25 18,22.5 22,22" fill="#ffd94a" stroke="#9e6c0a" strokeWidth="0.8" />}
        </svg>
      );

    case 'wireless':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="5" y="12" width="14" height="12" rx="1.2" fill="#dbe6f4" stroke="#476082" strokeWidth="1.1" />
          <rect x="7" y="14" width="10" height="7" fill="#2a86e8" />
          <path d="M20 9 C24 9 27 12 27 16" fill="none" stroke="#36a636" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 5 C26.5 5 30.5 9.5 30.5 16" fill="none" stroke="#36a636" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'recycle_bin_empty':
    case 'recycle_bin_full': {
      const isFull = name === 'recycle_bin_full';
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          {isFull && (
            <g>
              <polygon points="8,9 12,4 16,7 14,11" fill="#ffffff" stroke="#6387ab" strokeWidth="0.9" />
              <polygon points="15,10 19,3.5 24,6.5 21,11" fill="#fff7cc" stroke="#857845" strokeWidth="0.9" />
              <polygon points="11,11 16,6 20,10" fill="#eef6ff" stroke="#5d82ab" strokeWidth="0.9" />
            </g>
          )}
          <ellipse cx="16" cy="8.5" rx="9.5" ry="2.6" fill="#c7e1f7" stroke="#49749f" strokeWidth="1.1" />
          <path d="M6.8 9 L9.3 26.8 C9.5 28 12.5 28.8 16 28.8 C19.5 28.8 22.5 28 22.7 26.8 L25.2 9 C25.2 10.3 21.1 11.2 16 11.2 C10.9 11.2 6.8 10.3 6.8 9 Z" fill="#d9ebfb" stroke="#49749f" strokeWidth="1.15" />
          <path d="M16 14 L18.5 17.5 L13.5 17.5 Z" fill="#32a83a" />
          <path d="M12 22 L14.5 18.5 L16 22.5 Z" fill="#32a83a" />
          <path d="M20 22 L16.8 22.5 L18 18.5 Z" fill="#32a83a" />
        </svg>
      );
    }

    case 'internet_explorer':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M5 24 C1.5 19.5 6 10 15.5 5.5 C23 2 28.5 4.2 27.5 8.5 C26.8 11.2 22 14.5 14.5 18.5 C8.5 21.8 7 25.5 5 24 Z" fill="none" stroke="#f0ab00" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M24.8 17.5 C25 11.2 21 7 15.8 7 C10.2 7 6.2 11.2 6.2 16.5 C6.2 22 10.2 26 16 26 C20.4 26 23.6 23.8 24.6 20.5 L19.8 20.5 C19 21.8 17.6 22.4 16 22.4 C13.2 22.4 11.4 20.5 11.2 18 L24.8 18 Z M11.4 14.5 C12 12 13.7 10.6 15.9 10.6 C18.2 10.6 19.8 12 20.2 14.5 Z" fill="#2183e8" stroke="#073982" strokeWidth="0.8" />
        </svg>
      );

    case 'notepad':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="6" y="4" width="20" height="24" rx="1.2" fill="#ffffff" stroke="#456ea1" strokeWidth="1.2" />
          <rect x="6" y="4" width="20" height="5" rx="1" fill="#4696e8" stroke="#2d63a8" strokeWidth="1" />
          <line x1="9" y1="13" x2="23" y2="13" stroke="#85a3c7" strokeWidth="1.2" />
          <line x1="9" y1="16.5" x2="23" y2="16.5" stroke="#85a3c7" strokeWidth="1.2" />
          <line x1="9" y1="20" x2="20" y2="20" stroke="#85a3c7" strokeWidth="1.2" />
          <line x1="9" y1="23.5" x2="17" y2="23.5" stroke="#85a3c7" strokeWidth="1.2" />
        </svg>
      );

    case 'wordpad':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="5" y="4" width="20" height="24" rx="1.2" fill="#ffffff" stroke="#456ea1" strokeWidth="1.2" />
          <rect x="7.5" y="7" width="8" height="7" fill="#316ac5" />
          <text x="9" y="13" fontSize="7" fontWeight="bold" fill="#ffffff">A</text>
          <line x1="17" y1="8.5" x2="22.5" y2="8.5" stroke="#6f8db8" strokeWidth="1.2" />
          <line x1="17" y1="12" x2="22.5" y2="12" stroke="#6f8db8" strokeWidth="1.2" />
          <line x1="8" y1="17.5" x2="22" y2="17.5" stroke="#6f8db8" strokeWidth="1.2" />
          <line x1="8" y1="21" x2="20" y2="21" stroke="#6f8db8" strokeWidth="1.2" />
          <path d="M17 27 L27 17 L29 19 L19 29 Z" fill="#eb9b1d" stroke="#7c4e08" strokeWidth="0.9" />
        </svg>
      );

    case 'paint':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M16 4 C9 4 4 9.5 4 16 C4 22.5 9 27 16 27 C19.5 27 21.5 25 21 22.5 C20.6 20.6 22.2 19.5 24 19.5 C26.8 19.5 28.5 17.6 28.5 14.8 C28.5 8.8 23 4 16 4 Z" fill="#f7ebd2" stroke="#8f6c38" strokeWidth="1.2" />
          <circle cx="10.5" cy="11.5" r="2.2" fill="#e53935" />
          <circle cx="16.5" cy="8.8" r="2.2" fill="#fbc02d" />
          <circle cx="22.5" cy="11.5" r="2.2" fill="#43a047" />
          <circle cx="9.8" cy="17.8" r="2.2" fill="#1e88e5" />
          <path d="M22 26 L28.5 15.5" stroke="#5b3a1d" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'calculator':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="6" y="3.5" width="20" height="25" rx="2" fill="#c7d5e8" stroke="#425d82" strokeWidth="1.2" />
          <rect x="8.5" y="6" width="15" height="5" rx="0.6" fill="#d9f0d2" stroke="#5c7d59" strokeWidth="0.9" />
          <rect x="8.5" y="13.5" width="3.8" height="3" fill="#ffffff" stroke="#58749c" strokeWidth="0.7" />
          <rect x="14.1" y="13.5" width="3.8" height="3" fill="#ffffff" stroke="#58749c" strokeWidth="0.7" />
          <rect x="19.7" y="13.5" width="3.8" height="3" fill="#ffd4a8" stroke="#58749c" strokeWidth="0.7" />
          <rect x="8.5" y="18" width="3.8" height="3" fill="#ffffff" stroke="#58749c" strokeWidth="0.7" />
          <rect x="14.1" y="18" width="3.8" height="3" fill="#ffffff" stroke="#58749c" strokeWidth="0.7" />
          <rect x="19.7" y="18" width="3.8" height="3" fill="#ffd4a8" stroke="#58749c" strokeWidth="0.7" />
          <rect x="8.5" y="22.5" width="3.8" height="3" fill="#ffffff" stroke="#58749c" strokeWidth="0.7" />
          <rect x="14.1" y="22.5" width="3.8" height="3" fill="#ffffff" stroke="#58749c" strokeWidth="0.7" />
          <rect x="19.7" y="22.5" width="3.8" height="3" fill="#ff9e80" stroke="#58749c" strokeWidth="0.7" />
        </svg>
      );

    case 'charmap':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" rx="2" fill="#e6ecf5" stroke="#4d688f" strokeWidth="1.2" />
          <rect x="7" y="7" width="8.5" height="8.5" fill="#ffffff" stroke="#7f9db9" strokeWidth="0.9" />
          <rect x="16.5" y="7" width="8.5" height="8.5" fill="#ffffff" stroke="#7f9db9" strokeWidth="0.9" />
          <rect x="7" y="16.5" width="8.5" height="8.5" fill="#ffffff" stroke="#7f9db9" strokeWidth="0.9" />
          <rect x="16.5" y="16.5" width="8.5" height="8.5" fill="#316ac5" stroke="#1f498f" strokeWidth="0.9" />
          <text x="9" y="13.5" fontSize="7" fontWeight="bold" fill="#000">Ω</text>
          <text x="18.2" y="23.2" fontSize="7" fontWeight="bold" fill="#fff">§</text>
        </svg>
      );

    case 'address_book':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="6" y="4" width="18" height="24" rx="1.5" fill="#d98c3f" stroke="#784212" strokeWidth="1.2" />
          <rect x="8.5" y="6" width="13" height="20" fill="#fff8eb" />
          <circle cx="15" cy="12" r="2.8" fill="#4f74a8" />
          <path d="M10.5 20 C10.5 16.8 19.5 16.8 19.5 20 Z" fill="#4f74a8" />
          <rect x="24" y="7" width="3" height="4" fill="#e55235" />
          <rect x="24" y="13" width="3" height="4" fill="#3b7be0" />
          <rect x="24" y="19" width="3" height="4" fill="#52a846" />
        </svg>
      );

    case 'cmd':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="3" y="5" width="26" height="22" rx="1.5" fill="#0c0c0c" stroke="#4b688a" strokeWidth="1.3" />
          <rect x="3" y="5" width="26" height="4.5" fill="#1868e0" />
          <text x="6" y="18.5" fontSize="8" fontFamily="monospace" fontWeight="bold" fill="#e6e6e6">C:\&gt;_</text>
        </svg>
      );

    case 'scanner':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="6" y="9" width="20" height="15" rx="2" fill="#cdd8e6" stroke="#476082" strokeWidth="1.2" />
          <circle cx="16" cy="16.5" r="5" fill="#2c7ce5" stroke="#183d73" strokeWidth="1.2" />
          <circle cx="16" cy="16.5" r="2.2" fill="#8ed3ff" />
          <rect x="20" y="11" width="3.5" height="2" fill="#f5b82e" />
        </svg>
      );

    case 'printer':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="9" y="4" width="14" height="8" fill="#ffffff" stroke="#536b8a" strokeWidth="1" />
          <rect x="4" y="11" width="24" height="11" rx="1.5" fill="#d9e2ee" stroke="#486080" strokeWidth="1.2" />
          <rect x="8" y="18" width="16" height="9" fill="#ffffff" stroke="#536b8a" strokeWidth="1" />
          <line x1="10.5" y1="21" x2="21.5" y2="21" stroke="#7f9db9" strokeWidth="1.1" />
          <line x1="10.5" y1="23.8" x2="18.5" y2="23.8" stroke="#7f9db9" strokeWidth="1.1" />
          <circle cx="24" cy="14" r="1.2" fill="#46b846" />
        </svg>
      );

    case 'compat':
    case 'sync':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="11" fill="#e8f1fc" stroke="#2f6dc5" strokeWidth="1.4" />
          <path d="M10 14 A6.5 6.5 0 0 1 21 11.5" fill="none" stroke="#36a036" strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="22,8.5 23,14 17.8,13" fill="#36a036" />
          <path d="M22 18 A6.5 6.5 0 0 1 11 20.5" fill="none" stroke="#246be0" strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="10,23.5 9,18 14.2,19" fill="#246be0" />
        </svg>
      );

    case 'control_panel':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M3 8.5 L3 25 C3 26 3.8 26.8 4.8 26.8 L26.5 26.8 C27.5 26.8 28.3 26 28.3 25 L28.3 10.2 C28.3 9.2 27.5 8.5 26.5 8.5 L14.5 8.5 L12.3 5.8 L4.8 5.8 C3.8 5.8 3 6.8 3 8.5 Z" fill="#b7d2f2" stroke="#3c679c" strokeWidth="1.1" />
          <rect x="12" y="12" width="14" height="12" rx="1.2" fill="#f7f9fc" stroke="#3c679c" strokeWidth="1" />
          <circle cx="16" cy="16" r="2" fill="#e55235" />
          <rect x="19.5" y="15" width="4.5" height="2" fill="#3b7be0" />
          <rect x="14.5" y="19.5" width="9.5" height="2" fill="#52a846" />
        </svg>
      );

    case 'display':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M10 25 L22 25 L24 28.5 L8 28.5 Z" fill="#9fb2c9" stroke="#4f6480" strokeWidth="1" />
          <rect x="13" y="22" width="6" height="3" fill="#899eb8" />
          <rect x="4" y="4" width="24" height="18" rx="1.8" fill="#dbe5f2" stroke="#486080" strokeWidth="1.2" />
          <rect x="6.5" y="6.5" width="19" height="13" fill="#3b94f0" stroke="#2f4d73" strokeWidth="0.9" />
          <path d="M6.5 19.5 C11 15 18 15 25.5 18 L25.5 19.5 Z" fill="#46ab3d" />
          <circle cx="21" cy="10.5" r="2.2" fill="#fff06b" />
        </svg>
      );

    case 'run':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="6" width="24" height="20" rx="1.5" fill="#ece9d8" stroke="#0054e3" strokeWidth="1.4" />
          <rect x="4" y="6" width="24" height="5" fill="#0d61e5" />
          <rect x="7" y="14" width="12" height="5" fill="#ffffff" stroke="#7f9db9" strokeWidth="1" />
          <polygon points="21,13 26,16.5 21,20" fill="#3a9433" />
        </svg>
      );

    case 'drive':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M4 17 L9 9 L23 9 L28 17 Z" fill="#e2e8f0" stroke="#536b8a" strokeWidth="1.1" />
          <rect x="4" y="17" width="24" height="7.5" rx="1" fill="#bcc8d6" stroke="#486080" strokeWidth="1.1" />
          <rect x="6.5" y="19.5" width="9" height="2.2" fill="#4f6480" />
          <circle cx="23.5" cy="20.8" r="1.4" fill="#48c448" />
        </svg>
      );

    case 'cd_drive':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M4 18 L9 12 L23 12 L28 18 Z" fill="#e2e8f0" stroke="#536b8a" strokeWidth="1.1" />
          <rect x="4" y="18" width="24" height="6.5" rx="1" fill="#bcc8d6" stroke="#486080" strokeWidth="1.1" />
          <circle cx="16" cy="11" r="7.5" fill="#d9e8fc" stroke="#5b7aa8" strokeWidth="1.1" />
          <circle cx="16" cy="11" r="2.2" fill="#ffffff" stroke="#5b7aa8" strokeWidth="1" />
        </svg>
      );

    case 'text_file':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M6 3.5 L20 3.5 L26 9.5 L26 28.5 L6 28.5 Z" fill="#ffffff" stroke="#58749c" strokeWidth="1.2" />
          <path d="M20 3.5 L20 9.5 L26 9.5 Z" fill="#d9e6f5" stroke="#58749c" strokeWidth="1" />
          <line x1="9.5" y1="13" x2="22.5" y2="13" stroke="#6f8db8" strokeWidth="1.2" />
          <line x1="9.5" y1="16.8" x2="22.5" y2="16.8" stroke="#6f8db8" strokeWidth="1.2" />
          <line x1="9.5" y1="20.6" x2="20" y2="20.6" stroke="#6f8db8" strokeWidth="1.2" />
          <line x1="9.5" y1="24.4" x2="17" y2="24.4" stroke="#6f8db8" strokeWidth="1.2" />
        </svg>
      );

    case 'image_file':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M5 4 L21 4 L27 10 L27 28 L5 28 Z" fill="#ffffff" stroke="#4f74a8" strokeWidth="1.2" />
          <path d="M21 4 L21 10 L27 10 Z" fill="#d9e6f5" stroke="#4f74a8" strokeWidth="1" />
          <rect x="8.5" y="12.5" width="15" height="11.5" fill="#6fb8f7" stroke="#4f74a8" strokeWidth="0.9" />
          <path d="M8.5 24 L13 18.5 L16.5 21.5 L19.5 18 L23.5 24 Z" fill="#469e38" />
          <circle cx="12" cy="15.5" r="1.5" fill="#ffe14f" />
        </svg>
      );

    case 'outlook_express':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="8" width="22" height="15" rx="1.5" fill="#ffffff" stroke="#316ac5" strokeWidth="1.3" />
          <path d="M4 9 L15 17 L26 9" fill="none" stroke="#316ac5" strokeWidth="1.4" />
          <path d="M7 22 A11 11 0 0 0 27 12" fill="none" stroke="#f0ab00" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'messenger':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="12" cy="11" r="4" fill="#3a9433" stroke="#1e571a" strokeWidth="1" />
          <path d="M5 24 C5 18 19 18 19 24 Z" fill="#3a9433" stroke="#1e571a" strokeWidth="1" />
          <circle cx="21" cy="13" r="3.5" fill="#2c8df2" stroke="#114b8f" strokeWidth="1" />
          <path d="M15 25 C15 20 27 20 27 25 Z" fill="#2c8df2" stroke="#114b8f" strokeWidth="1" />
        </svg>
      );

    case 'msn_butterfly':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M16 15 C11 6 4 6 5 13 C6 17 11 17 16 16 Z" fill="#ef4928" />
          <path d="M16 15 C21 6 28 6 27 13 C26 17 21 17 16 16 Z" fill="#68bf31" />
          <path d="M16 16 C10 17 6 21 9 25 C12 27 15 22 16 16 Z" fill="#2c8df2" />
          <path d="M16 16 C22 17 26 21 23 25 C20 27 17 22 16 16 Z" fill="#f7b922" />
        </svg>
      );

    case 'remote_desktop':
    case 'remote_assistance':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="5" width="22" height="16" rx="1.5" fill="#dbe5f2" stroke="#486080" strokeWidth="1.2" />
          <rect x="6.5" y="7.5" width="17" height="11" fill={name === 'remote_desktop' ? '#196ae8' : '#2ea34a'} />
          <rect x="11" y="21" width="8" height="3" fill="#899eb8" />
          <path d="M9 26 L21 26" stroke="#486080" strokeWidth="2" strokeLinecap="round" />
          <path d="M11 13 L16 10 L16 12 L21 12 L21 14 L16 14 L16 16 Z" fill="#ffffff" />
        </svg>
      );

    case 'hypertrm':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="6" width="24" height="19" rx="1.5" fill="#1b3c6e" stroke="#4b688a" strokeWidth="1.2" />
          <rect x="6.5" y="9" width="19" height="12" fill="#001f0b" />
          <text x="8.5" y="17.5" fontSize="7" fontFamily="monospace" fill="#46e867">AT&gt;</text>
        </svg>
      );

    case 'phone':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M7 9 C11 5 21 5 25 9 L27 13 L21 15 L19 12 C17 11.5 15 11.5 13 12 L11 15 L5 13 Z" fill="#316ac5" stroke="#163b7a" strokeWidth="1.1" />
          <rect x="9" y="15" width="14" height="11" rx="1.5" fill="#e6ecf5" stroke="#486080" strokeWidth="1.1" />
          <rect x="12" y="18" width="8" height="5" fill="#95b8e8" />
        </svg>
      );

    case 'fax':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="9" y="4" width="14" height="7" fill="#ffffff" stroke="#536b8a" strokeWidth="1" />
          <rect x="4" y="11" width="24" height="13" rx="1.5" fill="#b8cce4" stroke="#486080" strokeWidth="1.2" />
          <rect x="7" y="13" width="4" height="8" rx="1" fill="#2c63b8" />
          <rect x="14" y="14" width="10" height="6" fill="#eef4fb" stroke="#6c84a3" strokeWidth="0.9" />
        </svg>
      );

    case 'wmp':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="12" fill="#1c75e8" stroke="#0c3c82" strokeWidth="1.2" />
          <path d="M8 10 A10 10 0 0 1 25 11" fill="none" stroke="#ff7426" strokeWidth="3" strokeLinecap="round" />
          <path d="M7 21 A10 10 0 0 0 24 22" fill="none" stroke="#68d13b" strokeWidth="3" strokeLinecap="round" />
          <polygon points="13.5,11 22,16 13.5,21" fill="#ffffff" />
        </svg>
      );

    case 'movie_maker':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="7" width="24" height="19" rx="1.5" fill="#224478" stroke="#10254a" strokeWidth="1.2" />
          <rect x="7" y="10" width="18" height="13" fill="#63b3ff" />
          <rect x="5.5" y="8" width="2.5" height="2" fill="#fff" />
          <rect x="11" y="8" width="2.5" height="2" fill="#fff" />
          <rect x="17" y="8" width="2.5" height="2" fill="#fff" />
          <rect x="23" y="8" width="2.5" height="2" fill="#fff" />
          <polygon points="14,13.5 20,16.5 14,19.5" fill="#ffffff" />
        </svg>
      );

    case 'sound_recorder':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="12" y="4" width="8" height="14" rx="4" fill="#d9e2ee" stroke="#486080" strokeWidth="1.2" />
          <path d="M9 14 A7 7 0 0 0 23 14" fill="none" stroke="#316ac5" strokeWidth="2" />
          <line x1="16" y1="21" x2="16" y2="26" stroke="#486080" strokeWidth="2" />
          <line x1="11" y1="26" x2="21" y2="26" stroke="#486080" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'volume':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M5 12 L10 12 L17 6 L17 26 L10 20 L5 20 Z" fill="#9fb2c9" stroke="#3c526e" strokeWidth="1.2" />
          <path d="M20.5 11.5 C22.8 13.5 22.8 18.5 20.5 20.5" fill="none" stroke="#2c7ce5" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M23.5 8.5 C27.2 12 27.2 20 23.5 23.5" fill="none" stroke="#2c7ce5" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'game_solitaire':
    case 'game_spider':
    case 'game_freecell':
    case 'game_hearts':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="6" width="14" height="19" rx="1.5" fill="#ffffff" stroke="#3c526e" strokeWidth="1.1" transform="rotate(-8 11 15)" />
          <rect x="13" y="6" width="14" height="19" rx="1.5" fill="#ffffff" stroke="#3c526e" strokeWidth="1.1" transform="rotate(6 20 15)" />
          <text
            x="16.5"
            y="19"
            fontSize="11"
            fill={name === 'game_hearts' ? '#d42020' : name === 'game_freecell' ? '#196ae8' : '#111111'}
          >
            {name === 'game_hearts' ? '♥' : name === 'game_spider' ? '♣' : '♠'}
          </text>
        </svg>
      );

    case 'game_minesweeper':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="8" fill="#1e1e1e" />
          <line x1="16" y1="4" x2="16" y2="28" stroke="#1e1e1e" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="4" y1="16" x2="28" y2="16" stroke="#1e1e1e" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="7.5" y1="7.5" x2="24.5" y2="24.5" stroke="#1e1e1e" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="24.5" y1="7.5" x2="7.5" y2="24.5" stroke="#1e1e1e" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="13.2" cy="13.2" r="2.2" fill="#ffffff" />
        </svg>
      );

    case 'game_pinball':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="12" fill="#212d54" stroke="#63b3ff" strokeWidth="1.4" />
          <circle cx="12" cy="11" r="3" fill="#ff5e3a" stroke="#ffd94a" strokeWidth="1" />
          <circle cx="20" cy="13" r="3" fill="#ff5e3a" stroke="#ffd94a" strokeWidth="1" />
          <circle cx="16" cy="21" r="2.4" fill="#d9e6f5" />
        </svg>
      );

    case 'game_internet':
    case 'game_controller':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="11" fill="#2a86e8" stroke="#0c3c82" strokeWidth="1.2" />
          <path d="M6 16 L26 16 M16 5 L16 27" stroke="#9ec9ff" strokeWidth="1.2" />
          <circle cx="16" cy="16" r="6" fill="none" stroke="#ffe14f" strokeWidth="2" />
        </svg>
      );

    case 'accessibility':
    case 'narrator':
    case 'magnifier':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" rx="4" fill="#2268d6" stroke="#0e3a82" strokeWidth="1.2" />
          <circle cx="15" cy="9.5" r="2.3" fill="#ffffff" />
          <path d="M13 13 L13 19 L20 19 L22 24" fill="none" stroke="#ffffff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="13.5" cy="21" r="4" fill="none" stroke="#ffffff" strokeWidth="2" />
        </svg>
      );

    case 'keyboard':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="3" y="9" width="26" height="14" rx="1.5" fill="#e6ecf5" stroke="#486080" strokeWidth="1.2" />
          <rect x="6" y="12" width="3" height="2.5" fill="#6f8db8" />
          <rect x="10.5" y="12" width="3" height="2.5" fill="#6f8db8" />
          <rect x="15" y="12" width="3" height="2.5" fill="#6f8db8" />
          <rect x="19.5" y="12" width="3" height="2.5" fill="#6f8db8" />
          <rect x="9" y="17" width="14" height="2.8" fill="#486080" />
        </svg>
      );

    case 'sysinfo':
    case 'dxdiag':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="5" width="24" height="22" rx="2" fill="#e6f0fc" stroke="#2c63b8" strokeWidth="1.2" />
          <circle cx="16" cy="11" r="2" fill="#2c63b8" />
          <rect x="14.3" y="14.5" width="3.4" height="8" rx="1" fill="#2c63b8" />
        </svg>
      );

    case 'cleanmgr':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <ellipse cx="16" cy="18" rx="11" ry="5" fill="#bcc8d6" stroke="#486080" strokeWidth="1.2" />
          <path d="M18 5 L23 17 L13 20 L11 9 Z" fill="#ffd94a" stroke="#9e6c0a" strokeWidth="1.1" />
        </svg>
      );

    case 'defrag':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="6" width="24" height="20" rx="1.5" fill="#ffffff" stroke="#486080" strokeWidth="1.2" />
          <rect x="7" y="10" width="5" height="4" fill="#2c7ce5" />
          <rect x="13.5" y="10" width="5" height="4" fill="#e55235" />
          <rect x="20" y="10" width="5" height="4" fill="#46b846" />
          <rect x="7" y="16" width="8" height="4" fill="#2c7ce5" />
          <rect x="16.5" y="16" width="8.5" height="4" fill="#2c7ce5" />
        </svg>
      );

    case 'restore':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="11" fill="#3a9433" stroke="#1b5916" strokeWidth="1.2" />
          <path d="M16 9 A7 7 0 1 1 9.5 19" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="8,15 13,15 10.5,20" fill="#ffffff" />
        </svg>
      );

    case 'backup':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="5" y="7" width="22" height="18" rx="2" fill="#d9e2ee" stroke="#486080" strokeWidth="1.2" />
          <circle cx="11" cy="16" r="3.5" fill="#486080" />
          <circle cx="21" cy="16" r="3.5" fill="#486080" />
          <rect x="9" y="21" width="14" height="3" fill="#316ac5" />
        </svg>
      );

    case 'migwiz':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="3" y="9" width="11" height="9" fill="#b7d2f2" stroke="#3c679c" strokeWidth="1.1" />
          <rect x="18" y="14" width="11" height="9" fill="#ffd966" stroke="#9e6c0a" strokeWidth="1.1" />
          <path d="M12 12 L20 12 L20 9.5 L24 13 L20 16.5 L20 14 L12 14 Z" fill="#36a036" />
        </svg>
      );

    case 'schtasks':
    case 'timedate':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="11.5" fill="#ffffff" stroke="#316ac5" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="16" y2="9" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="16" x2="21.5" y2="16" stroke="#e55235" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'taskmgr':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="3" y="5" width="26" height="22" rx="1.5" fill="#0d2914" stroke="#486080" strokeWidth="1.2" />
          <polyline points="5,20 10,20 13,12 17,22 21,15 27,15" fill="none" stroke="#48e85b" strokeWidth="2" />
        </svg>
      );

    case 'msconfig':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="4" y="6" width="24" height="20" rx="1.5" fill="#ece9d8" stroke="#316ac5" strokeWidth="1.3" />
          <rect x="7" y="10" width="6" height="6" fill="#ffffff" stroke="#316ac5" strokeWidth="1" />
          <path d="M8 13 L10 15 L12.5 11" fill="none" stroke="#36a036" strokeWidth="1.6" />
          <line x1="15" y1="13" x2="25" y2="13" stroke="#486080" strokeWidth="1.5" />
          <line x1="15" y1="19" x2="25" y2="19" stroke="#486080" strokeWidth="1.5" />
        </svg>
      );

    case 'regedit':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="5" y="13" width="9" height="9" fill="#316ac5" stroke="#ffffff" strokeWidth="0.9" />
          <rect x="13" y="8" width="9" height="9" fill="#4696e8" stroke="#ffffff" strokeWidth="0.9" />
          <rect x="17" y="16" width="9" height="9" fill="#6fb8f7" stroke="#ffffff" strokeWidth="0.9" />
        </svg>
      );

    case 'appwiz':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="5" y="12" width="15" height="14" rx="1" fill="#ffd966" stroke="#9e6c0a" strokeWidth="1.1" />
          <circle cx="22" cy="12" r="6" fill="#d9e8fc" stroke="#316ac5" strokeWidth="1.1" />
          <circle cx="22" cy="12" r="2" fill="#ffffff" stroke="#316ac5" strokeWidth="0.9" />
        </svg>
      );

    case 'intl':
    case 'regional':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="11" fill="#2a86e8" stroke="#144d94" strokeWidth="1.2" />
          <path d="M10 10 C15 8 20 11 22 15 C19 19 14 21 10 18 Z" fill="#68bf31" />
        </svg>
      );

    case 'users':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="12" cy="11" r="4" fill="#e59c4a" stroke="#784212" strokeWidth="1" />
          <path d="M5 25 C5 18.5 19 18.5 19 25 Z" fill="#316ac5" stroke="#163b7a" strokeWidth="1" />
          <circle cx="21" cy="12.5" r="3.5" fill="#f3c584" stroke="#784212" strokeWidth="1" />
          <path d="M15 26 C15 20.5 27 20.5 27 26 Z" fill="#52a846" stroke="#225e1a" strokeWidth="1" />
        </svg>
      );

    case 'taskbar':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="3" y="6" width="26" height="20" rx="1.5" fill="#d9e6f5" stroke="#486080" strokeWidth="1.2" />
          <rect x="3" y="20" width="26" height="6" fill="#245edc" />
          <rect x="4" y="20" width="7" height="6" fill="#3a9433" />
        </svg>
      );

    case 'fonts':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="5" y="4" width="22" height="24" rx="1" fill="#ffffff" stroke="#58749c" strokeWidth="1.2" />
          <text x="9" y="21" fontSize="14" fontWeight="bold" fontFamily="serif" fill="#163b7a">A</text>
          <text x="17.5" y="21" fontSize="11" fontWeight="bold" fill="#316ac5">a</text>
        </svg>
      );

    case 'mouse':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="9" y="6" width="14" height="20" rx="7" fill="#e2e8f0" stroke="#486080" strokeWidth="1.2" />
          <line x1="16" y1="6" x2="16" y2="14" stroke="#486080" strokeWidth="1.1" />
          <line x1="9" y1="14" x2="23" y2="14" stroke="#486080" strokeWidth="1.1" />
        </svg>
      );

    case 'power':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="9" y="6" width="14" height="20" rx="2" fill="#e6ecf5" stroke="#486080" strokeWidth="1.2" />
          <rect x="13" y="4" width="6" height="2.5" fill="#486080" />
          <polygon points="17,9 12,17 16,17 15,23 20,15 16,15" fill="#eb9b1d" />
        </svg>
      );

    case 'security_shield':
    case 'firewall':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M16 4 L26 8 L26 16 C26 22.5 21.5 26.5 16 28.5 C10.5 26.5 6 22.5 6 16 L6 8 Z" fill={name === 'firewall' ? '#e55235' : '#3a9433'} stroke="#222222" strokeWidth="1.1" />
          <path d="M11 16 L14.5 19.5 L21.5 12.5" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'hardware':
    case 'mmc':
    case 'admin_tools':
    case 'services':
    case 'iis':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="13" cy="14" r="6" fill="#bcc8d6" stroke="#486080" strokeWidth="1.5" />
          <circle cx="13" cy="14" r="2.2" fill="#ffffff" stroke="#486080" strokeWidth="1" />
          <circle cx="21.5" cy="20.5" r="4.5" fill="#9fb2c9" stroke="#3c526e" strokeWidth="1.3" />
          <circle cx="21.5" cy="20.5" r="1.5" fill="#ffffff" />
        </svg>
      );

    case 'eventvwr':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <rect x="5" y="4" width="22" height="24" rx="1.2" fill="#ffffff" stroke="#486080" strokeWidth="1.2" />
          <circle cx="9.5" cy="10" r="1.5" fill="#2c7ce5" />
          <line x1="13" y1="10" x2="23" y2="10" stroke="#58749c" strokeWidth="1.4" />
          <circle cx="9.5" cy="16" r="1.5" fill="#f0ab00" />
          <line x1="13" y1="16" x2="23" y2="16" stroke="#58749c" strokeWidth="1.4" />
          <circle cx="9.5" cy="22" r="1.5" fill="#df3022" />
          <line x1="13" y1="22" x2="23" y2="22" stroke="#58749c" strokeWidth="1.4" />
        </svg>
      );

    case 'windows_update':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="12" fill="#2a86e8" stroke="#144d94" strokeWidth="1.2" />
          <path d="M16 22 L16 10 M11.5 14.5 L16 10 L20.5 14.5" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'user_avatar':
      return (
        <svg viewBox="0 0 48 48" style={style} className={className} aria-hidden="true">
          <rect x="0" y="0" width="48" height="48" rx="4" fill="#6b2511" />
          <ellipse cx="24" cy="40" rx="14" ry="3.5" fill="rgba(0,0,0,0.45)" />
          <path d="M18 39 L20 26 C18 24 18 20 20 18 C18.5 15 20.5 11 24 11 C27.5 11 29.5 15 28 18 C30 20 30 24 28 26 L30 39 Z" fill="#edb54c" stroke="#613706" strokeWidth="1" />
          <circle cx="24" cy="9" r="2.2" fill="#ffe484" />
          <path d="M11 39 L12.5 30 C11 28 11.5 25 14 25 C16.5 25 17 28 15.5 30 L17 39 Z" fill="#d9a148" stroke="#4a2804" strokeWidth="0.9" />
          <path d="M31 39 L32.5 29 C31 27 31.5 24 34 24 C36.5 24 37 27 35.5 29 L37 39 Z" fill="#b87e2d" stroke="#4a2804" strokeWidth="0.9" />
        </svg>
      );

    case 'log_off':
      return (
        <svg viewBox="0 0 24 24" style={style} className={className} aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="3" fill="#f3b21c" stroke="#fff6d4" strokeWidth="1.2" />
          <circle cx="9.5" cy="12" r="3" fill="none" stroke="#ffffff" strokeWidth="2" />
          <path d="M12.5 12 L19 12 L19 15 M16.5 12 L16.5 14.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'turn_off':
      return (
        <svg viewBox="0 0 24 24" style={style} className={className} aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="3" fill="#df4b2b" stroke="#ffd8ce" strokeWidth="1.2" />
          <path d="M8.2 8.2 A5.5 5.5 0 1 0 15.8 8.2" fill="none" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round" />
          <line x1="12" y1="6.2" x2="12" y2="12" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      );

    case 'alert_error':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="13" fill="#df3022" stroke="#8f120a" strokeWidth="1.5" />
          <path d="M10.5 10.5 L21.5 21.5 M21.5 10.5 L10.5 21.5" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      );

    case 'alert_warning':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <path d="M16 3 L29.5 27 L2.5 27 Z" fill="#ffd32a" stroke="#996d00" strokeWidth="1.6" strokeLinejoin="round" />
          <line x1="16" y1="11" x2="16" y2="19.5" stroke="#000000" strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="16" cy="23.5" r="1.6" fill="#000000" />
        </svg>
      );

    case 'alert_info':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="13" fill="#2c7ce5" stroke="#144891" strokeWidth="1.5" />
          <circle cx="16" cy="10" r="1.8" fill="#ffffff" />
          <rect x="14.5" y="13.5" width="3" height="10" rx="1" fill="#ffffff" />
        </svg>
      );

    case 'alert_question':
      return (
        <svg viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="13" fill="#2f80ed" stroke="#154a94" strokeWidth="1.5" />
          <path d="M12.5 12.2 C12.5 9.8 14.3 8.5 16.3 8.5 C18.6 8.5 20.1 10 20.1 11.9 C20.1 13.7 18.6 14.6 17.2 15.6 C16.3 16.3 16 17 16 18.5" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="16" cy="22.8" r="1.6" fill="#ffffff" />
        </svg>
      );

    case 'search':
      return (
        <svg viewBox="0 0 24 24" style={style} className={className} aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6" fill="#d9f0ff" stroke="#316ac5" strokeWidth="1.8" />
          <line x1="15" y1="15" x2="20.5" y2="20.5" stroke="#9e5a16" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      );

    case 'help':
    default:
      return (
        <svg viewBox="0 0 24 24" style={style} className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" fill="#2f80ed" stroke="#154a94" strokeWidth="1.2" />
          <path d="M9.5 9.2 C9.5 7.6 10.7 6.8 12.1 6.8 C13.7 6.8 14.8 7.8 14.8 9.1 C14.8 10.3 13.8 11 12.8 11.7 C12.2 12.2 12 12.7 12 13.8" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16.8" r="1.2" fill="#ffffff" />
        </svg>
      );
  }
};
