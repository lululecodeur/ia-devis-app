'use client';
import { useState } from 'react';

interface LigneMainOeuvre {
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
}: {
  lignes: LigneMainOeuvre[];
  setLignes: (l: LigneMainOeuvre[]) => void;
  afficher: boolean;
  setAfficher: (v: boolean) => void;
  nomCategorie: string;
  setNomCategorie: (v: string) => void;
}) {
  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      { designation: '', mode: 'horaire', prixHoraire: 0, heures: 1, prixFixe: 0 },
    ]);
  };

  const modifierLigne = (index: number, champ: keyof LigneMainOeuvre, valeur: string | number) => {
    const copie = [...lignes];
    if (champ === 'prixHoraire' || champ === 'heures' || champ === 'prixFixe') {
      copie[index][champ] = parseFloat(String(valeur).replace(',', '.')) || 0;
    } else {
      copie[index][champ] = valeur as never;
    }
    setLignes(copie);
  };

  const supprimerLigne = (index: number) => {
    const copie = [...lignes];
    copie.splice(index, 1);
    setLignes(copie);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span>👷‍♂️</span>
        <input
          type="text"
          value={nomCategorie}
          onChange={e => setNomCategorie(e.target.value)}
          className="text-lg font-semibold bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none transition"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-600 tracking-wider">
              <th className="px-3 py-2 bg-gray-100 rounded-l-lg">Désignation</th>
              <th className="px-3 py-2 bg-gray-100">Mode</th>
              <th className="px-3 py-2 bg-gray-100">Prix horaire (€)</th>
              <th className="px-3 py-2 bg-gray-100">Heures</th>
              <th className="px-3 py-2 bg-gray-100">Prix fixe (€)</th>
              <th className="px-3 py-2 bg-gray-100 rounded-r-lg text-center">🗑️</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, index) => (
              <tr key={index} className="bg-white shadow-sm rounded-xl">
                <td className="px-3 py-2 align-top">
                  <input
                    className="w-full bg-transparent focus:outline-none text-sm"
                    value={ligne.designation}
                    onChange={e => modifierLigne(index, 'designation', e.target.value)}
                    placeholder="Désignation"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-sm w-full">
                    <button
                      type="button"
                      onClick={() => modifierLigne(index, 'mode', 'horaire')}
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
                      onClick={() => modifierLigne(index, 'mode', 'fixe')}
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
                    onChange={e => modifierLigne(index, 'prixHoraire', e.target.value)}
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
                    onChange={e => modifierLigne(index, 'heures', e.target.value)}
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
                    onChange={e => modifierLigne(index, 'prixFixe', e.target.value)}
                    disabled={ligne.mode === 'horaire'}
                    placeholder="0"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => supprimerLigne(index)}
                    className="text-red-500 hover:text-red-700"
                    title="Supprimer cette ligne"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            onChange={e => setAfficher(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition duration-300"></div>
          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-full shadow"></div>
        </label>
      </div>
    </div>
  );
}
