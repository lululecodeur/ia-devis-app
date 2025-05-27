'use client';

import { useState } from 'react';

interface ColonneCategorie {
  nom: string;
  type: 'texte' | 'quantite' | 'prix' | 'prixAvecMarge';
}

interface Props {
  onClose: () => void;
  onCreate: (categorie: {
    nom: string;
    colonnes: ColonneCategorie[];
    lignes: any[];
    afficher: boolean;
  }) => void;
}

export default function ModalNouvelleCategorie({ onClose, onCreate }: Props) {
  const [nom, setNom] = useState('');
  const [colonnes, setColonnes] = useState<ColonneCategorie[]>([
    { nom: 'Désignation', type: 'texte' },
    { nom: 'Unité', type: 'texte' },
    { nom: 'Qté', type: 'quantite' },
    { nom: 'PU HT (€)', type: 'prix' },
  ]);

  const ajouterColonne = () => {
    setColonnes([...colonnes, { nom: '', type: 'texte' }]);
  };

  const modifierColonne = (index: number, key: keyof ColonneCategorie, value: string) => {
    const copie = [...colonnes];
    copie[index][key] = value as any;
    setColonnes(copie);
  };

  const supprimerColonne = (index: number) => {
    const copie = [...colonnes];
    copie.splice(index, 1);
    setColonnes(copie);
  };

  const valider = () => {
    if (!nom.trim()) {
      alert('❌ Merci de renseigner un nom de catégorie.');
      return;
    }

    const colonnesValides = colonnes.filter(c => c.nom.trim() !== '');
    if (colonnesValides.length === 0) {
      alert('❌ Merci d’ajouter au moins une colonne.');
      return;
    }

    onCreate({
      nom: nom.trim(),
      colonnes: colonnesValides,
      lignes: [],
      afficher: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-lg space-y-4">
        <h2 className="text-xl font-semibold mb-2">➕ Nouvelle catégorie personnalisée</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Nom de la catégorie</label>
          <input
            type="text"
            value={nom}
            onChange={e => setNom(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Ex : Location, Transport, Nettoyage"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Colonnes</label>
          <div className="space-y-2">
            {colonnes.map((col, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={col.nom}
                  onChange={e => modifierColonne(index, 'nom', e.target.value)}
                  className="flex-1 border border-gray-300 rounded p-2"
                  placeholder={`Colonne ${index + 1}`}
                />
                <select
                  value={col.type}
                  onChange={e => modifierColonne(index, 'type', e.target.value)}
                  className="border border-gray-300 rounded p-2"
                >
                  <option value="texte">Texte</option>
                  <option value="quantite">Quantité</option>
                  <option value="prix">Prix</option>
                  <option value="prixAvecMarge">Prix avec marge</option>
                </select>
                <button
                  onClick={() => supprimerColonne(index)}
                  className="text-red-600 hover:text-red-800 text-xl"
                  title="Supprimer"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>

          <button onClick={ajouterColonne} className="mt-2 text-sm text-blue-600 hover:underline">
            ➕ Ajouter une colonne dans le tableau
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={valider}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            ✅ Créer la catégorie
          </button>
        </div>
      </div>
    </div>
  );
}
