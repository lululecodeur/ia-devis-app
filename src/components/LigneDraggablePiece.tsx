import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import Button from '@/components/ui/bouton';

interface LignePiece {
  id: string;
  designation: string;
  prixAchat: number;
  margePourcent: number;
  quantite: number;
  prixManuel?: number;
  mode: 'calculé' | 'manuel';
}

export default function LigneDraggablePiece({
  ligne,
  modifierLigne,
  supprimerLigne,
  sauvegarderLigne,
}: {
  ligne: LignePiece;
  modifierLigne: (id: string, champ: keyof LignePiece, valeur: string | number) => void;
  supprimerLigne: (id: string) => void;
  sauvegarderLigne: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: ligne.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: '#fff',
  };

  const formatNombre = (valeur: number): string =>
    Number.isNaN(valeur)
      ? ''
      : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(valeur);

  return (
    <tr ref={setNodeRef} style={style} className="bg-white shadow-sm rounded-xl">
      <td className="px-2 text-gray-400 w-6 text-center" {...attributes}>
        <GripVertical className="cursor-grab" size={14} {...listeners} />
      </td>

      <td className="px-3 py-2">
        <input
          type="text"
          className="w-full bg-transparent text-sm"
          value={ligne.designation}
          onChange={e => modifierLigne(ligne.id, 'designation', e.target.value)}
          placeholder="Désignation"
        />
      </td>

      <td className="px-3 py-2">
        <input
          type="text"
          className={`w-full bg-transparent text-sm ${
            ligne.mode === 'manuel' ? 'text-gray-400' : ''
          }`}
          value={formatNombre(ligne.prixAchat)}
          onChange={e => modifierLigne(ligne.id, 'prixAchat', e.target.value)}
          disabled={ligne.mode === 'manuel'}
        />
      </td>

      <td className="px-3 py-2">
        <input
          type="text"
          className={`w-full bg-transparent text-sm ${
            ligne.mode === 'manuel' ? 'text-gray-400' : ''
          }`}
          value={formatNombre(ligne.margePourcent)}
          onChange={e => modifierLigne(ligne.id, 'margePourcent', e.target.value)}
          disabled={ligne.mode === 'manuel'}
        />
      </td>

      <td className="px-3 py-2">
        <input
          type="text"
          className="w-full bg-transparent text-sm"
          value={formatNombre(ligne.quantite)}
          onChange={e => modifierLigne(ligne.id, 'quantite', e.target.value)}
        />
      </td>

      <td className="px-3 py-2">
        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-sm w-full">
          <button
            type="button"
            onClick={() => modifierLigne(ligne.id, 'mode', 'calculé')}
            className={`w-1/2 px-3 py-1 transition-colors ${
              ligne.mode === 'calculé'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Marge
          </button>
          <button
            type="button"
            onClick={() => modifierLigne(ligne.id, 'mode', 'manuel')}
            className={`w-1/2 px-3 py-1 transition-colors ${
              ligne.mode === 'manuel'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Fixe
          </button>
        </div>
      </td>

      <td className="px-3 py-2">
        <input
          type="text"
          className={`w-full bg-transparent text-sm ${
            ligne.mode === 'calculé' ? 'text-gray-400' : ''
          }`}
          value={formatNombre(ligne.prixManuel || 0)}
          onChange={e => modifierLigne(ligne.id, 'prixManuel', e.target.value)}
          disabled={ligne.mode === 'calculé'}
        />
      </td>

      <td className="px-3 py-2 text-center">
        <Button
          onClick={() => {
            console.log('🗑️ Suppression demandée pour', ligne.id);
            supprimerLigne(ligne.id);
          }}
          variant="outline"
          size="sm"
        >
          🗑️
        </Button>
        <Button
          onClick={() => {
            console.log('💾 Sauvegarde demandée pour', ligne);
            sauvegarderLigne();
          }}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          💾
        </Button>
      </td>
    </tr>
  );
}
