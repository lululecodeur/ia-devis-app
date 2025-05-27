import { useEffect, useState } from 'react';
import Button from '@/components/ui/bouton';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import LigneDraggable from '@/components/LigneDraggable'; // adapte le chemin si besoin

interface LigneMainOeuvre {
  id: string;
  designation: string;
  mode: 'horaire' | 'fixe';
  prixHoraire: number;
  heures: number;
  prixFixe: number;
}

const formatNombre = (valeur: number): string =>
  Number.isNaN(valeur)
    ? ''
    : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(valeur);

export default function BlocMainOeuvre({
  lignes,
  setLignes,
  afficher,
  setAfficher,
  nomCategorie,
  setNomCategorie,
  secteurActif,
}: {
  lignes: LigneMainOeuvre[];
  setLignes: (l: LigneMainOeuvre[]) => void;
  afficher: boolean;
  setAfficher: (v: boolean) => void;
  nomCategorie: string;
  setNomCategorie: (v: string) => void;
  secteurActif?: string;
}) {
  const [replie, setReplie] = useState(!afficher);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setReplie(true);
    }
  }, []);

  const [prestationsSauvegardees, setPrestationsSauvegardees] = useState<LigneMainOeuvre[]>([]);
  // toujours en haut de ton composant, hors du JSX
  const sensors = useSensors(useSensor(PointerSensor));

  const ajouterLigne = () => {
    const nouvelleLigne: LigneMainOeuvre = {
      id: crypto.randomUUID(), // ✅ identifiant unique
      designation: '',
      mode: 'horaire',
      prixHoraire: 0,
      heures: 1,
      prixFixe: 0,
    };
    setLignes([...lignes, nouvelleLigne]);
  };
  const modifierLigne = (id: string, champ: keyof LigneMainOeuvre, valeur: string | number) => {
    const copie = lignes.map(ligne => {
      if (ligne.id === id) {
        return {
          ...ligne,
          [champ]: ['prixHoraire', 'heures', 'prixFixe'].includes(champ)
            ? parseFloat(String(valeur).replace(',', '.')) || 0
            : valeur,
        };
      }
      return ligne;
    });
    setLignes(copie);
  };

  const supprimerLigne = (id: string) => {
    const copie = lignes.filter(ligne => ligne.id !== id);
    setLignes(copie);
  };

  const sauvegarderLigne = (ligne: LigneMainOeuvre) => {
    const secteur = secteurActif || 'global';
    console.log('💾 Sauvegarde dans la clé :', `prestationsSauvegardees_${secteur}`);
    const cle = `prestationsSauvegardees_${secteur}`;
    const nouvelleListe = [...prestationsSauvegardees, ligne];
    localStorage.setItem(cle, JSON.stringify(nouvelleListe));
    setPrestationsSauvegardees(nouvelleListe);
    alert('✅ Prestation enregistrée');
  };

  // 🔁 Chargement initial
  useEffect(() => {
    const secteur = secteurActif || 'global';

    const lignesBrutes = localStorage.getItem(`lignesMainOeuvre_${secteur}`);
    if (lignesBrutes) {
      try {
        const parsed = JSON.parse(lignesBrutes);
        if (Array.isArray(parsed)) {
          setLignes(parsed);
        }
      } catch (e) {
        console.error('Erreur parsing lignes main d’œuvre :', e);
      }
    }

    const nom = localStorage.getItem(`nomCategorieMainOeuvre_${secteur}`);
    if (nom) {
      setNomCategorie(nom);
    }

    const sauvegardes = localStorage.getItem(`prestationsSauvegardees_${secteur}`);
    if (sauvegardes) {
      try {
        const parsed = JSON.parse(sauvegardes);
        if (Array.isArray(parsed)) {
          setPrestationsSauvegardees(parsed);
        }
      } catch (e) {
        console.error('Erreur parsing prestations sauvegardées :', e);
      }
    }
  }, [secteurActif]);

  // 💾 Sauvegarde automatique des lignes
  useEffect(() => {
    const secteur = secteurActif || 'global';
    localStorage.setItem(`lignesMainOeuvre_${secteur}`, JSON.stringify(lignes));
  }, [lignes, secteurActif]);

  // 💾 Sauvegarde automatique du nom de catégorie
  useEffect(() => {
    const secteur = secteurActif || 'global';
    localStorage.setItem(`nomCategorieMainOeuvre_${secteur}`, nomCategorie);
  }, [nomCategorie, secteurActif]);

  return (
    <div className="flex flex-col gap-4">
      {replie ? (
        <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 shadow-sm mb-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">{nomCategorie || '👷‍♂️ Main d’œuvre'}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setReplie(false)}
                className="text-blue-600 text-sm hover:underline"
              >
                Afficher/Modifier
              </button>
              <button
                onClick={() => setAfficher(!afficher)}
                className="text-gray-600 text-sm hover:underline"
              >
                {afficher ? '📤 Retirer du PDF' : '📥 Afficher dans PDF'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {lignes.length} ligne{lignes.length > 1 ? 's' : ''} —{' '}
            {afficher ? 'affiché' : 'non affiché'} dans PDF
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>👷‍♂️</span>
              <input
                type="text"
                value={nomCategorie}
                onChange={e => {
                  const value = e.target.value;
                  setNomCategorie(value);
                  const secteur = secteurActif || 'global';
                  localStorage.setItem(`nomCategorieMainOeuvre_${secteur}`, value);
                }}
                className="text-lg font-semibold bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none transition"
              />
            </div>
            <button
              onClick={() => setReplie(true)}
              className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
            >
              🔽 Réduire
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={event => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              const oldIndex = lignes.findIndex(l => l.id === active.id);
              const newIndex = lignes.findIndex(l => l.id === over.id);
              setLignes(arrayMove(lignes, oldIndex, newIndex));
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-600 tracking-wider">
                    <th className="px-3 py-2 bg-gray-100 rounded-l-lg"></th>
                    <th className="px-3 py-2 bg-gray-100">Désignation</th>
                    <th className="px-3 py-2 bg-gray-100">Mode</th>
                    <th className="px-3 py-2 bg-gray-100">Prix horaire (€)</th>
                    <th className="px-3 py-2 bg-gray-100">Heures</th>
                    <th className="px-3 py-2 bg-gray-100">Prix fixe (€)</th>
                    <th className="px-3 py-2 bg-gray-100 rounded-r-lg text-center">Actions</th>
                  </tr>
                </thead>

                <SortableContext
                  items={lignes.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody>
                    {lignes.map(ligne => (
                      <LigneDraggable
                        key={ligne.id}
                        ligne={ligne}
                        modifierLigne={modifierLigne}
                        supprimerLigne={supprimerLigne}
                        sauvegarderLigne={() => sauvegarderLigne(ligne)}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </div>
          </DndContext>

          <button
            onClick={ajouterLigne}
            className="cursor-pointer flex items-center gap-2 bg-white hover:bg-gray-100 text-sm text-gray-800 px-4 py-2 rounded-md border border-gray-300 shadow-sm w-fit"
          >
            ➕ Ajouter une ligne
          </button>

          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-medium text-gray-700">Afficher dans le PDF</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={afficher}
                onChange={e => setAfficher(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition duration-300"></div>
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-full shadow"></div>
            </label>
          </div>

          {prestationsSauvegardees.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                📂 Prestations enregistrées ({secteurActif || 'global'})
              </h3>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 flex flex-col gap-2">
                {prestationsSauvegardees.map((prestation, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border border-gray-200 p-3 rounded bg-white shadow-sm"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {prestation.designation}
                      </span>
                      {prestation.mode === 'fixe' ? (
                        <span className="text-xs text-gray-500">
                          💰 Prix fixe : {prestation.prixFixe} €
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          ⏱️ {prestation.prixHoraire} €/h × {prestation.heures} h
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          setLignes([...lignes, { ...prestation, id: crypto.randomUUID() }])
                        }
                      >
                        ➕ Ajouter
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const confirm = window.confirm('🗑️ Supprimer cette prestation ?');
                          if (!confirm) return;

                          const updated = [...prestationsSauvegardees];
                          updated.splice(index, 1);
                          localStorage.setItem(
                            `prestationsSauvegardees_${secteurActif || 'global'}`,
                            JSON.stringify(updated)
                          );

                          setPrestationsSauvegardees(updated);
                        }}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
