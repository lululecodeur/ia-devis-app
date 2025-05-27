'use client';
import { useState } from 'react';
import Button from '@/components/ui/bouton';

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

export default function BlocCategorie({
  categorie,
  onUpdate,
  onDelete,
  onSaveCategorie, // ✅ ajout ici
}: {
  categorie: CategorieDynamique;
  onUpdate: (updated: CategorieDynamique) => void;
  onDelete: () => void;
  onSaveCategorie?: (cat: {
    nom: string;
    colonnes: ColonneCategorie[];
    lignes?: LigneCustom[]; // ✅ ajout ici
    emoji?: string;
  }) => void;
}) {
  const cleanNumericInput = (val: string): number => {
    const clean = val.replace(/^0+(\d)/, '$1');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  };

  const afficherNettoye = (val: any): string =>
    val !== undefined ? String(cleanNumericInput(String(val))) : '';

  const [replie, setReplie] = useState(!categorie.afficher);

  const ajouterLigne = () => {
    const nouvelleLigne: LigneCustom = {};
    categorie.colonnes.forEach(col => {
      if (col.type === 'prixAvecMarge') {
        nouvelleLigne[col.nom + '_achat'] = 0;
        nouvelleLigne[col.nom + '_marge'] = 0;
      } else {
        nouvelleLigne[col.nom] = col.type === 'texte' ? '' : 0;
      }
    });
    onUpdate({ ...categorie, lignes: [...categorie.lignes, nouvelleLigne] });
  };

  const supprimerLigne = (index: number) => {
    const lignes = [...categorie.lignes];
    lignes.splice(index, 1);
    onUpdate({ ...categorie, lignes });
  };

  const sauvegarderCategorie = () => {
    const { nom, colonnes, emoji, lignes } = categorie;

    if (!nom || colonnes.length === 0) {
      alert('❌ Le nom ou les colonnes sont vides.');
      return;
    }

    const lignesCopy = [...lignes]; // snapshot local

    if (onSaveCategorie) {
      onSaveCategorie({
        nom,
        colonnes,
        lignes: lignesCopy,
        emoji,
      });
    }
  };
  if (replie) {
    return (
      <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 shadow-sm mb-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">
            {categorie.emoji || '📂'} {categorie.nom}
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
            <button onClick={onDelete} className="text-red-600 text-sm hover:underline">
              ❌ Supprimer
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {categorie.colonnes.length} colonne{categorie.colonnes.length > 1 ? 's' : ''} —{' '}
          {categorie.lignes.length} ligne{categorie.lignes.length > 1 ? 's' : ''} —{' '}
          {categorie.afficher ? 'affiché' : 'non affiché'} dans PDF
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={categorie.nom}
          onChange={e => onUpdate({ ...categorie, nom: e.target.value })}
          className="text-lg font-semibold bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none transition"
        />

        <button
          onClick={() => setReplie(true)}
          className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
        >
          🔽 Réduire
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="flex flex-col gap-4 mt-4">
          <h4 className="text-sm font-medium text-gray-800">Colonnes de la catégorie</h4>
          {categorie.colonnes.map((col, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={col.nom}
                onChange={e => {
                  const colonnes = [...categorie.colonnes];
                  colonnes[idx].nom = e.target.value;
                  onUpdate({ ...categorie, colonnes });
                }}
                className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  col.type === 'prixAvecMarge'
                    ? 'ex : matériel'
                    : col.type === 'prix'
                    ? 'ex : service'
                    : col.type === 'quantite'
                    ? 'ex : quantité'
                    : 'ex : désignation'
                }
              />
              <select
                value={col.type}
                onChange={e => {
                  const colonnes = [...categorie.colonnes];
                  colonnes[idx].type = e.target.value as any;
                  onUpdate({ ...categorie, colonnes });
                }}
                className="w-48 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="texte">Texte</option>
                <option value="quantite">Quantité</option>
                <option value="prix">Prix</option>
                <option value="prixAvecMarge">Prix avec marge</option>
              </select>
              <button
                onClick={() => {
                  const colonnes = [...categorie.colonnes];
                  colonnes.splice(idx, 1);
                  onUpdate({ ...categorie, colonnes });
                }}
                className="text-red-600 hover:text-red-800 text-lg"
              >
                🗑️
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-75"
            onClick={() =>
              onUpdate({
                ...categorie,
                colonnes: [...categorie.colonnes, { nom: '', type: 'texte' }],
              })
            }
          >
            ➕ Ajouter une colonne au tableau (aperçu ci-dessous)
          </Button>
        </div>

        <table className="w-full text-sm border-separate border-spacing-y-2 mt-4">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-600 tracking-wider">
              {categorie.colonnes.map((col, idx) => (
                <th key={idx} className="px-3 py-2 bg-gray-100">
                  {col.nom}
                </th>
              ))}
              <th className="px-3 py-2 bg-gray-100 text-center">🗑️</th>
            </tr>
          </thead>
          <tbody>
            {categorie.lignes.map((ligne, index) => (
              <tr key={index} className="bg-white shadow-sm rounded-xl">
                {categorie.colonnes.map((col, colIndex) => {
                  const cle = col.nom;

                  if (col.type === 'prixAvecMarge') {
                    return (
                      <td key={colIndex} className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-gray-600">{cle} (calculé)</span>
                          <div className="flex gap-2">
                            <div className="flex flex-col w-1/2">
                              <label className="text-[10px] text-gray-500 mb-1">€ achat</label>
                              <input
                                type="number"
                                onWheel={e => e.currentTarget.blur()}
                                value={afficherNettoye(ligne[cle + '_achat'])}
                                onChange={e => {
                                  const lignes = [...categorie.lignes];
                                  lignes[index][cle + '_achat'] = cleanNumericInput(e.target.value);
                                  onUpdate({ ...categorie, lignes });
                                }}
                                className="w-full bg-transparent text-sm border border-gray-200 rounded px-2"
                              />
                            </div>
                            <div className="flex flex-col w-1/2">
                              <label className="text-[10px] text-gray-500 mb-1">% marge</label>
                              <input
                                type="number"
                                onWheel={e => e.currentTarget.blur()}
                                value={afficherNettoye(ligne[cle + '_marge'])}
                                onChange={e => {
                                  const lignes = [...categorie.lignes];
                                  lignes[index][cle + '_marge'] = cleanNumericInput(e.target.value);
                                  onUpdate({ ...categorie, lignes });
                                }}
                                className="w-full bg-transparent text-sm border border-gray-200 rounded px-2"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1 italic text-center">
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
                        value={
                          col.type === 'texte' ? ligne[cle] ?? '' : afficherNettoye(ligne[cle])
                        }
                        onChange={e => {
                          const lignes = [...categorie.lignes];
                          lignes[index][cle] =
                            col.type === 'texte'
                              ? e.target.value
                              : cleanNumericInput(e.target.value);
                          onUpdate({ ...categorie, lignes });
                        }}
                        className="w-full bg-transparent text-sm border border-gray-200 rounded px-2"
                      />
                    </td>
                  );
                })}
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
    </div>
  );
}
