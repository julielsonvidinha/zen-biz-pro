import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SaleForPDF {
  sale_number: number;
  customer_name?: string | null;
  customer_cpf?: string | null;
  total: number;
  subtotal: number;
  discount: number;
  payment_method: string;
  created_at: string;
  items: {
    product_name: string;
    qty: number;
    unit_price: number;
    total: number;
  }[];
}

export function generateSaleReceiptPDF(sale: SaleForPDF): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: [80, 200] });
  const w = 80;
  let y = 8;

  // Header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("NexaERP - Comprovante de Venda", w / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("DOCUMENTO NÃO FISCAL", w / 2, y, { align: "center" });
  y += 4;
  doc.line(4, y, w - 4, y);
  y += 3;

  // Sale info
  doc.setFontSize(7);
  doc.text(`Venda Nº: ${sale.sale_number}`, 4, y); y += 3.5;
  doc.text(`Data: ${new Date(sale.created_at).toLocaleString("pt-BR")}`, 4, y); y += 3.5;
  if (sale.customer_name) { doc.text(`Cliente: ${sale.customer_name}`, 4, y); y += 3.5; }
  if (sale.customer_cpf) { doc.text(`CPF: ${sale.customer_cpf}`, 4, y); y += 3.5; }
  doc.text(`Pagamento: ${sale.payment_method.toUpperCase()}`, 4, y); y += 3;
  doc.line(4, y, w - 4, y);
  y += 2;

  // Items table
  autoTable(doc, {
    startY: y,
    margin: { left: 4, right: 4 },
    head: [["Produto", "Qtd", "Unit", "Total"]],
    body: sale.items.map(i => [
      i.product_name,
      String(i.qty),
      `R$${Number(i.unit_price).toFixed(2)}`,
      `R$${Number(i.total).toFixed(2)}`,
    ]),
    styles: { fontSize: 6, cellPadding: 1 },
    headStyles: { fillColor: [30, 64, 175], fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 8, halign: "center" },
      2: { cellWidth: 14, halign: "right" },
      3: { cellWidth: 14, halign: "right" },
    },
    theme: "grid",
  });

  y = (doc as any).lastAutoTable.finalY + 3;
  doc.line(4, y, w - 4, y);
  y += 3;

  // Totals
  doc.setFontSize(7);
  doc.text("Subtotal:", 4, y);
  doc.text(`R$ ${Number(sale.subtotal).toFixed(2)}`, w - 4, y, { align: "right" }); y += 3.5;
  if (sale.discount > 0) {
    doc.text("Desconto:", 4, y);
    doc.text(`- R$ ${Number(sale.discount).toFixed(2)}`, w - 4, y, { align: "right" }); y += 3.5;
  }
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", 4, y);
  doc.text(`R$ ${Number(sale.total).toFixed(2)}`, w - 4, y, { align: "right" }); y += 5;

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Obrigado pela preferência!", w / 2, y, { align: "center" });

  return doc;
}

export function generateSaleFullPDF(sale: SaleForPDF): jsPDF {
  const doc = new jsPDF();
  let y = 15;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("NexaERP", 14, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Gestão Empresarial", 14, y + 6);
  y += 16;
  doc.line(14, y, 196, y);
  y += 8;

  // Sale info
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Comprovante de Venda #${sale.sale_number}`, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const info = [
    ["Data:", new Date(sale.created_at).toLocaleString("pt-BR")],
    ["Cliente:", sale.customer_name || "Não identificado"],
    ["CPF:", sale.customer_cpf || "—"],
    ["Pagamento:", sale.payment_method.toUpperCase()],
  ];
  info.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(val, 50, y);
    y += 6;
  });
  y += 4;

  // Items table
  autoTable(doc, {
    startY: y,
    head: [["#", "Produto", "Qtd", "Preço Unit.", "Total"]],
    body: sale.items.map((item, i) => [
      String(i + 1),
      item.product_name,
      String(item.qty),
      `R$ ${Number(item.unit_price).toFixed(2)}`,
      `R$ ${Number(item.total).toFixed(2)}`,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 175] },
    theme: "striped",
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Totals
  doc.setFontSize(10);
  const rightX = 196;
  doc.text("Subtotal:", rightX - 50, y);
  doc.text(`R$ ${Number(sale.subtotal).toFixed(2)}`, rightX, y, { align: "right" });
  y += 6;
  if (sale.discount > 0) {
    doc.text("Desconto:", rightX - 50, y);
    doc.text(`- R$ ${Number(sale.discount).toFixed(2)}`, rightX, y, { align: "right" });
    y += 6;
  }
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", rightX - 50, y);
  doc.text(`R$ ${Number(sale.total).toFixed(2)}`, rightX, y, { align: "right" });
  y += 12;

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Documento gerado pelo NexaERP", 14, 285);
  doc.text(new Date().toLocaleString("pt-BR"), 196, 285, { align: "right" });

  return doc;
}
