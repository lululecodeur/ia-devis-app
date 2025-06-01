'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/bouton';

interface ColonneCategorie {
  nom: string;
  type: 'texte' | 'quantite' | 'prix' | 'prixAvecMarge';
}

interface Props {
  mode: 'creation' | 'edition';
  initialCategorie?: {
    nom: string;
    colonnes: ColonneCategorie[];
  };
  onClose: () => void;
  onCreate: (categorie: {
    nom: string;
    colonnes: ColonneCategorie[];
    lignes: any[];
    afficher: boolean;
  }) => void;
}

export default function ModalNouvelleCategorie({
  mode,
  initialCategorie,
  onClose,
  onCreate,
}: Props) {
  const [nom, setNom] = useState('');
  const [colonnes, setColonnes] = useState<ColonneCategorie[]>([]);

  useEffect(() => {
    if (mode === 'edition' && initialCategorie) {
      setNom(initialCategorie.nom);
      setColonnes(initialCategorie.colonnes);
    } else {
      setNom('');
      setColonnes([
        { nom: 'Désignation', type: 'texte' },
        { nom: 'Unité', type: 'texte' },
        { nom: 'Qté', type: 'quantite' },
        { nom: 'PU HT (€)', type: 'prix' },
      ]);
    }
  }, [mode, initialCategorie]);

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
      lignes: [], // Tu peux adapter si tu veux conserver les lignes existantes
      afficher: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-lg space-y-4">
        <h2 className="text-xl font-semibold mb-2">
          {mode === 'creation' ? '➕ Nouvelle catégorie personnalisée' : '✏️ Modifier la catégorie'}
        </h2>

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
                <Button
                  onClick={() => supprimerColonne(index)}
                  variant="danger"
                  size="sm"
                  title="Supprimer"
                >
                  ✖
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={ajouterColonne} variant="outline" size="sm" className="mt-4">
            ➕ Ajouter une colonne dans le tableau
          </Button>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm cursor-pointer"
          >
            Annuler
          </button>
          <Button onClick={valider} variant="success" size="md">
            {mode === 'creation' ? '✅ Créer la catégorie' : '💾 Enregistrer les modifications'}
          </Button>
        </div>
      </div>
    </div>
  );
}
