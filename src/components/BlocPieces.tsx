'use client';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/bouton';
import LigneDraggablePiece from '@/components/LigneDraggablePiece';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import Aide from '@/components/Aide';

interface LignePiece {
  id: string;
  designation: string;
  unite: string;
  prixAchat: number;
  margePourcent: number;
  quantite: number;
  prixManuel?: number;
  mode: 'calculé' | 'manuel';
}

const formatNombre = (valeur: number): string =>
  Number.isNaN(valeur)
    ? ''
    : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(valeur);

export default function BlocPieces({
  lignes,
  setLignes,
  afficher,
  setAfficher,
  nomCategorie,
  setNomCategorie,
  secteurActif,
}: {
  lignes: LignePiece[];
  setLignes: (l: LignePiece[]) => void;
  afficher: boolean;
  setAfficher: (v: boolean) => void;
  nomCategorie: string;
  setNomCategorie: (v: string) => void;
  secteurActif?: string;
}) {
  const [prestationsSauvegardees, setPrestationsSauvegardees] = useState<LignePiece[]>([]);
  // toujours en haut de ton composant, hors du JSX
  const sensors = useSensors(useSensor(PointerSensor));

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      {
        id: crypto.randomUUID(), // ✅ ID requis pour le drag
        designation: '',
        unite: '', // ✅ ajout ici
        prixAchat: 0,
        margePourcent: 0,
        quantite: 1,
        prixManuel: 0,
        mode: 'calculé',
      },
    ]);
  };

  const modifierLigne = (id: string, champ: keyof LignePiece, valeur: string | number) => {
    const nouvellesLignes = lignes.map(ligne => {
      if (ligne.id !== id) return ligne;

      // Toujours garder la valeur brute (avec virgule) en string si c'est un champ numérique
      let nouvelleValeur: string | number = valeur;

      // Sécurité : forcer le type string si l'utilisateur entre une virgule
      if (typeof valeur === 'string' && /,/.test(valeur)) {
        nouvelleValeur = valeur;
      }

      return { ...ligne, [champ]: nouvelleValeur };
    });

    setLignes(nouvellesLignes);
  };

  const supprimerLigne = (id: string) => {
    const copie = lignes.filter(ligne => ligne.id !== id);
    setLignes(copie);
  };

  const [replie, setReplie] = useState(!afficher);

  const aidePieces = `🔩 Nom de la catégorie
Vous pouvez renommer cette catégorie selon votre activité : Pièces, Matériaux, Fournitures, etc.
Ce nom sera mémorisé pour vos futurs devis.

📉 Affichage
Pour ne pas inclure cette section dans le PDF, réduisez-la puis cliquez sur « Retirer du PDF ».

💸 Tarification
Deux modes sont possibles pour chaque pièce :
• Mode calculé : vous renseignez un prix d’achat HT et une marge (%). Le prix final est automatiquement calculé :
→ Prix = achat × (1 + marge / 100)
• Mode manuel : vous saisissez directement un prix de vente HT, sans calcul.

🛠️ Gestion des lignes
– Vous pouvez ajouter, modifier ou supprimer les lignes manuellement.
– Cliquez sur « Enregistrer cette pièce » pour la réutiliser dans un autre devis.
– Pour l’ajouter rapidement, cliquez sur « Ajouter » dans l'encadré *Pièces enregistrées* (visible uniquement si au moins une pièce a été enregistrée).
– Pour l’oublier définitivement, utilisez le bouton « Supprimer » dans cet encadré.
`;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setReplie(true);
    }
  }, []);

  const sauvegarderLigne = (ligne: LignePiece) => {
    console.log('➡️ Sauvegarde déclenchée dans BlocPieces avec', ligne);

    if (!secteurActif) {
      console.warn('❌ secteurActif est undefined, impossible de sauvegarder');
      return;
    }

    const cle = `prestationsPieces_${secteurActif}`;

    const nouvelleListe = [...prestationsSauvegardees.filter(p => p.id !== ligne.id), ligne];

    localStorage.setItem(cle, JSON.stringify(nouvelleListe));
    setPrestationsSauvegardees(nouvelleListe);
    alert('✅ Prestation enregistrée');
  };

  useEffect(() => {
    if (secteurActif) {
      const clePrestations = `prestationsPieces_${secteurActif}`;
      const cleNomCategorie = `nomCategoriePieces_${secteurActif}`;

      const sauvegardes = localStorage.getItem(clePrestations);
      if (sauvegardes) {
        try {
          const parsed = JSON.parse(sauvegardes);
          if (Array.isArray(parsed)) {
            setPrestationsSauvegardees(parsed);
          }
        } catch (e) {
          console.error('Erreur chargement prestations pièces', e);
        }
      }

      const nomSauvegarde = localStorage.getItem(cleNomCategorie);
      if (nomSauvegarde) {
        setNomCategorie(nomSauvegarde);
      }
    }
  }, [secteurActif]);

  useEffect(() => {
    const seen = new Set<string>();
    const lignesCorrigees = lignes.map(ligne => {
      let id = ligne.id || crypto.randomUUID();

      // Si l'id est déjà utilisé, on en génère un nouveau
      while (seen.has(id)) {
        id = crypto.randomUUID();
      }

      seen.add(id);
      return { ...ligne, id };
    });

    setLignes(lignesCorrigees);
  }, []);

  if (replie) {
    return (
      <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 shadow-sm mb-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{nomCategorie || '🧩 Pièces'}</span>
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
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>🔩</span>
          <input
            type="text"
            value={nomCategorie}
            onChange={e => {
              const value = e.target.value;
              setNomCategorie(value);
              localStorage.setItem(`nomCategorieMainOeuvre_${secteurActif || 'global'}`, value);
            }}
            className="text-lg font-semibold bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-4">
          <Aide titre="Aide" contenu={aidePieces} />
          <Button onClick={() => setReplie(true)} variant="outline" size="xs">
            🔽 Réduire
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
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
                  <th className="px-2 py-2" />
                  {/* ✅ pas de texte ici */}
                  <th className="px-3 py-2 bg-gray-100">Désignation</th>
                  <th className="px-3 py-2 bg-gray-100">Unité</th>

                  <th className="px-3 py-2 bg-gray-100">Prix d’achat (€)</th>
                  <th className="px-3 py-2 bg-gray-100">% Marge</th>
                  <th className="px-3 py-2 bg-gray-100">Quantité</th>
                  <th className="px-3 py-2 bg-gray-100">Mode</th>
                  <th className="px-3 py-2 bg-gray-100">Prix fixe (€)</th>
                  <th className="px-3 py-2 bg-gray-100 text-center">Actions</th>
                </tr>
              </thead>

              <SortableContext items={lignes.map(l => l.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {lignes.map((ligne, index) => (
                    <LigneDraggablePiece
                      key={ligne.id}
                      ligne={ligne}
                      modifierLigne={modifierLigne}
                      supprimerLigne={() => supprimerLigne(ligne.id)}
                      sauvegarderLigne={() => sauvegarderLigne(ligne)}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      </div>

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
            onChange={e => {
              const val = e.target.checked;
              setAfficher(val);
              if (!val) setReplie(true);
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition duration-300"></div>
          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-full shadow"></div>
        </label>
      </div>

      {secteurActif && prestationsSauvegardees.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            🧰 Pièces enregistrées ({secteurActif})
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
                  {prestation.mode === 'manuel' ? (
                    <span className="text-xs text-gray-500">
                      💰 Prix fixe : {prestation.prixManuel} €
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      🛠️ {prestation.prixAchat} € achat + {prestation.margePourcent}% marge ×{' '}
                      {prestation.quantite}
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
                      const confirm = window.confirm('🗑️ Supprimer cette pièce ?');
                      if (!confirm) return;

                      const updated = [...prestationsSauvegardees];
                      updated.splice(index, 1);
                      localStorage.setItem(
                        `prestationsPieces_${secteurActif}`,
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
    </div>
  );
}
