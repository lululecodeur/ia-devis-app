import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import Button from '@/components/ui/bouton';

export interface LigneMainOeuvre {
  id: string;
  designation: string;
  mode: 'horaire' | 'fixe';
  prixHoraire: number;
  heures: number;
  prixFixe: number;
}

export default function LigneDraggable({
  ligne,
  modifierLigne,
  supprimerLigne,
  sauvegarderLigne,
}: {
  ligne: LigneMainOeuvre;
  modifierLigne: (id: string, champ: keyof LigneMainOeuvre, valeur: string | number) => void;
  supprimerLigne: (id: string) => void;
  sauvegarderLigne: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ligne.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatNombre = (val: number) =>
    Number.isNaN(val)
      ? ''
      : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(val);

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="px-3 py-2 text-gray-400 w-8">
        <GripVertical className="cursor-move" size={16} {...attributes} {...listeners} />
      </td>

      <td className="px-3 py-2">
        <input
          className="w-full bg-transparent focus:outline-none text-sm break-words whitespace-pre-wrap resize-none"
          value={ligne.designation}
          onChange={e => modifierLigne(ligne.id, 'designation', e.target.value)}
          placeholder="Désignation"
        />
      </td>
      <td className="px-3 py-2">
        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-sm w-full">
          <button
            type="button"
            onClick={() => modifierLigne(ligne.id, 'mode', 'horaire')}
            className={`w-1/2 px-3 py-1 transition-colors ${
              ligne.mode === 'horaire'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            À l'heure
          </button>
          <button
            type="button"
            onClick={() => modifierLigne(ligne.id, 'mode', 'fixe')}
            className={`w-1/2 px-3 py-1 transition-colors ${
              ligne.mode === 'fixe'
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
            ligne.mode === 'fixe' ? 'text-gray-400' : ''
          }`}
          value={formatNombre(ligne.prixHoraire)}
          onChange={e => modifierLigne(ligne.id, 'prixHoraire', e.target.value)}
          disabled={ligne.mode === 'fixe'}
          placeholder="0"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          className={`w-full bg-transparent text-sm ${
            ligne.mode === 'fixe' ? 'text-gray-400' : ''
          }`}
          value={formatNombre(ligne.heures)}
          onChange={e => modifierLigne(ligne.id, 'heures', e.target.value)}
          disabled={ligne.mode === 'fixe'}
          placeholder="0"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          className={`w-full bg-transparent text-sm ${
            ligne.mode === 'horaire' ? 'text-gray-400' : ''
          }`}
          value={formatNombre(ligne.prixFixe)}
          onChange={e => modifierLigne(ligne.id, 'prixFixe', e.target.value)}
          disabled={ligne.mode === 'horaire'}
          placeholder="0"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <Button onClick={() => supprimerLigne(ligne.id)} variant="danger" size="sm">
          Supprimer
        </Button>
        <Button onClick={sauvegarderLigne} variant="primary" size="sm" className="mt-4">
          Sauvegarder cette presta
        </Button>
      </td>
    </tr>
  );
}
