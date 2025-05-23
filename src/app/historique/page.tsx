'use client';

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
    fetch('http://localhost:5000/devis-final')
      .then((res) => res.json())
      .then((data) => {
        setDevisList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erreur fetch historique :', err);
        setLoading(false);
      });
  }, []);

  const reutiliserDevis = (devis: Devis) => {
    localStorage.setItem('devisEnCours', JSON.stringify(devis));
    router.push('/');
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
                  <h2 className="font-semibold">{devis.titre}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(devis.date).toLocaleString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Client : {devis.recepteur?.nom || 'Non spécifié'}
                  </p>
                </div>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => reutiliserDevis(devis)}
                >
                  📝 Réutiliser
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link href="/" className="text-blue-600 underline">
          ← Retour à la création de devis
        </Link>
      </div>
    </div>
  );
}
