import React from 'react';

type LigneMainOeuvre = {
  designation: string;
  mode: 'fixe' | 'horaire';
  prixFixe: number;
  prixHoraire: number;
  heures: number;
};

type LignePiece = {
  designation: string;
  mode: 'manuel' | 'calculé';
  prixManuel?: number;
  prixAchat: number;
  margePourcent: number;
  quantite: number;
};

type ColonneCategorie = {
  nom: string;
  type: 'texte' | 'quantite' | 'prix' | 'prixAvecMarge';
};

type CategorieDynamique = {
  nom: string;
  colonnes: ColonneCategorie[];
  lignes: { [key: string]: any }[];
  afficher: boolean;
  emoji?: string;
};

type PreviewDevisProps = {
  logo?: string | null;
  hauteurLogo: number;
  numeroDevis?: string;
  emetteur: {
    nom: string;
    adresse?: string;
    siret?: string;
    email?: string;
    tel?: string;
  };
  recepteur: {
    nom: string;
    adresse?: string;
    email?: string;
    tel?: string;
  };
  titre: string;
  intro?: string;
  lignesMainOeuvre: LigneMainOeuvre[];
  lignesPieces: LignePiece[];
  afficherMainOeuvre: boolean;
  afficherPieces: boolean;
  nomMainOeuvre: string;
  nomPieces: string;
  categoriesDynamiques: CategorieDynamique[];
  totalHTBrut: number;
  remise: number;
  remisePourcent: number;
  totalHT: number;
  tvaTaux: number;
  tva: number;
  totalTTC: number;
  acompte: number;
  acomptePourcent: number;
  mentions: string;
  conclusion: string;
  signatureClient?: string | null;
  signatureEmetteur?: string | null;
  iban?: string;
  bic?: string;
};

export default function PreviewDevis(props: PreviewDevisProps) {
  const {
    logo,
    hauteurLogo,
    numeroDevis,
    emetteur,
    recepteur,
    titre,
    intro,
    lignesMainOeuvre,
    lignesPieces,
    afficherMainOeuvre,
    afficherPieces,
    nomMainOeuvre,
    nomPieces,
    categoriesDynamiques,
    totalHTBrut,
    remise,
    remisePourcent,
    totalHT,
    tvaTaux,
    tva,
    totalTTC,
    acompte,
    acomptePourcent,
    mentions,
    conclusion,
    signatureClient,
    signatureEmetteur,
    iban,
    bic,
  } = props;

  const COL_WIDTHS = ['40%', '15%', '15%', '15%', '15%'];

  const getWidth = (idx: number, total: number) => {
    if (total === 0) return '100%';
    if (idx === 0) return '40%'; // Désignation
    return `${60 / total}%`; // le reste
  };

  const TdContent = ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: '100%', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
      {children}
    </div>
  );

  return (
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
            <span style={{ fontWeight: 'bold', color: '#333' }}>Devis n° {numeroDevis}</span>
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
          {emetteur.siret && <p style={{ margin: '4px 0' }}>SIRET : {emetteur.siret}</p>}
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
                    width: COL_WIDTHS[0],
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Désignation
                </th>
                <th
                  style={{
                    width: COL_WIDTHS[1],
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Unité
                </th>
                <th
                  style={{
                    width: COL_WIDTHS[2],
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Qté
                </th>
                <th
                  style={{
                    width: COL_WIDTHS[3],
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  PU HT (€)
                </th>
                <th
                  style={{
                    width: COL_WIDTHS[4],
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Total HT (€)
                </th>
              </tr>

              {lignesMainOeuvre.map((ligne, index) => {
                const prix =
                  ligne.mode === 'fixe' ? ligne.prixFixe : ligne.prixHoraire * ligne.heures;

                return (
                  <tr key={`main-${index}`}>
                    <td
                      style={{
                        width: COL_WIDTHS[0],
                        padding: '6px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      {ligne.designation}
                    </td>
                    <td
                      style={{
                        width: COL_WIDTHS[1],
                        padding: '6px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      U
                    </td>
                    <td
                      style={{
                        width: COL_WIDTHS[2],
                        padding: '6px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      1
                    </td>
                    <td
                      style={{
                        width: COL_WIDTHS[3],
                        padding: '6px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      {prix.toFixed(2)}
                    </td>
                    <td
                      style={{
                        width: COL_WIDTHS[4],
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
                    width: COL_WIDTHS[0],
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Désignation
                </th>
                <th
                  style={{
                    width: COL_WIDTHS[1],
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Unité
                </th>
                <th
                  style={{
                    width: COL_WIDTHS[2],
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Qté
                </th>
                <th
                  style={{
                    width: COL_WIDTHS[3],
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  PU HT (€)
                </th>
                <th
                  style={{
                    width: COL_WIDTHS[4],
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontWeight: 'bold',
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
                        width: COL_WIDTHS[0],
                        padding: '6px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      {ligne.designation}
                    </td>
                    <td
                      style={{
                        width: COL_WIDTHS[1],
                        padding: '6px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      U
                    </td>
                    <td
                      style={{
                        width: COL_WIDTHS[2],
                        padding: '6px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      {ligne.quantite}
                    </td>
                    <td
                      style={{
                        width: COL_WIDTHS[3],
                        padding: '6px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      {prix.toFixed(2)}
                    </td>
                    <td
                      style={{
                        width: COL_WIDTHS[4],
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
      <>
        {categoriesDynamiques.map((cat, i) => {
          console.log(
            '📦',
            cat.nom,
            'colonnes:',
            cat.colonnes.map(c => c.nom),
            '→ total:',
            cat.colonnes.length
          );

          return cat.afficher && cat.lignes.length > 0 ? (
            <table
              key={i}
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                fontSize: '14px',
                marginBottom: '24px',
              }}
            >
              <colgroup>
                {cat.colonnes.map((_, idx) => (
                  <col key={`col-${idx}`} style={{ width: getWidth(idx, cat.colonnes.length) }} />
                ))}
                <col style={{ width: getWidth(cat.colonnes.length, cat.colonnes.length) }} />
              </colgroup>

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
                        boxSizing: 'border-box',
                        padding: '6px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        borderBottom: '1px solid #e5e7eb',
                        borderLeft: idx === 0 ? '1px solid #e5e7eb' : undefined,
                      }}
                    >
                      {col.nom}
                    </th>
                  ))}
                  <th
                    style={{
                      boxSizing: 'border-box',
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
                            boxSizing: 'border-box',
                            padding: '6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            borderLeft: idx === 0 ? '1px solid #e5e7eb' : undefined,
                            borderBottom:
                              j === cat.lignes.length - 1 ? '1px solid #e5e7eb' : undefined,
                          }}
                        >
                          <TdContent>
                            {typeof val === 'number' ? val.toFixed(2) : val ?? '\u00A0'}
                          </TdContent>
                        </td>
                      );
                    })}

                    <td
                      style={{
                        boxSizing: 'border-box',
                        padding: '6px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        borderRight: '1px solid #e5e7eb',
                        borderBottom: j === cat.lignes.length - 1 ? '1px solid #e5e7eb' : 'none',
                      }}
                    >
                      <TdContent>
                        {(() => {
                          let pu = 0;
                          const colonneQuantite = cat.colonnes.find(c => c.type === 'quantite');
                          const quantite = colonneQuantite
                            ? Number(ligne[colonneQuantite.nom]) || 0
                            : 1;

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
                      </TdContent>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null;
        })}
      </>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '24px',
          marginTop: '24px',
        }}
      >
        {/* Mentions à gauche */}
        {mentions.trim() && (
          <div style={{ flex: 1.2 }}>
            <p style={{ marginBottom: '4px' }}>
              <strong>Mentions légales :</strong>
            </p>
            <p style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{mentions}</p>
          </div>
        )}

        {/* Totaux à droite */}
        <div style={{ flex: 1 }}>
          <table
            style={{
              borderCollapse: 'collapse',
              fontSize: '14px',
              width: '100%',
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
                        textAlign: 'right',
                        borderBottom: '1px solid #e5e7eb',
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
                        textAlign: 'right',
                        borderBottom: '1px solid #e5e7eb',
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
                    textAlign: 'right',
                    borderBottom: '1px solid #e5e7eb',
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
                    textAlign: 'right',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  {tva.toFixed(2)} €
                </td>
              </tr>
              <tr style={{ backgroundColor: '#eee', fontWeight: 'bold' }}>
                <td style={{ padding: '8px 12px', borderRight: '1px solid #e5e7eb' }}>Total TTC</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{totalTTC.toFixed(2)} €</td>
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
      </div>

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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
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
            <img src={signatureClient} alt="Signature Client" style={{ height: '80px' }} />
          ) : (
            <div style={{ height: '80px', borderBottom: '1px solid #000' }}></div>
          )}
        </div>
        <div style={{ width: '45%', textAlign: 'right' }}>
          <p>
            <strong>Signature de l'émetteur</strong>
          </p>
          {signatureEmetteur ? (
            <img src={signatureEmetteur} alt="Signature Emetteur" style={{ height: '80px' }} />
          ) : (
            <div style={{ height: '80px', borderBottom: '1px solid #000' }}></div>
          )}
        </div>
      </div>
    </div>
  );
}
