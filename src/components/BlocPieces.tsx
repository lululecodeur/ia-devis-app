'use client';
import { useEffect, useState } from 'react';

interface LignePiece {
  designation: string;
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

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      {
        designation: '',
        prixAchat: 0,
        margePourcent: 0,
        quantite: 1,
        prixManuel: 0,
        mode: 'calculé',
      },
    ]);
  };

  const modifierLigne = (index: number, champ: keyof LignePiece, valeur: string | number) => {
    const copie = [...lignes];
    if (
      champ === 'prixAchat' ||
      champ === 'margePourcent' ||
      champ === 'quantite' ||
      champ === 'prixManuel'
    ) {
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

  const sauvegarderLigne = (ligne: LignePiece) => {
    if (!secteurActif) return;
    const cle = `prestationsPieces_${secteurActif}`;
    const nouvelleListe = [...prestationsSauvegardees, ligne];
    localStorage.setItem(cle, JSON.stringify(nouvelleListe));
    setPrestationsSauvegardees(nouvelleListe);
    alert('✅ Prestation enregistrée');
  };

  useEffect(() => {
    if (secteurActif) {
      const cle = `prestationsPieces_${secteurActif}`;
      const sauvegardes = localStorage.getItem(cle);
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
    }
  }, [secteurActif]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span>🔩</span>
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
              <th className="px-3 py-2 bg-gray-100">Prix d’achat (€)</th>
              <th className="px-3 py-2 bg-gray-100">% Marge</th>
              <th className="px-3 py-2 bg-gray-100">Quantité</th>
              <th className="px-3 py-2 bg-gray-100">Mode</th>
              <th className="px-3 py-2 bg-gray-100">Prix fixe (€)</th>
              <th className="px-3 py-2 bg-gray-100 rounded-r-lg text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, index) => (
              <tr key={index} className="bg-white shadow-sm rounded-xl">
                <td className="px-3 py-2">
                  <input
                    className="w-full bg-transparent text-sm"
                    value={ligne.designation}
                    onChange={e => modifierLigne(index, 'designation', e.target.value)}
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
                    onChange={e => modifierLigne(index, 'prixAchat', e.target.value)}
                    disabled={ligne.mode === 'manuel'}
                    placeholder="0"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    className={`w-full bg-transparent text-sm ${
                      ligne.mode === 'manuel' ? 'text-gray-400' : ''
                    }`}
                    value={formatNombre(ligne.margePourcent)}
                    onChange={e => modifierLigne(index, 'margePourcent', e.target.value)}
                    disabled={ligne.mode === 'manuel'}
                    placeholder="0"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm"
                    value={formatNombre(ligne.quantite)}
                    onChange={e => modifierLigne(index, 'quantite', e.target.value)}
                    placeholder="1"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-sm w-full">
                    <button
                      type="button"
                      onClick={() => modifierLigne(index, 'mode', 'calculé')}
                      className={`w-1/2 px-3 py-1 transition-colors ${
                        ligne.mode === 'calculé'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Prix avec marge
                    </button>
                    <button
                      type="button"
                      onClick={() => modifierLigne(index, 'mode', 'manuel')}
                      className={`w-1/2 px-3 py-1 transition-colors ${
                        ligne.mode === 'manuel'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Prix fixe
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
                    onChange={e => modifierLigne(index, 'prixManuel', e.target.value)}
                    disabled={ligne.mode === 'calculé'}
                    placeholder="0"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => supprimerLigne(index)}
                    className="text-red-500 hover:text-red-700 mr-2"
                    title="Supprimer cette ligne"
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => sauvegarderLigne(ligne)}
                    className="text-green-600 hover:text-green-800"
                    title="Sauvegarder cette prestation"
                  >
                    💾
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
                  <button
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    onClick={() => setLignes([...lignes, { ...prestation }])}
                  >
                    ➕ Ajouter
                  </button>
                  <button
                    className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200"
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
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
