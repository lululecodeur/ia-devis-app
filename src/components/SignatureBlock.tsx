import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';

export default function SignatureBlock({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const ref = useRef<SignatureCanvas | null>(null);

  const clear = () => {
    ref.current?.clear();
    onChange(null);
  };

  const save = () => {
    if (!ref.current || ref.current.isEmpty()) return;
    const url = ref.current.getCanvas().toDataURL('image/png');
    onChange(url);
  };

  return (
    <div className="flex flex-col gap-3 border border-gray-200 p-6 rounded-xl bg-white shadow-sm w-full">
      <label className="font-medium text-gray-700 text-sm">{label}</label>

      <SignatureCanvas
        ref={(el: SignatureCanvas | null) => {
          ref.current = el;
        }}
        penColor="black"
        canvasProps={{
          width: 300,
          height: 100,
          className: 'signature-canvas',
          style: {
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            backgroundColor: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transform: 'none', // crucial
            touchAction: 'none', // mobile fixes
          },
        }}
      />

      <div className="flex gap-3 mt-2">
        <button
          onClick={save}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-md border border-green-700 shadow-sm transition-colors"
        >
          ✅ Sauvegarder
        </button>
        <button
          onClick={clear}
          className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-4 py-2 rounded-md border border-red-300 shadow-sm transition-colors"
        >
          🗑️ Effacer
        </button>
      </div>

      {value && (
        <img
          src={value}
          alt="Signature"
          className="mt-2 max-h-24 rounded shadow border border-gray-300"
        />
      )}
    </div>
  );
}
