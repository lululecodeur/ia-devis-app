'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Ligne {
  designation: string;
  unite: string;
  quantite: number;
  prix: number;
}

interface InfoEntreprise {
  nom: string;
  adresse?: string;
  siret?: string;
  email?: string;
  tel?: string;
}

interface Devis {
  date: string;
  titre: string;
  numeroDevis?: string; // ✅ Ajout
  lignes: Ligne[];
  intro?: string;
  conclusion?: string;
  mentions?: string;
  emetteur?: InfoEntreprise;
  recepteur?: InfoEntreprise;
  logo?: string;
}

export default function HistoriquePage() {
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('devisHistorique');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setDevisList(data.reverse()); // 🔁 ordre du plus récent au plus ancien
      } catch (err) {
        console.error('Erreur parsing historique :', err);
      }
    }

    setLoading(false);
  }, []);

  const reutiliserDevis = (devis: Devis) => {
    localStorage.setItem('devisEnCours', JSON.stringify(devis));
    router.push('/?mode=devis');
  };

  const supprimerDevis = (index: number) => {
    const copie = [...devisList];
    copie.splice(index, 1);
    setDevisList(copie);
    localStorage.setItem('devisHistorique', JSON.stringify(copie));
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">📁 Historique des devis</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : devisList.length === 0 ? (
        <p className="text-gray-500">Aucun devis sauvegardé pour le moment.</p>
      ) : (
        <ul className="space-y-4">
          {devisList.map((devis, index) => (
            <li key={index} className="border rounded p-4 shadow-sm bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold">
                    {devis.titre}
                    {devis.numeroDevis && (
                      <span className="ml-2 text-sm text-gray-600 font-normal">
                        (n° {devis.numeroDevis})
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date(devis.date).toLocaleString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Client : {devis.recepteur?.nom || 'Non spécifié'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => reutiliserDevis(devis)}
                  >
                    📝 Réutiliser
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => supprimerDevis(index)}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="sticky bottom-4 z-50 flex justify-center mt-8">
        <Link href="/?mode=devis">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm">
            ← Retour à la création de devis
          </button>
        </Link>
      </div>
    </div>
  );
}
