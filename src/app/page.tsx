'use client';

import React from 'react';
import { useState, ChangeEvent, useEffect, useRef } from 'react';
import { exporterPDF } from '@/utils/exportPdf';
import Card from '@/components/ui/Card';
import SignatureBlock from '@/components/SignatureBlock';
import type SignatureCanvas from 'react-signature-canvas';
import BlocMainOeuvre from '@/components/BlocMainOeuvre';
import BlocPieces from '@/components/BlocPieces';
import Link from 'next/link';
import { createRoot } from 'react-dom/client'; // ✅ à importer une seule fois
import BlocCategorie from '@/components/BlocCategorie';

// Types

// Ligne d’un devis
interface Ligne {
  designation: string;
  unite: string;
  quantite: number;
  prix: number;
}

// Tarif personnalisé pour GPT
interface Tarif {
  designation: string;
  unite: string;
  prix: number;
}

// Ligne Main d'œuvre
interface LigneMainOeuvre {
  designation: string;
  mode: 'horaire' | 'fixe';
  prixHoraire: number;
  heures: number;
  prixFixe: number;
}

// Ligne Pièce
interface LignePiece {
  designation: string;
  prixAchat: number;
  margePourcent: number;
  quantite: number;
  prixManuel?: number;
  mode: 'calculé' | 'manuel';
}

type LigneCustom = { [key: string]: any };

interface ColonneCategorie {
  nom: string;
  type: 'texte' | 'quantite' | 'prix' | 'prixAvecMarge';
}

interface CategorieDynamique {
  nom: string;
  lignes: LigneCustom[];
  colonnes: ColonneCategorie[]; // ← nouveau
  afficher: boolean;
  emoji?: string;
}

interface CategorieSauvegardee {
  nom: string;
  colonnes: ColonneCategorie[];
  lignes?: LigneCustom[];
  emoji?: string;
}

// Totaux
const imprimerPDFViaPrintJS = async () => {
  const { default: printJS } = await import('print-js');

  const devis = document.getElementById('devis-final');
  if (!devis) {
    alert('❌ Devis introuvable pour impression.');
    return;
  }

  // Crée un clone exact du rendu final
  const clone = devis.cloneNode(true) as HTMLElement;

  // On retire tout bord extérieur
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.margin = '0 auto';

  // Conteneur invisible
  const wrapper = document.createElement('div');
  wrapper.id = 'print-container';
  wrapper.style.position = 'fixed';
  wrapper.style.top = '-9999px';
  wrapper.style.left = '0';
  wrapper.style.zIndex = '-1';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  printJS({
    printable: clone,
    type: 'html',
    scanStyles: true, // ✅ applique les classes (ex: Tailwind)
    targetStyles: ['*'], // récupère tous les styles actifs
    style: `
  @page { margin: 0; }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  th[colspan] {
    background-color: #f2f2f2 !important;
  }

  th {
    border-bottom: 1px solid #e5e7eb !important;
  }
`,

    documentTitle: 'Devis imprimé',
    onPrintDialogClose: () => {
      wrapper.remove(); // nettoyage DOM
    },
  });
};

const exporterPDFSansClasses = async () => {
  const devis = document.getElementById('devis-final');
  if (!devis) {
    console.warn('❌ Élément #devis-final introuvable.');
    return;
  }

  const clone = devis.cloneNode(true) as HTMLElement;
  clone.style.width = '794px';
  clone.style.minHeight = '1123px';
  clone.style.padding = '32px';
  clone.style.margin = '0 auto';
  clone.style.backgroundColor = '#ffffff';
  clone.style.fontFamily = 'Arial, sans-serif';
  clone.style.fontSize = '14px';
  clone.style.lineHeight = '1.5';
  clone.style.transform = 'none';
  clone.style.transformOrigin = 'top left';

  // Supprimer classes
  clone.querySelectorAll('*').forEach(el => el.removeAttribute('class'));

  // Appliquer style uniquement aux tableaux de prestations
  clone.querySelectorAll('table').forEach(table => {
    const isTotaux = table.innerHTML.includes('Total TTC');
    if (!isTotaux) {
      const t = table as HTMLElement;
      t.style.tableLayout = 'fixed';
      t.style.width = '100%';
      t.style.borderCollapse = 'collapse';
    }
  });

  // Corriger les cellules
  clone.querySelectorAll('td, th').forEach(el => {
    const cell = el as HTMLTableCellElement;
    const content = cell.innerHTML.trim();

    // Empêche cellule vide
    if (!content) {
      cell.innerHTML = '&nbsp;';
    }

    // Vrai centrage vertical via flexbox (sauf titres colSpan)
    const isTitre = cell.colSpan && cell.colSpan > 1;

    if (!isTitre) {
      const wrapped = `<div style="display:flex; align-items:center; justify-content:center; height:100%;">${content}</div>`;
      cell.innerHTML = wrapped;
    }

    // Styles de base
    cell.style.padding = '6px 8px';
    cell.style.height = '40px';
    cell.style.minHeight = '40px';
    cell.style.verticalAlign = 'middle';
    cell.style.display = 'table-cell';
    cell.style.lineHeight = '1.3';
    cell.style.fontSize = '14px';

    // Alignement
    cell.style.textAlign = isTitre ? 'left' : 'center';
    if (isTitre) cell.style.fontWeight = 'bold';
  });

  // Fix hauteur des lignes
  clone.querySelectorAll('tr').forEach(el => {
    (el as HTMLElement).style.minHeight = '40px';
  });

  // 📄 Ajouter à un conteneur invisible pour export
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '0';
  container.style.zIndex = '-1';
  container.style.width = '794px';
  container.appendChild(clone);
  document.body.appendChild(container);

  await exporterPDF(clone);
  document.body.removeChild(container);
};

export default function Home() {
  // État général
  const [titre, setTitre] = useState('Devis - Intervention Plomberie');
  const [lignes, setLignes] = useState<Ligne[]>([
    { designation: '', unite: 'U', quantite: 1, prix: 0 },
  ]);
  const [mentions, setMentions] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [emetteur, setEmetteur] = useState({ nom: '', adresse: '', siret: '', email: '', tel: '' });
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');

  const [recepteur, setRecepteur] = useState({ nom: '', adresse: '', email: '', tel: '' });
  const [intro, setIntro] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [hauteurLogo, setHauteurLogo] = useState(160);
  const [brief, setBrief] = useState('');
  const [devisIA, setDevisIA] = useState('');
  const [chargementIA, setChargementIA] = useState(false);
  const [tarifs, setTarifs] = useState<Tarif[]>([
    { designation: "Main d'œuvre", unite: 'h', prix: 55 },
    { designation: 'Déplacement', unite: 'U', prix: 50 },
    { designation: 'Pose WC suspendu', unite: 'U', prix: 350 },
  ]);
  const [lignesParseesTemp, setLignesParseesTemp] = useState<Ligne[] | null>(null);

  const [tvaTaux, setTvaTaux] = useState(20);
  const [remisePourcent, setRemisePourcent] = useState(0);
  const [acomptePourcent, setAcomptePourcent] = useState(30);
  const [onglet, setOnglet] = useState<'manuel' | 'ia'>('manuel');
  const [secteurs, setSecteurs] = useState<string[]>([]);
  const [secteurActif, setSecteurActif] = useState<string>('');
  const [showSecteurModal, setShowSecteurModal] = useState(false);
  const cleanNumericInput = (val: string): number => {
    const clean = val.replace(/^0+(\d)/, '$1'); // 01 → 1, 003 → 3
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100; // max 2 décimales
  };
  const [signatureClient, setSignatureClient] = useState<string | null>(null);
  const [lignesMainOeuvre, setLignesMainOeuvre] = useState<LigneMainOeuvre[]>([]);
  const [lignesPieces, setLignesPieces] = useState<LignePiece[]>([]);
  const [nomMainOeuvre, setNomMainOeuvre] = useState('Main d’œuvre');
  const [nomPieces, setNomPieces] = useState('Pièces');
  const [categoriesDynamiques, setCategoriesDynamiques] = useState<CategorieDynamique[]>([]);
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');

  const [signatureEmetteur, setSignatureEmetteur] = useState<string | null>(null);

  const [mode, setMode] = useState<'accueil' | 'devis'>('accueil');
  const [afficherMainOeuvre, setAfficherMainOeuvre] = useState(true);
  const [afficherPieces, setAfficherPieces] = useState(true);
  const lignesPourPDF: { type: 'header' | 'ligne'; contenu?: Ligne }[] = [];
  const [numeroDevis, setNumeroDevis] = useState('');
  const [colonnesCustom, setColonnesCustom] = useState<
    { nom: string; type: 'texte' | 'quantite' | 'prix' | 'prixAvecMarge' }[]
  >([]);

  const [nouvelleColonne, setNouvelleColonne] = useState('');
  const [typeColonne, setTypeColonne] = useState<'texte' | 'quantite' | 'prix' | 'prixAvecMarge'>(
    'texte'
  );
  const [categoriesSauvegardees, setCategoriesSauvegardees] = useState<CategorieSauvegardee[]>([]);

  if (lignesMainOeuvre.length > 0) {
    lignesPourPDF.push({
      type: 'header',
      contenu: { designation: '👷‍♂️ Main d’œuvre', unite: '', quantite: 0, prix: 0 },
    });
    lignesMainOeuvre.forEach(l => {
      const prix = l.mode === 'fixe' ? l.prixFixe : l.prixHoraire * l.heures;
      lignesPourPDF.push({
        type: 'ligne',
        contenu: { designation: l.designation, unite: 'U', quantite: 1, prix },
      });
    });
  }

  if (lignesPieces.length > 0) {
    lignesPourPDF.push({
      type: 'header',
      contenu: { designation: '🔩 Pièces', unite: '', quantite: 0, prix: 0 },
    });
    lignesPieces.forEach(l => {
      const prix = l.prixAchat * (1 + l.margePourcent / 100);
      lignesPourPDF.push({
        type: 'ligne',
        contenu: { designation: l.designation, unite: 'U', quantite: l.quantite, prix },
      });
    });
  }
  useEffect(() => {
    const secteursSauvegardes = localStorage.getItem('secteurs');
    const secteurActifSauvegarde = localStorage.getItem('secteurActif');

    if (secteursSauvegardes) {
      try {
        const parsed = JSON.parse(secteursSauvegardes);
        if (Array.isArray(parsed)) {
          setSecteurs(parsed);

          if (secteurActifSauvegarde && parsed.includes(secteurActifSauvegarde)) {
            setSecteurActif(secteurActifSauvegarde);
            setMode('devis');
            setShowSecteurModal(false);
          } else if (parsed.length > 0) {
            setSecteurActif(parsed[0]);
            setMode('devis');
            setShowSecteurModal(false);
          }
        }
      } catch (e) {
        console.error('Erreur lecture secteurs sauvegardés', e);
      }
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');

    if (modeParam === 'devis') {
      setMode('devis');

      const temp = localStorage.getItem('clientTemp');
      if (temp) {
        try {
          const client = JSON.parse(temp);
          setRecepteur(client);
          setClientTempLoaded(true);
          localStorage.removeItem('clientTemp');
        } catch (e) {
          console.error('Erreur lecture clientTemp :', e);
        }
      }

      // ✅ AJOUTE CE BLOC JUSTE ICI
      const idTemp = localStorage.getItem('client_id_temp');
      if (idTemp) {
        const clientsStr = localStorage.getItem('clients');
        const clients = clientsStr ? JSON.parse(clientsStr) : [];

        const client = clients.find((c: any) => c.client_id === idTemp);
        if (client) {
          setRecepteur(client);
        }

        localStorage.removeItem('client_id_temp');
      }
    }
  }, []);

  useEffect(() => {
    const nomPiecesSauvegarde = localStorage.getItem('nomPieces');
    if (nomPiecesSauvegarde) setNomPieces(nomPiecesSauvegarde);

    const nomMainOeuvreSauvegarde = localStorage.getItem('nomMainOeuvre');
    if (nomMainOeuvreSauvegarde) setNomMainOeuvre(nomMainOeuvreSauvegarde);
  }, []);

  const [deviceScale, setDeviceScale] = useState(1);
  const [hasHydratedFromDevis, setHasHydratedFromDevis] = useState(false);
  const [canSaveEmetteur, setCanSaveEmetteur] = useState(false);
  const [clientTempLoaded, setClientTempLoaded] = useState(false);
  const [clientId, setClientId] = useState(''); // <- pour garder le vrai ID du client
  const lignesFinales: Ligne[] = [
    ...(afficherMainOeuvre
      ? lignesMainOeuvre.map(l => ({
          designation: `[${nomMainOeuvre}] ${l.designation}`,
          unite: 'U',
          quantite: 1,
          prix: l.mode === 'fixe' ? l.prixFixe : l.prixHoraire * l.heures,
        }))
      : []),

    ...(afficherPieces
      ? lignesPieces.map(l => ({
          designation: `[${nomPieces}] ${l.designation}`,
          unite: 'U',
          quantite: l.quantite,
          prix: l.mode === 'manuel' ? l.prixManuel || 0 : l.prixAchat * (1 + l.margePourcent / 100),
        }))
      : []),

    ...categoriesDynamiques
      .filter(c => c.afficher)
      .flatMap(cat =>
        cat.lignes.map(ligne => {
          let prix = 0;
          for (const col of cat.colonnes) {
            if (col.type === 'prix') {
              const quantite = ligne['quantite'] ?? 1;
              const pu = ligne[col.nom] ?? 0;
              prix += pu * quantite;
            } else if (col.type === 'prixAvecMarge') {
              const quantite = ligne['quantite'] ?? 1;
              const achat = ligne[col.nom + '_achat'] ?? 0;
              const marge = ligne[col.nom + '_marge'] ?? 0;
              const pu = achat * (1 + marge / 100);
              prix += pu * quantite;
            }
          }
          return {
            designation: `[${cat.nom}] ${ligne.designation ?? ''}`,
            unite: ligne.unite ?? 'U',
            quantite: 1,
            prix,
          };
        })
      ),
  ];

  const totalHTBrut = lignesFinales.reduce(
    (somme, ligne) => somme + ligne.quantite * ligne.prix,
    0
  );

  const remise = totalHTBrut * (remisePourcent / 100);
  const totalHT = totalHTBrut - remise;
  const tva = totalHT * (tvaTaux / 100);
  const totalTTC = totalHT + tva;
  const acompte = totalTTC * (acomptePourcent / 100);

  // Logo upload
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  useEffect(() => {
    const secteursSauvegardes = localStorage.getItem('secteurs');
    if (secteursSauvegardes) {
      try {
        const parsed = JSON.parse(secteursSauvegardes);
        if (Array.isArray(parsed)) {
          setSecteurs(parsed);

          const secteurSauvegarde = localStorage.getItem('secteurActif');
          if (secteurSauvegarde && parsed.includes(secteurSauvegarde)) {
            setSecteurActif(secteurSauvegarde);
            setShowSecteurModal(false);
            setMode('devis'); // ✅ IMPORTANT
          } else if (parsed.length > 0) {
            setSecteurActif(parsed[0]);
            setShowSecteurModal(false);
            setMode('devis'); // ✅ AUSSI ICI
          }
        }
      } catch (e) {
        console.error('Erreur lecture secteurs sauvegardés', e);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDeviceScale(1 / window.devicePixelRatio);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('secteurs', JSON.stringify(secteurs));
  }, [secteurs]);

  // Sauvegarde localStorage : logo et émetteur
  useEffect(() => {
    const encoreUnDevis = localStorage.getItem('devisEnCours');
    if (encoreUnDevis) return; // 🛑 on ne fait rien si un devis est présent

    const emetteurSauvegarde = localStorage.getItem('emetteur');
    const logoSauvegarde = localStorage.getItem('logo');

    if (emetteurSauvegarde) setEmetteur(JSON.parse(emetteurSauvegarde));
    if (logoSauvegarde) setLogo(logoSauvegarde);
  }, []);

  useEffect(() => {
    localStorage.setItem('emetteur', JSON.stringify(emetteur));
  }, [emetteur]);

  useEffect(() => {
    if (logo) localStorage.setItem('logo', logo);
  }, [logo]);

  // Charger les mentions sauvegardées
  useEffect(() => {
    const mentionsSauvegarde = localStorage.getItem('mentions');
    if (mentionsSauvegarde) setMentions(mentionsSauvegarde);
  }, []);

  // Sauvegarder les mentions à chaque modification
  useEffect(() => {
    localStorage.setItem('mentions', mentions);
  }, [mentions]);

  useEffect(() => {
    if (secteurActif) {
      setTitre(`Devis - Intervention ${secteurActif}`);
    }
  }, [secteurActif]);

  useEffect(() => {
    if (secteurActif) {
      const val = localStorage.getItem(`nomMainOeuvre_${secteurActif}`);
      if (val) setNomMainOeuvre(val);
    }
  }, [secteurActif]);

  useEffect(() => {
    if (secteurActif) {
      const val = localStorage.getItem(`nomPieces_${secteurActif}`);
      if (val) setNomPieces(val);
    }
  }, [secteurActif]);

  useEffect(() => {
    if (secteurActif) {
      localStorage.setItem(`nomMainOeuvre_${secteurActif}`, nomMainOeuvre);
    }
  }, [nomMainOeuvre, secteurActif]);

  useEffect(() => {
    if (secteurActif) {
      localStorage.setItem(`nomPieces_${secteurActif}`, nomPieces);
    }
  }, [nomPieces, secteurActif]);

  useEffect(() => {
    if (secteurActif) {
      const sauvegardes = localStorage.getItem(`tarifs_${secteurActif}`);
      if (sauvegardes) {
        try {
          const parsed = JSON.parse(sauvegardes);
          if (Array.isArray(parsed)) setTarifs(parsed);
        } catch (e) {
          console.error('❌ Erreur lecture tarifs localStorage :', e);
        }
      } else {
        setTarifs([]);
      }

      setTitre(`Devis - Intervention ${secteurActif}`);
    }
  }, [secteurActif]);
  // Sauvegarder les tarifs dans le localStorage

  useEffect(() => {
    if (secteurActif) {
      localStorage.setItem(`tarifs_${secteurActif}`, JSON.stringify(tarifs));
    }
  }, [tarifs, secteurActif]);
  // Charger les secteurs sauvegardés

  useEffect(() => {
    const saved = localStorage.getItem('devisEnCours');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTitre(data.titre || '');
        setLignes(data.lignes || []);
        setIntro(data.intro || '');
        setConclusion(data.conclusion || '');
        setMentions(data.mentions || '');
        setLogo(data.logo || null);
        setEmetteur(data.emetteur || { nom: '', adresse: '', siret: '', email: '', tel: '' });
        setTvaTaux(data.tva_taux || 20);
        setRemisePourcent(data.remise_pourcent || 0);
        setAcomptePourcent(data.acompte_pourcent || 30);
        setRecepteur(data.recepteur || { nom: '', adresse: '', email: '', tel: '' });
        setHasHydratedFromDevis(true);
        localStorage.removeItem('devisEnCours');
        setCanSaveEmetteur(true); // autorise la sauvegarde ensuite
      } catch (err) {
        console.error('Erreur lors de la lecture du devis à réutiliser :', err);
      }
    } else {
      setHasHydratedFromDevis(true); // même s'il n'y a rien, on le signale
    }
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem('categoriesSauvegardees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCategoriesSauvegardees(parsed);
      } catch {}
    }
  }, []);
  useEffect(() => {
    if (secteurActif) {
      localStorage.setItem('secteurActif', secteurActif);
    }
  }, [secteurActif]);

  // Lignes : ajout, modification, suppression

  // Parsing IA

  const parserViaIA = async (texte: string) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/parse-devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devis: texte,
          secteur: secteurActif, // ✅ on envoie bien le secteur utilisé
        }),
      });

      const data = await res.json();
      if (data.parsed) {
        const json = JSON.parse(data.parsed);
        const lignesParsees: Ligne[] = json.lignesFinales.map((ligne: any) => ({
          designation: ligne.designation,
          unite: ligne.unite,
          quantite: parseFloat(ligne.quantite),
          prix: parseFloat(ligne.prix_unitaire),
        }));

        setLignesParseesTemp(lignesParsees);
      } else {
        alert('❌ Erreur de parsing IA.');
      }
    } catch (err) {
      console.error('Erreur parsing IA :', err);
      alert('❌ Erreur serveur lors du parsing.');
    }
  };

  // Génération IA
  const genererAvecIA = async () => {
    setChargementIA(true);
    setDevisIA('');
    try {
      const res = await fetch('http://127.0.0.1:5000/generate-devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, secteur: secteurActif, tarifs }),
      });
      const data = await res.json();
      setDevisIA(data.devis || '⚠️ Aucune réponse reçue.');
    } catch (err) {
      console.error('Erreur :', err);
      setDevisIA('❌ Une erreur est survenue. Vérifie le backend.');
    } finally {
      setChargementIA(false);
    }
  };

  // separation entre home et return

  return (
    <>
      {mode === 'accueil' && (
        <div className="text-center mt-20">
          <h1 className="text-3xl font-bold mb-4">Bienvenue 👋</h1>
          <p className="text-gray-600 mb-6">
            Commencez par choisir un secteur pour générer votre premier devis.
          </p>
          <button
            onClick={() => {
              setShowSecteurModal(true);
              setMode('devis'); // ✅ Ajout indispensable
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow"
          >
            🚀 Commencer
          </button>
        </div>
      )}

      {mode === 'devis' && (
        <main className="min-h-screen p-8 bg-gray-100 font-sans text-black">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 max-w-screen-xl mx-auto">
            <div className="w-full min-w-0 flex flex-col gap-6">
              {/* 🟩 Colonne gauche : Formulaire */}
              <div className="w-full min-w-0 space-y-6">
                {showSecteurModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
                      <h2 className="text-xl font-semibold mb-4">
                        Quels sont vos domaines d'expertise ?
                      </h2>

                      {/* Champ pour ajouter un secteur */}
                      <input
                        type="text"
                        placeholder="Ex : Électricien, Peintre, Photographe..."
                        className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={secteurActif}
                        onChange={e => setSecteurActif(e.target.value)}
                      />

                      <button
                        onClick={() => {
                          const propre = secteurActif.trim();
                          if (propre && !secteurs.includes(propre)) {
                            const updated = [...secteurs, propre];
                            setSecteurs(updated);
                            setSecteurActif(propre); // ✅ garder le dernier choisi
                            localStorage.setItem('secteurs', JSON.stringify(updated));
                            localStorage.setItem('secteurActif', propre); // ✅ fix
                          }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700 w-full"
                      >
                        ➕ Ajouter le métier
                      </button>

                      {/* Liste des secteurs ajoutés avec suppression */}
                      {secteurs.length > 0 && (
                        <>
                          <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {secteurs.map(s => (
                              <div
                                key={s}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border cursor-pointer transition ${
                                  secteurActif === s
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                                }`}
                                onClick={() => setSecteurActif(s)}
                              >
                                <span>{s}</span>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    const updated = secteurs.filter(item => item !== s);
                                    setSecteurs(updated);
                                    localStorage.setItem('secteurs', JSON.stringify(updated));
                                    if (secteurActif === s) {
                                      setSecteurActif(updated[0] || '');
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  title="Supprimer ce métier"
                                >
                                  ❌
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <button
                        disabled={secteurs.length === 0 && secteurActif.trim() === ''}
                        onClick={() => {
                          const propre = secteurActif.trim();
                          let secteurFinal = propre;

                          // Si rien dans le champ mais une liste existe, on prend le premier
                          if (!secteurFinal && secteurs.length > 0) {
                            secteurFinal = secteurs[0];
                          }

                          if (secteurFinal) {
                            // Si nouveau, on l’ajoute
                            if (!secteurs.includes(secteurFinal)) {
                              const updated = [...secteurs, secteurFinal];
                              setSecteurs(updated);
                              localStorage.setItem('secteurs', JSON.stringify(updated));
                            }

                            setSecteurActif(secteurFinal);
                            localStorage.setItem('secteurActif', secteurFinal);
                            setMode('devis');
                            setShowSecteurModal(false);
                          } else {
                            alert('❌ Merci de renseigner un métier valide.');
                          }
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 w-full"
                      >
                        ✅ Valider et continuer
                      </button>

                      <p className="text-sm text-gray-500 mb-2">
                        🛠️ Vous pourrez modifier ou supprimer vos métiers à tout moment.
                      </p>
                    </div>
                  </div>
                )}

                <h1 className="text-3xl font-bold mb-6 text-center">🧾 Génère ton devis</h1>

                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => setShowSecteurModal(true)}
                    className="text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    Modifier le secteur ({secteurActif})
                  </button>
                </div>

                <div className="w-full flex flex-col space-y-8">
                  <Card title="Logo de l’entreprise (optionnel)" className="w-full">
                    <div className="flex flex-col gap-6">
                      {!logo && (
                        <div className="flex flex-col items-start gap-2">
                          <label htmlFor="logo-upload" className="text-sm font-medium">
                            Uploader un fichier image
                          </label>
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="inline-block cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm py-2 px-4 rounded border border-blue-200"
                          >
                            📁 Choisir un fichier
                          </label>
                        </div>
                      )}

                      {logo && (
                        <div className="flex flex-col gap-4">
                          <img
                            src={logo}
                            alt="Logo"
                            className="rounded shadow"
                            style={{
                              height: `${hauteurLogo}px`,
                              maxHeight: '300px',
                              objectFit: 'contain',
                              maxWidth: '100%',
                            }}
                          />

                          <div className="w-full">
                            <label className="block text-sm font-medium text-center mb-2">
                              Taille du logo :{' '}
                              <span className="font-semibold text-blue-600">{hauteurLogo}px</span>
                            </label>
                            <div className="relative w-full">
                              <input
                                type="range"
                                min="80"
                                max="300"
                                value={hauteurLogo}
                                onChange={e => setHauteurLogo(Number(e.target.value))}
                                className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <style jsx>{`
                              input[type='range'].slider-thumb-visible::-webkit-slider-thumb {
                                -webkit-appearance: none;
                                height: 20px;
                                width: 20px;
                                margin-top: -9px; /* centre le thumb */
                                background: white;
                                border: 2px solid #2563eb;
                                border-radius: 50%;
                                cursor: pointer;
                              }

                              input[type='range'].slider-thumb-visible::-moz-range-thumb {
                                height: 20px;
                                width: 20px;
                                background: white;
                                border: 2px solid #2563eb;
                                border-radius: 50%;
                                cursor: pointer;
                              }

                              input[type='range'].slider-thumb-visible::-ms-thumb {
                                height: 20px;
                                width: 20px;
                                background: white;
                                border: 2px solid #2563eb;
                                border-radius: 50%;
                                cursor: pointer;
                              }

                              input[type='range'].slider-thumb-visible::-webkit-slider-runnable-track {
                                height: 2px;
                                background: #e5e7eb;
                                border-radius: 999px;
                              }

                              input[type='range'].slider-thumb-visible::-moz-range-track {
                                height: 2px;
                                background: #e5e7eb;
                                border-radius: 999px;
                              }

                              input[type='range'].slider-thumb-visible::-ms-track {
                                height: 2px;
                                background: #e5e7eb;
                                border-radius: 999px;
                                border-color: transparent;
                                color: transparent;
                              }
                            `}</style>
                          </div>

                          <button
                            onClick={() => {
                              setLogo(null);
                              localStorage.removeItem('logo');
                            }}
                            className="text-red-600 hover:text-red-800 text-sm underline text-center"
                          >
                            🗑️ Supprimer le logo
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card title="📤 Informations de l'émetteur">
                      <div className="flex flex-col gap-4">
                        <label className="block font-medium">Nom de l'entreprise</label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          type="text"
                          inputMode="text"
                          autoComplete="organization"
                          aria-label="Nom de l'entreprise"
                          placeholder={`Ex : ${
                            secteurActif ? secteurActif + ' Martin' : 'Mon entreprise'
                          }`}
                          value={emetteur.nom}
                          onChange={e => setEmetteur({ ...emetteur, nom: e.target.value })}
                        />

                        <label className="block font-medium">Adresse</label>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoComplete="street-address"
                          aria-label="Adresse de l'entreprise"
                          placeholder="Ex : 12 rue des Lilas, 75000 Paris"
                          value={emetteur.adresse}
                          rows={2}
                          onChange={e => setEmetteur({ ...emetteur, adresse: e.target.value })}
                        />

                        <label className="block font-medium">SIRET</label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          inputMode="numeric"
                          autoComplete="off"
                          aria-label="Numéro SIRET"
                          placeholder="Ex : 123 456 789 00010"
                          value={emetteur.siret}
                          onChange={e => setEmetteur({ ...emetteur, siret: e.target.value })}
                        />

                        <label className="block font-medium">Email</label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          aria-label="Email de l'entreprise"
                          placeholder={`Ex : contact@${
                            secteurActif
                              ? secteurActif.toLowerCase().replace(/\s/g, '')
                              : 'monentreprise'
                          }.fr`}
                          value={emetteur.email}
                          onChange={e => setEmetteur({ ...emetteur, email: e.target.value })}
                        />

                        <label className="block font-medium">Téléphone</label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          aria-label="Téléphone de l'entreprise"
                          placeholder="Ex : 01 23 45 67 89"
                          value={emetteur.tel}
                          onChange={e => setEmetteur({ ...emetteur, tel: e.target.value })}
                        />
                        <label className="block font-medium">IBAN</label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          type="text"
                          placeholder="Ex : FR76 1234 5678 9012 3456 7890 123"
                          value={iban}
                          onChange={e => setIban(e.target.value)}
                        />

                        <label className="block font-medium">BIC</label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          type="text"
                          placeholder="Ex : AGRIFRPP"
                          value={bic}
                          onChange={e => setBic(e.target.value)}
                        />

                        <button
                          onClick={() => {
                            localStorage.removeItem('emetteur');
                            localStorage.removeItem('logo');
                            setEmetteur({ nom: '', adresse: '', siret: '', email: '', tel: '' });
                            setLogo(null);
                          }}
                          className="text-sm text-red-600 underline hover:text-red-800 transition-colors cursor-pointer"
                        >
                          🔄 Réinitialiser les infos enregistrées
                        </button>
                      </div>
                    </Card>

                    <Card title="📥 Informations du client">
                      <div className="flex flex-col gap-4">
                        <label className="block font-medium">Nom du client</label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          type="text"
                          inputMode="text"
                          autoComplete="name"
                          aria-label="Nom du client"
                          placeholder="Ex : Jean Dupont"
                          value={recepteur.nom}
                          onChange={e => setRecepteur({ ...recepteur, nom: e.target.value })}
                        />

                        <label className="block font-medium">Adresse du client</label>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoComplete="street-address"
                          aria-label="Adresse du client"
                          placeholder="Ex : 7 avenue de la République, 75011 Paris"
                          value={recepteur.adresse}
                          rows={2}
                          onChange={e => setRecepteur({ ...recepteur, adresse: e.target.value })}
                        />

                        <label className="block font-medium">Email du client</label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          aria-label="Email du client"
                          placeholder="Ex : jean.dupont@email.com"
                          value={recepteur.email}
                          onChange={e => setRecepteur({ ...recepteur, email: e.target.value })}
                        />

                        <label className="block font-medium">Téléphone du client</label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          aria-label="Téléphone du client"
                          placeholder="Ex : 06 78 90 12 34"
                          value={recepteur.tel}
                          onChange={e => setRecepteur({ ...recepteur, tel: e.target.value })}
                        />
                      </div>
                      <button
                        onClick={() => {
                          try {
                            // 🔒 Vérif basique
                            if (!recepteur.nom.trim() || !recepteur.email.trim()) {
                              alert(
                                '❌ Merci de renseigner au minimum un nom **et un email** pour le client.'
                              );
                              return;
                            }

                            const clientsStr = localStorage.getItem('clients');
                            const clients = clientsStr ? JSON.parse(clientsStr) : [];

                            const generatedId = `${recepteur.nom.trim()}-${recepteur.email.trim()}`;

                            const nouveauClient = {
                              ...recepteur,
                              client_id: generatedId,
                              date: new Date().toISOString(),
                            };

                            const existeDeja = clients.some(
                              (c: any) =>
                                c.nom === nouveauClient.nom && c.email === nouveauClient.email
                            );

                            if (!existeDeja) {
                              clients.push(nouveauClient);
                              localStorage.setItem('clients', JSON.stringify(clients));
                              alert('✅ Infos client enregistrées !');
                            } else {
                              alert('ℹ️ Client déjà enregistré.');
                            }

                            // ✅ On applique l'ID seulement à la fin, si tout est bon
                            localStorage.setItem('client_id_temp', generatedId);
                          } catch (e) {
                            alert('❌ Erreur lors de la sauvegarde :');
                            alert("Erreur lors de l'enregistrement du client.");
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm w-full mb-2"
                      >
                        💾 Enregistrer les infos client
                      </button>

                      <button
                        onClick={() => {
                          window.location.href = '/clients';
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm w-full"
                      >
                        📁 Voir les infos client enregistrées
                      </button>
                    </Card>
                  </div>

                  <Card title="📝 Titre du devis & Sélection du secteur">
                    <div className="flex flex-col gap-4">
                      {/* Titre personnalisable */}
                      <input
                        className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={titre}
                        onChange={e => setTitre(e.target.value)}
                        placeholder="Titre du devis"
                      />

                      {/* Menu déroulant de sélection */}
                      <label className="block font-medium">Secteur sélectionné</label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={secteurActif}
                        onChange={e => setSecteurActif(e.target.value)}
                      >
                        {secteurs.map(s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      {/* Liste visuelle des métiers avec suppression */}
                      <div className="flex flex-wrap gap-2">
                        {secteurs.map(s => (
                          <div
                            key={s}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition cursor-pointer ${
                              secteurActif === s
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                            }`}
                            onClick={() => setSecteurActif(s)}
                          >
                            <span>{s}</span>
                            <button
                              onClick={e => {
                                e.stopPropagation(); // éviter le setSecteurActif
                                const updated = secteurs.filter(item => item !== s);
                                setSecteurs(updated);
                                localStorage.setItem('secteurs', JSON.stringify(updated));
                                if (secteurActif === s) {
                                  setSecteurActif(updated[0] || '');
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                              title="Supprimer ce métier"
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Choix entre mode manuel ou IA */}
                      {false && (
                        <div className="flex gap-4 mt-2">
                          <button
                            onClick={() => setOnglet('manuel')}
                            className={`cursor-pointer px-4 py-2 rounded-md text-sm border transition-colors ${
                              onglet === 'manuel'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300'
                            }`}
                          >
                            📝 Lignes manuelles
                          </button>
                          <button
                            onClick={() => setOnglet('ia')}
                            className={`cursor-pointer px-4 py-2 rounded-md text-sm border transition-colors ${
                              onglet === 'ia'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300'
                            }`}
                          >
                            🤖 Génération IA
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                  <Card title="🧾 Numéro du devis">
                    <input
                      className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={numeroDevis}
                      onChange={e => setNumeroDevis(e.target.value)}
                      placeholder="Ex : DEV-2025-001"
                    />
                  </Card>

                  {onglet === 'manuel' && (
                    <div className="flex flex-col gap-6">
                      {/* 🟩 Bloc classique : main d'œuvre + pièces */}
                      <Card title="📁 Détail des prestations">
                        <p className="text-sm text-gray-500 mb-2">
                          👷 Vous pouvez adapter le nom de cette catégorie selon votre activité : «
                          main d’œuvre », « prestation », « services », etc en appuyant bien sur
                          Entrée à la fin de la saisie. Cette modification sera enregistrée pour vos
                          prochains devis. Si vous n'en avez pas besoin, décocher "Afficher dans le
                          pdf".
                        </p>
                        <BlocMainOeuvre
                          lignes={lignesMainOeuvre}
                          setLignes={setLignesMainOeuvre}
                          afficher={afficherMainOeuvre}
                          setAfficher={setAfficherMainOeuvre}
                          nomCategorie={nomMainOeuvre}
                          setNomCategorie={setNomMainOeuvre}
                          secteurActif={secteurActif}
                        />

                        {/* Trait de séparation entre main d'œuvre et pièces */}
                        <div className="w-full h-[1px] bg-gray-300 my-6" />
                        <p className="text-sm text-gray-500 mb-2">
                          🧰 Vous pouvez personnaliser le nom de chaque catégorie selon votre métier
                          : « pièces », « matériaux », « fournitures »… en appuyant bien sur Entrée
                          à la fin de la saisie. Cette modification sera enregistrée pour vos
                          prochains devis. Si vous n'en avez pas besoin, décocher "Afficher dans le
                          pdf".
                        </p>
                        <BlocPieces
                          lignes={lignesPieces}
                          setLignes={setLignesPieces}
                          afficher={afficherPieces}
                          setAfficher={setAfficherPieces}
                          nomCategorie={nomPieces}
                          setNomCategorie={setNomPieces}
                          secteurActif={secteurActif}
                        />
                      </Card>

                      {/* 🟦 Bloc séparé : catégories dynamiques */}
                      <Card title="📦 Catégories personnalisées">
                        {categoriesDynamiques.map((cat, index) => (
                          <div key={index}>
                            <BlocCategorie
                              categorie={cat}
                              onUpdate={updatedCat => {
                                const copie = [...categoriesDynamiques];
                                copie[index] = updatedCat;
                                setCategoriesDynamiques(copie);
                              }}
                              onDelete={() => {
                                const copie = [...categoriesDynamiques];
                                copie.splice(index, 1);
                                setCategoriesDynamiques(copie);
                              }}
                            />

                            {/* ✅ Bouton de sauvegarde déporté ici */}
                            <button
                              className="text-sm text-blue-600 hover:text-blue-800 underline mt-2"
                              onClick={() => {
                                const cat = categoriesDynamiques[index];

                                if (!cat.nom || cat.colonnes.length === 0) {
                                  alert('❌ Le nom ou les colonnes sont vides.');
                                  return;
                                }

                                const copie = [...categoriesSauvegardees];
                                const indexExistante = copie.findIndex(c => c.nom === cat.nom);

                                if (indexExistante !== -1) {
                                  const confirmer = window.confirm(
                                    `🔁 Une catégorie « ${cat.nom} » existe déjà.
Voulez-vous la remplacer avec les colonnes et les prestations actuelles (cela écrasera l’ancienne version) ?`
                                  );
                                  if (!confirmer) return;

                                  copie[indexExistante] = {
                                    nom: cat.nom,
                                    colonnes: [...cat.colonnes],
                                    lignes: [...cat.lignes],
                                    emoji: cat.emoji,
                                  };
                                } else {
                                  copie.push({
                                    nom: cat.nom,
                                    colonnes: [...cat.colonnes],
                                    lignes: [...cat.lignes],
                                    emoji: cat.emoji,
                                  });
                                }

                                setCategoriesSauvegardees(copie);
                                localStorage.setItem(
                                  'categoriesSauvegardees',
                                  JSON.stringify(copie)
                                );
                                alert('✅ Catégorie enregistrée.');
                              }}
                            >
                              💾 Sauvegarder cette catégorie et ces prestations
                            </button>

                            {/* Trait de séparation sauf après la dernière */}
                            {index < categoriesDynamiques.length - 1 && (
                              <div className="flex justify-center">
                                <div className="h-1 w-3/4 bg-gray-300 my-10 rounded-full" />
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Ajout d'une nouvelle catégorie */}
                        <div className="mt-10">
                          <h3 className="text-md font-semibold text-gray-700 mb-2">
                            ➕ Ajouter une catégorie personnalisée
                          </h3>
                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                            <input
                              type="text"
                              value={nouvelleCategorie}
                              onChange={e => setNouvelleCategorie(e.target.value)}
                              className="w-full sm:w-auto flex-grow p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ex : Location, Transport, Divers"
                            />
                            <button
                              onClick={() => {
                                const nom = nouvelleCategorie.trim();
                                if (!nom) return;

                                setCategoriesDynamiques([
                                  ...categoriesDynamiques,
                                  {
                                    nom,
                                    colonnes: [
                                      { nom: 'Désignation', type: 'texte' },
                                      { nom: 'Quantité', type: 'quantite' },
                                      { nom: 'Prix', type: 'prixAvecMarge' },
                                    ],
                                    lignes: [],
                                    afficher: true,
                                  },
                                ]);
                                setNouvelleCategorie('');
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
                            >
                              ➕ Ajouter
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Les colonnes par défaut seront : designation (texte), quantite
                            (numérique) et prix (avec marge).
                          </p>
                        </div>
                      </Card>

                      <Card title="📂 Catégories enregistrées">
                        {categoriesSauvegardees.length === 0 && (
                          <p className="text-sm text-gray-500">
                            Aucune catégorie enregistrée pour l'instant.
                          </p>
                        )}
                        <div className="flex flex-col gap-2">
                          {categoriesSauvegardees.map((cat, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center border border-gray-300 bg-white shadow-sm p-3 rounded-lg"
                            >
                              <span>
                                {cat.emoji} {cat.nom}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                  onClick={() =>
                                    setCategoriesDynamiques([
                                      ...categoriesDynamiques,
                                      {
                                        nom: cat.nom,
                                        colonnes: [...cat.colonnes],
                                        lignes: cat.lignes ? cat.lignes.map(l => ({ ...l })) : [],
                                        afficher: true,
                                        emoji: cat.emoji,
                                      },
                                    ])
                                  }
                                >
                                  ➕ Ajouter
                                </button>

                                {/* ✅ BOUTON SUPPRIMER */}
                                <button
                                  className="text-sm bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                  onClick={() => {
                                    const confirmer = window.confirm(
                                      `❌ Supprimer la catégorie "${cat.nom}" ?`
                                    );
                                    if (!confirmer) return;

                                    const copie = [...categoriesSauvegardees];
                                    copie.splice(index, 1);
                                    setCategoriesSauvegardees(copie);
                                    localStorage.setItem(
                                      'categoriesSauvegardees',
                                      JSON.stringify(copie)
                                    );
                                    alert('🗑️ Catégorie supprimée.');
                                  }}
                                >
                                  ❌
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  )}

                  {false && (
                    <Card title="🤖 Génération IA">
                      <div className="flex flex-col gap-4">
                        <label className="block font-medium mb-1">
                          Brief de la prestation (pour génération IA)
                        </label>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Brief de la prestation"
                          placeholder="Ex : Pose d’un chauffe-eau 200L mural avec déplacement évier"
                          value={brief}
                          onChange={e => setBrief(e.target.value)}
                        />

                        <h2 className="text-lg font-semibold mb-2">
                          🔧 Tarifs de référence pour l’IA
                        </h2>
                        <table className="w-full text-sm border mb-2">
                          <thead className="bg-gray-200">
                            <tr>
                              <th className="p-2 border">Désignation</th>
                              <th className="p-2 border">Unité</th>
                              <th className="p-2 border">Prix unitaire (€ HT)</th>
                              <th className="p-2 border">Suppr.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tarifs.map((tarif, index) => (
                              <tr key={index}>
                                <td className="p-2 border">
                                  <input
                                    className="w-full p-3 text-base"
                                    type="text"
                                    inputMode="text"
                                    autoComplete="off"
                                    aria-label={`Désignation tarif ${index + 1}`}
                                    value={tarif.designation}
                                    onChange={e => {
                                      const updated = [...tarifs];
                                      updated[index].designation = e.target.value;
                                      setTarifs(updated);
                                    }}
                                  />
                                </td>
                                <td className="p-2 border">
                                  <input
                                    className="w-full p-3 text-base"
                                    type="text"
                                    inputMode="text"
                                    autoComplete="off"
                                    aria-label={`Unité tarif ${index + 1}`}
                                    value={tarif.unite}
                                    onChange={e => {
                                      const updated = [...tarifs];
                                      updated[index].unite = e.target.value;
                                      setTarifs(updated);
                                    }}
                                  />
                                </td>
                                <td className="p-2 border">
                                  <input
                                    type="number"
                                    className="w-full p-3 text-base"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    aria-label={`Prix unitaire tarif ${index + 1}`}
                                    value={tarif.prix}
                                    onChange={e => {
                                      const updated = [...tarifs];
                                      updated[index].prix = parseFloat(e.target.value) || 0;
                                      setTarifs(updated);
                                    }}
                                  />
                                </td>
                                <td className="p-2 border text-center">
                                  <button
                                    className="text-red-600 hover:text-red-800 text-sm"
                                    onClick={() => {
                                      const updated = [...tarifs];
                                      updated.splice(index, 1);
                                      setTarifs(updated);
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <button
                          className="cursor-pointer bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
                          onClick={() =>
                            setTarifs([...tarifs, { designation: '', unite: 'U', prix: 0 }])
                          }
                        >
                          ➕ Ajouter un tarif
                        </button>

                        <button
                          onClick={genererAvecIA}
                          disabled={!brief || chargementIA}
                          className={`cursor-pointer mt-4 px-4 py-2 rounded text-white ${
                            chargementIA ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          🤖 Générer automatiquement avec IA
                        </button>

                        {false && (
                          <>
                            <pre className="mt-4 whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm border">
                              {devisIA}
                            </pre>
                            <button
                              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                              onClick={async () => await parserViaIA(devisIA)}
                            >
                              📥 Insérer dans le tableau
                            </button>

                            {lignesParseesTemp && lignes.length > 0 && (
                              <div className="mt-4 flex gap-4">
                                <button
                                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                  onClick={() => {
                                    if (lignesParseesTemp) setLignes(lignesParseesTemp);

                                    setLignesParseesTemp(null);
                                  }}
                                >
                                  🔄 Remplacer les lignes existantes
                                </button>

                                <button
                                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                  onClick={() => {
                                    if (lignesParseesTemp)
                                      setLignes([...lignes, ...lignesParseesTemp]);

                                    setLignesParseesTemp(null);
                                  }}
                                >
                                  ➕ Ajouter aux lignes existantes
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </Card>
                  )}
                  <Card title="⚖️ Mentions légales & paramètres fiscaux">
                    <div className="flex flex-col gap-4">
                      <label className="block font-medium mb-1">Mentions légales</label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex : Devis valable 15 jours..."
                        value={mentions}
                        onChange={e => setMentions(e.target.value)}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-medium mb-1">TVA (%)</label>
                          <span
                            className="test-blue-600 cursor-help"
                            title="Taux de TVA appliqué sur le total HT"
                          >
                            ℹ️
                          </span>
                          <input
                            type="number"
                            onWheel={e => e.currentTarget.blur()}
                            className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={tvaTaux.toString()}
                            onChange={e => setTvaTaux(cleanNumericInput(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">Remise (%)</label>
                          <span
                            className="text-blue-600 cursor-help"
                            title="Réduction appliquée sur le montant HT avant TVA"
                          >
                            ℹ️
                          </span>
                          <input
                            type="number"
                            onWheel={e => e.currentTarget.blur()}
                            className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={remisePourcent.toString()}
                            onChange={e => setRemisePourcent(cleanNumericInput(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">Acompte (%)</label>
                          <span
                            className="text-blue-600 cursor-help"
                            title="Pourcentage demandé en avance sur le total TTC"
                          >
                            ℹ️
                          </span>
                          <input
                            type="number"
                            onWheel={e => e.currentTarget.blur()}
                            className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={acomptePourcent.toString()}
                            onChange={e => setAcomptePourcent(cleanNumericInput(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Paragraphe d'introduction */}
                  <Card title="✍️ Texte d’introduction & conclusion">
                    <div className="flex flex-col gap-4">
                      <label className="block font-medium mt-6 mb-1">
                        Texte d’introduction (facultatif)
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex : Merci pour votre confiance, voici le détail de notre proposition..."
                        value={intro}
                        onChange={e => setIntro(e.target.value)}
                      />

                      {/* Paragraphe de conclusion */}
                      <label className="block font-medium mt-6 mb-1">
                        Remarques ou informations complémentaires (facultatif)
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex : N'hésitez pas à nous contacter pour toute question complémentaire."
                        value={conclusion}
                        onChange={e => setConclusion(e.target.value)}
                      />
                    </div>
                  </Card>

                  <Card title="🖊️ Signatures numériques">
                    <div className="flex flex-col gap-6">
                      <SignatureBlock
                        label="✍️ Signature du client"
                        value={signatureClient}
                        onChange={setSignatureClient}
                      />
                      <SignatureBlock
                        label="✍️ Signature de l’émetteur"
                        value={signatureEmetteur}
                        onChange={setSignatureEmetteur}
                      />
                    </div>
                  </Card>

                  {/* Bouton fixe en bas à gauche */}
                  {mode === 'devis' && !showSecteurModal && (
                    <div className="sticky bottom-4 left-4 z-50">
                      <button
                        onClick={async () => {
                          try {
                            // ✅ Vérifs de base
                            if (!recepteur.nom.trim() || !recepteur.email.trim()) {
                              alert('❌ Nom ou email manquant.');
                              return;
                            }

                            if (!lignesFinales || lignesFinales.length === 0) {
                              alert('❌ Aucune ligne dans le devis.');
                              return;
                            }

                            // ✅ Gestion client
                            const clientsStr = localStorage.getItem('clients');
                            const clients = clientsStr ? JSON.parse(clientsStr) : [];

                            const clientExistant = clients.find(
                              (c: any) =>
                                c.nom.trim() === recepteur.nom.trim() &&
                                c.email.trim() === recepteur.email.trim()
                            );

                            const client_id_final =
                              clientExistant?.client_id ||
                              `${recepteur.nom.trim()}-${recepteur.email.trim()}`;

                            const nouveauClient = {
                              ...recepteur,
                              client_id: client_id_final,
                              date: new Date().toISOString(),
                            };

                            if (!clientExistant) {
                              clients.push(nouveauClient);
                              localStorage.setItem('clients', JSON.stringify(clients));
                            }

                            // ✅ Sauvegarde backend (si disponible)
                            try {
                              await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/sauvegarder-devis-final`,
                                {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    titre,
                                    lignesFinales,
                                    total_ht_brut: totalHTBrut,
                                    remise,
                                    total_ht: totalHT,
                                    tva,
                                    total_ttc: totalTTC,
                                    acompte,
                                    tva_taux: tvaTaux,
                                    remise_pourcent: remisePourcent,
                                    acompte_pourcent: acomptePourcent,
                                    mentions,
                                    intro,
                                    conclusion,
                                    emetteur,
                                    recepteur,
                                    logo,
                                    client_id: client_id_final,
                                  }),
                                }
                              );
                            } catch (err) {
                              console.warn('⚠️ Erreur sauvegarde backend :', err);
                            }

                            // ✅ Sauvegarde historique local
                            const historiqueStr = localStorage.getItem('devisHistorique');
                            const historique = historiqueStr ? JSON.parse(historiqueStr) : [];

                            historique.push({
                              titre,
                              lignesFinales,
                              total_ht_brut: totalHTBrut,
                              remise,
                              total_ht: totalHT,
                              tva,
                              total_ttc: totalTTC,
                              acompte,
                              tva_taux: tvaTaux,
                              remise_pourcent: remisePourcent,
                              acompte_pourcent: acomptePourcent,
                              mentions,
                              intro,
                              conclusion,
                              emetteur,
                              recepteur,
                              logo,
                              client_id: client_id_final,
                              date: new Date().toISOString(),
                              numeroDevis,
                            });

                            localStorage.setItem('devisHistorique', JSON.stringify(historique));

                            await new Promise(resolve => setTimeout(resolve, 0)); // React flush

                            const devisElement = document.getElementById('devis-final');
                            if (!devisElement) {
                              alert('❌ Impossible de trouver le bloc #devis-final.');
                              return;
                            }
                            const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: white;
        width: 100%;
        height: 100%;
      }

      * {
        font-family: Arial, sans-serif;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      #devis-final {
        width: 794px; /* A4 largeur en px à 96dpi */
        min-height: 1123px; /* A4 hauteur */
        margin: 0 auto;
        padding: 32px;
        background: white;
        box-shadow: 0 0 0 transparent; /* pour éviter bordures dans PDF */
      }
    </style>
  </head>
  <body>
    ${devisElement.outerHTML}
  </body>
</html>
`;

                            console.log('🚀 HTML envoyé au backend :', html.slice(0, 300));
                            console.log('📡 URL API :', process.env.NEXT_PUBLIC_API_URL);

                            const res = await fetch(
                              `${process.env.NEXT_PUBLIC_API_URL}/generate-pdf`,
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  html,
                                  filename: `devis-${numeroDevis || 'sans-numero'}.pdf`,
                                }),
                              }
                            );

                            console.log('⬅️ Statut réponse PDF :', res.status);
                            if (!res.ok) {
                              const text = await res.text();
                              console.error('❌ Erreur backend :', res.status, text);
                              alert('❌ Le serveur PDF a retourné une erreur.');
                              return;
                            }

                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `devis-${numeroDevis || 'sans-numero'}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);

                            alert('✅ Devis exporté avec succès !');
                          } catch (e) {
                            alert('❌ Erreur complète lors de l’export.');
                            console.error(e);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-3 rounded-xl shadow flex items-center justify-center gap-2"
                      >
                        Exporter le deviss
                      </button>
                    </div>
                  )}

                  {/* Résumé des totaux */}

                  {/* Bouton d'export PDF */}

                  <Card title="📤 Export & Historique">
                    <div className="flex flex-col gap-4">
                      <button
                        onClick={async () => {
                          try {
                            // ✅ Vérifs de base
                            if (!recepteur.nom.trim() || !recepteur.email.trim()) {
                              alert('❌ Nom ou email manquant.');
                              return;
                            }

                            if (!lignesFinales || lignesFinales.length === 0) {
                              alert('❌ Aucune ligne dans le devis.');
                              return;
                            }

                            // ✅ Gestion client
                            const clientsStr = localStorage.getItem('clients');
                            const clients = clientsStr ? JSON.parse(clientsStr) : [];

                            const clientExistant = clients.find(
                              (c: any) =>
                                c.nom.trim() === recepteur.nom.trim() &&
                                c.email.trim() === recepteur.email.trim()
                            );

                            const client_id_final =
                              clientExistant?.client_id ||
                              `${recepteur.nom.trim()}-${recepteur.email.trim()}`;

                            const nouveauClient = {
                              ...recepteur,
                              client_id: client_id_final,
                              date: new Date().toISOString(),
                            };

                            if (!clientExistant) {
                              clients.push(nouveauClient);
                              localStorage.setItem('clients', JSON.stringify(clients));
                            }

                            // ✅ Sauvegarde backend (si disponible)
                            try {
                              await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/sauvegarder-devis-final`,
                                {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    titre,
                                    lignesFinales,
                                    total_ht_brut: totalHTBrut,
                                    remise,
                                    total_ht: totalHT,
                                    tva,
                                    total_ttc: totalTTC,
                                    acompte,
                                    tva_taux: tvaTaux,
                                    remise_pourcent: remisePourcent,
                                    acompte_pourcent: acomptePourcent,
                                    mentions,
                                    intro,
                                    conclusion,
                                    emetteur,
                                    recepteur,
                                    logo,
                                    client_id: client_id_final,
                                  }),
                                }
                              );
                            } catch (err) {
                              console.warn('⚠️ Erreur sauvegarde backend :', err);
                            }

                            // ✅ Sauvegarde historique local
                            const historiqueStr = localStorage.getItem('devisHistorique');
                            const historique = historiqueStr ? JSON.parse(historiqueStr) : [];

                            historique.push({
                              titre,
                              lignesFinales,
                              total_ht_brut: totalHTBrut,
                              remise,
                              total_ht: totalHT,
                              tva,
                              total_ttc: totalTTC,
                              acompte,
                              tva_taux: tvaTaux,
                              remise_pourcent: remisePourcent,
                              acompte_pourcent: acomptePourcent,
                              mentions,
                              intro,
                              conclusion,
                              emetteur,
                              recepteur,
                              logo,
                              client_id: client_id_final,
                              date: new Date().toISOString(),
                              numeroDevis,
                            });

                            localStorage.setItem('devisHistorique', JSON.stringify(historique));

                            await new Promise(resolve => setTimeout(resolve, 0)); // React flush

                            const devisElement = document.getElementById('devis-final');
                            if (!devisElement) {
                              alert('❌ Impossible de trouver le bloc #devis-final.');
                              return;
                            }
                            const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: white;
        width: 100%;
        height: 100%;
      }

      * {
        font-family: Arial, sans-serif;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      #devis-final {
        width: 794px; /* A4 largeur en px à 96dpi */
        min-height: 1123px; /* A4 hauteur */
        margin: 0 auto;
        padding: 32px;
        background: white;
        box-shadow: 0 0 0 transparent; /* pour éviter bordures dans PDF */
      }
    </style>
  </head>
  <body>
    ${devisElement.outerHTML}
  </body>
</html>
`;

                            console.log('🚀 HTML envoyé au backend :', html.slice(0, 300));
                            console.log('📡 URL API :', process.env.NEXT_PUBLIC_API_URL);

                            const res = await fetch(
                              `${process.env.NEXT_PUBLIC_API_URL}/generate-pdf`,
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  html,
                                  filename: `devis-${numeroDevis || 'sans-numero'}.pdf`,
                                }),
                              }
                            );

                            console.log('⬅️ Statut réponse PDF :', res.status);
                            if (!res.ok) {
                              const text = await res.text();
                              console.error('❌ Erreur backend :', res.status, text);
                              alert('❌ Le serveur PDF a retourné une erreur.');
                              return;
                            }

                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `devis-${numeroDevis || 'sans-numero'}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);

                            alert('✅ Devis exporté avec succès !');
                          } catch (e) {
                            alert('❌ Erreur complète lors de l’export.');
                            console.error(e);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-3 rounded-xl shadow flex items-center justify-center gap-2"
                      >
                        Exporter le deviss
                      </button>
                      <div className="flex justify-center mt-4">
                        <Link href="/historique">
                          <button className="bg-gray-100 hover:bg-gray-200 text-sm text-gray-800 px-4 py-2 rounded-md border border-gray-300 shadow-sm">
                            📁 Voir l’historique des devis
                          </button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-[794px] shrink-0">
              <div className="sticky top-8">
                <div
                  id="devis-final"
                  style={{
                    width: '794px',
                    minHeight: '1123px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    padding: '24px',
                    fontSize: '14px',
                    fontFamily: 'sans-serif',
                    border: '1px solid #e5e7eb',

                    borderRadius: '12px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    margin: '0 auto',
                    // transform: `scale(${deviceScale})`,
                    transform: 'none',

                    transformOrigin: 'top left',
                  }}
                >
                  {/* Header logo + date */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '24px',
                    }}
                  >
                    {logo && (
                      <img
                        src={logo}
                        alt="Logo"
                        style={{
                          height: `${hauteurLogo}px`,
                          objectFit: 'contain',
                          maxWidth: '200px',
                        }}
                      />
                    )}
                    <div style={{ color: '#666', fontSize: '12px', textAlign: 'right' }}>
                      {new Date().toLocaleDateString('fr-FR')}
                      <br />
                      {numeroDevis && (
                        <span style={{ fontWeight: 'bold', color: '#333' }}>
                          Devis n° {numeroDevis}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Infos Émetteur / Client */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '24px',
                    }}
                  >
                    <div style={{ width: '50%' }}>
                      <strong>Émetteur :</strong>
                      <p style={{ margin: '4px 0' }}>{emetteur.nom}</p>
                      {emetteur.adresse && <p style={{ margin: '4px 0' }}>{emetteur.adresse}</p>}
                      {emetteur.siret && (
                        <p style={{ margin: '4px 0' }}>SIRET : {emetteur.siret}</p>
                      )}
                      {emetteur.email && <p style={{ margin: '4px 0' }}>{emetteur.email}</p>}
                      {emetteur.tel && <p style={{ margin: '4px 0' }}>{emetteur.tel}</p>}
                      {iban && <p style={{ margin: '4px 0' }}>IBAN : {iban}</p>}
                      {bic && <p style={{ margin: '4px 0' }}>BIC : {bic}</p>}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong>Client :</strong>
                      <p style={{ margin: '4px 0' }}>{recepteur.nom}</p>
                      {recepteur.adresse && <p style={{ margin: '4px 0' }}>{recepteur.adresse}</p>}
                      {recepteur.email && <p style={{ margin: '4px 0' }}>{recepteur.email}</p>}
                      {recepteur.tel && <p style={{ margin: '4px 0' }}>{recepteur.tel}</p>}
                    </div>
                  </div>

                  {/* Titre */}
                  <h1 style={{ fontSize: '20px', marginBottom: '16px' }}>{titre}</h1>

                  {/* Texte d'introduction */}
                  {intro && (
                    <p style={{ fontStyle: 'italic', marginBottom: '16px' }}>
                      {intro.split('\n').map((line, index) => (
                        <span key={index}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </p>
                  )}

                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginTop: '24px',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                    }}
                  >
                    <tbody>
                      {/* MAIN D’ŒUVRE */}
                      {lignesMainOeuvre.length > 0 && afficherMainOeuvre && (
                        <>
                          <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <td
                              colSpan={5}
                              style={{
                                fontWeight: 'bold',
                                padding: '8px',
                                textAlign: 'left',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              {nomMainOeuvre}
                            </td>
                          </tr>

                          <tr>
                            <th
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'center',
                              }}
                            >
                              Désignation
                            </th>
                            <th
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'center',
                              }}
                            >
                              Unité
                            </th>
                            <th
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'center',
                              }}
                            >
                              Qté
                            </th>
                            <th
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'center',
                              }}
                            >
                              PU HT (€)
                            </th>
                            <th
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'center',
                              }}
                            >
                              Total HT (€)
                            </th>
                          </tr>

                          {lignesMainOeuvre.map((ligne, index) => {
                            const prix =
                              ligne.mode === 'fixe'
                                ? ligne.prixFixe
                                : ligne.prixHoraire * ligne.heures;
                            return (
                              <tr key={`main-${index}`}>
                                <td
                                  style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  {ligne.designation}
                                </td>
                                <td
                                  style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  U
                                </td>
                                <td
                                  style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  1
                                </td>
                                <td
                                  style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  {prix.toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  {prix.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      )}

                      {/* PIÈCES */}
                      {lignesPieces.length > 0 && afficherPieces && (
                        <>
                          <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <td
                              colSpan={5}
                              style={{
                                fontWeight: 'bold',
                                padding: '8px',
                                textAlign: 'left',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              {nomPieces}
                            </td>
                          </tr>
                          <tr>
                            <th
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'center',
                              }}
                            >
                              Désignation
                            </th>
                            <th
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'center',
                              }}
                            >
                              Unité
                            </th>
                            <th
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'center',
                              }}
                            >
                              Qté
                            </th>
                            <th
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'center',
                              }}
                            >
                              PU HT (€)
                            </th>
                            <th
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'center',
                              }}
                            >
                              Total HT (€)
                            </th>
                          </tr>
                          {lignesPieces.map((ligne, index) => {
                            const prix =
                              ligne.mode === 'manuel'
                                ? ligne.prixManuel || 0
                                : ligne.prixAchat * (1 + ligne.margePourcent / 100);

                            return (
                              <tr key={`piece-${index}`}>
                                <td
                                  style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  {ligne.designation}
                                </td>
                                <td
                                  style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  U
                                </td>
                                <td
                                  style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  {ligne.quantite}
                                </td>
                                <td
                                  style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  {prix.toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  {(prix * ligne.quantite).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      )}
                    </tbody>
                  </table>

                  {categoriesDynamiques.map((cat, i) =>
                    cat.afficher && cat.lignes.length > 0 ? (
                      <table
                        key={i}
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '14px',
                          marginBottom: '24px',
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              colSpan={cat.colonnes.length + 1}
                              style={{
                                backgroundColor: '#f2f2f2',
                                textAlign: 'left',
                                padding: '8px',
                                fontWeight: 'bold',
                                borderBottom: '1px solid #e5e7eb',
                                borderLeft: '1px solid #e5e7eb',
                                borderRight: '1px solid #e5e7eb',
                                WebkitPrintColorAdjust: 'exact',
                                printColorAdjust: 'exact',
                              }}
                            >
                              {cat.emoji} {cat.nom}
                            </th>
                          </tr>
                          <tr>
                            {cat.colonnes.map((col, idx) => (
                              <th
                                key={`col-${idx}`}
                                style={{
                                  padding: '6px',
                                  textAlign: 'center',
                                  fontWeight: 'bold',
                                  borderBottom: '1px solid #e5e7eb',
                                  borderLeft: idx === 0 ? '1px solid #e5e7eb' : 'none',
                                }}
                              >
                                {col.nom}
                              </th>
                            ))}
                            <th
                              style={{
                                padding: '6px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                borderBottom: '1px solid #e5e7eb',
                                borderRight: '1px solid #e5e7eb',
                              }}
                            >
                              Total HT (€)
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {cat.lignes.map((ligne, j) => (
                            <tr key={`cat-${i}-ligne-${j}`}>
                              {cat.colonnes.map((col, idx) => {
                                let val = ligne[col.nom];

                                if (col.type === 'prixAvecMarge') {
                                  const achat = Number(ligne[col.nom + '_achat'] ?? 0);
                                  const marge = Number(ligne[col.nom + '_marge'] ?? 0);
                                  val = (achat * (1 + marge / 100)).toFixed(2);
                                }

                                return (
                                  <td
                                    key={`col-${idx}`}
                                    style={{
                                      padding: '6px',
                                      textAlign: 'center',
                                      verticalAlign: 'middle',
                                      borderLeft: idx === 0 ? '1px solid #e5e7eb' : 'none',
                                      borderBottom:
                                        j === cat.lignes.length - 1 ? '1px solid #e5e7eb' : 'none',
                                    }}
                                  >
                                    {typeof val === 'number' ? val.toFixed(2) : val ?? '—'}
                                  </td>
                                );
                              })}

                              <td
                                style={{
                                  padding: '6px',
                                  textAlign: 'center',
                                  verticalAlign: 'middle',
                                  borderRight: '1px solid #e5e7eb',
                                  borderBottom:
                                    j === cat.lignes.length - 1 ? '1px solid #e5e7eb' : 'none',
                                }}
                              >
                                {(() => {
                                  let pu = 0;
                                  const quantite = Number(ligne['quantite'] ?? 1);
                                  for (const col of cat.colonnes) {
                                    if (col.type === 'prix') {
                                      pu += Number(ligne[col.nom] ?? 0);
                                    } else if (col.type === 'prixAvecMarge') {
                                      const achat = Number(ligne[col.nom + '_achat'] ?? 0);
                                      const marge = Number(ligne[col.nom + '_marge'] ?? 0);
                                      pu += achat * (1 + marge / 100);
                                    }
                                  }
                                  return (pu * quantite).toFixed(2);
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : null
                  )}

                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '24px',
                    }}
                  >
                    <table
                      style={{
                        borderCollapse: 'collapse',
                        fontSize: '14px',
                        minWidth: '280px',
                        backgroundColor: '#f9f9f9',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <tbody>
                        {remise > 0 && (
                          <>
                            <tr>
                              <td
                                style={{
                                  padding: '8px 12px',
                                  fontWeight: '500',
                                  borderRight: '1px solid #e5e7eb',
                                  borderBottom: '1px solid #e5e7eb',
                                }}
                              >
                                Total HT brut
                              </td>
                              <td
                                style={{
                                  padding: '8px 12px',
                                  borderBottom: '1px solid #e5e7eb',
                                  textAlign: 'right',
                                }}
                              >
                                {totalHTBrut.toFixed(2)} €
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  padding: '8px 12px',
                                  fontWeight: '500',
                                  borderRight: '1px solid #e5e7eb',
                                  borderBottom: '1px solid #e5e7eb',
                                }}
                              >
                                Remise ({remisePourcent}%)
                              </td>
                              <td
                                style={{
                                  padding: '8px 12px',
                                  borderBottom: '1px solid #e5e7eb',
                                  textAlign: 'right',
                                }}
                              >
                                -{remise.toFixed(2)} €
                              </td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td
                            style={{
                              padding: '8px 12px',
                              fontWeight: '500',
                              borderRight: '1px solid #e5e7eb',
                              borderBottom: '1px solid #e5e7eb',
                            }}
                          >
                            Total HT
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              borderBottom: '1px solid #e5e7eb',
                              textAlign: 'right',
                            }}
                          >
                            {totalHT.toFixed(2)} €
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: '8px 12px',
                              fontWeight: '500',
                              borderRight: '1px solid #e5e7eb',
                              borderBottom: '1px solid #e5e7eb',
                            }}
                          >
                            TVA ({tvaTaux}%)
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              borderBottom: '1px solid #e5e7eb',
                              textAlign: 'right',
                            }}
                          >
                            {tva.toFixed(2)} €
                          </td>
                        </tr>
                        <tr style={{ backgroundColor: '#eee', fontWeight: 'bold' }}>
                          <td style={{ padding: '8px 12px', borderRight: '1px solid #e5e7eb' }}>
                            Total TTC
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            {totalTTC.toFixed(2)} €
                          </td>
                        </tr>
                        {acompte > 0 && (
                          <tr>
                            <td
                              style={{
                                padding: '8px 12px',
                                borderRight: '1px solid #e5e7eb',
                                fontWeight: '500',
                              }}
                            >
                              Acompte ({acomptePourcent}%)
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              {acompte.toFixed(2)} €
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mentions légales */}
                  {mentions.trim() && (
                    <div style={{ marginTop: '20px' }}>
                      <p>
                        <strong>Mentions légales :</strong>
                      </p>
                      <p>
                        {mentions.split('\n').map((line, index) => (
                          <span key={index}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </p>
                    </div>
                  )}

                  {/* Texte de conclusion */}
                  {conclusion && (
                    <div style={{ marginTop: '20px' }}>
                      <p>
                        {conclusion.split('\n').map((line, index) => (
                          <span key={index}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </p>
                    </div>
                  )}

                  {/* Signatures */}
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}
                  >
                    <div
                      style={{
                        width: '45%',
                        textAlign: 'right',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                      }}
                    >
                      <p>
                        <strong>Signature du client</strong>
                      </p>
                      {signatureClient ? (
                        <img
                          src={signatureClient}
                          alt="Signature Client"
                          style={{ height: '80px' }}
                        />
                      ) : (
                        <div style={{ height: '80px', borderBottom: '1px solid #000' }}></div>
                      )}
                    </div>
                    <div style={{ width: '45%', textAlign: 'right' }}>
                      <p>
                        <strong>Signature de l'émetteur</strong>
                      </p>
                      {signatureEmetteur ? (
                        <img
                          src={signatureEmetteur}
                          alt="Signature Emetteur"
                          style={{ height: '80px' }}
                        />
                      ) : (
                        <div style={{ height: '80px', borderBottom: '1px solid #000' }}></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
