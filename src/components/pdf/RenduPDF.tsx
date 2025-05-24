import React from 'react';

interface Ligne {
  designation: string;
  unite: string;
  quantite: number;
  prix: number;
}

interface Props {
  date: string;
  titre: string;
  emetteur: {
    nom: string;
    adresse: string;
    siret: string;
    email: string;
    tel: string;
  };
  recepteur: {
    nom: string;
    adresse: string;
    email: string;
    tel: string;
  };
  lignesMainOeuvre: Ligne[];
  lignesPieces: Ligne[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  acompte: number;
  tvaTaux: number;
  acomptePourcent: number;
  mentions?: string;
  intro?: string;
  conclusion?: string;
  signatureClient?: string;
  signatureEmetteur?: string;
}

export default function RenduPDF({
  date,
  titre,
  emetteur,
  recepteur,
  lignesMainOeuvre,
  lignesPieces,
  totalHT,
  tva,
  totalTTC,
  acompte,
  tvaTaux,
  acomptePourcent,
  mentions,
  intro,
  conclusion,
  signatureClient,
  signatureEmetteur,
}: Props) {
  const renderLignes = (lignes: Ligne[]) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
      <thead>
        <tr>
          <th style={cellHeader}>Désignation</th>
          <th style={cellHeader}>Unité</th>
          <th style={cellHeader}>Qté</th>
          <th style={cellHeader}>PU HT (€)</th>
          <th style={cellHeader}>Total HT (€)</th>
        </tr>
      </thead>
      <tbody>
        {lignes.map((l, i) => (
          <tr key={i}>
            <td style={cell}>{l.designation}</td>
            <td style={cell}>{l.unite}</td>
            <td style={cell}>{l.quantite}</td>
            <td style={cell}>{l.prix.toFixed(2)}</td>
            <td style={cell}>{(l.quantite * l.prix).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const cellHeader: React.CSSProperties = {
    backgroundColor: '#f0f0f0',
    padding: '8px',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: '13px',
  };

  const cell: React.CSSProperties = {
    padding: '8px',
    fontSize: '13px',
    borderBottom: '1px solid #ddd',
  };

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        backgroundColor: '#fff',
        padding: '32px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: 1.5,
      }}
    >
      {/* Date & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: '#444' }}>{date}</div>
      </div>

      {/* Infos émetteur et client */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ width: '50%' }}>
          <strong>Émetteur :</strong>
          <p>{emetteur.nom}</p>
          <p>{emetteur.adresse}</p>
          <p>SIRET : {emetteur.siret}</p>
          <p>{emetteur.email}</p>
          <p>{emetteur.tel}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong>Client :</strong>
          <p>{recepteur.nom}</p>
          <p>{recepteur.adresse}</p>
          <p>{recepteur.email}</p>
          <p>{recepteur.tel}</p>
        </div>
      </div>

      <h1 style={{ fontSize: '18px', marginBottom: '12px' }}>{titre}</h1>
      {intro && <p style={{ fontStyle: 'italic', marginBottom: '16px' }}>{intro}</p>}

      {/* Lignes Main d'oeuvre */}
      {lignesMainOeuvre.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ backgroundColor: '#f5f5f5', padding: '6px 10px' }}>Main d’œuvre</h2>
          {renderLignes(lignesMainOeuvre)}
        </div>
      )}

      {/* Lignes Pièces */}
      {lignesPieces.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ backgroundColor: '#f5f5f5', padding: '6px 10px' }}>Pièces</h2>
          {renderLignes(lignesPieces)}
        </div>
      )}

      {/* Résumé total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
        <table style={{ width: '300px', fontSize: '13px' }}>
          <tbody>
            <tr>
              <td style={cell}>Total HT</td>
              <td style={{ ...cell, textAlign: 'right' }}>{totalHT.toFixed(2)} €</td>
            </tr>
            <tr>
              <td style={cell}>TVA ({tvaTaux}%)</td>
              <td style={{ ...cell, textAlign: 'right' }}>{tva.toFixed(2)} €</td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td style={cell}>Total TTC</td>
              <td style={{ ...cell, textAlign: 'right' }}>{totalTTC.toFixed(2)} €</td>
            </tr>
            {acompte > 0 && (
              <tr>
                <td style={cell}>Acompte ({acomptePourcent}%)</td>
                <td style={{ ...cell, textAlign: 'right' }}>{acompte.toFixed(2)} €</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mentions && (
        <div style={{ marginTop: '24px', fontSize: '12px' }}>
          <strong>Mentions légales :</strong>
          <p>{mentions}</p>
        </div>
      )}

      {conclusion && <p style={{ marginTop: '20px' }}>{conclusion}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
        <div style={{ textAlign: 'center' }}>
          <p>
            <strong>Signature du client</strong>
          </p>
          {signatureClient ? (
            <img src={signatureClient} alt="Signature client" style={{ height: '80px' }} />
          ) : (
            <div
              style={{
                height: '80px',
                borderBottom: '1px solid #000',
                width: '200px',
                margin: '0 auto',
              }}
            ></div>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <p>
            <strong>Signature de l'émetteur</strong>
          </p>
          {signatureEmetteur ? (
            <img src={signatureEmetteur} alt="Signature émetteur" style={{ height: '80px' }} />
          ) : (
            <div
              style={{
                height: '80px',
                borderBottom: '1px solid #000',
                width: '200px',
                margin: '0 auto',
              }}
            ></div>
          )}
        </div>
      </div>
    </div>
  );
}
