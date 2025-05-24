'use client';
import { useState } from 'react';

interface LigneGenerique {
  designation: string;
  quantite: number;
  prix: number;
  unite: string;
}

interface CategorieDynamique {
  nom: string;
  emoji: string;
  lignes: LigneGenerique[];
  afficher: boolean;
}

export default function BlocCategorie({
  categorie,
  onUpdate,
  onDelete,
}: {
  categorie: CategorieDynamique;
  onUpdate: (updated: CategorieDynamique) => void;
  onDelete: () => void;
}) {
  const ajouterLigne = () => {
    const nouvelleLigne: LigneGenerique = {
      designation: '',
      quantite: 1,
      prix: 0,
      unite: 'U',
    };
    onUpdate({ ...categorie, lignes: [...categorie.lignes, nouvelleLigne] });
  };

  const modifierLigne = (index: number, champ: keyof LigneGenerique, valeur: string | number) => {
    const lignes = [...categorie.lignes];
    if (champ === 'quantite' || champ === 'prix') {
      lignes[index][champ] = parseFloat(String(valeur).replace(',', '.')) || 0;
    } else if (champ === 'designation' || champ === 'unite') {
      lignes[index][champ] = valeur as string;
    }

    onUpdate({ ...categorie, lignes });
  };

  const supprimerLigne = (index: number) => {
    const lignes = [...categorie.lignes];
    lignes.splice(index, 1);
    onUpdate({ ...categorie, lignes });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Titre modifiable */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{categorie.emoji}</span>
          <input
            type="text"
            value={categorie.nom}
            onChange={e => onUpdate({ ...categorie, nom: e.target.value })}
            className="text-lg font-semibold bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none transition"
          />
        </div>

        {/* Supprimer catégorie */}
        <button onClick={onDelete} className="text-red-600 text-sm underline hover:text-red-800">
          Supprimer cette catégorie
        </button>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-600 tracking-wider">
              <th className="px-3 py-2 bg-gray-100">Désignation</th>
              <th className="px-3 py-2 bg-gray-100">Unité</th>
              <th className="px-3 py-2 bg-gray-100">Quantité</th>
              <th className="px-3 py-2 bg-gray-100">Prix (€)</th>
              <th className="px-3 py-2 bg-gray-100 text-center">🗑️</th>
            </tr>
          </thead>
          <tbody>
            {categorie.lignes.map((ligne, index) => (
              <tr key={index} className="bg-white shadow-sm rounded-xl">
                <td className="px-3 py-2">
                  <input
                    value={ligne.designation}
                    onChange={e => modifierLigne(index, 'designation', e.target.value)}
                    className="w-full bg-transparent text-sm"
                    placeholder="Désignation"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={ligne.unite}
                    onChange={e => modifierLigne(index, 'unite', e.target.value)}
                    className="w-full bg-transparent text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={ligne.quantite}
                    onChange={e => modifierLigne(index, 'quantite', e.target.value)}
                    className="w-full bg-transparent text-sm"
                    placeholder="1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={ligne.prix}
                    onChange={e => modifierLigne(index, 'prix', e.target.value)}
                    className="w-full bg-transparent text-sm"
                    placeholder="0"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => supprimerLigne(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ajouter une ligne */}
      <button
        onClick={ajouterLigne}
        className="bg-white hover:bg-gray-100 text-sm text-gray-800 px-4 py-2 rounded-md border border-gray-300 shadow-sm w-fit"
      >
        ➕ Ajouter une ligne
      </button>

      {/* Affichage dans PDF */}
      <div className="flex items-center gap-4 mt-4">
        <span className="text-sm font-medium text-gray-700">Afficher dans le PDF</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={categorie.afficher}
            onChange={e => onUpdate({ ...categorie, afficher: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition duration-300"></div>
          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-full shadow"></div>
        </label>
      </div>
    </div>
  );
}
