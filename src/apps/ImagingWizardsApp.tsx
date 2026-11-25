import React, { useMemo, useState } from 'react';
import type { PrinterDevice, SystemState, VfsNode, VfsState } from '../types/os';
import { SYSTEM_IDS } from '../state/vfs';
import { XpIcon } from '../components/xp/XpIcons';

function makeSamplePhotoSvg(title: string, c1: string, c2: string, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
    <rect width="320" height="220" fill="url(#g)"/>
    <circle cx="245" cy="60" r="28" fill="${accent}"/>
    <path d="M0 165 Q95 120 190 155 T320 140 L320 220 L0 220 Z" fill="rgba(0,0,0,0.22)"/>
    <text x="16" y="202" font-family="Tahoma, sans-serif" font-size="14" fill="#ffffff">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SAMPLE_CAMERA_PHOTOS = [
  {
    id: 'cam_sunset',
    name: 'Sunset Beach.png',
    url: makeSamplePhotoSvg('Sunset Beach', '#ff7b54', '#5b3c88', '#ffe066'),
  },
  {
    id: 'cam_forest',
    name: 'Pine Trail.png',
    url: makeSamplePhotoSvg('Pine Trail', '#2c7744', '#a8ff78', '#fff5b8'),
  },
  {
    id: 'cam_scan',
    name: 'Scanned Receipt.png',
    url: makeSamplePhotoSvg('Scanned Document', '#d7e1ec', '#9db5d1', '#316ac5'),
  },
];

interface ScannerCameraWizardProps {
  system: SystemState;
  onImportImage: (parentId: string, name: string, dataUrl: string) => { ok: boolean; error?: string };
  onClose: () => void;
}

export const ScannerCameraWizardApp: React.FC<ScannerCameraWizardProps> = ({
  system,
  onImportImage,
  onClose,
}) => {
  const activeUser =
    system.users.find((u) => u.username === system.activeUsername) ?? system.users[0];
  const picsFolderId = activeUser?.picturesFolderId ?? SYSTEM_IDS.MY_PICTURES;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedId, setSelectedId] = useState(SAMPLE_CAMERA_PHOTOS[0].id);
  const [fileName, setFileName] = useState('Scanned_Photo.png');
  const [errorMsg, setErrorMsg] = useState('');

  const chosen = SAMPLE_CAMERA_PHOTOS.find((p) => p.id === selectedId) ?? SAMPLE_CAMERA_PHOTOS[0];

  const handleFinish = () => {
    const cleanName = fileName.trim() || chosen.name;
    const res = onImportImage(picsFolderId, cleanName, chosen.url);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Import failed.');
      return;
    }
    setStep(3);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <div className="bg-white border-b border-[#aca899] p-3 flex items-center justify-between">
        <div>
          <div className="font-bold text-[12px]">Scanner and Camera Wizard</div>
          <div className="text-[#555]">XP Virtual Imaging Device (WIA USB Camera)</div>
        </div>
        <XpIcon name="scanner" size={32} />
      </div>

      <div className="flex-1 min-h-0 p-4 flex flex-col gap-3 overflow-auto">
        {step === 1 && (
          <>
            <p>Choose a sample picture from the simulated camera or scanner to copy to My Pictures:</p>
            <div className="grid grid-cols-3 gap-3">
              {SAMPLE_CAMERA_PHOTOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(p.id);
                    setFileName(p.name);
                  }}
                  className={`p-1.5 border bg-white flex flex-col items-center gap-1 cursor-default ${
                    selectedId === p.id ? 'border-[#316ac5] ring-2 ring-[#316ac5]' : 'border-[#aca899]'
                  }`}
                >
                  <img src={p.url} alt={p.name} className="w-full h-[76px] object-cover" />
                  <span className="text-[10px] truncate w-full text-center">{p.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p>Type a name for this picture and confirm destination in My Pictures:</p>
            <label className="flex flex-col gap-1">
              <span>File name:</span>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="xp-input h-[22px] bg-white"
              />
            </label>
            <div className="flex items-center gap-3 bg-white border border-[#aca899] p-2">
              <img src={chosen.url} alt={chosen.name} className="w-[100px] h-[68px] object-cover" />
              <div className="text-[#444]">Destination: My Pictures</div>
            </div>
            {errorMsg && <div className="text-[#a31515]">{errorMsg}</div>}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-2">
            <div className="font-bold text-[12px] text-[#215dc6]">Completing the Scanner and Camera Wizard</div>
            <p>
              <strong>{fileName}</strong> has been imported and saved into <strong>My Pictures</strong>.
            </p>
          </div>
        )}
      </div>

      <div className="h-[42px] shrink-0 border-t border-[#aca899] px-3 flex items-center justify-end gap-2">
        {step === 1 && (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="xp-button xp-button-default min-w-[74px]"
          >
            Next &gt;
          </button>
        )}
        {step === 2 && (
          <>
            <button type="button" onClick={() => setStep(1)} className="xp-button min-w-[74px]">
              &lt; Back
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="xp-button xp-button-default min-w-[74px]"
            >
              Finish
            </button>
          </>
        )}
        {step === 3 ? (
          <button type="button" onClick={onClose} className="xp-button xp-button-default min-w-[74px]">
            Close
          </button>
        ) : (
          <button type="button" onClick={onClose} className="xp-button min-w-[74px]">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

interface PhotoPrintingWizardProps {
  vfs: VfsState;
  printers: PrinterDevice[];
  initialNodeIds?: string[];
  onSubmitPrintJob: (printerId: string, documentName: string, appName: string, pages: number) => void;
  onClose: () => void;
}

export const PhotoPrintingWizardApp: React.FC<PhotoPrintingWizardProps> = ({
  vfs,
  printers,
  initialNodeIds,
  onSubmitPrintJob,
  onClose,
}) => {
  const allImages = useMemo(
    () => Object.values(vfs.nodes).filter((n): n is VfsNode => n.kind === 'image' && Boolean(n.parentId)),
    [vfs.nodes]
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialNodeIds?.length ? initialNodeIds : allImages.slice(0, 1).map((i) => i.id)
  );
  const [layout, setLayout] = useState<'full' | '2up' | '4up'>('2up');
  const [printerId, setPrinterId] = useState(
    printers.find((p) => p.isDefault)?.id ?? printers[0]?.id ?? ''
  );
  const [submitted, setSubmitted] = useState(false);

  const selectedImages = allImages.filter((i) => selectedIds.includes(i.id));

  const toggleImage = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    if (selectedImages.length === 0) return;
    const pid = printerId || printers[0]?.id || 'prt_xps';
    onSubmitPrintJob(
      pid,
      selectedImages.map((i) => i.name).join(', '),
      'Photo Printing Wizard',
      layout === 'full' ? selectedImages.length : Math.max(1, Math.ceil(selectedImages.length / (layout === '2up' ? 2 : 4)))
    );
    setSubmitted(true);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <div className="bg-white border-b border-[#aca899] p-3 flex items-center justify-between">
        <div>
          <div className="font-bold text-[12px]">Photo Printing Wizard</div>
          <div className="text-[#555]">Select pictures and choose a print layout.</div>
        </div>
        <XpIcon name="printer" size={32} />
      </div>

      <div className="flex-1 min-h-0 p-3 flex flex-col gap-3 overflow-auto">
        {submitted ? (
          <div className="bg-white border border-[#aca899] p-4 flex flex-col gap-2">
            <div className="font-bold text-[#215dc6]">Photos sent to Print Spooler!</div>
            <p>
              Submitted {selectedImages.length} photo(s) using the <strong>{layout}</strong> layout.
              Check Printers and Faxes to inspect the spooler queue.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            <div className="bg-white border border-[#7f9db9] p-2 overflow-y-auto flex flex-col gap-1.5">
              <div className="font-bold">1. Pictures:</div>
              {allImages.map((img) => (
                <label key={img.id} className="flex items-center gap-2 cursor-default">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(img.id)}
                    onChange={() => toggleImage(img.id)}
                  />
                  <span className="truncate">{img.name}</span>
                </label>
              ))}
              <label className="flex flex-col gap-1 mt-2">
                <span className="font-bold">2. Printer:</span>
                <select
                  aria-label="Printer"
                  value={printerId}
                  onChange={(e) => setPrinterId(e.target.value)}
                  className="xp-input h-[22px] bg-white"
                >
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 mt-1">
                <span className="font-bold">3. Layout:</span>
                <select
                  aria-label="Print layout"
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as 'full' | '2up' | '4up')}
                  className="xp-input h-[22px] bg-white"
                >
                  <option value="full">Full Page Photo (1 per page)</option>
                  <option value="2up">2-up Prints (2 per page)</option>
                  <option value="4up">Contact Sheet / 4-up (4 per page)</option>
                </select>
              </label>
            </div>

            <div className="bg-[#808080] p-3 flex items-center justify-center">
              <div
                className={`w-[160px] h-[200px] bg-white shadow p-2 grid gap-1.5 ${
                  layout === 'full'
                    ? 'grid-cols-1'
                    : layout === '2up'
                    ? 'grid-cols-1 grid-rows-2'
                    : 'grid-cols-2 grid-rows-2'
                }`}
              >
                {selectedImages.slice(0, layout === 'full' ? 1 : layout === '2up' ? 2 : 4).map((img) => (
                  <img
                    key={img.id}
                    src={img.content}
                    alt={img.name}
                    className="w-full h-full object-cover border border-[#ddd]"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-[42px] shrink-0 border-t border-[#aca899] px-3 flex items-center justify-end gap-2">
        {!submitted ? (
          <>
            <button
              type="button"
              disabled={selectedImages.length === 0}
              onClick={handlePrint}
              className="xp-button xp-button-default min-w-[74px]"
            >
              Print
            </button>
            <button type="button" onClick={onClose} className="xp-button min-w-[74px]">
              Cancel
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose} className="xp-button xp-button-default min-w-[74px]">
            Finish
          </button>
        )}
      </div>
    </div>
  );
};
