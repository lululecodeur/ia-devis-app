"use client";

const debug = (msg: string) => {
  const div = document.getElementById("debug-log");
  if (div) {
    div.innerHTML += `\n${msg}`;
  }
};

export const exporterPDF = async () => {
  alert("📄 Export lancé !");
  debug("📄 Lancement export PDF !");
  const html2pdf = (await import("html2pdf.js")).default;
  debug("📦 html2pdf importé !");

  const element = document.getElementById("devis-final");

  if (!element) {
    alert("❌ Élément #devis-final introuvable !");
    console.warn("❌ Élément #devis-final introuvable !");
    return;
  }

  if (element.innerText.trim() === "") {
    alert("⚠️ Le devis est vide. Veuillez remplir au moins une ligne.");
    console.warn("⚠️ Rien à exporter : le contenu est vide.");
    return;
  }

  debug("🎯 Élément trouvé : " + element.id);
debug("📏 Dimensions: " + element.offsetWidth + " x " + element.offsetHeight);
debug("🧾 innerText: " + element.innerText.slice(0, 100));


  const today = new Date();
  const filename = `devis_${today.toLocaleDateString("fr-FR").replace(/\//g, "-")}.pdf`;

  const oldTransform = element.style.transform;
  element.style.transform = "none";

  try {
    await new Promise((res) => setTimeout(res, 100));

    await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2
        },
        jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" }
      })
      .from(element)
      .save();

  } catch (err) {
    console.error("❌ Erreur lors de la génération du PDF :", err);
    alert("❌ Une erreur est survenue lors de la génération du PDF.");
  } finally {
    element.style.transform = oldTransform;
  }
};
