export type AppId =
  // Shell & Core
  | 'explorer'
  | 'recyclebin'
  | 'search'
  | 'control'
  | 'display'
  | 'run'
  | 'help'
  | 'tour'
  | 'wupdmgr'
  // Accessories & Documents
  | 'notepad'
  | 'wordpad'
  | 'paint'
  | 'imageviewer'
  | 'calculator'
  | 'charmap'
  | 'wab'
  | 'cmd'
  | 'wiaacmgr'
  | 'photoprint'
  | 'compatwizard'
  | 'mobsync'
  | 'cdburn'
  // Internet & Communications
  | 'iexplore'
  | 'outlook'
  | 'messenger'
  | 'mstsc'
  | 'msra'
  | 'ncpa'
  | 'newconn'
  | 'netsetup'
  | 'wirelesssetup'
  | 'hypertrm'
  | 'dialer'
  | 'fax'
  | 'msnexplorer'
  // Multimedia
  | 'wmplayer'
  | 'moviemaker'
  | 'sndrec32'
  | 'sndvol32'
  // Games
  | 'solitaire'
  | 'spider'
  | 'freecell'
  | 'minesweeper'
  | 'hearts'
  | 'pinball'
  | 'zone_backgammon'
  | 'zone_checkers'
  | 'zone_hearts'
  | 'zone_reversi'
  | 'zone_spades'
  // Accessibility
  | 'accwiz'
  | 'access_opts'
  | 'magnify'
  | 'narrator'
  | 'osk'
  | 'utilman'
  // System Tools
  | 'msinfo32'
  | 'dxdiag'
  | 'cleanmgr'
  | 'dfrg'
  | 'chkdsk'
  | 'rstrui'
  | 'ntbackup'
  | 'migwiz'
  | 'schtasks'
  | 'taskmgr'
  | 'msconfig'
  | 'regedit'
  | 'eudcedit'
  | 'iexpress'
  // Control Panel Applets
  | 'appwiz'
  | 'wincomp'
  | 'sysdm'
  | 'timedate'
  | 'intl'
  | 'nusrmgr'
  | 'taskbar_opts'
  | 'folder_opts'
  | 'fonts'
  | 'mouse_opts'
  | 'keyboard_opts'
  | 'game_opts'
  | 'sounds_opts'
  | 'speech_opts'
  | 'power_opts'
  | 'inet_opts'
  | 'printers'
  | 'scanners'
  | 'telephon'
  | 'security_center'
  | 'firewall'
  | 'auto_updates'
  | 'add_hardware'
  | 'admin_tools'
  // MMC Administrative Consoles
  | 'compmgmt'
  | 'eventvwr'
  | 'services'
  | 'devmgmt'
  | 'diskmgmt'
  | 'fsmgmt'
  | 'lusrmgr'
  | 'perfmon'
  | 'dcomcnfg'
  | 'odbcad32'
  | 'secpol'
  | 'gpedit'
  | 'iis_mgr'
  | 'indexing_mgr';

export type NodeKind =
  | 'folder'
  | 'text'
  | 'rtf'
  | 'image'
  | 'audio'
  | 'archive'
  | 'project'
  | 'drive'
  | 'system';

export interface VfsNode {
  id: string;
  name: string;
  kind: NodeKind;
  parentId: string | null;
  content?: string; // text, HTML/RTF json, data URL, audio spec json, archive base64, or movie project json
  mimeType?: string;
  sizeBytes?: number;
  hidden?: boolean;
  createdAt: number;
  updatedAt: number;
  readOnly?: boolean;
  systemKey?:
    | 'my_computer'
    | 'c_drive'
    | 'd_drive'
    | 'my_documents'
    | 'my_pictures'
    | 'my_music'
    | 'my_network_places'
    | 'recycle_bin';
}

export interface TrashItem {
  id: string;
  node: VfsNode;
  descendants: VfsNode[];
  originalParentId: string;
  originalPathLabel: string;
  deletedAt: number;
}

export interface VfsState {
  nodes: Record<string, VfsNode>;
  trash: TrashItem[];
  initialized: boolean;
}

export type WallpaperId =
  | 'bliss'
  | 'none'
  | 'ascent'
  | 'atacama_licancabur'
  | 'autumn'
  | 'auyantepui_canaima'
  | 'azul'
  | 'bengal_tiger'
  | 'bodrum_castle'
  | 'borobudur'
  | 'calzada_de_los_muertos'
  | 'cameron'
  | 'canal_de_panama'
  | 'cerros_torre_y_fitz_roy'
  | 'colonia'
  | 'crystal'
  | 'dunagiri'
  | 'ephesus_hadrian'
  | 'floriano_falls'
  | 'follow'
  | 'friend'
  | 'home'
  | 'isla_providencia'
  | 'isla_saona'
  | 'jakarta_windows_xp'
  | 'kuala_lumpur_blue'
  | 'kuala_lumpur_purple'
  | 'lake_bratan'
  | 'moon_flower'
  | 'peace'
  | 'plus_aquarium'
  | 'plus_aquarium_2'
  | 'plus_davinci'
  | 'plus_nature'
  | 'plus_nature_2'
  | 'plus_space'
  | 'plus_space_2'
  | 'power'
  | 'purple_flower'
  | 'radiance'
  | 'desert'
  | 'ripple'
  | 'stonehenge'
  | 'tulips'
  | 'vortec_space'
  | 'wind'
  | 'windows_energy_bliss'
  | 'windows_xp_home_edition'
  | 'windows_xp_media_center_edition'
  | 'windows_xp_professional';

export interface AppearancePrefs {
  wallpaper: WallpaperId;
  backgroundColor: string;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  bounds: WindowBounds;
  restoreBounds?: WindowBounds;
  minimized: boolean;
  maximized: boolean;
  resizable: boolean;
  canMaximize: boolean;
  canMinimize: boolean;
  minWidth: number;
  minHeight: number;
  zIndex: number;
  modalParentId?: string;
  payload?: {
    folderId?: string;
    fileId?: string;
    initialUrl?: string;
    initialQuery?: string;
    initialNodeIds?: string[];
    highlightNodeId?: string;
    initialTab?: string;
    dirty?: boolean;
  };
}

export type DesktopIconId =
  | 'my_documents'
  | 'my_computer'
  | 'my_network_places'
  | 'recycle_bin'
  | 'internet_explorer';

export interface ContextMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  bold?: boolean;
  checked?: boolean;
  separatorBefore?: boolean;
  onSelect?: () => void;
}

export type SessionPhase = 'desktop' | 'logged_off' | 'shut_down' | 'remote_desktop';

export interface ModalPromptRequest {
  id: string;
  parentWindowId?: string;
  kind: 'alert' | 'confirm' | 'save_discard_cancel' | 'rename' | 'restore_conflict';
  icon: 'info' | 'warning' | 'error' | 'question';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  secondaryLabel?: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onSecondary?: () => void;
  onCancel?: () => void;
}

// --- Shared XP System State Types ---

export interface UserAccount {
  username: string;
  role: 'Administrator' | 'Limited';
  passwordHint?: string;
  appearance: AppearancePrefs;
  docsFolderId: string;
  picturesFolderId: string;
  musicFolderId: string;
}

export interface FolderOptionsState {
  showExtensions: boolean;
  showHidden: boolean;
  singleClickToOpen: boolean;
  doubleClickSpeedMs: number;
  classicControlPanel: boolean;
}

export interface RegionalOptionsState {
  clock24h: boolean;
  showSeconds: boolean;
  dateFormat: 'M/d/yyyy' | 'yyyy-MM-dd' | 'dd/MM/yyyy';
  timezone: string;
  localeLabel: string;
}

export interface AccessibilityState {
  highContrast: boolean;
  stickyKeys: boolean;
  filterKeys: boolean;
  toggleKeys: boolean;
  soundSentry: boolean;
  magnifierZoom: number;
  magnifierInvert: boolean;
  narratorActive: boolean;
  narratorLastText: string;
}

export interface AudioState {
  masterVolume: number; // 0..100
  waveVolume: number; // 0..100
  synthVolume: number; // 0..100
  muted: boolean;
  balance: number; // -1..1
}

export interface ServiceItem {
  id: string;
  name: string;
  displayName: string;
  description: string;
  status: 'Running' | 'Stopped';
  startupType: 'Automatic' | 'Manual' | 'Disabled';
  optionalComponentId?: string;
}

export interface PrinterDevice {
  id: string;
  name: string;
  port: string;
  driver: string;
  isDefault: boolean;
  paused: boolean;
}

export interface PrintJob {
  id: string;
  printerId: string;
  documentName: string;
  appName: string;
  owner: string;
  pages: number;
  status: 'Printing' | 'Paused' | 'Queued' | 'Completed';
  submittedAt: number;
}

export interface EventLogEntry {
  id: string;
  logType: 'System' | 'Application' | 'Security';
  level: 'Information' | 'Warning' | 'Error';
  source: string;
  eventId: number;
  message: string;
  timestamp: number;
}

export interface GroupPolicyState {
  hideRunFromStart: boolean;
  disableCmd: boolean;
  disableRegedit: boolean;
  hideDisplayPanel: boolean;
  forceClassicStartNotice: boolean;
}

export interface TaskbarPrefs {
  lockTaskbar: boolean;
  groupSimilar: boolean;
  showClock: boolean;
  showQuickLaunch: boolean;
}

export interface NetworkConnectionProfile {
  id: string;
  name: string;
  kind: 'LAN' | 'Wireless' | 'Dial-up' | 'VPN';
  deviceName: string;
  status: 'Connected' | 'Disconnected';
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsServer: string;
  ssid?: string;
  packetsSent: number;
  packetsReceived: number;
}

export interface ScheduledTaskItem {
  id: string;
  name: string;
  appId: AppId;
  scheduleText: string;
  enabled: boolean;
  lastRunAt: number | null;
}

export interface StartupEntry {
  id: string;
  name: string;
  command: string;
  appId: AppId;
  enabled: boolean;
}

export interface WindowsUpdateItem {
  id: string;
  kb: string;
  title: string;
  category: 'High Priority' | 'Optional Software' | 'Hardware';
  sizeLabel: string;
  description: string;
  installed: boolean;
  installedAt?: number;
}

export interface RestorePoint {
  id: string;
  name: string;
  createdAt: number;
  snapshot: {
    folderOptions: FolderOptionsState;
    regionalOptions: RegionalOptionsState;
    accessibility: AccessibilityState;
    fileAssociations: Record<string, AppId>;
    optionalComponents: Record<string, boolean>;
    groupPolicy: GroupPolicyState;
    taskbarPrefs: TaskbarPrefs;
    appearance: AppearancePrefs;
  };
}

export interface ContactItem {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  company: string;
  group: 'All Contacts' | 'Family' | 'Friends' | 'Work';
  notes: string;
}

export interface MailAttachment {
  vfsNodeId: string;
  name: string;
  kind: NodeKind;
}

export type MailFolderId = 'inbox' | 'outbox' | 'sent' | 'deleted' | 'drafts';

export interface MailMessage {
  id: string;
  ownerIdentity: string; // 'admin@xp-workstation.local' | 'alex@xp-workstation.local'
  folder: MailFolderId;
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments: MailAttachment[];
  read: boolean;
  timestamp: number;
}

export interface MessengerMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface MessengerContact {
  email: string;
  displayName: string;
  status: 'Online' | 'Busy' | 'Away' | 'Offline';
  personalMessage: string;
}

export interface FaxJob {
  id: string;
  recipientName: string;
  recipientNumber: string;
  subject: string;
  body: string;
  status: 'Sent' | 'Queued';
  pages: number;
  timestamp: number;
}

export interface CompatibilityProfile {
  mode: 'None' | 'Windows 95' | 'Windows 98 / Me' | 'Windows NT 4.0 (SP5)' | 'Windows 2000';
  colors256: boolean;
  res640x480: boolean;
  disableThemes: boolean;
}

export interface RegistryValue {
  name: string;
  type: 'REG_SZ' | 'REG_DWORD';
  data: string;
}

export interface RegistryKeyNode {
  path: string;
  values: RegistryValue[];
}

export interface SystemState {
  computerName: string;
  registeredOwner: string;
  users: UserAccount[];
  activeUsername: string;
  folderOptions: FolderOptionsState;
  regionalOptions: RegionalOptionsState;
  accessibility: AccessibilityState;
  audio: AudioState;
  taskbarPrefs: TaskbarPrefs;
  fileAssociations: Record<string, AppId>;
  optionalComponents: Record<string, boolean>;
  services: ServiceItem[];
  printers: PrinterDevice[];
  printJobs: PrintJob[];
  eventLog: EventLogEntry[];
  groupPolicy: GroupPolicyState;
  firewallEnabled: boolean;
  automaticUpdatesMode: 'Automatic' | 'Notify' | 'Off';
  networkConnections: NetworkConnectionProfile[];
  scheduledTasks: ScheduledTaskItem[];
  startupEntries: StartupEntry[];
  windowsUpdates: WindowsUpdateItem[];
  restorePoints: RestorePoint[];
  contacts: ContactItem[];
  mailMessages: MailMessage[];
  activeMailIdentity: string;
  messengerSignedIn: boolean;
  messengerStatus: 'Online' | 'Busy' | 'Away' | 'Appear Offline';
  messengerContacts: MessengerContact[];
  messengerHistory: Record<string, MessengerMessage[]>;
  faxJobs: FaxJob[];
  compatibilityProfiles: Record<string, CompatibilityProfile>;
  cdStagingNodeIds: string[];
  burnedCdVolumeName: string | null;
  burnedCdFiles: Array<{ name: string; kind: NodeKind; content?: string }>;
  offlineSyncItems: Array<{ id: string; label: string; location: string; enabled: boolean; lastSyncedAt: number | null }>;
  registry: Record<string, RegistryValue[]>;
  mouseSpeed: number; // 1..10
  keyboardRepeatDelay: number; // 1..4
  powerScheme: 'Home/Office Desk' | 'Portable/Laptop' | 'Always On';
  ieHomePage: string;
  ieHistory: Array<{ url: string; title: string; visitedAt: number }>;
  ieFavorites: Array<{ url: string; title: string }>;
  gameStats: {
    minesweeperBest: { beginner: number | null; intermediate: number | null; expert: number | null };
    solitaireWins: number;
    spiderWins: number;
    freecellWins: number;
    heartsWins: number;
    pinballHighScore: number;
  };
  hardwareDevices: Array<{
    id: string;
    category: string;
    name: string;
    manufacturer: string;
    driverVersion: string;
    enabled: boolean;
  }>;
  customChars: Record<string, string>; // hex codepoint e.g. 'E000' -> 16x16 bitstring
  lastDiskDefragAt: number | null;
  lastBackupAt: number | null;
  diskUsedOffsetMb: number;
}
