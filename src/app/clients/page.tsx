'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Client {
  nom: string;
  adresse: string;
  email: string;
  tel: string;
  date: string;
  client_id?: string;
}

interface Devis {
  titre?: string;
  date?: string;
  created_at?: string;
  client_id?: string;
  recepteur?: Client;
  [key: string]: any;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [modifs, setModifs] = useState<Record<number, Partial<Client>>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('clients');
    if (stored) {
      const parsed = JSON.parse(stored);
      setClients(parsed.reverse()); // 🔁 inverse la liste
    }
  }, []);

  const sauvegarderClient = (index: number) => {
    const updatedClients = [...clients];
    const modif = modifs[index];

    if (modif) {
      updatedClients[index] = {
        ...updatedClients[index],
        ...modif,
      };
      setClients(updatedClients);
      localStorage.setItem('clients', JSON.stringify(updatedClients));

      const client = updatedClients[index];
      const clientId = client.client_id;

      const historique = localStorage.getItem('devisHistorique');
      if (historique) {
        try {
          const devis: Devis[] = JSON.parse(historique);
          const updatedDevis = devis.map(d =>
            d.client_id === clientId ? { ...d, recepteur: client } : d
          );
          localStorage.setItem('devisHistorique', JSON.stringify(updatedDevis));
        } catch (e) {
          console.warn('❌ Erreur mise à jour devis liés :', e);
        }
      }

      const newModifs = { ...modifs };
      delete newModifs[index];
      setModifs(newModifs);

      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    }
  };

  const supprimerClient = (index: number) => {
    const copie = [...clients];
    copie.splice(index, 1);
    setClients(copie);
    localStorage.setItem('clients', JSON.stringify(copie));
  };

  const reutiliserClient = (client: Client) => {
    localStorage.setItem('clientTemp', JSON.stringify(client));
    localStorage.setItem('client_id_temp', client.client_id || '');
    window.location.replace('/?mode=devis');
  };

  const getDevisPourClient = (client: Client): Devis[] => {
    const clientId = client.client_id;
    const historiqueStr = localStorage.getItem('devisHistorique');
    if (!historiqueStr) return [];
    try {
      const historique: Devis[] = JSON.parse(historiqueStr);
      return historique.filter(d => d.client_id === clientId);
    } catch {
      return [];
    }
  };

  return (
    <main className="p-8 max-w-3xl mx-auto min-h-screen bg-gray-50 text-black">
      <h1 className="text-3xl font-bold mb-6">📋 Historique Clients</h1>

      {showConfirmation && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4 text-sm shadow">
          ✅ Client modifié et devis associés mis à jour !
        </div>
      )}

      {clients.length === 0 ? (
        <p className="text-gray-500">Aucun client enregistré pour l’instant.</p>
      ) : (
        clients.map((client, index) => (
          <div
            key={index}
            className="bg-white border rounded-xl p-6 mb-6 shadow space-y-2 text-black"
          >
            <input
              className="w-full border p-2 rounded text-black"
              value={modifs[index]?.nom ?? client.nom}
              onChange={e =>
                setModifs({
                  ...modifs,
                  [index]: {
                    ...modifs[index],
                    nom: e.target.value,
                  },
                })
              }
              placeholder="Nom"
            />
            <input
              className="w-full border p-2 rounded text-black"
              value={modifs[index]?.adresse ?? client.adresse}
              onChange={e =>
                setModifs({
                  ...modifs,
                  [index]: {
                    ...modifs[index],
                    adresse: e.target.value,
                  },
                })
              }
              placeholder="Adresse"
            />
            <input
              className="w-full border p-2 rounded text-black"
              value={modifs[index]?.email ?? client.email}
              onChange={e =>
                setModifs({
                  ...modifs,
                  [index]: {
                    ...modifs[index],
                    email: e.target.value,
                  },
                })
              }
              placeholder="Email"
            />
            <input
              className="w-full border p-2 rounded text-black"
              value={modifs[index]?.tel ?? client.tel}
              onChange={e =>
                setModifs({
                  ...modifs,
                  [index]: {
                    ...modifs[index],
                    tel: e.target.value,
                  },
                })
              }
              placeholder="Téléphone"
            />

            <div className="flex flex-wrap gap-4 mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => sauvegarderClient(index)}
              >
                💾 Sauvegarder
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={() => reutiliserClient(clients[index])}
              >
                ✅ Réutiliser
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={() => supprimerClient(index)}
              >
                🗑️ Supprimer
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold mb-1">📄 Devis liés :</p>
              {getDevisPourClient(client).length === 0 ? (
                <p className="text-sm text-gray-500 italic">Aucun devis associé.</p>
              ) : (
                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                  {getDevisPourClient(client).map((devis, i) => (
                    <li key={i}>
                      {devis.titre || 'Devis sans titre'} —{' '}
                      {new Date(devis.date || devis.created_at || Date.now()).toLocaleDateString(
                        'fr-FR'
                      )}
                      <button
                        className="ml-2 text-blue-600 hover:underline text-xs"
                        onClick={() => {
                          localStorage.setItem('devisEnCours', JSON.stringify(devis));
                          if (devis.client_id) {
                            localStorage.setItem('client_id_temp', devis.client_id);
                          }
                          window.location.href = '/?mode=devis';
                        }}
                      >
                        📄 Voir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))
      )}

      <div className="sticky bottom-4 z-50 flex justify-center mt-8">
        <Link href="/?mode=devis">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm">
            ← Retour au générateur de devis
          </button>
        </Link>
      </div>
    </main>
  );
}
