

"use client";

import { useState, ChangeEvent, useEffect, useRef } from "react";
import { exporterPDF } from "@/utils/exportPdf";
import Card from "@/components/ui/Card";
import SignatureBlock from "@/components/SignatureBlock";
import type SignatureCanvas from "react-signature-canvas";

import Link from "next/link";

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

export default function Home() {
  // État général
  const [titre, setTitre] = useState("Devis - Intervention Plomberie");
  const [lignes, setLignes] = useState<Ligne[]>([{ designation: "", unite: "U", quantite: 1, prix: 0 }]);
  const [mentions, setMentions] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [emetteur, setEmetteur] = useState({ nom: "", adresse: "", siret: "", email: "", tel: "" });
  const [recepteur, setRecepteur] = useState({ nom: "", adresse: "", email: "", tel: "" });
  const [intro, setIntro] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [hauteurLogo, setHauteurLogo] = useState(160);
  const [brief, setBrief] = useState("");
  const [devisIA, setDevisIA] = useState("");
  const [chargementIA, setChargementIA] = useState(false);
  const [tarifs, setTarifs] = useState<Tarif[]>([
  { designation: "Main d'œuvre", unite: "h", prix: 55 },
  { designation: "Déplacement", unite: "U", prix: 50 },
  { designation: "Pose WC suspendu", unite: "U", prix: 350 },
]);
  const [lignesParseesTemp, setLignesParseesTemp] = useState<Ligne[] | null>(null);
  const [tvaTaux, setTvaTaux] = useState(20);
  const [remisePourcent, setRemisePourcent] = useState(0);
  const [acomptePourcent, setAcomptePourcent] = useState(30);
  const [onglet, setOnglet] = useState<'manuel' | 'ia'>('manuel');
  const [secteurs, setSecteurs] = useState<string[]>([]);
  const [secteurActif, setSecteurActif] = useState<string>("");
  const [showSecteurModal, setShowSecteurModal] = useState(false);
  const cleanNumericInput = (val: string): number => {
  const clean = val.replace(/^0+(\d)/, "$1"); // 01 → 1, 003 → 3
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100; // max 2 décimales
};
  const [signatureClient, setSignatureClient] = useState<string | null>(null);
const canvasRef = useRef<SignatureCanvas>(null);

const clearSignature = () => canvasRef.current?.clear();
const saveSignature = () => {
  if (canvasRef.current) {
    const dataURL = canvasRef.current.getTrimmedCanvas().toDataURL("image/png");
    setSignatureClient(dataURL);
  }
};
const [signatureEmetteur, setSignatureEmetteur] = useState<string | null>(null);

const [mode, setMode] = useState<"accueil" | "devis">("accueil");






  




  // Sauvegarde localStorage : logo et émetteur
  useEffect(() => {
    const emetteurSauvegarde = localStorage.getItem("emetteur");
    const logoSauvegarde = localStorage.getItem("logo");
    if (emetteurSauvegarde) setEmetteur(JSON.parse(emetteurSauvegarde));
    if (logoSauvegarde) setLogo(logoSauvegarde);
  }, []);

  useEffect(() => {
    localStorage.setItem("emetteur", JSON.stringify(emetteur));
  }, [emetteur]);

  useEffect(() => {
    if (logo) localStorage.setItem("logo", logo);
  }, [logo]);

  // Charger les mentions sauvegardées
useEffect(() => {
  const mentionsSauvegarde = localStorage.getItem("mentions");
  if (mentionsSauvegarde) setMentions(mentionsSauvegarde);
}, []);

// Sauvegarder les mentions à chaque modification
useEffect(() => {
  localStorage.setItem("mentions", mentions);
}, [mentions]);

useEffect(() => {
  if (secteurActif) {
    setTitre(`Devis - Intervention ${secteurActif}`);
  }
}, [secteurActif]);

useEffect(() => {
  const secteurSauvegarde = localStorage.getItem("secteurActif");
  if (secteurSauvegarde) {
    setSecteurActif(secteurSauvegarde);
    setShowSecteurModal(false);
  }
}, []);

useEffect(() => {
  if (secteurActif) {
    const sauvegardes = localStorage.getItem(`tarifs_${secteurActif}`);
    if (sauvegardes) {
      try {
        const parsed = JSON.parse(sauvegardes);
        if (Array.isArray(parsed)) setTarifs(parsed);
      } catch (e) {
        console.error("❌ Erreur lecture tarifs localStorage :", e);
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





  // Lignes : ajout, modification, suppression
  const ajouterLigne = () => {
    setLignes([...lignes, { designation: "", unite: "U", quantite: 1, prix: 0 }]);
  };

  const modifierLigne = (index: number, champ: keyof Ligne, valeur: string | number) => {
  const copie = [...lignes];

  if (champ === "quantite" || champ === "prix") {
    const parsed = cleanNumericInput(valeur.toString());
    copie[index][champ] = parsed as never;
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

  // Parsing IA
  const parseDevisGPT = (texte: string): Ligne[] => {
    const lignes: Ligne[] = [];
    const regex = /^\|(.+?)\|(.+?)\|(.+?)\|(.+?)\|(.+?)\|$/gm;

    let match;
    while ((match = regex.exec(texte)) !== null) {
      const [_, designation, unite, quantiteStr, prixStr] = match.map(cell => cell.trim());
      const quantite = parseFloat(quantiteStr.replace(",", "."));
      const prix = parseFloat(prixStr.replace(",", "."));
      if (!isNaN(quantite) && !isNaN(prix)) {
        lignes.push({ designation, unite, quantite, prix });
      }
    }

    return lignes;
  };

const parserViaIA = async (texte: string) => {
  try {
    const res = await fetch("http://127.0.0.1:5000/parse-devis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        devis: texte,
        secteur: secteurActif, // ✅ on envoie bien le secteur utilisé
      }),
    });

    const data = await res.json();
    if (data.parsed) {
      const json = JSON.parse(data.parsed);
      const lignesParsees: Ligne[] = json.lignes.map((ligne: any) => ({
        designation: ligne.designation,
        unite: ligne.unite,
        quantite: parseFloat(ligne.quantite),
        prix: parseFloat(ligne.prix_unitaire),
      }));

      setLignesParseesTemp(lignesParsees);
    } else {
      alert("❌ Erreur de parsing IA.");
    }
  } catch (err) {
    console.error("Erreur parsing IA :", err);
    alert("❌ Erreur serveur lors du parsing.");
  }
};



  // Génération IA
  const genererAvecIA = async () => {
    setChargementIA(true);
    setDevisIA("");
    try {
      const res = await fetch("http://127.0.0.1:5000/generate-devis", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, secteur: secteurActif, tarifs }),

      });
      const data = await res.json();
      setDevisIA(data.devis || "⚠️ Aucune réponse reçue.");
    } catch (err) {
      console.error("Erreur :", err);
      setDevisIA("❌ Une erreur est survenue. Vérifie le backend.");
    } finally {
      setChargementIA(false);
    }
  };

  // Totaux
  const totalHTBrut = lignes.reduce((somme, ligne) => somme + ligne.quantite * ligne.prix, 0);
  const remise = totalHTBrut * (remisePourcent / 100);
  const totalHT = totalHTBrut - remise;
  const tva = totalHT * (tvaTaux / 100);
  const totalTTC = totalHT + tva;
  const acompte = totalTTC * (acomptePourcent / 100);

  const boutonActif = lignes.length > 0 && recepteur.nom.trim() !== "";

  // Logo upload
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };



const exporterPDFSansClasses = async () => {
  const devis = document.getElementById("devis-final");
  if (!devis) return;

  // Clone
  const clone = devis.cloneNode(true) as HTMLElement;

  // Nettoyage des classes et styles problématiques
  clone.querySelectorAll("*").forEach((el) => {
    el.removeAttribute("class");
    el.removeAttribute("style");
    (el as HTMLElement).style.color = "#000";
    (el as HTMLElement).style.backgroundColor = "#fff";
  });

  // Conteneur temporaire
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "0";
  container.style.width = "800px";
  container.style.background = "#fff";
  container.appendChild(clone);
  document.body.appendChild(container);

  // PDF
  await exporterPDF();

  // Nettoyage
  document.body.removeChild(container);
};


  

// Le JSX complet est maintenu dans le reste du code.
// Trop volumineux pour affichage ici, mais tout est fonctionnel.
// Voir section suivante ou téléverser dans un éditeur pour le code JSX complet.

  return(
<>
{mode === "accueil" && (
  <div className="text-center mt-20">
    <h1 className="text-3xl font-bold mb-4">Bienvenue 👋</h1>
    <p className="text-gray-600 mb-6">Commencez par choisir un secteur pour générer votre premier devis.</p>
    <button
  onClick={() => {
    setShowSecteurModal(true);
    setMode("devis"); // ✅ Ajout indispensable
  }}
  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow"
>
  🚀 Commencer
</button>

  </div>
)}


{mode === "devis" && (
    <main className="min-h-screen p-8 bg-gray-100 font-sans text-black overflow-x-hidden">

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
        className="w-full border p-2 rounded mb-2"
        value={secteurActif}
        onChange={(e) => setSecteurActif(e.target.value)}
      />

      <button
        onClick={() => {
          const propre = secteurActif.trim();
          if (propre && !secteurs.includes(propre)) {
            const updated = [...secteurs, propre];
            setSecteurs(updated);
            setSecteurActif("");
            localStorage.setItem("secteurs", JSON.stringify(updated));
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
            {secteurs.map((s) => (
              <div
                key={s}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border cursor-pointer transition ${
                  secteurActif === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                }`}
                onClick={() => setSecteurActif(s)}
              >
                <span>{s}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = secteurs.filter((item) => item !== s);
                    setSecteurs(updated);
                    localStorage.setItem("secteurs", JSON.stringify(updated));
                    if (secteurActif === s) {
                      setSecteurActif(updated[0] || "");
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
        disabled={secteurs.length === 0 && secteurActif.trim() === ""}
        onClick={() => {
  const propre = secteurActif.trim();
  if (propre && !secteurs.includes(propre)) {
    const updated = [...secteurs, propre];
    setSecteurs(updated);
    setSecteurActif(propre);
    localStorage.setItem("secteurs", JSON.stringify(updated));
  }
  setShowSecteurModal(false);
  setMode("devis"); // ✅ ici
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
    maxHeight: "300px",
    objectFit: "contain",
    maxWidth: "100%",
  }}
/>

        

        <div className="w-full">
          <label className="block text-sm font-medium text-center mb-1">Taille du logo</label>
          <input
            type="range"
            min="80"
            max="300"
            value={hauteurLogo}
            onChange={(e) => setHauteurLogo(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          onClick={() => {
            setLogo(null);
            localStorage.removeItem("logo");
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
      className="w-full border p-3 rounded text-base"
      type="text"
      inputMode="text"
      autoComplete="organization"
      aria-label="Nom de l'entreprise"
      placeholder={`Ex : ${secteurActif ? secteurActif + " Martin" : "Mon entreprise"}`}

      value={emetteur.nom}
      onChange={(e) => setEmetteur({ ...emetteur, nom: e.target.value })}
    />

    <label className="block font-medium">Adresse</label>
    <textarea
      className="w-full border p-3 rounded text-base resize-y min-h-[60px]"
      autoComplete="street-address"
      aria-label="Adresse de l'entreprise"
      placeholder="Ex : 12 rue des Lilas, 75000 Paris"
      value={emetteur.adresse}
      rows={2}
      onChange={(e) => setEmetteur({ ...emetteur, adresse: e.target.value })}
    />

    <label className="block font-medium">SIRET</label>
    <input
      className="w-full border p-3 rounded text-base"
      inputMode="numeric"
      autoComplete="off"
      aria-label="Numéro SIRET"
      placeholder="Ex : 123 456 789 00010"
      value={emetteur.siret}
      onChange={(e) => setEmetteur({ ...emetteur, siret: e.target.value })}
    />

    <label className="block font-medium">Email</label>
    <input
      className="w-full border p-3 rounded text-base"
      type="email"
      inputMode="email"
      autoComplete="email"
      aria-label="Email de l'entreprise"
      placeholder={`Ex : contact@${secteurActif ? secteurActif.toLowerCase().replace(/\s/g, '') : "monentreprise"}.fr`}

      value={emetteur.email}
      onChange={(e) => setEmetteur({ ...emetteur, email: e.target.value })}
    />

    <label className="block font-medium">Téléphone</label>
    <input
      className="w-full border p-3 rounded text-base"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      aria-label="Téléphone de l'entreprise"
      placeholder="Ex : 01 23 45 67 89"
      value={emetteur.tel}
      onChange={(e) => setEmetteur({ ...emetteur, tel: e.target.value })}
    />

    <button
      className="text-sm text-red-600 underline"
      onClick={() => {
        localStorage.removeItem("emetteur");
        localStorage.removeItem("logo");
        setEmetteur({ nom: "", adresse: "", siret: "", email: "", tel: "" });
        setLogo(null);
      }}
    >
      🔄 Réinitialiser les infos enregistrées
    </button>
  </div>
</Card>


      
<Card title="📥 Informations du client">
  <div className="flex flex-col gap-4">
    <label className="block font-medium">Nom du client</label>
    <input
      className="w-full border p-3 rounded text-base"
      type="text"
      inputMode="text"
      autoComplete="name"
      aria-label="Nom du client"
      placeholder="Ex : Jean Dupont"
      value={recepteur.nom}
      onChange={(e) => setRecepteur({ ...recepteur, nom: e.target.value })}
    />

    <label className="block font-medium">Adresse du client</label>
    <textarea
      className="w-full border p-3 rounded text-base resize-y min-h-[60px]"
      autoComplete="street-address"
      aria-label="Adresse du client"
      placeholder="Ex : 7 avenue de la République, 75011 Paris"
      value={recepteur.adresse}
      rows={2}
      onChange={(e) => setRecepteur({ ...recepteur, adresse: e.target.value })}
    />

    <label className="block font-medium">Email du client</label>
    <input
      className="w-full border p-3 rounded text-base"
      type="email"
      inputMode="email"
      autoComplete="email"
      aria-label="Email du client"
      placeholder="Ex : jean.dupont@email.com"
      value={recepteur.email}
      onChange={(e) => setRecepteur({ ...recepteur, email: e.target.value })}
    />

    <label className="block font-medium">Téléphone du client</label>
    <input
      className="w-full border p-3 rounded text-base"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      aria-label="Téléphone du client"
      placeholder="Ex : 06 78 90 12 34"
      value={recepteur.tel}
      onChange={(e) => setRecepteur({ ...recepteur, tel: e.target.value })}
    />
  </div>
</Card>
</div>
  

<Card title="📝 Titre du devis & Sélection du secteur">
  <div className="flex flex-col gap-4">

    {/* Titre personnalisable */}
    <input
      className="w-full border p-2 rounded text-lg font-semibold"
      value={titre}
      onChange={(e) => setTitre(e.target.value)}
      placeholder="Titre du devis"
    />

    {/* Menu déroulant de sélection */}
    <label className="block font-medium">Secteur sélectionné</label>
    <select
      className="w-full border p-2 rounded"
      value={secteurActif}
      onChange={(e) => setSecteurActif(e.target.value)}
    >
      {secteurs.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>

    {/* Liste visuelle des métiers avec suppression */}
    <div className="flex flex-wrap gap-2">
      {secteurs.map((s) => (
        <div
          key={s}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition cursor-pointer ${
            secteurActif === s
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
          }`}
          onClick={() => setSecteurActif(s)}
        >
          <span>{s}</span>
          <button
            onClick={(e) => {
              e.stopPropagation(); // éviter le setSecteurActif
              const updated = secteurs.filter((item) => item !== s);
              setSecteurs(updated);
              localStorage.setItem("secteurs", JSON.stringify(updated));
              if (secteurActif === s) {
                setSecteurActif(updated[0] || "");
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
    <div className="flex gap-4 mt-2">
      <button
        onClick={() => setOnglet("manuel")}
        className={`px-4 py-2 rounded-md text-sm border transition-colors ${
          onglet === "manuel"
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300"
        }`}
      >
        📝 Lignes manuelles
      </button>
      <button
        onClick={() => setOnglet("ia")}
        className={`px-4 py-2 rounded-md text-sm border transition-colors ${
          onglet === "ia"
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300"
        }`}
      >
        🤖 Génération IA
      </button>
    </div>
  </div>
</Card>



    {onglet === 'manuel' && (
      <Card title="🛠️ Lignes manuelles">
        <div className="flex flex-col gap-4">
        <div className="overflow-auto">
          <table className="w-full text-sm border mt-4">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">Désignation</th>
                <th className="p-2 border">Unité</th>
                <th className="p-2 border">Quantité</th>
                <th className="p-2 border">Prix unitaire (€ HT)</th>
                <th className="p-2 border">Total HT</th>
                <th className="p-2 border">Suppr.</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne, index) => (
                <tr key={index}>
                  <td className="p-2 border">
<input
  type="text"
  className="w-full"
  autoComplete="off"
  inputMode="text"
  aria-label={`Désignation ligne ${index + 1}`}
  value={ligne.designation}
  onWheel={(e) => e.currentTarget.blur()}
  onChange={(e) => modifierLigne(index, 'designation', e.target.value)}
/>

</td>
<td className="p-2 border">
<input
  type="text"
  className="w-full"
  autoComplete="off"
  inputMode="text"
  aria-label={`Unité ligne ${index + 1}`}
  value={ligne.unite}
  onWheel={(e) => e.currentTarget.blur()}
  onChange={(e) => modifierLigne(index, 'unite', e.target.value)}
/>

</td>
<td className="p-2 border">
<input
  type="number"
  inputMode="decimal"
  autoComplete="off"
  className="w-full"
  step="1"
  aria-label={`Quantité ligne ${index + 1}`}
  value={ligne.quantite.toString()}
  onWheel={(e) => e.currentTarget.blur()}
  onChange={(e) => modifierLigne(index, 'quantite', e.target.value)}
/>

</td>
<td className="p-2 border">
<input
  type="number"
  inputMode="decimal"
  autoComplete="off"
  className="w-full"
  step="0.01"
  aria-label={`Prix unitaire ligne ${index + 1}`}
  value={ligne.prix.toString()}
  onWheel={(e) => e.currentTarget.blur()}
  onChange={(e) => modifierLigne(index, 'prix', e.target.value)}
/>

</td>

                  <td className="p-2 border text-right">{(ligne.quantite * ligne.prix).toFixed(2)} €</td>
                  <td className="p-2 border text-center">
                    <button
  onClick={() => supprimerLigne(index)}
  className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded-md border border-red-200 hover:border-red-300 transition-colors"
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
  className="bg-white hover:bg-gray-100 text-sm text-gray-800 px-4 py-2 rounded-md border border-gray-300 shadow-sm flex items-center gap-2 transition-colors mt-4"
>➕ Ajouter une ligne</button>
        </div>
      </Card>
    )}

    {onglet === 'ia' && (
<Card title="🤖 Génération IA">
  <div className="flex flex-col gap-4">
    <label className="block font-medium mb-1">Brief de la prestation (pour génération IA)</label>
    <textarea
      className="w-full p-2 border rounded h-24 mb-4"
      aria-label="Brief de la prestation"
      placeholder="Ex : Pose d’un chauffe-eau 200L mural avec déplacement évier"
      value={brief}
      onChange={(e) => setBrief(e.target.value)}
    />


    <h2 className="text-lg font-semibold mb-2">🔧 Tarifs de référence pour l’IA</h2>
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
  onChange={(e) => {
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
  onChange={(e) => {
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
  onChange={(e) => {
    const updated = [...tarifs];
    updated[index].prix = parseFloat(e.target.value) || 0;
    setTarifs(updated);
  }}
/>

            </td>
            <td className="p-2 border text-center">
              <button className="text-red-600 hover:text-red-800 text-sm" onClick={() => {
                const updated = [...tarifs];
                updated.splice(index, 1);
                setTarifs(updated);
              }}>
                🗑️
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <button
      className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
      onClick={() => setTarifs([...tarifs, { designation: '', unite: 'U', prix: 0 }])}
    >
      ➕ Ajouter un tarif
    </button>

    <button
      onClick={genererAvecIA}
      disabled={!brief || chargementIA}
      className={`mt-4 px-4 py-2 rounded text-white ${
        chargementIA ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      🤖 Générer automatiquement avec IA
    </button>

    {devisIA && (
      <>
        <pre className="mt-4 whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm border">{devisIA}</pre>
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
                setLignes(lignesParseesTemp);
                setLignesParseesTemp(null);
              }}
            >
              🔄 Remplacer les lignes existantes
            </button>

            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={() => {
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
    className="w-full p-2 border rounded h-24 mb-4"
    placeholder="Ex : Devis valable 15 jours..."
    value={mentions}
    onChange={(e) => setMentions(e.target.value)}
  />

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div>
      <label className="block font-medium mb-1">TVA (%)</label>
      <span className="test-blue-600 cursor-help"title="Taux de TVA appliqué sur le total HT">ℹ️</span>
      <input
        type="number"
        onWheel={(e) => e.currentTarget.blur()}
        className="w-full border p-2 rounded"
        value={tvaTaux.toString()}
        onChange={(e) => setTvaTaux(cleanNumericInput(e.target.value))}
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
        onWheel={(e) => e.currentTarget.blur()}
        className="w-full border p-2 rounded"
        value={remisePourcent.toString()}
        onChange={(e) => setRemisePourcent(cleanNumericInput(e.target.value))}
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
        onWheel={(e) => e.currentTarget.blur()}
        className="w-full border p-2 rounded"
        value={acomptePourcent.toString()}
        onChange={(e) => setAcomptePourcent(cleanNumericInput(e.target.value))}
      />
    </div>
  </div>
  </div>
</Card>

      {/* Paragraphe d'introduction */}
    <Card title="✍️ Texte d’introduction & conclusion">
      <div className="flex flex-col gap-4">
      <label className="block font-medium mt-6 mb-1">Texte d’introduction (facultatif)</label>
      <textarea
        className="w-full p-2 border rounded h-24 text-base"
        placeholder="Ex : Merci pour votre confiance, voici le détail de notre proposition..."
        value={intro}
        onChange={(e) => setIntro(e.target.value)}
      />

    {/* Paragraphe de conclusion */}
      <label className="block font-medium mt-6 mb-1">Texte de conclusion (facultatif)</label>
      <textarea
        className="w-full p-2 border rounded h-24"
        placeholder="Ex : N'hésitez pas à nous contacter pour toute question complémentaire."
        value={conclusion}
        onChange={(e) => setConclusion(e.target.value)}
      />
      </div>
    </Card>

<Card title="🖊️ Signatures numériques">
  <div className="flex flex-col lg:flex-row gap-6">
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
{mode === "devis" && !showSecteurModal &&(
<div className="sticky bottom-4 left-4 z-50">
  <button
    onClick={async () => {
      await fetch("http://localhost:5000/sauvegarder-devis-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre,
          lignes,
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
        }),
      });
      await exporterPDFSansClasses();
    }}
    className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-3 rounded-xl shadow flex items-center justify-center gap-2"
  >
    📄 Exporter le devis
  </button>
</div>
)}

    {/* Résumé des totaux */}

  {/* Bouton d'export PDF */}

<Card title="📤 Export & Historique">
  <div className="flex flex-col gap-4">
  <button
    onClick={async () => {
      await fetch("http://localhost:5000/sauvegarder-devis-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre, lignes, total_ht_brut: totalHTBrut, remise, total_ht: totalHT,
          tva, total_ttc: totalTTC, acompte, tva_taux: tvaTaux,
          remise_pourcent: remisePourcent, acompte_pourcent: acomptePourcent,
          mentions, intro, conclusion, emetteur, recepteur, logo,
        }),
      });
      await exporterPDFSansClasses();
    }}
    className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-3 rounded-xl shadow w-full flex items-center justify-center gap-2"
  >
    📄 Exporter le devis en PDF
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
  width: "794px",
  minHeight: "1123px",
  backgroundColor: "#ffffff",
  color: "#000000",
  padding: "24px",
  fontSize: "14px",
  fontFamily: "sans-serif",
  border: "1px solid #ccc",
  borderRadius: "12px",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  margin: "0 auto",
      }}
    >
  {/* Header logo + date */}
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
    {logo && (
      <img
        src={logo}
        alt="Logo"
        style={{ height: `${hauteurLogo}px`, objectFit: "contain", maxWidth: "200px" }}
      />
    )}
    <div style={{ color: "#666", fontSize: "12px" }}>
      {new Date().toLocaleDateString("fr-FR")}
    </div>
  </div>

  {/* Infos Émetteur / Client */}
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
    <div style={{ width: "50%" }}>
      <strong>Émetteur :</strong>
      <p style={{ margin: "4px 0" }}>{emetteur.nom}</p>
      {emetteur.adresse && <p style={{ margin: "4px 0" }}>{emetteur.adresse}</p>}
      {emetteur.siret && <p style={{ margin: "4px 0" }}>SIRET : {emetteur.siret}</p>}
      {emetteur.email && <p style={{ margin: "4px 0" }}>{emetteur.email}</p>}
      {emetteur.tel && <p style={{ margin: "4px 0" }}>{emetteur.tel}</p>}
    </div>

    <div style={{ textAlign: "right" }}>
      <strong>Client :</strong>
      <p style={{ margin: "4px 0" }}>{recepteur.nom}</p>
      {recepteur.adresse && <p style={{ margin: "4px 0" }}>{recepteur.adresse}</p>}
      {recepteur.email && <p style={{ margin: "4px 0" }}>{recepteur.email}</p>}
      {recepteur.tel && <p style={{ margin: "4px 0" }}>{recepteur.tel}</p>}
    </div>
  </div>

  {/* Titre */}
  <h1 style={{ fontSize: "20px", marginBottom: "16px" }}>{titre}</h1>

  {/* Texte d'introduction */}
  {intro && (
  <p style={{ fontStyle: "italic", marginBottom: "16px" }}>
    {intro.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ))}
  </p>
)}


  {/* Tableau des lignes */}
  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
    <thead>
      <tr>
        <th style={{ border: "1px solid #000", padding: "4px" }}>Désignation</th>
        <th style={{ border: "1px solid #000", padding: "4px" }}>Unité</th>
        <th style={{ border: "1px solid #000", padding: "4px" }}>Quantité</th>
        <th style={{ border: "1px solid #000", padding: "4px" }}>Prix Unitaire HT(€)</th>
        <th style={{ border: "1px solid #000", padding: "4px" }}>Total HT (€)</th>
      </tr>
    </thead>
    <tbody>
      {lignes.map((ligne, index) => (
        <tr key={index}>
          <td style={{ border: "1px solid #000", padding: "4px" }}>{ligne.designation}</td>
          <td style={{ border: "1px solid #000", padding: "4px" }}>{ligne.unite}</td>
          <td style={{ border: "1px solid #000", padding: "4px" }}>{ligne.quantite}</td>
          <td style={{ border: "1px solid #000", padding: "4px" }}>{ligne.prix.toFixed(2)}</td>
          <td style={{ border: "1px solid #000", padding: "4px" }}>{(ligne.quantite * ligne.prix).toFixed(2)}</td>
        </tr>
      ))}
    </tbody>
    <tfoot>
</tfoot>

</table>

<div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
  <table style={{
    borderCollapse: "collapse",
    fontSize: "14px",
    minWidth: "280px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ccc"
  }}>
    <tbody>
      {remise > 0 && (
        <>
          <tr>
            <td style={{ padding: "8px 12px", fontWeight: "500", borderRight: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
              Total HT brut
            </td>
            <td style={{ padding: "8px 12px", borderBottom: "1px solid #ccc", textAlign: "right" }}>
              {totalHTBrut.toFixed(2)} €
            </td>
          </tr>
          <tr>
            <td style={{ padding: "8px 12px", fontWeight: "500", borderRight: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
              Remise ({remisePourcent}%)
            </td>
            <td style={{ padding: "8px 12px", borderBottom: "1px solid #ccc", textAlign: "right" }}>
              -{remise.toFixed(2)} €
            </td>
          </tr>
        </>
      )}
      <tr>
        <td style={{ padding: "8px 12px", fontWeight: "500", borderRight: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
          Total HT
        </td>
        <td style={{ padding: "8px 12px", borderBottom: "1px solid #ccc", textAlign: "right" }}>
          {totalHT.toFixed(2)} €
        </td>
      </tr>
      <tr>
        <td style={{ padding: "8px 12px", fontWeight: "500", borderRight: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
          TVA ({tvaTaux}%)
        </td>
        <td style={{ padding: "8px 12px", borderBottom: "1px solid #ccc", textAlign: "right" }}>
          {tva.toFixed(2)} €
        </td>
      </tr>
      <tr style={{ backgroundColor: "#eee", fontWeight: "bold" }}>
        <td style={{ padding: "8px 12px", borderRight: "1px solid #ccc" }}>Total TTC</td>
        <td style={{ padding: "8px 12px", textAlign: "right" }}>
          {totalTTC.toFixed(2)} €
        </td>
      </tr>
      {acompte > 0 && (
        <tr>
          <td style={{ padding: "8px 12px", borderRight: "1px solid #ccc", fontWeight: "500" }}>
            Acompte ({acomptePourcent}%)
          </td>
          <td style={{ padding: "8px 12px", textAlign: "right" }}>
            {acompte.toFixed(2)} €
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>


  {/* Mentions légales */}
{mentions.trim() && (
  <div style={{ marginTop: "20px" }}>
    <p><strong>Mentions légales :</strong></p>
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
  <div style={{ marginTop: "20px" }}>
    <p>
      {conclusion.split("\n").map((line, index) => (
        <span key={index}>
          {line}
          <br />
        </span>
      ))}
    </p>
  </div>
)}


  {/* Signatures */}
  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
    <div style={{ width: "45%" }}>
      <p><strong>Signature du client</strong></p>
      {signatureClient ? (
  <img src={signatureClient} alt="Signature Client" style={{ height: "80px" }} />
) : (
  <div style={{ height: "80px", borderBottom: "1px solid #000" }}></div>
)}

    </div>
    <div style={{ width: "45%", textAlign: "right" }}>
      <p><strong>Signature de l'émetteur</strong></p>
      {signatureEmetteur ? (
  <img src={signatureEmetteur} alt="Signature Emetteur" style={{ height: "80px" }} />
) : (
  <div style={{ height: "80px", borderBottom: "1px solid #000" }}></div>
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
