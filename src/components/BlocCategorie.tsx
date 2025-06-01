'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/bouton';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import Aide from '@/components/Aide';

type LigneCustom = { [cle: string]: any };

interface ColonneCategorie {
  nom: string;
  type: 'texte' | 'quantite' | 'prix' | 'prixAvecMarge';
}

interface CategorieDynamique {
  nom: string;
  colonnes: ColonneCategorie[];
  lignes: LigneCustom[];
  afficher: boolean;
  emoji?: string;
}

function LigneSortable({
  ligne,
  index,
  colonnes,
  onUpdate,
  onDelete,
}: {
  ligne: LigneCustom;
  index: number;
  colonnes: ColonneCategorie[];
  onUpdate: (idx: number, cle: string, val: any, marge?: boolean) => void;
  onDelete: () => void;
}) {
  const id = ligne._id || index.toString();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: 1,
    backgroundColor: '#fff',
  };

  const cleanNumericInput = (val: string): number => {
    const clean = val.replace(/^0+(\d)/, '$1');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  };

  const afficherNettoye = (val: any): string =>
    val !== undefined ? String(cleanNumericInput(String(val))) : '';

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="px-2 text-gray-400 w-6 text-center" {...attributes}>
        <GripVertical className="cursor-grab" size={14} {...listeners} />
      </td>

      {colonnes.map((col, colIndex) => {
        const cle = col.nom;
        if (col.type === 'prixAvecMarge') {
          return (
            <td key={colIndex} className="px-3 py-2">
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <div className="flex flex-col w-1/2">
                    <label className="text-[10px] text-gray-500 mb-1">€ achat</label>
                    <input
                      type="number"
                      onWheel={e => e.currentTarget.blur()}
                      value={afficherNettoye(ligne[cle + '_achat'])}
                      onChange={e => onUpdate(index, cle + '_achat', e.target.value)}
                      className="w-full bg-transparent text-sm border border-gray-200 rounded px-2"
                    />
                  </div>
                  <div className="flex flex-col w-1/2">
                    <label className="text-[10px] text-gray-500 mb-1">% marge</label>
                    <input
                      type="number"
                      onWheel={e => e.currentTarget.blur()}
                      value={afficherNettoye(ligne[cle + '_marge'])}
                      onChange={e => onUpdate(index, cle + '_marge', e.target.value)}
                      className="w-full bg-transparent text-sm border border-gray-200 rounded px-2"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 italic text-center">
                  Prix = achat × (1 + marge / 100)
                </p>
              </div>
            </td>
          );
        }

        return (
          <td key={colIndex} className="px-3 py-2">
            <input
              type={col.type === 'texte' ? 'text' : 'number'}
              onWheel={e => e.currentTarget.blur()}
              value={col.type === 'texte' ? ligne[cle] ?? '' : afficherNettoye(ligne[cle])}
              onChange={e => onUpdate(index, cle, e.target.value)}
              className="w-full min-w-[80px] text-[16px] bg-transparent border border-gray-200 rounded px-2"
            />
          </td>
        );
      })}
      <td className="px-3 py-2 text-center">
        <Button onClick={onDelete} variant="outline" size="xs">
          🗑️
        </Button>
      </td>
    </tr>
  );
}

export default function BlocCategorie({
  categorie,
  onUpdate,
  onDelete,
  onSaveCategorie,
  onDemanderEdition, // ✅ nouvelle prop
}: {
  categorie: CategorieDynamique;
  onUpdate: (updated: CategorieDynamique) => void;
  onDelete: () => void;
  onSaveCategorie?: (cat: {
    nom: string;
    colonnes: ColonneCategorie[];
    lignes?: LigneCustom[];
    emoji?: string;
  }) => void;
  onDemanderEdition?: (cat: { nom: string; colonnes: ColonneCategorie[] }) => void;
}) {
  const [replie, setReplie] = useState(!categorie.afficher);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) setReplie(true);
  }, []);

  const ajouterLigne = () => {
    const nouvelle: LigneCustom = { _id: crypto.randomUUID() };
    categorie.colonnes.forEach(col => {
      if (col.type === 'prixAvecMarge') {
        nouvelle[col.nom + '_achat'] = 0;
        nouvelle[col.nom + '_marge'] = 0;
      } else {
        nouvelle[col.nom] = col.type === 'texte' ? '' : 0;
      }
    });
    onUpdate({ ...categorie, lignes: [...categorie.lignes, nouvelle] });
  };

  const supprimerLigne = (i: number) => {
    const lignes = [...categorie.lignes];
    lignes.splice(i, 1);
    onUpdate({ ...categorie, lignes });
  };

  const modifierValeur = (i: number, cle: string, val: any) => {
    const lignes = [...categorie.lignes];

    // 🔍 Trouver la colonne correspondant à cette clé
    const colonne = categorie.colonnes.find(c => c.nom === cle || cle.startsWith(c.nom + '_'));

    if (!colonne) return;

    // 🔁 Appliquer la logique en fonction du type
    if (colonne.type === 'texte') {
      lignes[i][cle] = val;
    } else {
      lignes[i][cle] = parseFloat(val) || 0;
    }

    onUpdate({ ...categorie, lignes });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categorie.lignes.findIndex(l => (l._id || '') === active.id);
    const newIndex = categorie.lignes.findIndex(l => (l._id || '') === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(categorie.lignes, oldIndex, newIndex);
      onUpdate({ ...categorie, lignes: reordered });
    }
  };

  const sauvegarderCategorie = () => {
    const { nom, colonnes, emoji, lignes } = categorie;
    if (!nom || colonnes.length === 0) return alert('❌ Nom ou colonnes vides.');
    if (onSaveCategorie) {
      onSaveCategorie({ nom, colonnes, lignes, emoji });
    }
  };

  // ... (replié UI comme dans ta version précédente)
  return (
    <div className="flex flex-col gap-4">
      {replie ? (
        <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 shadow-sm mb-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">
              {categorie.emoji ? `${categorie.emoji} ` : ''}
              {categorie.nom || 'Catégorie personnalisée'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setReplie(false)}
                className="text-blue-600 text-sm hover:underline"
              >
                Afficher/Modifier
              </button>
              <button
                onClick={() => onUpdate({ ...categorie, afficher: !categorie.afficher })}
                className="text-gray-600 text-sm hover:underline"
              >
                {categorie.afficher ? '📤 Retirer du PDF' : '📥 Afficher dans PDF'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {categorie.lignes.length} ligne{categorie.lignes.length > 1 ? 's' : ''} —{' '}
            {categorie.afficher ? 'affiché' : 'non affiché'} dans PDF
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mt-2">
            <h2 className="text-md font-semibold">
              {categorie.emoji ? `${categorie.emoji} ` : ''}
              {categorie.nom}
            </h2>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  onDemanderEdition?.({
                    nom: categorie.nom,
                    colonnes: categorie.colonnes,
                  })
                }
              >
                ✏️ Modifier la structure
              </Button>
              <Button onClick={() => setReplie(true)} variant="outline" size="xs">
                🔽 Réduire
              </Button>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-2 mt-4">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-600 tracking-wider">
                    <th className="w-6" />
                    {categorie.colonnes.map((col, idx) => (
                      <th key={idx} className="px-3 py-2 bg-gray-100">
                        {col.nom}
                      </th>
                    ))}
                    <th className="px-3 py-2 bg-gray-100 text-center">🗑️</th>
                  </tr>
                </thead>

                <SortableContext
                  items={categorie.lignes.map((l, i) => l._id || i.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody>
                    {categorie.lignes.map((ligne, i) => (
                      <LigneSortable
                        key={ligne._id || i}
                        ligne={ligne}
                        index={i}
                        colonnes={categorie.colonnes}
                        onUpdate={modifierValeur}
                        onDelete={() => supprimerLigne(i)}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </div>
          </DndContext>

          <Button variant="ghost" size="sm" onClick={ajouterLigne} className="w-75">
            ➕ Ajouter une ligne
          </Button>

          <div className="flex items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Afficher dans le PDF</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={categorie.afficher}
                  onChange={e => {
                    const val = e.target.checked;
                    onUpdate({ ...categorie, afficher: val });
                    if (!val) setReplie(true);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition duration-300"></div>
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-full shadow"></div>
              </label>
            </div>

            <Button variant="danger" size="sm" onClick={onDelete}>
              Supprimer du devis
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
