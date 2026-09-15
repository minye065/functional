import jsPDF from "jspdf";

export function exportPng(dataUrl: string): void
{
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "pose-reference.png";
    link.click();
}

export function exportPdf(dataUrl: string): void
{
    const image = new Image();
    image.onload = () =>
    {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const width = 170;
        const height = (image.height / image.width) * width;
        doc.text("Pose Reference", 20, 15);
        doc.addImage(dataUrl, "PNG", 20, 25, width, height);
        doc.save("pose-reference.pdf");
    };
    image.src = dataUrl;
}